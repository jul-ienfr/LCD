#!/usr/bin/env bash
# Déploiement reproductible sur VPS Docker (ADR-06).
#
# Usage, depuis le dossier v2/ :
#   ./scripts/deployer.sh                     # déploie le tag courant
#   ./scripts/deployer.sh --tag v2.0.0-rc1    # récupère et déploie un tag précis
#   ./scripts/deployer.sh --sans-sauvegarde   # saute la sauvegarde préalable
#   ./scripts/deployer.sh --sans-migration    # saute les migrations
#   ./scripts/deployer.sh --sans-domaine      # ne teste que la santé interne
#
# Séquence : verrou → sauvegarde → checkout → build → migrations → démarrage →
# /api/health puis /api/ready → test HTTPS public. En cas d'échec, aucun
# redémarrage silencieux : le script sort en erreur et indique ./scripts/revenir.sh.
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env.prod -f compose.prod.yml)
VERROU="${TMPDIR:-/tmp}/lcd-deploiement.lock"
ETAT=".deploiement"
CIBLE=""
SAUVEGARDE=1
MIGRER=1
VERIFIER_DOMAINE=1

while [ $# -gt 0 ]; do
  case "$1" in
    --tag) CIBLE="${2:-}"; shift 2 ;;
    --sans-sauvegarde) SAUVEGARDE=0; shift ;;
    --sans-migration) MIGRER=0; shift ;;
    --sans-domaine) VERIFIER_DOMAINE=0; shift ;;
    -h|--help) sed -n '2,16p' "$0"; exit 0 ;;
    *) echo "Option inconnue : $1" >&2; exit 2 ;;
  esac
done

log() { printf '\n== %s ==\n' "$*"; }
erreur() { printf '\nERREUR : %s\n' "$*" >&2; }

if [ ! -f .env.prod ]; then
  erreur ".env.prod introuvable. Copier .env.prod.example et le remplir."
  exit 1
fi

# Un seul déploiement à la fois.
exec 9>"${VERROU}"
if ! flock -n 9; then
  erreur "un déploiement est déjà en cours (${VERROU})."
  exit 1
fi

DOMAINE="$(sed -n 's/^DOMAIN=//p' .env.prod | tail -n 1)"
PRECEDENT="$(git describe --tags --always 2>/dev/null || git rev-parse --short HEAD)"
mkdir -p "${ETAT}"

if [ "${SAUVEGARDE}" -eq 1 ]; then
  log "Sauvegarde avant déploiement"
  ./scripts/backup-vps.sh
fi

if [ -n "${CIBLE}" ]; then
  log "Récupération du tag ${CIBLE}"
  git fetch --tags --force
  git checkout --detach "${CIBLE}"
fi

COURANT="$(git describe --tags --always)"
echo "${PRECEDENT}" > "${ETAT}/precedent"
echo "${COURANT}" > "${ETAT}/courant"
echo "commit $(git rev-parse --short HEAD) le $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "${ETAT}/courant"

log "Construction des images (${COURANT})"
"${COMPOSE[@]}" build

log "Démarrage de PostgreSQL"
"${COMPOSE[@]}" up -d postgres

if [ "${MIGRER}" -eq 1 ]; then
  log "Migrations"
  "${COMPOSE[@]}" run --rm tools npm run db:migrate
fi

log "Démarrage web et Caddy"
export LCD_VERSION="${COURANT}"
"${COMPOSE[@]}" up -d web caddy

# Jeton de scrape Prometheus (FR-019) : Prometheus n'étend pas les variables
# d'environnement dans sa configuration, le jeton vit donc dans un fichier
# monté, régénéré à chaque déploiement. Vide = endpoint public (comportement
# documenté) ; Prometheus relit le fichier à chaque scrape, sans redémarrage.
log "Jeton de métriques (Prometheus)"
mkdir -p monitoring
JETON_METRIQUES="$(sed -n 's/^METRICS_TOKEN=//p' .env.prod | tail -n 1)"
printf '%s' "${JETON_METRIQUES}" > monitoring/metrics_token

attendre() {
  local description="$1" commande="$2" essais="${3:-30}" delai="${4:-5}" i
  for i in $(seq 1 "${essais}"); do
    if eval "${commande}" >/dev/null 2>&1; then
      echo "  ${description} : OK (essai ${i})"
      return 0
    fi
    sleep "${delai}"
  done
  echo "  ${description} : échec après ${essais} essais"
  return 1
}

log "Contrôle de santé interne"
SANTE='docker compose --env-file .env.prod -f compose.prod.yml exec -T web node -e "fetch(\"http://127.0.0.1:3000/api/health\").then(r=>{if(!r.ok)process.exit(1)}).catch(()=>process.exit(1))"'
PRET='docker compose --env-file .env.prod -f compose.prod.yml exec -T web node -e "fetch(\"http://127.0.0.1:3000/api/ready\").then(async r=>{const c=await r.json();if(!r.ok||c.db!==\"up\"||c.schema!==\"ok\"||c.rls!==\"ok\")process.exit(1)}).catch(()=>process.exit(1))"'

if ! attendre "/api/health" "${SANTE}"; then
  erreur "le service web ne répond pas."
  "${COMPOSE[@]}" logs --tail=80 web || true
  exit 1
fi
if ! attendre "/api/ready" "${PRET}"; then
  erreur "la base, le schéma ou la RLS n'est pas prêt."
  exit 1
fi

if [ "${VERIFIER_DOMAINE}" -eq 1 ] && [ -n "${DOMAINE}" ]; then
  log "Contrôle HTTPS public (${DOMAINE})"
  if ! attendre "https://${DOMAINE}/api/ready" "curl -fsS --max-time 10 https://${DOMAINE}/api/ready" 12 10; then
    erreur "l'accès HTTPS public échoue (DNS, certificat ou proxy)."
    exit 1
  fi
fi

log "Déploiement réussi : ${COURANT}"
echo "Rollback possible vers ${PRECEDENT} : ./scripts/revenir.sh"
