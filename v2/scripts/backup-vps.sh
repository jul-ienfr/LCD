#!/usr/bin/env bash
# Sauvegarde PostgreSQL + photos sur un VPS Docker (spec 006, FR-006/FR-007).
# À lancer depuis la racine de v2/.
# Exemple cron : 15 3 * * * cd /opt/lcd/v2 && ./scripts/backup-vps.sh
#
# Produit, dans backups/ :
#   lcd-<horodatage>.sql.gz[.enc]        dump logique + checksum
#   photos-<horodatage>.tar.gz[.enc]     archive du volume photos + checksum
#   photos-<horodatage>.json             preuve de complétude (fichiers/octets)
#
# Un échec (dump, archive, incohérence de comptage) alerte le canal
# d'exploitation via scripts/alerter-exploitation.mjs quand APP_URL et
# CRON_SECRET sont définis, puis sort en erreur : jamais silencieux.
set -euo pipefail

cd "$(dirname "$0")/.."
umask 077

if [ ! -f .env.prod ]; then
  echo "ERREUR : .env.prod introuvable." >&2
  exit 1
fi

COMPOSE=(docker compose --env-file .env.prod -f compose.prod.yml)

alerter() {
  local message="$1"
  echo "ALERTE : ${message}" >&2
  if command -v node >/dev/null 2>&1; then
    node scripts/alerter-exploitation.mjs \
      --source sauvegarde-vps \
      --severite critique \
      --message "${message}" \
      --runbook "v2/BACKUPS.md" >/dev/null 2>&1 || true
  fi
}

on_error() {
  alerter "Sauvegarde VPS échouée (ligne ${1}). Voir /var/log/lcd-backup.log."
}
trap 'on_error $LINENO' ERR

mkdir -p backups
horodatage="$(date -u +%Y%m%d-%H%M%S)"

cle="${BACKUP_ENCRYPTION_KEY:-}"
if [ -z "${cle}" ] && grep -q '^BACKUP_ENCRYPTION_KEY=' .env.prod; then
  cle="$(sed -n 's/^BACKUP_ENCRYPTION_KEY=//p' .env.prod | tail -n 1)"
fi
export BACKUP_ENCRYPTION_KEY="${cle}"

chiffrer_si_cle() {
  local fichier="$1"
  if [ -n "${cle}" ]; then
    "${COMPOSE[@]}" --profile tools run --rm --no-deps -T \
      -e BACKUP_ENCRYPTION_KEY \
      -v "${PWD}/backups:/backups" \
      tools node scripts/chiffrer-fichier.mjs "/backups/$(basename "${fichier}")"
    echo "${fichier}.enc"
  else
    echo "${fichier}"
  fi
}

# --- Base de données -------------------------------------------------------
fichier="backups/lcd-${horodatage}.sql.gz"
"${COMPOSE[@]}" exec -T postgres \
  sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges' \
  | gzip -9 > "${fichier}"
sha256sum "${fichier}" > "${fichier}.sha256"
fichier="$(chiffrer_si_cle "${fichier}")"

# --- Photos (FR-007) -------------------------------------------------------
# Le volume photos est monté dans le service web : on l'archive depuis lui,
# puis on compare le nombre de fichiers vivants et archivés. Une différence
# signifie une archive incomplète : elle est refusée et alerte.
PHOTOS_DIR="/var/lib/lcd/photos"
archive="backups/photos-${horodatage}.tar.gz"
"${COMPOSE[@]}" exec -T web \
  sh -c "mkdir -p ${PHOTOS_DIR} && tar -czf - -C ${PHOTOS_DIR} ." > "${archive}"

fichiers_vivants="$("${COMPOSE[@]}" exec -T web \
  sh -c "find ${PHOTOS_DIR} -type f | wc -l" | tr -d '[:space:]')"
octets_vivants="$("${COMPOSE[@]}" exec -T web \
  sh -c "du -sb ${PHOTOS_DIR} | cut -f1" | tr -d '[:space:]')"
fichiers_archives="$(tar -tzf "${archive}" | grep -vc '/$' || true)"
sha256sum "${archive}" > "${archive}.sha256"

complet="false"
if [ "${fichiers_vivants}" = "${fichiers_archives}" ]; then
  complet="true"
fi

archive_finale="$(chiffrer_si_cle "${archive}")"
empreinte_photos="$(cut -d' ' -f1 "${archive_finale}.sha256")"
if ! node scripts/preuve-photos.mjs \
  --archive "$(basename "${archive_finale}")" \
  --sha256 "${empreinte_photos}" \
  --fichiers "${fichiers_vivants}" \
  --archives "${fichiers_archives}" \
  --octets "${octets_vivants:-0}" > "${archive}.json"; then
  alerter "Archive photos incomplète : ${fichiers_archives}/${fichiers_vivants} fichiers."
  exit 1
fi

if [ "${complet}" != "true" ]; then
  alerter "Archive photos incomplète : ${fichiers_archives}/${fichiers_vivants} fichiers."
  exit 1
fi

# Copie hors-site optionnelle (T-13) : renseigner OFFSITE_CIBLE dans .env.prod.
if grep -q '^OFFSITE_CIBLE=' .env.prod; then
  OFFSITE_CIBLE="$(sed -n 's/^OFFSITE_CIBLE=//p' .env.prod | tail -n 1)"
  export OFFSITE_CIBLE
  ./scripts/copier-hors-site.sh
fi

# Rétention locale : 14 jours.
find backups \( -name 'lcd-*.sql.gz' -o -name 'lcd-*.sql.gz.enc' -o -name 'photos-*.tar.gz' -o -name 'photos-*.tar.gz.enc' \) -mtime +14 -delete
find backups \( -name 'lcd-*.sql.gz.sha256' -o -name 'lcd-*.sql.gz.enc.sha256' -o -name 'photos-*.tar.gz.sha256' -o -name 'photos-*.tar.gz.enc.sha256' -o -name 'photos-*.json' \) -mtime +14 -delete

echo "Sauvegarde : ${fichier}"
echo "Photos : ${archive_finale} (${fichiers_vivants} fichiers, complet=${complet})"
