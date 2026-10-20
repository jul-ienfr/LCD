# reprise.ps1 — DRILL DE REPRISE COMPLETE (doctrine docs/71, §8 decies ; R-06).
#
#   powershell -ExecutionPolicy Bypass -File ./reprise.ps1              # drill complet, puis nettoyage
#   powershell -ExecutionPolicy Bypass -File ./reprise.ps1 -Garder      # laisse la pile de reprise debout
#   powershell -ExecutionPolicy Bypass -File ./reprise.ps1 -Arreter     # nettoie une pile laissee
#
# CE QUE CE SCRIPT PROUVE : qu'une sauvegarde restauree permet de REMETTRE LE
# SERVICE EN LIGNE, sur une pile separee, sans toucher a la production. Les
# batteries existantes prouvaient (a) que la sauvegarde est chiffree et
# restaurable, (b) que le depot est sain ; aucune ne prouvait le trajet
# complet « snapshot -> conteneurs -> requete qui repond ». C'est ce trajet qui
# decide si une reprise est possible.
#
# CONTRAT D'APPEL (lecon du 2026-10-19) : Verif recoit EXACTEMENT deux
# arguments — un libelle deja formate, et une condition convertie en booleen.
# Une version precedente passait la condition en 3e argument et le compte
# final affichait « 0 ECHEC(S) » en executant la branche d'echec : une preuve
# qui ment sur son propre resultat est pire qu'aucune preuve.

param(
    [switch]$Garder,
    [switch]$Arreter,
    [string]$Projet = "lcd-reprise",
    [int]$PortWeb = 3110,
    [int]$PortHttps = 4101,
    [int]$PortIdp = 4102,
    [int]$PortHttp = 4103,
    [int]$DelaiSecondes = 180
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$compose = Join-Path $ici "docker-compose.yml"
$surcharge = Join-Path $ici "reprise/docker-compose.reprise.yml"
$depot = Join-Path $ici "backups/restic"
$mdp = Join-Path $ici "backups/.restic-pass"
$script:KO = 0
$script:N = 0

function Verif([string]$label, [bool]$ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" }
    else { Write-Output "[KO] $label"; $script:KO = $script:KO + 1 }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Compose([string[]]$sous) {
    $a = @("compose", "-p", $Projet, "-f", $compose, "-f", $surcharge) + $sous
    return (Natif { Push-Location $ici; try { & docker @a 2>&1 } finally { Pop-Location } } | Out-String)
}
function Code([string]$url, [string[]]$extra = @()) {
    $a = @("-s", "-o", "NUL", "-w", "%{http_code}", "-m", "10") + $extra + @($url)
    return ((Natif { & curl.exe @a 2>$null } | Out-String).Trim())
}
function Restic([string[]]$sous, [string[]]$volumes = @()) {
    $montages = @("-v", "$(Resolve-Path $depot):/repo", "-v", "$(Resolve-Path $mdp):/pw:ro") + $volumes
    $a = @("run", "--rm", "-e", "RESTIC_PASSWORD_FILE=/pw", "-e", "RESTIC_REPOSITORY=/repo") + $montages + @("restic/restic:0.17.3") + $sous
    return (Natif { & docker @a 2>&1 } | Out-String)
}

if ($Arreter) {
    $null = Compose @("down", "-v", "--remove-orphans")
    Write-Output "pile de reprise arretee"
    exit 0
}

Write-Output "== reprise ($Projet) : remettre le service en ligne depuis une sauvegarde"
$null = Compose @("down", "-v", "--remove-orphans")

# --- Temoin de la production AVANT -------------------------------------------
$prodAvant = Code "https://lcd.test:4001/hote" @("-k", "--resolve", "lcd.test:4001:127.0.0.1")
Verif ("la production repond AVANT le drill (mesure " + $prodAvant + ")") ([bool]($prodAvant -eq "302"))

# --- 1. Volume neuf + restauration REELLE du volume IdP ----------------------
$volumeIdp = $Projet + "_authelia-data"
$null = Natif { & docker volume rm $volumeIdp 2>&1 }
$null = Natif { & docker volume create $volumeIdp 2>&1 }

#  `restore latest` prend le snapshot le plus recent TOUS VOLUMES CONFONDUS :
#  mesure du 2026-10-19, le drill restaurait le volume bidon de test-backup.
#  On resout donc l'identifiant du snapshot du volume attendu.
$liste = Restic @("snapshots", "--tag", "volume=lcd-deploy_authelia-data", "--latest", "1", "--json")
$idSnapshot = ""
if ($liste -match '"id":"([0-9a-f]{16,})"') { $idSnapshot = $Matches[1] }
elseif ($liste -match '"short_id":"([0-9a-f]+)"') { $idSnapshot = $Matches[1] }
$montre = if ($idSnapshot) { $idSnapshot.Substring(0, 8) } else { "aucun" }
Verif ("le snapshot du volume IdP est identifie (" + $montre + ")") ([bool]($idSnapshot -ne ""))
if (-not $idSnapshot) { Write-Output "RESULTAT : reprise non prouvee (aucun snapshot du volume IdP)"; exit 1 }

$restaure = Restic @("restore", $idSnapshot, "--target", "/", "--include", "/data") @("-v", "${volumeIdp}:/data")
Verif "restauration restic reelle dans un volume neuf" ([bool]($restaure -match "(?i)restoring snapshot|restored"))

$inventaire = (Natif { & docker run --rm -v "${volumeIdp}:/d" python:3.12-slim python -c "import sqlite3,os;print('taille',os.path.getsize('/d/db.sqlite'));c=sqlite3.connect('/d/db.sqlite');print('enroles',c.execute('select count(*) from totp_configurations').fetchone()[0])" 2>&1 } | Out-String)
Verif "la base IdP restauree est lisible et contient les enrolements" ([bool]($inventaire -match "enroles [1-9]"))

# --- 2. Demarrage de la pile de reprise --------------------------------------
$debut = Get-Date
$up = Compose @("up", "-d", "--no-build", "--remove-orphans")
$enLigne = $false
for ($i = 0; $i -lt $DelaiSecondes; $i += 5) {
    Start-Sleep -Seconds 5
    if ((Code "https://lcd.test:${PortHttps}/hote" @("-k", "--resolve", "lcd.test:${PortHttps}:127.0.0.1")) -eq "302") { $enLigne = $true; break }
}
$secondes = [int]((Get-Date) - $debut).TotalSeconds
Verif ("la pile de reprise sert l'entree HTTPS en " + $secondes + " s") ([bool]$enLigne)
if (-not $enLigne) { Write-Output (($up -split "`r?`n" | Where-Object { $_ -match "Error|error" }) -join " / ") }

# --- 3. Requetes de service (le trajet complet) ------------------------------
$entree = Code "https://lcd.test:${PortHttps}/hote" @("-k", "--resolve", "lcd.test:${PortHttps}:127.0.0.1")
Verif ("l'entree protegee redirige vers l'IdP (mesure " + $entree + ")") ([bool]($entree -eq "302"))
$portail = Code "https://lcd.test:${PortIdp}/" @("-k", "--resolve", "lcd.test:${PortIdp}:127.0.0.1")
Verif ("le portail IdP repond (mesure " + $portail + ")") ([bool]($portail -eq "200"))
$front = Code ("http://127.0.0.1:" + $PortWeb + "/")
Verif ("le front repond en direct (mesure " + $front + ")") ([bool]($front -eq "200"))
$redir = Code "http://lcd.test:${PortHttp}/" @("--resolve", "lcd.test:${PortHttp}:127.0.0.1")
Verif ("l'entree HTTP redirige vers HTTPS (mesure " + $redir + ")") ([bool]($redir -match "^(301|302|308)$"))

$sante = (Natif { & docker ps --filter "label=com.docker.compose.project=$Projet" --format "{{.Names}}={{.Status}}" 2>&1 } | Out-String).Trim()
$enHaut = @($sante -split "\r?\n" | Where-Object { $_ -match "Up" }).Count
Verif ("les trois services de la pile de reprise sont demarres (" + $enHaut + "/3)") ([bool]($enHaut -ge 3))

# --- 3 bis. La CONFIGURATION est restaurable elle aussi ----------------------
#  Restaurer les volumes ne suffit pas : sans `.env` ni `users.yml`, la pile
#  redemarre avec des secrets vides et aucun compte. La sauvegarde « etat hote »
#  (tag hote=lcd) doit donc contenir ces fichiers A L'IDENTIQUE.
$tmpHote = Join-Path ([IO.Path]::GetTempPath()) ("lcd-hote-" + [guid]::NewGuid().ToString("N"))
New-Item -ItemType Directory -Force -Path $tmpHote | Out-Null
$idHote = ""
$listeHote = Restic @("snapshots", "--tag", "hote=lcd", "--latest", "1", "--json")
if ($listeHote -match '"id":"([0-9a-f]{16,})"') { $idHote = $Matches[1] }
elseif ($listeHote -match '"short_id":"([0-9a-f]+)"') { $idHote = $Matches[1] }
Verif ("le snapshot de la configuration hote est identifie (" + $(if ($idHote) { $idHote.Substring(0, 8) } else { "aucun" }) + ")") ([bool]($idHote -ne ""))
if ($idHote) {
    $null = Restic @("restore", $idHote, "--target", "/sortie") @("-v", "${tmpHote}:/sortie")
    $envR = Join-Path $tmpHote "src/env"
    $usersR = Join-Path $tmpHote "src/users.yml"
    Verif "la configuration hote restauree contient .env et users.yml" (
        [bool]((Test-Path $envR) -and (Test-Path $usersR)))
    if ((Test-Path $envR) -and (Test-Path $usersR)) {
        $memeEnv = (Get-FileHash $envR -Algorithm SHA256).Hash -eq (Get-FileHash (Join-Path $ici ".env") -Algorithm SHA256).Hash
        $memeUsers = (Get-FileHash $usersR -Algorithm SHA256).Hash -eq (Get-FileHash (Join-Path $ici "authelia/users.yml") -Algorithm SHA256).Hash
        Verif "le .env restaure est identique a celui en service" ([bool]$memeEnv)
        Verif "le users.yml restaure est identique a celui en service" ([bool]$memeUsers)
    }
}
Remove-Item $tmpHote -Recurse -Force -ErrorAction SilentlyContinue
# --- 4. La production n'a pas bouge ------------------------------------------
$prodApres = Code "https://lcd.test:4001/hote" @("-k", "--resolve", "lcd.test:4001:127.0.0.1")
Verif ("la production repond APRES le drill (mesure " + $prodApres + ")") ([bool]($prodApres -eq "302"))

# --- 5. Nettoyage ------------------------------------------------------------
if (-not $Garder) {
    $null = Compose @("down", "-v", "--remove-orphans")
    $restes = @(Natif { & docker ps -a --filter "label=com.docker.compose.project=$Projet" -q 2>$null } | Where-Object { $_ })
    $volRestes = @(Natif { & docker volume ls -q --filter "name=${Projet}_" 2>$null } | Where-Object { $_ })
    Verif ("nettoyage complet (" + $restes.Count + " conteneur(s), " + $volRestes.Count + " volume(s) restant(s))") (
        [bool]($restes.Count -eq 0 -and $volRestes.Count -eq 0))
} else {
    Write-Output ("pile de reprise laissee debout (ports " + $PortHttps + "/" + $PortIdp + "/" + $PortHttp + "/" + $PortWeb + ") - -Arreter pour nettoyer")
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : reprise complete prouvee, " + $secondes + " s pour resservir, production intacte (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N + " - la reprise n'est pas prouvee")
exit $script:KO
