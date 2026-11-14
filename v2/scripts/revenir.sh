#!/usr/bin/env bash
# Retour arrière sur VPS Docker.
#
# Usage, depuis le dossier v2/ :
#   ./scripts/revenir.sh                    # revient au tag enregistré par deployer.sh
#   ./scripts/revenir.sh --tag v2.0.0-rc0   # revient à un tag précis
#   ./scripts/revenir.sh --sans-sauvegarde  # saute la sauvegarde de l'état courant
#
# ATTENTION : les migrations sont prospectives. Un retour de code sur une base
# déjà migrée n'est sûr que si le schéma reste compatible. Le script refuse de
# restaurer une sauvegarde sans confirmation explicite (--restaurer <fichier>).
set -euo pipefail
cd "$(dirname "$0")/.."

COMPOSE=(docker compose --env-file .env.prod -f compose.prod.yml)
VERROU="${TMPDIR:-/tmp}/lcd-deploiement.lock"
ETAT=".deploiement"
CIBLE=""
SAUVEGARDE=1
RESTAURER=""

while [ $# -gt 0 ]; do
  case "$1" in
    --tag) CIBLE="${2:-}"; shift 2 ;;
    --sans-sauvegarde) SAUVEGARDE=0; shift ;;
    --restaurer) RESTAURER="${2:-}"; shift 2 ;;
    -h|--help) sed -n '2,14p' "$0"; exit 0 ;;
    *) echo "Option inconnue : $1" >&2; exit 2 ;;
  esac
done

log() { printf '\n== %s ==\n' "$*"; }
erreur() { printf '\nERREUR : %s\n' "$*" >&2; }

if [ ! -f .env.prod ]; then
  erreur ".env.prod introuvable."
  exit 1
fi

exec 9>"${VERROU}"
if ! flock -n 9; then
  erreur "un déploiement est déjà en cours (${VERROU})."
  exit 1
fi

if [ -z "${CIBLE}" ] && [ -f "${ETAT}/precedent" ]; then
  CIBLE="$(cat "${ETAT}/precedent")"
fi
if [ -z "${CIBLE}" ]; then
  erreur "aucun tag précédent enregistré : préciser --tag <ref>."
  exit 1
fi

if [ "${SAUVEGARDE}" -eq 1 ]; then
  log "Sauvegarde de l'état courant avant retour arrière"
  ./scripts/backup-vps.sh
fi

log "Retour au tag ${CIBLE}"
git fetch --tags --force
git checkout --detach "${CIBLE}"

log "Construction et redémarrage"
"${COMPOSE[@]}" build
"${COMPOSE[@]}" up -d postgres
export LCD_VERSION="${CIBLE}"
"${COMPOSE[@]}" up -d web caddy

log "Contrôle de santé"
if ! "${COMPOSE[@]}" exec -T web node -e 'fetch("http://127.0.0.1:3000/api/health").then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))'; then
  erreur "le service web ne répond pas après le retour arrière."
  "${COMPOSE[@]}" logs --tail=80 web || true
  exit 1
fi

log "Retour arrière terminé sur ${CIBLE} ($(git rev-parse --short HEAD))"

if [ -n "${RESTAURER}" ]; then
  log "Restauration de la base depuis ${RESTAURER}"
  echo "La restauration remplace toutes les données. Confirmer avec RESTAURATION_CONFIRMEE=1."
  if [ "${RESTAURATION_CONFIRMEE:-}" != "1" ]; then
    erreur "restauration non confirmée ; aucune donnée n'a été modifiée."
    exit 1
  fi
  if [ ! -f "${RESTAURER}" ]; then
    erreur "sauvegarde introuvable : ${RESTAURER}"
    exit 1
  fi
  CLE="$(sed -n 's/^BACKUP_ENCRYPTION_KEY=//p' .env.prod | tail -n 1)"
  if [ "${RESTAURER%.enc}" != "${RESTAURER}" ]; then
    "${COMPOSE[@]}" --profile tools run --rm --no-deps -T \
      -e BACKUP_ENCRYPTION_KEY="${CLE}" \
      -v "${PWD}/backups:/backups" \
      tools node scripts/dechiffrer-fichier.mjs "/backups/$(basename "${RESTAURER}")" \
      | gunzip -c \
      | "${COMPOSE[@]}" exec -T postgres \
          sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
  else
    gunzip -c "${RESTAURER}" \
      | "${COMPOSE[@]}" exec -T postgres \
          sh -c 'psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -v ON_ERROR_STOP=1'
  fi
  log "Restauration terminée ; vérifier /api/ready et les compteurs métier."
fi

echo
echo "Vérifier les journaux applicatifs : ${COMPOSE[*]} logs -f web"
echo "Si le schéma est plus récent que le code, restaurer la sauvegarde :"
echo "  RESTAURATION_CONFIRMEE=1 ./scripts/revenir.sh --tag ${CIBLE} --restaurer backups/<fichier>.sql.gz"
