#!/bin/sh
# lab/seed-reset.sh — remise à zéro des fixtures lab (P8-9, REQ-S-004).
# Les runs de tests_lab.py MUTENT les fixtures trackées (biens TEST-INV-*,
# registres parc-registre, conso stocks, etc. — assertions en >=, jamais ==).
# Ce script restaure le seed versionné en 1 commande, sans toucher au code.
# Usage : sh lab/seed-reset.sh [--volumes]
#   (sans option : fixtures seules ; --volumes : + docker compose down -v)
# Windows : powershell -ExecutionPolicy Bypass -File lab/seed-reset.ps1 [-Volumes]
set -e
cd "$(dirname "$0")/.."
git checkout -- \
  lab/inventaire.lab \
  lab/memoire.lab \
  lab/stocks.lab \
  lab/extras.lab \
  lab/prestataires.lab \
  lab/parc-registre \
  lab/branding.lab.yaml \
  lab/logements.lab.yaml \
  lab/lab-config
echo "OK : fixtures lab restaurees depuis le seed versionne."
if [ "${1:-}" = "--volumes" ]; then
  (cd lab && docker compose down -v)
  echo "OK : volumes runtime supprimes (down -v)."
fi
echo "Relancer : cd lab && docker compose up -d --build && python3 tests_lab.py"
