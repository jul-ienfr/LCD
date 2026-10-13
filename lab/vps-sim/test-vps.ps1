#Requires -Version 5.1
<#
.SYNOPSIS
  Test du faux VPS (lab/vps-sim) : TLS + 2 origines + allowlist, 0 secret.
.DESCRIPTION
  Suppose le compose vps-sim DEMARRE (docker compose up -d separement).
  Verifie : health TLS, /v1/statut, /metrics, POST relaye, socle ferme,
  headers HSTS+nosniff, 0 secret. Resolution via --resolve (pas de hosts).
  Tous les appels TLS utilisent -k (CA interne de sim, jamais LE prod).
#>
$ErrorActionPreference = "Stop"

$Script:Echecs = @()
function Check {
  param([string]$Nom, [bool]$Cond, [string]$Detail = "")
  if ($Cond) { Write-Host "[OK] $Nom" }
  else { Write-Host "[KO] $Nom $Detail"; $Script:Echecs += $Nom }
}

function Get-Tls {
  param([string]$Hote, [string]$Port, [string]$Chemin)
  $r = curl.exe -s -k -m 15 --resolve "${Hote}:${Port}:127.0.0.1" -D - -o "$env:TEMP/vps-sim-body.json" "https://${Hote}:${Port}${Chemin}" 2>&1
  $h = ($r | Where-Object { $_ -match "^(HTTP|strict|content-type|x-|cache)" } | Out-String)
  $b = Get-Content "$env:TEMP/vps-sim-body.json" -Raw -ErrorAction SilentlyContinue
  return @{ headers = "$h"; body = "$b" }
}

function Post-Tls {
  param([string]$Hote, [string]$Port, [string]$Chemin, [string]$Json)
  $code = curl.exe -s -k -m 20 --resolve "${Hote}:${Port}:127.0.0.1" -o "$env:TEMP/vps-sim-post.json" -w "%{http_code}" -X POST -H "content-type: application/json" -d $Json "https://${Hote}:${Port}${Chemin}"
  $pb = Get-Content "$env:TEMP/vps-sim-post.json" -Raw -ErrorAction SilentlyContinue
  return @{ code = "$code"; body = "$pb" }
}

$t1 = Get-Tls "parc.test" "4433" "/health"
Check "parc.test:4433/health = 200" ($t1.body -match '"ok":\s*true') $t1.body

$t2 = Get-Tls "api.test" "4443" "/v1/statut"
Check "api.test:4443/v1/statut = 200 + phase" ($t2.body -match '"phase_conseillee":\s*"(p1|p2|p3)"') $t2.body

$t3 = Get-Tls "api.test" "4443" "/metrics"
Check "api.test:4443/metrics lecture seule" ($t3.body -match '"lecture_seule":\s*true') $t3.body

$payload = '{"box_id":"box-sim","logement_id":"log1","action":"prix","qui":"personne_01","ref":"SIM-1","champs":{"logement_id":"log1","date":"2027-03-04","prix":120}}'
$p4 = Post-Tls "api.test" "4443" "/v1/action" $payload
Check "POST /v1/action via api = metier (200/400/409)" ($p4.code -match "^(200|400|409)$") ("HTTP " + $p4.code + " " + $p4.body)

$simNames = @("lcd-vps-sim-gateway-parc-1", "lcd-vps-sim-booking-direct-1")
$pubs = docker ps --format "{{.Names}} {{.Ports}}" 2>$null | Where-Object { $_ -match "^lcd-vps-sim-" -and $_ -match "0\.0\.0\.0:" }
$pubsSocle = @($pubs | Where-Object { $_ -notmatch "4433->443" -and $_ -notmatch "4443->443" })
Check "sim : seul Caddy publie (4433+4443), socle en expose seul" ($pubsSocle.Count -eq 0) ($pubsSocle -join " | ")

$t6 = Get-Tls "parc.test" "4433" "/health"
Check "headers HSTS + nosniff" (($t6.headers -match "Strict-Transport-Security") -and ($t6.headers -match "nosniff")) $t6.headers

$tout = (Get-Content "$env:TEMP/vps-sim-body.json" -Raw -ErrorAction SilentlyContinue) + (Get-Content "$env:TEMP/vps-sim-post.json" -Raw -ErrorAction SilentlyContinue)
$fuite = @('"pin"', '"secret"', '"token"', '"password"', '"api_key"', 'LCD_HA_') | Where-Object { $tout -match [regex]::Escape($_) }
Check "0 fuite secret sur reponses sim" ($fuite.Count -eq 0) ($fuite -join ",")

if ($Script:Echecs.Count -gt 0) { Write-Host "RESULTAT : $($Script:Echecs.Count) ECHEC(S)"; exit 1 }
Write-Host "RESULTAT : faux VPS OK (TLS + 2 origines + allowlist + socle ferme)"
