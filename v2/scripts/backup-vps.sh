#!/usr/bin/env bash
# Sauvegarde PostgreSQL sur un VPS Docker. À lancer depuis la racine de v2/.
# Exemple cron : 15 3 * * * cd /opt/lcd/v2 && ./scripts/backup-vps.sh
set -euo pipefail

cd "$(dirname "$0")/.."
umask 077

if [ ! -f .env.prod ]; then
  echo "ERREUR : .env.prod introuvable." >&2
  exit 1
fi

mkdir -p backups
horodatage="$(date -u +%Y%m%d-%H%M%S)"
fichier="backups/lcd-${horodatage}.sql.gz"

docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${fichier}"

sha256sum "${fichier}" > "${fichier}.sha256"

# Rétention locale : 14 jours.
find backups -name 'lcd-*.sql.gz' -mtime +14 -delete
find backups -name 'lcd-*.sql.gz.sha256' -mtime +14 -delete

echo "Sauvegarde : ${fichier}"
