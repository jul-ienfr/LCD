# lan-ouvrir.ps1 — ETAPE HOTE (une seule fois, en administrateur) pour rendre le
# SAS LCD joignable depuis le LAN. Doctrine docs/71, R3 (local -> LAN -> Internet).
#
#   powershell -ExecutionPolicy Bypass -File .\lan-ouvrir.ps1            # etat + commandes
#   powershell -ExecutionPolicy Bypass -File .\lan-ouvrir.ps1 -Poser     # applique (admin)
#
# Pourquoi cette etape existe (mesure du 2026-10-19, pas une supposition) :
#   - docker publie bien 0.0.0.0:4001/4002/4003 (docker port le prouve) ;
#   - mais AUCUN listener n'apparait cote Windows (Get-NetTCPConnection vide) :
#     les ports vivent dans la VM WSL2 et Docker Desktop ne les relaie qu'en
#     loopback (localhostForwarding). D'ou : loopback 200, IP LAN 000.
#   - deux verrous hote, tous deux en administrateur :
#       1. relais WSL2 -> LAN   : netsh interface portproxy (ou Docker Desktop
#                                 "host networking") ;
#       2. pare-feu Windows     : regle entrante TCP sur les 3 ports.
#
# Ce script ne touche a AUCUNE donnee : uniquement reseau/pare-feu de l'hote.
# Il est idempotent (relancer ne duplique rien) et verifie le resultat.

param([switch]$Poser)

$ErrorActionPreference = "Stop"
$ports = @(4001, 4002, 4003)
$admin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)

$ips = @((ipconfig | Select-String "IPv4") | ForEach-Object { ($_ -split ":")[-1].Trim() } |
    Where-Object { $_ -match '^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.)' })
# Ordre de preference pour l'indication "postes clients" : un reseau domestique
# est presque toujours en 192.168/16 ; 10/8 peut etre un VPN ou le reseau WSL.
$ipLan = ($ips | Sort-Object { if ($_ -match '^192\.168\.') { 0 } elseif ($_ -match '^10\.') { 1 } else { 2 } } |
    Select-Object -First 1)
if (-not $ipLan) { $ipLan = "<IP-du-serveur>" }

Write-Output "== Etat de l'hote =="
Write-Output ("administrateur : " + $(if ($admin) { "oui" } else { "NON" }))
Write-Output ("IP privee      : " + ($ips -join ", "))

$ecoute = @(Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue |
    Where-Object { $_.LocalPort -in $ports })
Write-Output ("listeners Windows sur " + ($ports -join "/") + " : " + $ecoute.Count)

$proxy = @(netsh interface portproxy show v4tov4 2>$null | Select-String "400[123]")
Write-Output ("regles portproxy : " + $proxy.Count)

$regles = @(Get-NetFirewallRule -DisplayName "LCD SAS*" -ErrorAction SilentlyContinue)
Write-Output ("regles pare-feu LCD : " + $regles.Count)
try {
    foreach ($profil in (Get-NetConnectionProfile -ErrorAction Stop)) {
        Write-Output ("profil reseau  : " + $profil.Name + " -> " + $profil.NetworkCategory)
    }
} catch { Write-Output "profil reseau  : (non lisible sans elevation)" }

if (-not $Poser) {
    Write-Output ""
    Write-Output "== Commandes a executer dans un PowerShell ADMINISTRATEUR =="
    Write-Output "   (ou : powershell -ExecutionPolicy Bypass -File .\lan-ouvrir.ps1 -Poser)"
    Write-Output ""
    foreach ($p in $ports) {
        Write-Output ("netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$p connectaddress=127.0.0.1 connectport=$p")
    }
    Write-Output ("New-NetFirewallRule -DisplayName 'LCD SAS LAN' -Direction Inbound -Protocol TCP -LocalPort " + ($ports -join ",") + " -Action Allow -Profile Private")
    Write-Output ""
    Write-Output "== Cote POSTES CLIENTS (LAN) =="
    Write-Output "  1) fichier hosts (admin) : $ipLan`tlcd.test"
    Write-Output "     (ou DHCP/DNS local : enregistrer lcd.test -> $ipLan)"
    Write-Output "  2) faire confiance a l'autorite de certification interne :"
    Write-Output "     docker cp lcd-deploy-caddy-1:/data/caddy/pki/authorities/local/root.crt .\lcd-root.crt"
    Write-Output "     puis importer lcd-root.crt dans 'Autorites de certification racines de confiance'"
    Write-Output "  3) verifier : curl.exe -s -o NUL -w '%{http_code}' https://lcd.test:4001/api/health   -> 200"
    Write-Output ""
    exit 0
}

if (-not $admin) {
    Write-Error "L'option -Poser exige un PowerShell ADMINISTRATEUR (pare-feu + portproxy)."
}

Write-Output ""
Write-Output "== Application =="
foreach ($p in $ports) {
    netsh interface portproxy delete v4tov4 listenaddress=0.0.0.0 listenport=$p 2>$null | Out-Null
    netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=$p connectaddress=127.0.0.1 connectport=$p | Out-Null
    Write-Output "portproxy 0.0.0.0:$p -> 127.0.0.1:$p"
}
$nom = "LCD SAS LAN"
Get-NetFirewallRule -DisplayName $nom -ErrorAction SilentlyContinue | Remove-NetFirewallRule
New-NetFirewallRule -DisplayName $nom -Direction Inbound -Protocol TCP -LocalPort ($ports -join ",") `
    -Action Allow -Profile Private | Out-Null
Write-Output "pare-feu : entrantes TCP $($ports -join ',') autorisees (profil prive)"

Write-Output ""
Write-Output "== Verification =="
$ok = 0
foreach ($ip in $ips) {
    $c = & curl.exe --resolve "lcd.test:4001:${ip}" -k -s -o NUL -w "%{http_code}" -m 6 https://lcd.test:4001/api/health 2>$null
    Write-Output ("  https://lcd.test:4001 via $ip -> $c")
    if ($c -eq "200") { $ok++ }
}
if ($ok -gt 0) {
    Write-Output "RESULTAT : LAN operationnel (relancer deploy/test-lan.ps1 -Exiger pour le gate complet)"
} else {
    Write-Output "RESULTAT : toujours bloque. Verifier que Docker Desktop expose le reseau"
    Write-Output "  (Settings > Resources > Network) et que le profil pare-feu du reseau est 'Prive'."
}
exit $(if ($ok -gt 0) { 0 } else { 1 })
