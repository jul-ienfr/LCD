# lab/lab-run.ps1 — test global local 1 commande (P8-9, REQ-S-004).
# Jumeau Windows de lab-run.sh : seed-reset COMPLET (fixtures + volumes,
# car l'état resa vit dans les volumes Docker) → rebuild → santé → batterie → faux VPS.
# Usage : powershell -ExecutionPolicy Bypass -File lab/lab-run.ps1 [-NoVps] [-NoBuild]
param([switch]$NoVps, [switch]$NoBuild)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "== 0/4 seed-reset complet (fixtures + volumes) =="
powershell -ExecutionPolicy Bypass -File ./seed-reset.ps1 -Volumes
if (-not $NoBuild) {
  Write-Host "== 1/4 rebuild lab =="
  docker compose up -d --build
} else {
  Write-Host "== 1/4 up lab (sans rebuild) =="
  docker compose up -d
}
Write-Host "== 2/4 attente sante (120 s max) =="
$sain = $false
for ($i = 1; $i -le 24; $i++) {
  try {
    foreach ($p in @(8090,8091,8092,8093,8094,8095,8096,8097,8098,8099,8100,8050,8060,8443)) {
      (New-Object Net.WebClient).DownloadString("http://127.0.0.1:$p/health") | Out-Null
    }
    $sain = $true; Write-Host "OK : 14 endpoints sains apres $($i*5) s."; break
  } catch { Start-Sleep 5 }
}
if (-not $sain) { Write-Host "KO : lab non sain apres 120 s."; exit 1 }
Write-Host "== 3/4 batterie tests_lab.py =="
python -u tests_lab.py
if (-not $NoVps) {
  Write-Host "== 4/4 faux VPS =="
  Set-Location (Join-Path $PSScriptRoot "vps-sim")
  docker compose up -d --build
  Start-Sleep 10
  powershell -ExecutionPolicy Bypass -File ./test-vps.ps1
  docker compose down -v
  Set-Location $PSScriptRoot
} else {
  Write-Host "== 4/4 faux VPS saute (-NoVps) =="
}
Write-Host "RESULTAT : run global OK (P8-9 REQ-S-004)."
