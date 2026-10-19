# rendre-config.ps1 — rend deploy/authelia/configuration.yml depuis le modele
# versionne configuration.yml.template (doctrine docs/71, R3 : meme pile servie
# en local, en LAN puis sur Internet, sans changement de code).
#
#   powershell -ExecutionPolicy Bypass -File ./rendre-config.ps1
#   powershell -ExecutionPolicy Bypass -File ./rendre-config.ps1 -Hote lcd.local
#   powershell -ExecutionPolicy Bypass -File ./rendre-config.ps1 -Verifier
#
# -Hote     : nom d'entree (defaut lcd.test ; LAN = lcd.local ; Internet = domaine).
# -PortIdp  : port du portail Authelia (defaut 4002).
# -Verifier : ne reecrit RIEN, verifie que le fichier rendu correspond au modele
#             pour le nom par defaut (reproductibilite) et sort en erreur sinon.
# -Sortie   : chemin de sortie (defaut deploy/authelia/configuration.yml).
#
# Fail-closed : si un placeholder subsiste, si le resultat est vide ou s'il
# contient encore le nom d'un autre hote, on n'ecrit pas et on sort en erreur.

param(
    [string]$Hote = "lcd.test",
    [int]$PortIdp = 4002,
    [switch]$Verifier,
    [string]$Sortie
)

$ErrorActionPreference = "Stop"
$ici = Split-Path -Parent $MyInvocation.MyCommand.Path
$modele = Join-Path $ici "configuration.yml.template"
if (-not $Sortie) { $Sortie = Join-Path $ici "configuration.yml" }

if (-not (Test-Path $modele)) { Write-Error "modele absent : $modele" }

if ($Hote -notmatch '^[A-Za-z0-9]([A-Za-z0-9.-]*[A-Za-z0-9])?$') {
    Write-Error "hote invalide : '$Hote' (attendu : nom DNS, sans schema ni port)"
}
if ($PortIdp -lt 1 -or $PortIdp -gt 65535) { Write-Error "port invalide : $PortIdp" }

$texte = Get-Content $modele -Raw -Encoding utf8
$rendu = $texte.Replace("{{HOTE}}", $Hote).Replace("{{PORT_IDP}}", "$PortIdp")

foreach ($reste in @("{{HOTE}}", "{{PORT_IDP}}", "{{")) {
    if ($rendu.Contains($reste)) { Write-Error "placeholder non resolu dans le rendu : $reste" }
}
if ($rendu.Trim().Length -lt 200) { Write-Error "rendu suspect (trop court)" }

# Le nom d'entree ne doit apparaitre QUE comme valeur (domain/issuer/url) :
# un rendu qui garde un autre hote = melange de deux deployments.
if ($Hote -ne "lcd.test" -and $rendu -match "(?m)^\s*-?\s*(domain|issuer|authelia_url):?\s*lcd\.test") {
    Write-Error "le rendu contient encore l'hote lcd.test"
}

if ($Verifier) {
    if (-not (Test-Path $Sortie)) { Write-Error "fichier rendu absent : $Sortie" }
    $actuel = (Get-Content $Sortie -Raw -Encoding utf8)
    $attendu = $rendu.Replace("`r`n", "`n").TrimEnd()
    $present = $actuel.Replace("`r`n", "`n").TrimEnd()
    if ($present -ne $attendu) {
        Write-Error "configuration.yml DERIVE du modele (hote par defaut) : relancer sans -Verifier"
    }
    Write-Output "OK : configuration.yml conforme au modele (hote $Hote, portail $PortIdp)"
    exit 0
}

# Ecriture atomique : jamais un fichier a moitie ecrit lu par Authelia.
$tmp = "$Sortie.tmp"
$utf8 = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($tmp, $rendu, $utf8)
Move-Item -Force $tmp $Sortie
Write-Output "rendu : $Sortie (hote $Hote, portail $PortIdp, $((Get-Content $Sortie).Count) lignes)"
