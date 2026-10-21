# ouvrir-pare-feu.ps1 - OUVRIR LE SAS AU RESEAU LOCAL (le seul port utile : 443)
#
# Mesure du 2026-10-21 : https://192.168.31.59/hote ne repond pas (code 000)
# parce qu'AUCUNE regle de pare-feu n'autorise l'entree. Windows bloque en
# entrant par defaut. C'est voulu par l'editeur, pas par nous -- mais un service
# destine au LAN doit etre joignable depuis les autres machines.
#
# CE QUI EST OUVERT, ET RIEN DE PLUS :
#   - TCP 443 (l'application ET le portail, servis par Caddy sur le meme port) ;
#   - TCP 80 (redirection HTTP -> HTTPS, confort des navigateurs) ;
#   - PORTEE : reseau local uniquement (remoteip=localsubnet). Pas d'Internet.
# Les anciens ports d'atelier (4001, 4002, 4003) restent FERMES : une seule
# porte, c'est plus simple et plus sur. 443 est suffisant.
#
# Exige l'administrateur : lance par ouvrir-pare-feu.cmd, qui demande
# l'elevation. Idempotent : relancer met la regle a jour au lieu d'en empiler.
param([switch]$Simuler)

$ErrorActionPreference = "Stop"
$log = Join-Path $PSScriptRoot "pare-feu.log"

function Journal([string]$ligne) {
    $h = "[{0:yyyy-MM-dd HH:mm:ss}] {1}" -f (Get-Date), $ligne
    Write-Host $h
    Add-Content -Path $log -Value $h -Encoding UTF8
}

$regles = @(
    @{ nom = "LCD-SAS-HTTPS-443"; port = 443 },
    @{ nom = "LCD-SAS-HTTP-80"; port = 80 }
)

Journal "=== ouverture du pare-feu (LAN seulement) ==="

if ($Simuler) {
    foreach ($r in $regles) {
        $existe = (netsh advfirewall firewall show rule name="$($r.nom)" 2>&1) -match "Ports locaux|LocalPort"
        Journal ("  {0} : TCP {1} entrant, portee reseau local, existe deja = {2}" -f $r.nom, $r.port, [bool]$existe)
    }
    Journal "SIMULATION : aucune regle n'a ete ajoutee ni retiree."
    exit 0
}

$estAdmin = ([Security.Principal.WindowsPrincipal] `
    [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
        [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $estAdmin) {
    Journal "ECHEC : droits administrateur requis. Lancez ouvrir-pare-feu.cmd."
    exit 3
}

foreach ($r in $regles) {
    & netsh advfirewall firewall delete rule name="$($r.nom)" 2>&1 | Out-Null
    $sortie = & netsh advfirewall firewall add rule name="$($r.nom)" dir=in action=allow `
        protocol=TCP localport=$($r.port) remoteip=localsubnet profile=any 2>&1
    Journal ("TCP {0} : {1}" -f $r.port, ($sortie -join " "))
}

# --- verification : la regle existe ET le port repond en local ------------
$ok = 0
foreach ($r in $regles) {
    $vue = (& netsh advfirewall firewall show rule name="$($r.nom)" 2>&1) -join " "
    if ($vue -match "$($r.port)") { Journal "regle $($r.nom) : presente"; $ok++ }
    else { Journal "regle $($r.nom) : ABSENTE" }
}

$reponse = & curl.exe -s -o NUL -w "%{http_code}" -m 8 -k `
    --resolve "lcd.test:443:127.0.0.1" "https://lcd.test/hote" 2>$null
Journal "verification locale : /hote -> $reponse (302 attendu : l'application est protegee)"

Journal "=== fin : $ok regle(s) posee(s) ==="
if ($ok -eq $regles.Count) { exit 0 } else { exit 1 }
