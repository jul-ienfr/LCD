#!/usr/bin/env bash
# Copie hors-site de la dernière sauvegarde (spec 006, FR-006/FR-007).
#
# Appelé par backup-vps.sh quand OFFSITE_CIBLE est défini dans .env.prod.
# OFFSITE_CIBLE est soit un chemin monté (disque externe, partage), soit une
# cible rsync (user@hote:/chemin). La copie est vérifiée par checksum après
# transfert : une copie altérée échoue et alerte.
set -euo pipefail

cd "$(dirname "$0")/.."
umask 077

cible="${OFFSITE_CIBLE:-}"
if [ -z "${cible}" ] && [ -f .env.prod ]; then
  cible="$(sed -n 's/^OFFSITE_CIBLE=//p' .env.prod | tail -n 1)"
fi
if [ -z "${cible}" ]; then
  echo "OFFSITE_CIBLE absent : copie hors-site ignorée."
  exit 0
fi

alerter() {
  echo "ALERTE : $1" >&2
  node scripts/alerter-exploitation.mjs \
    --source copie-hors-site \
    --severite critique \
    --message "$1" \
    --runbook "v2/BACKUPS.md" >/dev/null 2>&1 || true
}

# Fichiers de la dernière sauvegarde (moins de 2 jours).
mapfile -d '' fichiers < <(
  find backups -maxdepth 1 -type f -mtime -2 \
    \( -name 'lcd-*' -o -name 'photos-*' \) -print0
)
if [ "${#fichiers[@]}" -eq 0 ]; then
  alerter "Aucune sauvegarde récente à copier hors-site."
  exit 1
fi

if command -v rsync >/dev/null 2>&1; then
  printf '%s\0' "${fichiers[@]}" \
    | rsync -a --from0 --files-from=- ./ "${cible%/}/"
else
  mkdir -p "${cible}"
  for fichier in "${fichiers[@]}"; do
    cp -p "${fichier}" "${cible%/}/"
  done
fi

# Preuve d'intégrité : chaque checksum copié est revérifié sur la cible.
for fichier in "${fichiers[@]}"; do
  case "${fichier}" in
    *.sha256) nom="$(basename "${fichier}")" ;;
    *) continue ;;
  esac
  if ! (cd "${cible%/}" && sha256sum -c "${nom}" >/dev/null 2>&1); then
    alerter "Copie hors-site altérée : ${nom} ne correspond pas à son checksum."
    exit 1
  fi
done

echo "Copie hors-site vérifiée : ${#fichiers[@]} fichiers vers ${cible}"
