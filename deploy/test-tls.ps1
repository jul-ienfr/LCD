# Batterie G-tls (doctrine docs/71, §8 sexdecies) : le mode TLS est-il
# PARAMETRE, et la bascule vers Let's Encrypt est-elle deja validee ?
#
#   powershell -ExecutionPolicy Bypass -File ./test-tls.ps1
#
# POURQUOI : le passage sur Internet ne demande pas de reecrire Caddy, il
# demande de changer UNE variable (LCD_TLS=admin@domaine) pour que Caddy passe
# de sa CA interne a ACME. Tant que `tls internal` est ecrit en dur, cette
# bascule est une modification de code non testee. Cette batterie prouve :
#   1. aucun `tls internal` en dur dans le Caddyfile (mode parametre) ;
#   2. la configuration actuelle (CA interne) est VALIDE ;
#   3. la variante ACME (LCD_TLS=admin@domaine) est VALIDE AUSSI ;
#   4. l'entree repond 302 en TLS avec la CA interne ;
#   5. SANS -k, le client REFUSE le certificat : preuve que la CA est interne
#      et qu'aucun certificat public n'est en service ;
#   6. les en-tetes de securite sont bien servis (HSTS) ;
#   7. un rechargement de Caddy reussit (la config est appliquee, pas seulement
#      validee).

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false
$script:KO = 0
$script:N = 0
$ici = Split-Path -Parent (Resolve-Path $MyInvocation.MyCommand.Path)
$caddyfile = Join-Path $ici "Caddyfile"
$conteneur = "lcd-deploy-caddy-1"

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
function Caddy([string[]]$extra) {
    $a = @("exec") + $extra + @($conteneur, "caddy", "validate", "--config", "/etc/caddy/Caddyfile")
    $sortie = (Natif { & docker @a 2>$null } | Out-String)
    return [ordered]@{ code = $LASTEXITCODE; sortie = $sortie }
}

$texte = [IO.File]::ReadAllText($caddyfile, [Text.Encoding]::UTF8)
$enDur = ([regex]::Matches($texte, "(?m)^\s*tls internal")).Count
Verif ("aucun 'tls internal' en dur dans le Caddyfile (" + $enDur + ")") ([bool]($enDur -eq 0))
Verif "le mode TLS est parametre par LCD_TLS" ([bool]($texte -match "\{\`$LCD_TLS:internal\}"))

$interne = Caddy @()
Verif "la configuration actuelle (CA interne) est valide" ([bool]($interne.code -eq 0 -and $interne.sortie -match "Valid configuration"))

$acme = (Natif { & docker exec -e "LCD_TLS=admin@sas.exemple.fr" $conteneur caddy validate --config /etc/caddy/Caddyfile 2>$null } | Out-String)
Verif "la variante ACME (LCD_TLS=admin@domaine) est valide aussi" ([bool]($LASTEXITCODE -eq 0 -and $acme -match "Valid configuration"))

$code = (curl.exe -s -o NUL -w "%{http_code}" -m 8 -k --resolve "lcd.test:4001:127.0.0.1" "https://lcd.test:4001/hote" 2>$null)
Verif ("l'entree repond en TLS avec la CA interne (mesure " + $code + ")") ([bool]($code -eq "302"))

#  Sans -k, curl doit REFUSER : c'est la preuve qu'aucun certificat public
#  n'est en service (donc qu'ACME n'est pas actif en local).
$refus = (Natif { & curl.exe -s -o NUL -w "%{http_code}" -m 8 --resolve "lcd.test:4001:127.0.0.1" "https://lcd.test:4001/hote" 2>&1 } | Out-String)
$codeRefus = (Natif { & curl.exe -s -o NUL -w "%{http_code}" -m 8 --resolve "lcd.test:4001:127.0.0.1" "https://lcd.test:4001/hote" 2>$null } | Out-String).Trim()
Verif ("sans -k le client refuse le certificat (mesure " + $codeRefus + ", code " + $LASTEXITCODE + ")") (
    [bool]($codeRefus -eq "000" -and $LASTEXITCODE -ne 0))

$entetes = (Natif { & curl.exe -skI -m 8 --resolve "lcd.test:4001:127.0.0.1" "https://lcd.test:4001/hote" 2>$null } | Out-String)
Verif "HSTS et anti-sniffing servis" ([bool]($entetes -match "strict-transport-security" -and $entetes -match "x-content-type-options"))

$reload = (Natif { & docker exec $conteneur caddy reload --config /etc/caddy/Caddyfile 2>$null } | Out-String)
Verif "un rechargement de Caddy reussit (config appliquee)" ([bool]($LASTEXITCODE -eq 0))
Start-Sleep -Seconds 2
$apres = (curl.exe -s -o NUL -w "%{http_code}" -m 8 -k --resolve "lcd.test:4001:127.0.0.1" "https://lcd.test:4001/hote" 2>$null)
Verif ("l'entree repond encore apres rechargement (mesure " + $apres + ")") ([bool]($apres -eq "302"))

Write-Output ""
if ($script:KO -eq 0) {
    Write-Output ("RESULTAT : TLS parametre, bascule ACME validee, CA interne en service (" + $script:N + "/" + $script:N + " OK)")
    exit 0
}
Write-Output ("RESULTAT : " + $script:KO + " ECHEC(S) sur " + $script:N)
exit $script:KO
