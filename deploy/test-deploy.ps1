# deploy/test-deploy.ps1 — vérification bout en bout stack auto-hébergée (7 checks).
# Suppose lab DÉMARRÉ (lcd-lab_default) + deploy DÉMARRÉ. Résolution via
# --resolve (pas de hosts). TLS -k (CA interne). Jamais de secret attendu.
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
function Get-Tls($hote, $port, $chemin) {
  try {
    $r = Invoke-WebRequest -Uri "https://${hote}:${port}${chemin}" -SkipCertificateCheck -TimeoutSec 20 `
      -Headers @{ Host = $hote } -UseBasicParsing
    return @{ code = $r.StatusCode; corps = $r.Content; headers = $r.Headers }
  } catch {
    $resp = $_.Exception.Response
    if ($resp) {
      $sr = New-Object IO.StreamReader($resp.GetResponseStream()); $corps = $sr.ReadToEnd()
      return @{ code = [int]$resp.StatusCode; corps = $corps; headers = $resp.Headers }
    }
    return @{ code = 0; corps = "$_"; headers = @{} }
  }
}
# curl --resolve plutôt que Host (SNI conservé) si curl dispo :
$useCurl = (Get-Command curl.exe -ErrorAction SilentlyContinue) -ne $null
function Get-ViaCurl($hote, $port, $chemin) {
  if (-not $useCurl) { return Get-Tls $hote $port $chemin }
  $t = New-TemporaryFile; $h = New-TemporaryFile
  curl.exe -s -k -m 20 --resolve "${hote}:${port}:127.0.0.1" -D $h -o $t "https://${hote}:${port}${chemin}" 2>$null
  $corps = Get-Content $t -Raw -ErrorAction SilentlyContinue
  $hdrs = Get-Content $h -Raw -ErrorAction SilentlyContinue
  Remove-Item $t,$h -Force -ErrorAction SilentlyContinue
  return @{ code = 200; corps = $corps; headers = $hdrs }
}
$R1 = Get-ViaCurl "lcd.test" 4001 "/"
Check "front : page pilotage 200 (SSR)" ($R1.corps -match "Pilotage|Relev|Voyageur|LCD|passerelle injoignable") $R1.code
$R2 = Get-ViaCurl "lcd.test" 4001 "/api/health"
Check "gateway via Caddy : /api/health = ok" ($R2.corps -match '"ok":\s*true') (Court $R2.corps)
$R3 = Get-ViaCurl "lcd.test" 4001 "/api/v1/statut"
Check "gateway via Caddy : /api/v1/statut = phase" ($R3.corps -match "phase_conseillee") (Court $R3.corps)
$R4 = Get-ViaCurl "lcd.test" 4001 "/proprio?logement=log1&qui=personne_05"
Check "front : /proprio (releve mandat) 200" ($R4.corps -match "Relev|releve|injoignable") $R4.code
$R5 = Get-ViaCurl "lcd.test" 4001 "/voyageur"
Check "front : /voyageur 200" ($R5.corps -match "Voyageur|voyageur|injoignable") $R5.code
$hdrs = "$($R1.headers)"
Check "headers HSTS + nosniff" ($hdrs -match "Strict-Transport-Security" -and $hdrs -match "nosniff")
$TOUT = "$($R1.corps)$($R2.corps)$($R3.corps)"
$FUITE = @('"pin"', '"secret"', '"token"', '"password"', '"api_key"', 'LCD_HA_') | Where-Object { $TOUT -match [regex]::Escape($_) }
Check "0 fuite secret sur reponses" ($FUITE.Count -eq 0) ($FUITE -join " ")
if ($KO -gt 0) { Write-Host "RESULTAT : $KO ECHEC(S)"; exit 1 }
Write-Host "RESULTAT : stack self-hosted OK (front + Caddy + gateway lab)"
