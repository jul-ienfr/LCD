#!/bin/sh
# lab/lab-run.sh — test global local 1 commande (P8-9, REQ-S-004).
# Enchaîne : seed-reset COMPLET (fixtures + volumes runtime, car l'état resa
# vit dans les volumes Docker, pas dans les fixtures) → rebuild lab →
# attente santé → batterie tests_lab.py → faux VPS (up + test-vps + down) →
# stack self-hosted deploy/ (build front + up + test-deploy + down).
# Usage : sh lab/lab-run.sh [--no-vps] [--no-build] [--no-deploy]
#   --no-vps    : saute le faux VPS (plus rapide)
#   --no-build  : saute le rebuild (images déjà à jour)
#   --no-deploy : saute la stack self-hosted (plus rapide)
# Windows : powershell -ExecutionPolicy Bypass -File lab/lab-run.ps1 [-NoVps] [-NoBuild] [-NoDeploy]
set -e
cd "$(dirname "$0")"
NO_VPS=0; NO_BUILD=0; NO_DEPLOY=0
for a in "$@"; do
  case "$a" in --no-vps) NO_VPS=1;; --no-build) NO_BUILD=1;; --no-deploy) NO_DEPLOY=1;; esac
done
echo "== 0/5 seed-reset complet (fixtures + volumes) =="
# Stacks satellites d'abord : un deploy/ ou vps-sim oublié UP fausse les
# checks (ports 4000/4001 occupés, réseau résiduel) — teardown silencieux.
(cd ../deploy && docker compose down -v 2>/dev/null || true)
(cd vps-sim && docker compose down -v 2>/dev/null || true)
sh seed-reset.sh --volumes
if [ "$NO_BUILD" = "0" ]; then
  echo "== 1/5 rebuild lab =="
  docker compose up -d --build
else
  echo "== 1/5 up lab (sans rebuild) =="
  docker compose up -d
fi
echo "== 2/5 attente sante (120 s max) =="
for i in $(seq 1 24); do
  if python3 -c "import urllib.request
for p in (8090,8091,8092,8093,8094,8095,8096,8097,8098,8099,8100,8050,8060,8443):
    urllib.request.urlopen(f'http://127.0.0.1:{p}/health',timeout=5).read()" 2>/dev/null; then
    echo "OK : 14 endpoints sains apres ${i}x5 s."; break
  fi
  if [ "$i" = "24" ]; then echo "KO : lab non sain apres 120 s."; exit 1; fi
  sleep 5
done
echo "== 3/5 batterie tests_lab.py =="
# set +e local : la batterie peut rendre des KO (ex. conteneur kill externe
# mid-run) — on CONTINUE vers vps-sim + deploy pour le bilan complet, et le
# verdict final porte l'exit (jamais de vert mensonger).
set +e
python3 -u tests_lab.py
BAT_EXIT=$?
set -e
if [ "$BAT_EXIT" != "0" ]; then echo "NOTE 3/5 : batterie exit $BAT_EXIT (KO en cascade possibles si kill externe) — suite du run."; fi
if [ "$NO_VPS" = "0" ]; then
  echo "== 4/5 faux VPS =="
  (cd vps-sim && docker compose up -d --build)
  sleep 10
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -ExecutionPolicy Bypass -File vps-sim/test-vps.ps1
  else
    sh vps-sim/test-vps.sh
  fi
  (cd vps-sim && docker compose down -v)
else
  echo "== 4/5 faux VPS saute (--no-vps) =="
fi
if [ "$NO_DEPLOY" = "0" ]; then
  echo "== 5/5 stack self-hosted deploy/ =="
  (cd ../deploy && docker compose up -d --build)
  sleep 15
  if command -v powershell.exe >/dev/null 2>&1; then
    powershell.exe -ExecutionPolicy Bypass -File ../deploy/test-deploy.ps1
  else
    sh ../deploy/test-deploy.sh
  fi
  (cd ../deploy && docker compose down -v)
else
  echo "== 5/5 stack self-hosted sautee (--no-deploy) =="
fi
if [ "$BAT_EXIT" != "0" ]; then echo "RESULTAT : run global INCOMPLET (batterie exit $BAT_EXIT) — voir KO ci-dessus."; exit "$BAT_EXIT"; fi
echo "RESULTAT : run global OK (P8-9 REQ-S-004)."
