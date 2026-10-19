# lab/start-all.ps1 -- demarrage DURABLE de tout le SAS local (1 commande).
# Jumeau Windows de start-all.sh : lab + vps-sim + deploy UP, sans teardown.
# Idempotent : relancer ne casse rien (compose up est declaratif).
# Usage : powershell -ExecutionPolicy Bypass -File lab/start-all.ps1 [-NoBuild]
param([switch]$NoBuild)
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
Write-Host "== 1/3 lab =="
if (-not $NoBuild) {
  docker compose up -d --build
} else {
  docker compose up -d
}
# profil moli : box-nord (log3) deploye son runtime moli-box-nord.
# SANS --build (contexte distant — rebuild via MOLI_SRC, voir README).
docker compose --profile moli up -d
Write-Host "== 2/3 faux VPS (vps-sim) =="
Set-Location (Join-Path $PSScriptRoot "vps-sim")
docker compose up -d --build
Write-Host "== 3/3 self-hosted (deploy) =="
Set-Location (Join-Path (Join-Path $PSScriptRoot "..") "deploy")
docker compose up -d --build
Set-Location $PSScriptRoot
Write-Host ""
Write-Host "ACCES (local) :"
Write-Host "  lab socle      : http://127.0.0.1:8090..8100 + :8050 :8060 :8443 :8123"
Write-Host "  faux VPS sim   : https://parc.test:4433 + https://api.test:4443 (tls interne, --resolve)"
Write-Host "  self-hosted    : https://lcd.test:4001 (front + /api/*)"
Write-Host ""
Write-Host "Verifier : powershell -File lab/vps-sim/test-vps.ps1 && powershell -File deploy/test-deploy.ps1"
