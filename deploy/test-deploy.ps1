# deploy/test-deploy.ps1 — vérification bout en bout stack auto-hébergée.
# Mode IdP (F3) : l'entrée lcd.test:4001 est TOUJOURS derrière forward_auth.
#   - anonyme : 302 portail (fail-closed) sur les pages/écritures protégées,
#     200 seulement sur les bypasss réels (/api/health, /voyageur) ;
#   - authentifié : chaîne complète déléguée à test-idp.ps1 (DRY — une seule
#     recette décrit 1FA/2FA/révocation/logout).
# Suppose lab DÉMARRÉ (lcd-lab_default) + deploy DÉMARRÉ (LCD_IDP=1).
# Résolution via --resolve (pas de hosts). TLS -k (CA interne). Jamais de
# secret attendu dans les réponses.
# Usage : cd deploy ; docker compose up -d --build ; powershell ./test-deploy.ps1
$ErrorActionPreference = "Continue"
$KO = 0
function Check($nom, $ok, $detail = "") {
  if ($ok) { Write-Host "[OK] $nom" } else { Write-Host "[KO] $nom $detail"; $script:KO++ }
}
function Court($s, $n = 120) {
  if ([string]::IsNullOrEmpty($s)) { return "(vide)" }
  return $s.Substring(0, [Math]::Min($n, $s.Length))
}
# Requete TLS via curl --resolve (SNI conserve) avec VRAI code HTTP ; fallback
# Invoke-WebRequest (SkipCertificateCheck) si curl absent.
$useCurl = (Get-Command curl.exe -ErrorAction SilentlyContinue) -ne $null
function Get-ViaCurl($hote, $port, $chemin) {
  if (-not $useCurl) {
    try {
      $r = Invoke-WebRequest -Uri "https://${hote}:${port}${chemin}" -SkipCertificateCheck `
        -TimeoutSec 20 -MaximumRedirection 0 -UseBasicParsing
      return @{ code = $r.StatusCode; corps = $r.Content; headers = "$($r.Headers)" }
    } catch {
      $resp = $_.Exception.Response
      if ($resp) {
        $sr = New-Object IO.StreamReader($resp.GetResponseStream())
        return @{ code = [int]$resp.StatusCode; corps = $sr.ReadToEnd(); headers = "$($resp.Headers)" }
      }
      return @{ code = 0; corps = "$_"; headers = "" }
    }
  }
  $t = New-TemporaryFile; $h = New-TemporaryFile
  $code = curl.exe -s -k -m 20 --resolve "${hote}:${port}:127.0.0.1" `
    -D $h -o $t -w "%{http_code}" "https://${hote}:${port}${chemin}" 2>$null
  $corps = Get-Content $t -Raw -ErrorAction SilentlyContinue
  $hdrs = Get-Content $h -Raw -ErrorAction SilentlyContinue
  Remove-Item $t, $h -Force -ErrorAction SilentlyContinue
  return @{ code = [int]"$code"; corps = $corps; headers = $hdrs }
}

Write-Host "== Anonyme : fail-closed (302 portail) + seuls bypasss reels =="
$R1 = Get-ViaCurl "lcd.test" 4001 "/"
Check "anonyme / -> 200 vitrine publique (racine ouverte, application protegee)" ($R1.code -eq 200) $R1.code
$R3 = Get-ViaCurl "lcd.test" 4001 "/api/v1/statut"
Check "anonyme /api/v1/statut -> 302 (ecriture moteur fermee)" (
  $R3.code -eq 302) $R3.code
$R4 = Get-ViaCurl "lcd.test" 4001 "/proprio?logement=log1&qui=personne_05"
Check "anonyme /proprio -> 302 (portal proprio derriere IdP)" (
  $R4.code -eq 302) $R4.code
$R2 = Get-ViaCurl "lcd.test" 4001 "/api/health"
Check "bypass /api/health = 200 ok" ($R2.code -eq 200 -and $R2.corps -match '"ok":\s*true') (Court $R2.corps)
$R5 = Get-ViaCurl "lcd.test" 4001 "/voyageur"
Check "bypass /voyageur = 200 (lien signe, sans session)" (
  $R5.code -eq 200 -and $R5.corps -match "Voyageur|voyageur") $R5.code

Write-Host "== TLS / headers / fuites =="
$hdrs = "$($R5.headers)"
Check "headers HSTS + nosniff" ($hdrs -match "Strict-Transport-Security" -and $hdrs -match "nosniff")
$TOUT = "$($R1.corps)$($R2.corps)$($R3.corps)$($R5.corps)"
$FUITE = @('"pin"', '"secret"', '"token"', '"password"', '"api_key"', 'LCD_HA_') |
  Where-Object { $TOUT -match [regex]::Escape($_) }
Check "0 fuite secret sur reponses" ($FUITE.Count -eq 0) ($FUITE -join " ")

Write-Host "== Vitrine publique vs application fermée =="
# Defaut produit corrige le 2026-10-19 : un visiteur tombait sur un mur de login.
# La propriete doit tenir EN CONTINU, pas seulement le jour de la correction :
#   - la racine est PUBLIQUE (200, la vitrine) ;
#   - une route applicative reste FERMEE (302 vers le portail).
# Une regression ici referme la vitrine ou ouvre l'application : les deux sont graves.
$hote = "lcd.test"
$pub = (& curl.exe -s -o NUL -w "%{http_code}" -m 12 -k --resolve "${hote}:443:127.0.0.1" "https://${hote}/" 2>$null)
$pro = (& curl.exe -s -o NUL -w "%{http_code}" -m 12 -k --resolve "${hote}:443:127.0.0.1" "https://${hote}/hote" 2>$null)
Check "racine publique (vitrine, 200)" ($pub -eq "200") "HTTP $pub"
Check "route applicative fermee (302)" ($pro -eq "302") "HTTP $pro"
Write-Host "== Chaîne authentifiée (déléguée à test-idp.ps1) =="
if ($KO -eq 0) {
  powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot "test-idp.ps1")
  if ($LASTEXITCODE -ne 0) { $script:KO += [int]$LASTEXITCODE }
} else {
  Write-Host "[KO] test-idp.ps1 SAUTE (prerequis anonyme en echec)"
  $script:KO += 1
}

if ($KO -gt 0) { Write-Host "RESULTAT : $KO ECHEC(S)"; exit 1 }
Write-Host "RESULTAT : stack self-hosted OK (IdP + Caddy + gateway lab + recette)"
