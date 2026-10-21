# Batterie G-demarrage (doctrine docs/71, V6 « runbook applicable a froid ») :
# prouver qu'une pile ARRETEE redemarre en une commande et se verifie elle-meme.
#
#   powershell -ExecutionPolicy Bypass -File ./test-demarrage.ps1
#
# Checks :
#   1. arret complet (demarrer.ps1 -Arreter) : plus aucun conteneur deploy ;
#   2. les sondes tombent VRAIMENT a zero quand c'est arrete (sinon elles ne
#      mesurent rien) : front injoignable, entree TLS injoignable ;
#   3. demarrage a froid : exit 0, duree mesuree ;
#   4. apres demarrage : web healthy, authelia healthy, les 3 endpoints a 200 ;
#   5. la veille ne voit plus aucune alerte critique (pile fonctionnelle) ;
#   6. l'entree TLS sert bien la MEME application que le front (marqueur HTML).

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$Hote = "lcd.test"

function Verif($label, $ok) {
    $script:N++
    if ($ok) { Write-Output "[OK] $label" } else { Write-Output "[KO] $label"; $script:KO++ }
}
function Natif($bloc) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try { return (& $bloc) } finally { $ErrorActionPreference = $prev }
}
function Code($url, [string[]]$opts = @()) {
    return (Natif { curl.exe @opts -s -o NUL -w "%{http_code}" -m 6 $url 2>$null } | Out-String).Trim()
}
function Corps($url, [string[]]$opts = @()) {
    return (Natif { curl.exe @opts -s -m 10 $url 2>$null } | Out-String)
}

Push-Location $ici
try {
    # --- 1. Arret reel ----------------------------------------------------
    $t0 = Get-Date
    $arret = (Natif { powershell -ExecutionPolicy Bypass -File ./demarrer.ps1 -Arreter 2>&1 } | Out-String)
    $restants = @(Natif { docker ps -a --filter "name=lcd-deploy" --format "{{.Names}}" 2>$null } | Where-Object { "$_".Trim() })
    Verif "arret complet : aucun conteneur deploy restant" ($restants.Count -eq 0)
    if ($restants.Count -gt 0) { Write-Output "      restants : $($restants -join ', ')" }

    # --- 2. Les sondes tombent a zero (preuve que la mesure est reelle) ---
    Start-Sleep -Seconds 2
    $codeFrontArrete = Code "http://127.0.0.1:3100/"
    $codeEntreeArretee = Code "https://${Hote}:4001/api/health" @("--resolve", "${Hote}:4001:127.0.0.1", "-k")
    Verif "arret : front injoignable ($codeFrontArrete)" ($codeFrontArrete -eq "000")
    Verif "arret : entree TLS injoignable ($codeEntreeArretee)" ($codeEntreeArretee -eq "000")

    # --- 3. Demarrage a froid --------------------------------------------
    $sortie = (Natif { powershell -ExecutionPolicy Bypass -File ./demarrer.ps1 2>&1 } | Out-String)
    $codeDemarrage = $LASTEXITCODE
    $duree = [int]((Get-Date) - $t0).TotalSeconds
    Verif "demarrage a froid : exit 0 (${duree}s arret+demarrage)" ($codeDemarrage -eq 0)
    if ($codeDemarrage -ne 0) { Write-Output ($sortie -split "`n" | Select-Object -Last 8) }
    Verif "le demarrage annonce lui-meme le SAS servi" ($sortie -match "SAS demarre et SERVI")

    # --- 4. Sante reelle apres demarrage ---------------------------------
    $sWeb = (Natif { docker inspect --format "{{.State.Health.Status}}" lcd-deploy-web-1 2>$null } | Out-String).Trim()
    $sIdp = (Natif { docker inspect --format "{{.State.Health.Status}}" lcd-deploy-authelia-1 2>$null } | Out-String).Trim()
    Verif "web healthy ($sWeb)" ($sWeb -eq "healthy")
    Verif "authelia healthy ($sIdp)" ($sIdp -eq "healthy")
    Verif "front 200" ((Code "http://127.0.0.1:3100/") -eq "200")
    Verif "portail IdP 200" ((Code "https://${Hote}:4002/api/health" @("--resolve", "${Hote}:4002:127.0.0.1", "-k")) -eq "200")
    Verif "entree TLS 200" ((Code "https://${Hote}:4001/api/health" @("--resolve", "${Hote}:4001:127.0.0.1", "-k")) -eq "200")

    # --- 5. Veille : aucune alerte critique (disque neutralise par seuil) -
    $veille = (Natif { powershell -ExecutionPolicy Bypass -File ./veille.ps1 -SeuilDisque 0 2>&1 } | Out-String)
    Verif "veille : 0 alerte critique apres demarrage" (-not ($veille -match "\[CRITIQUE\]"))
    if ($veille -match "\[CRITIQUE\]") { Write-Output ($veille -split "`n" | Where-Object { $_ -match "CRITIQUE" }) }

    # --- 6. L'entree TLS passe bien par le front ET par l'IdP -------------
    #  L'accueil est PUBLIQUE cote front (marqueur present), mais via l'entree
    #  TLS la requete anonyme traverse forward_auth puis est REDIRIGEE vers le
    #  portail IdP : c'est cette chaine qu'on verifie (comparer un corps HTML
    #  n'aurait aucun sens sur une 302).
    $marqueur = 'href="/login"'
    $corpsFront = Corps "http://127.0.0.1:3100/"
    Verif "front : page d'accueil servie (marqueur present)" ($corpsFront -match [regex]::Escape($marqueur))
    #  Racine PUBLIQUE depuis 2026-10-21 (vitrine) : l application est la
    #  surface FERMEE -- on prouve les DEUX contrats sur / et /hote.
    $racine = (Natif { curl.exe @("--resolve", "${Hote}:4001:127.0.0.1", "-k") -s -o NUL -w "%{http_code}" -m 10 "https://${Hote}:4001/" 2>$null } | Out-String).Trim()
    $redir = (Natif { curl.exe @("--resolve", "${Hote}:4001:127.0.0.1", "-k") -s -o NUL -w "%{http_code}|%{redirect_url}" -m 10 "https://${Hote}:4001/hote" 2>$null } | Out-String).Trim()
    $parties = $redir -split "\|"
    $codeEntree = $parties[0]
    $cible = if ($parties.Count -gt 1) { $parties[1] } else { "" }
    Verif "entree TLS : racine publique (200) MAIS application /hote fermee -> portail IdP ($codeEntree -> $cible)" (
        $racine -eq "200" -and ($codeEntree -eq "302" -or $codeEntree -eq "303") -and $cible -match ":4002")
    $corpsEntree = Corps "https://${Hote}:4001/api/health" @("--resolve", "${Hote}:4001:127.0.0.1", "-k")
    Verif "entree TLS : la passerelle repond a travers Caddy (/api/health)" ($corpsEntree -match '"ok"')

} finally {
    #  Etat de sortie : pile en marche (jamais laisser l'hote arrete).
    $up = Natif { powershell -ExecutionPolicy Bypass -File ./demarrer.ps1 2>&1 } | Out-Null
    Pop-Location
}

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output "RESULTAT : demarrage a froid prouve ($($script:N)/$($script:N) OK)"
} else {
    Write-Output "RESULTAT : $($script:KO) ECHEC(S) sur $($script:N) checks"
}
exit $script:KO
