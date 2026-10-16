# lab/lab-run.ps1 -- test global local 1 commande (P8-9, REQ-S-004).
# Jumeau Windows de lab-run.sh : seed-reset COMPLET (fixtures + volumes,
# car l'etat resa vit dans les volumes Docker) -> rebuild -> sante ->
# batterie -> faux VPS -> self-hosted deploy/.
# Usage : powershell -ExecutionPolicy Bypass -File lab/lab-run.ps1 [-NoVps] [-NoBuild] [-NoDeploy]
param([switch]$NoVps, [switch]$NoBuild, [switch]$NoDeploy)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "== 0/5 seed-reset complet (fixtures + volumes) =="
# Stacks satellites d'abord : un deploy/ ou vps-sim oublie UP fausse les
# checks (ports 4000/4001 occupes) -- teardown silencieux, jamais bloquant.
# (try/catch + stderr fusionne : avec "Stop", le moindre stderr natif est
# terminant -- constate sur down -v le 2026-10-16.)
try { Set-Location (Join-Path (Join-Path $PSScriptRoot "..") "deploy"); docker compose down -v 2>&1 | Out-Null } catch {}
try { Set-Location (Join-Path $PSScriptRoot "vps-sim"); docker compose down -v 2>&1 | Out-Null } catch {}
Set-Location $PSScriptRoot
powershell -ExecutionPolicy Bypass -File ./seed-reset.ps1 -Volumes
if (-not $NoBuild) {
  Write-Host "== 1/5 rebuild lab =="
  docker compose up -d --build
} else {
  Write-Host "== 1/5 up lab (sans rebuild) =="
  docker compose up -d
}
Write-Host "== 2/5 attente sante (120 s max) =="
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
Write-Host "== 3/5 batterie tests_lab.py =="
# Batterie KO != stop : on CONTINUE vers vps-sim + deploy pour le bilan
# complet, et le verdict final porte l'exit (jamais de vert mensonger).
$BAT_EXIT = 0
try { python -u tests_lab.py; if ($LASTEXITCODE -ne 0) { $BAT_EXIT = $LASTEXITCODE } } catch { $BAT_EXIT = 1 }
if ($BAT_EXIT -ne 0) { Write-Host "NOTE 3/5 : batterie exit $BAT_EXIT (KO en cascade possibles si kill externe) -- suite du run." }
if (-not $NoVps) {
  Write-Host "== 4/5 faux VPS =="
  Set-Location (Join-Path $PSScriptRoot "vps-sim")
  docker compose up -d --build
  Start-Sleep 10
  powershell -ExecutionPolicy Bypass -File ./test-vps.ps1
  docker compose down -v
  Set-Location $PSScriptRoot
} else {
  Write-Host "== 4/5 faux VPS saute (-NoVps) =="
}
if (-not $NoDeploy) {
  Write-Host "== 5/5 stack self-hosted deploy/ =="
  Set-Location (Join-Path (Join-Path $PSScriptRoot "..") "deploy")
  docker compose up -d --build
  Start-Sleep 15
  powershell -ExecutionPolicy Bypass -File ./test-deploy.ps1
  docker compose down -v
  Set-Location $PSScriptRoot
} else {
  Write-Host "== 5/5 stack self-hosted sautee (-NoDeploy) =="
}
if ($BAT_EXIT -ne 0) { Write-Host "RESULTAT : run global INCOMPLET (batterie KO) -- voir KO ci-dessus."; exit $BAT_EXIT }
Write-Host "RESULTAT : run global OK (P8-9 REQ-S-004)."
