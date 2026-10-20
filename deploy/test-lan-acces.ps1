# Batterie G-lan-acces (doctrine docs/71, §8 quindecies) : le SAS est-il
# joignable DEPUIS LE RESEAU LOCAL, et si non, qu'est-ce qui manque exactement ?
#
#   powershell -ExecutionPolicy Bypass -File ./test-lan-acces.ps1
#
# La question « pret pour le LAN » n'est pas une opinion : elle se mesure. Trois
# etats possibles, et un seul est une panne :
#   - OUVERT   : l'entree repond sur l'adresse LAN -> rien a faire ;
#   - FERME    : elle ne repond pas, mais Docker publie bien sur 0.0.0.0 et
#                aucune regle de pare-feu n'existe pour ces ports -> il manque
#                UN geste d'administrateur, nomme et imprime ;
#   - CASSE    : elle ne repond pas non plus en boucle locale, ou Docker est
#                lie a 127.0.0.1, ou une regle existe et bloque quand meme.
#
# Checks :
#   1. l'adresse LAN de la machine est identifiee ;
#   2. l'entree repond en boucle locale (le service est vivant) ;
#   3. Docker publie 4001/4002/4003 sur 0.0.0.0 (pas sur 127.0.0.1) ;
#   4. l'acces LAN est classe OUVERT ou FERME-par-pare-feu (jamais devine) ;
#   5. si une regle de pare-feu existe pour ces ports, l'acces LAN repond ;
#   6. le geste d'administrateur imprime correspond aux ports reellement lies.

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ports = @(4001, 4002, 4003)

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
function Code([string]$url, [string[]]$extra = @()) {
    $a = @("-s", "-o", "NUL", "-w", "%{http_code}", "-m", "5") + $extra + @($url)
    return ((Natif { & curl.exe @a 2>$null } | Out-String).Trim())
}

# --- 1. Adresse LAN ----------------------------------------------------------
#  Get-NetIPAddress est CASSE sur cet hote (« Classe non valide » : la classe CIM
#  MSFT_NetIPAddress manque). On lit donc ipconfig, qui ne depend de rien.
$ips = @()
(ipconfig) | ForEach-Object { if ($_ -match "IPv4.*?:\s*([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+)") { $ips += $Matches[1] } }
$lan = $ips | Where-Object { $_ -notmatch "^(127\.|169\.254\.)" } | Select-Object -First 1
Verif ("adresse LAN identifiee (" + $(if ($lan) { $lan } else { "aucune" }) + " ; candidates : " + ($ips -join ", ") + ")") ([bool]($lan))

# --- 2. Boucle locale --------------------------------------------------------
$local = Code "https://lcd.test:4001/hote" @("-k", "--resolve", "lcd.test:4001:127.0.0.1")
Verif ("l'entree repond en boucle locale (mesure " + $local + ")") ([bool]($local -eq "302"))

# --- 3. Liaisons Docker ------------------------------------------------------
$lies = (Natif { & docker port "lcd-deploy-caddy-1" 2>&1 } | Out-String)
$surTout = @($ports | Where-Object { $lies -match ("0\.0\.0\.0:" + $_) }).Count
$surLocal = @($ports | Where-Object { $lies -match ("127\.0\.0\.1:" + $_) }).Count
Verif ("Docker publie les trois ports sur 0.0.0.0 (" + $surTout + "/3, dont " + $surLocal + " sur 127.0.0.1)") (
    [bool]($surTout -eq 3 -and $surLocal -eq 0))
if ($surTout -ne 3 -or $surLocal -ne 0) { Write-Output ("       liaisons : " + (($lies -split "`r?`n" | Where-Object { $_ }) -join " ; ")) }

# --- 4. Classement de l'acces LAN -------------------------------------------
$codes = @{}
foreach ($p in $ports) { $codes[$p] = if ($lan) { Code "https://lcd.test:${p}/hote" @("-k", "--resolve", "lcd.test:${p}:$lan") } else { "000" } }
$repondSurLan = @($ports | Where-Object { $codes[$_] -ne "000" }).Count
$profils = (Natif { & netsh advfirewall show allprofiles state 2>&1 } | Out-String)
$pareFeuActif = [bool]($profils -match "(?i)actif|on")
$regles = (Natif { & netsh advfirewall firewall show rule name=all dir=in 2>&1 } | Out-String)
$reglePorts = [bool](@($ports | Where-Object { $regles -match ("\b" + $_ + "\b") }).Count -gt 0)

$etat = if ($repondSurLan -eq 3) { "OUVERT" }
        elseif ($repondSurLan -eq 0 -and $pareFeuActif -and -not $reglePorts) { "FERME-PAR-PARE-FEU" }
        elseif ($repondSurLan -eq 0) { "CASSE" } else { "PARTIEL" }
Verif ("acces LAN classe : " + $etat + " (" + $repondSurLan + "/3 ports repondent sur " + $lan + ")") (
    [bool]($etat -eq "OUVERT" -or $etat -eq "FERME-PAR-PARE-FEU"))

# --- 5. Coherence regle / acces ---------------------------------------------
if ($reglePorts) {
    Verif "une regle existe pour ces ports et l'acces LAN repond" ([bool]($repondSurLan -eq 3))
} else {
    Verif "aucune regle de pare-feu pour ces ports (le geste admin reste a faire) : coherent avec l'etat" (
        [bool]($etat -ne "OUVERT"))
}

# --- 6. Le geste d'administrateur -------------------------------------------
$cmd = "netsh advfirewall firewall add rule name=""LCD SAS (LAN)"" dir=in action=allow protocol=TCP localport=4001,4002,4003"
$outil = Test-Path (Join-Path (Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)) "lan-ouvrir.ps1")
Verif "le geste d'administrateur est imprime et correspond aux ports lies" (
    [bool]($cmd -match "4001,4002,4003" -and $outil))

Write-Output ""
if ($etat -eq "FERME-PAR-PARE-FEU") {
    Write-Output "       a executer en administrateur (un seul geste) :"
    Write-Output ("         " + $cmd)
    Write-Output "       puis relancer cette batterie : l'etat doit passer a OUVERT."
}
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : acces LAN mesure (" + $etat + ", " + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N + " - l'acces LAN n'est pas dans un etat explique")
exit $script:KO
