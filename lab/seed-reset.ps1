# lab/seed-reset.ps1 — remise à zéro des fixtures lab (P8-9, REQ-S-004).
# Jumeau Windows de seed-reset.sh : restaure le seed versionné en 1 commande.
# Usage : powershell -ExecutionPolicy Bypass -File lab/seed-reset.ps1 [-Volumes]
param([switch]$Volumes)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
git checkout -- lab/inventaire.lab lab/memoire.lab lab/stocks.lab lab/extras.lab lab/prestataires.lab lab/parc-registre lab/branding.lab.yaml lab/logements.lab.yaml lab/lab-config
Write-Host "OK : fixtures lab restaurees depuis le seed versionne."
if ($Volumes) {
  Set-Location (Join-Path $PSScriptRoot "")
  docker compose down -v
  Write-Host "OK : volumes runtime supprimes (down -v)."
}
Write-Host "Relancer : cd lab ; docker compose up -d --build ; python tests_lab.py"
