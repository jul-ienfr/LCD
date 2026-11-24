#!/usr/bin/env bash
# Vérification hebdomadaire de la restauration (spec 006, FR-008/FR-009).
#
# Restaure la dernière sauvegarde dans une base jetable, écrit une preuve
# datée (succès ou échec) et alerte le canal d'exploitation en cas d'échec.
# La preuve porte aussi le RTO mesuré et l'âge de la sauvegarde (RPO).
#
# Cron hebdomadaire (dimanche 04:30, après la sauvegarde de 03:15) :
#   30 4 * * 0 cd /opt/lcd/v2 && ./scripts/verifier-restauration.sh >> /var/log/lcd-restauration.log 2>&1
set -euo pipefail

cd "$(dirname "$0")/.."
umask 077
mkdir -p preuves

horodatage="$(date -u +%Y%m%dT%H%M%SZ)"
preuve="preuves/restauration-${horodatage}.json"

export PREUVE="${preuve}"
export BACKUP_DIR="${BACKUP_DIR:-backups}"
export PG_CONTAINER="${PG_CONTAINER:-lcd-prod-postgres-1}"
export RTO_MAX_MINUTES="${RTO_MAX_MINUTES:-30}"
export RPO_MAX_HEURES="${RPO_MAX_HEURES:-24}"

if ! node scripts/restore-test.mjs; then
  echo "ALERTE : restauration de contrôle en échec (${preuve})." >&2
  node scripts/alerter-exploitation.mjs \
    --source restauration \
    --severite critique \
    --message "Restauration de contrôle hebdomadaire en échec. Preuve : ${preuve}." \
    --runbook "v2/BACKUPS.md" >/dev/null 2>&1 || true
  exit 1
fi

# Rétention des preuves : 90 jours.
find preuves -maxdepth 1 -name 'restauration-*.json' -mtime +90 -delete

echo "Restauration vérifiée : ${preuve}"
