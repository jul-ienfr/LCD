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
  # --profile moli OBLIGATOIRE : les services profilés ne sont pas arrêtés
  # par un down nu, gardent `ics-logs` monté et Docker refuse alors la
  # suppression ("Resource is still in use") - preuves/avis/contrats du
  # moteur decision SURVIVENT aux resets et font echouer la batterie
  # (carnet T2 attend 2 releves, en trouve 8 apres 4 runs).
  docker compose --profile moli down -v
  Write-Host "OK : volumes runtime supprimes (down -v, profil moli inclus)."
}
Write-Host "Relancer : cd lab ; docker compose up -d --build ; docker compose --profile moli up -d ; python tests_lab.py"
Write-Host "(moli SANS --build : contexte distant, image locale moli-os:lcd-lab ; rebuild via MOLI_SRC)"
