#!/bin/sh
# lab/start-all.sh — démarrage DURABLE de tout le SAS local (1 commande).
# Différence avec lab-run.sh (qui teste PUIS démonte vps-sim/deploy) :
# ici on démarre tout et on NE TOUCHE plus à rien — état accessible final.
#   1. lab (19 services, socle 8090-8100 + 8050/8060/8443/8123 + nord)
#   2. faux VPS vps-sim (parc.test:4433 + api.test:4443)
#   3. self-hosted deploy (front + Caddy lcd.test:4001)
# Idempotent : relancer ne casse rien (compose up est déclaratif).
# Usage : sh lab/start-all.sh [--no-build]
# Windows : powershell -ExecutionPolicy Bypass -File lab/start-all.ps1 [-NoBuild]
set -e
cd "$(dirname "$0")"
NO_BUILD=0
for a in "$@"; do
  case "$a" in --no-build) NO_BUILD=1;; esac
done
echo "== 1/3 lab =="
if [ "$NO_BUILD" = "0" ]; then
  docker compose up -d --build
else
  docker compose up -d
fi
# profil moli : box-nord (log3) deploye son runtime moli-box-nord.
# SANS --build (contexte distant - rebuild via MOLI_SRC, voir README).
docker compose --profile moli up -d
echo "== 2/3 faux VPS (vps-sim) =="
(cd vps-sim && docker compose up -d --build)
echo "== 3/3 self-hosted (deploy) =="
(cd ../deploy && docker compose up -d --build)
echo ""
echo "ACCES (local) :"
echo "  lab socle      : http://127.0.0.1:8090..8100 + :8050 :8060 :8443 :8123"
echo "  faux VPS sim   : https://parc.test:4433 + https://api.test:4443 (tls interne, --resolve)"
echo "  self-hosted    : https://lcd.test:4001 (front + /api/*)"
echo ""
echo "Verifier : powershell -File lab/vps-sim/test-vps.ps1 && powershell -File deploy/test-deploy.ps1"
