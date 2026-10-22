# demarrer.ps1 — demarrage A FROID du SAS LCD en UNE commande, avec
# verification de sante reelle (doctrine docs/71, V6 « runbook applicable a
# froid » et R3 « deployable »).
#
#   powershell -ExecutionPolicy Bypass -File ./demarrer.ps1
#   powershell -ExecutionPolicy Bypass -File ./demarrer.ps1 -Reconstruire   # force le rebuild de l'image web
#   powershell -ExecutionPolicy Bypass -File ./demarrer.ps1 -Arreter        # arret propre
#
# Ce que fait le script, dans cet ordre, sans rien supposer :
#   1. verifie les prererequis (docker joignable, secrets reels presents) ;
#   2. demarre la pile `deploy` (web + authelia + caddy) ;
#   3. attend la SANTE reelle : authelia healthy, web healthy, puis les
#      endpoints (portail IdP, entree TLS -> passerelle) ;
#   4. verifie la dependance `gateway-parc` (pile lab) et DIT clairement si
#      elle manque (etat degrade assume, jamais un faux vert) ;
#   5. mesure la duree de demarrage et propose les batteries.
#
# Sortie : code 0 seulement si la pile est reellement servie (front + portail
# + entree TLS). Un demarrage "docker dit up" mais injoignable est un echec.

param(
    [switch]$Reconstruire,
    [switch]$Arreter,
    [string]$Hote = "lcd.test",
    [int]$DelaiSecondes = 180
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$debut = Get-Date

function Etape($texte) { Write-Output ("== " + $texte) }
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}

Push-Location $ici
try {
    # --- 0. Prerequis -----------------------------------------------------
    Etape "prerequis"
    $version = (Natif { docker version --format "{{.Server.Version}}" 2>$null } | Out-String).Trim()
    if (-not $version) { Write-Error "docker injoignable : demarrer Docker Desktop puis relancer." }
    Write-Output "   docker server $version"

    if ($Arreter) {
        Etape "arret propre de la pile deploy"
        Natif { docker compose down 2>&1 } | ForEach-Object { Write-Output "   $_" }
        $restants = @(Natif { docker ps -a --filter "name=lcd-deploy" --format "{{.Names}}" 2>$null })
        if ($restants.Count -gt 0) { Write-Error "conteneurs encore presents : $($restants -join ', ')" }
        Write-Output "RESULTAT : pile deploy arretee ($([int]((Get-Date) - $debut).TotalSeconds)s)"
        exit 0
    }

    foreach ($f in @(".env", "authelia/users.yml", "authelia/configuration.yml")) {
        if (-not (Test-Path $f)) { Write-Error "secret ou config manquant : deploy/$f (voir deploy/authelia/README.md)" }
    }
    Write-Output "   secrets et configuration presents (.env, users.yml, configuration.yml)"

    # Design du site (super_admin, /systeme) : fichier RUNTIME monte dans le
    # conteneur web. S'il manque, Docker creerait un DOSSIER a sa place et le
    # dashboard signalerait « ecriture impossible » a tort.
    $design = Join-Path (Split-Path $PSScriptRoot -Parent) "custom\design.yaml"
    if (-not (Test-Path -LiteralPath $design)) {
        Copy-Item -LiteralPath "$design.example" -Destination $design -Force
        Write-Output "   design du site initialise depuis custom/design.yaml.example"
    }

    # La configuration IdP doit etre le RENDU du modele, pas une copie derivee.
    Natif { powershell -ExecutionPolicy Bypass -File ./authelia/rendre-config.ps1 -Verifier 2>&1 } | Out-Null
    if ($LASTEXITCODE -ne 0) { Write-Error "deploy/authelia/configuration.yml a derive du modele : relancer authelia/rendre-config.ps1" }
    Write-Output "   configuration IdP conforme au modele"

    # --- 1. Demarrage -----------------------------------------------------
    Etape "demarrage de la pile (web + authelia + caddy)"
    $argsUp = @("compose", "up", "-d")
    if ($Reconstruire) { $argsUp += @("--build", "web") }
    $sortie = Natif { docker @argsUp 2>&1 }
    $sortie | Select-Object -Last 3 | ForEach-Object { Write-Output "   $_" }
    if ($LASTEXITCODE -ne 0) { Write-Output ($sortie | Select-Object -Last 8); Write-Error "docker compose up a echoue" }

    # --- 2. Attente de la sante REELLE ------------------------------------
    Etape "attente de la sante (max ${DelaiSecondes}s)"
    $fin = (Get-Date).AddSeconds($DelaiSecondes)
    $attentes = [ordered]@{
        "authelia healthy" = { (Natif { docker inspect --format "{{.State.Health.Status}}" lcd-deploy-authelia-1 2>$null } | Out-String).Trim() -eq "healthy" }
        "web healthy"      = { (Natif { docker inspect --format "{{.State.Health.Status}}" lcd-deploy-web-1 2>$null } | Out-String).Trim() -eq "healthy" }
        "caddy demarre"    = { (Natif { docker inspect --format "{{.State.Running}}" lcd-deploy-caddy-1 2>$null } | Out-String).Trim() -eq "true" }
    }
    foreach ($nom in $attentes.Keys) {
        $ok = $false
        while ((Get-Date) -lt $fin) {
            if (& $attentes[$nom]) { $ok = $true; break }
            Start-Sleep -Milliseconds 900
        }
        if ($ok) { Write-Output "   [OK] $nom" } else { Write-Output "   [KO] $nom (delai depasse)" }
        if (-not $ok) { Write-Error "demarrage incomplet : $nom" }
    }

    # --- 3. Endpoints servis ---------------------------------------------
    Etape "endpoints"
    $controles = [ordered]@{
        "portail IdP (auth)" = @("--resolve", "auth.${Hote}:443:127.0.0.1", "-k", "https://auth.${Hote}/api/health")
        "front (3100)"         = @("http://127.0.0.1:3100/")
        "entree TLS (4001)"    = @("--resolve", "${Hote}:4001:127.0.0.1", "-k", "https://${Hote}:4001/api/health")
    }
    $ko = 0
    foreach ($nom in $controles.Keys) {
        $a = $controles[$nom]
        # ATTENTION : sur un tableau a UN element, `$a[0..($a.Count-2)]` vaut
        # `$a[0..-1]` = DEUX indices en PowerShell (bug attrape le 2026-10-19 :
        # curl recevait des arguments parasites et la sortie HTML partait dans
        # le terminal au lieu de /dev/null).
        $url = $a[-1]
        $opts = if ($a.Count -gt 1) { @($a[0..($a.Count - 2)]) } else { @() }
        # Caddy demarre plus vite que le front : un seul essai juste apres
        # `up -d` produit de faux KO (mesure du 2026-10-19). On reessaie
        # jusqu'a l'echeance.
        $code = ""
        while ((Get-Date) -lt $fin) {
            $code = (Natif { curl.exe @opts -s -o NUL -w "%{http_code}" -m 10 $url 2>$null } | Out-String).Trim()
            if ($code -eq "200") { break }
            Start-Sleep -Milliseconds 1200
        }
        if ($code -eq "200") { Write-Output "   [OK] $nom -> 200" }
        else { Write-Output "   [KO] $nom -> $code"; $ko++ }
    }

    # --- 4. Dependance lab (gateway-parc) --------------------------------
    Etape "dependance gateway-parc (pile lab)"
    $gw = (Natif { docker inspect --format "{{.State.Running}}" lcd-lab-gateway-parc-1 2>$null } | Out-String).Trim()
    if ($gw -eq "true") {
        Write-Output "   [OK] passerelle du parc joignable (lcd-lab-gateway-parc-1)"
    } else {
        Write-Output "   [--] passerelle du parc ABSENTE : l'entree TLS renverra 502 sur /api/*"
        Write-Output "        etat DEGRADE assume (R4) -- demarrer la pile box : lab/lab-run.ps1"
    }

    $duree = [int]((Get-Date) - $debut).TotalSeconds
    Write-Output ""
    Write-Output "duree : ${duree}s"
    if ($ko -eq 0) {
        Write-Output "RESULTAT : SAS demarre et SERVI (front + portail + entree TLS)"
        Write-Output "  verifier : deploy/test-deploy.ps1, deploy/test-front.ps1, deploy/veille.ps1"
        exit 0
    }
    Write-Output "RESULTAT : $ko endpoint(s) non servi(s)"
    exit 1
} finally {
    Pop-Location
}
