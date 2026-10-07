#!/bin/sh
# lab/export-box.sh — exporte l'image transférable vers une vraie box (PC -> box).
# Même image générique pour tous les logements : seuls logements.yaml, secrets.yaml
# et branding.yaml changent par box/logement (montés, jamais bakés dans l'image).
# Scalable : ajouter un logement = 5 lignes (bloc logements.yaml + prestataires/logX.yaml),
# 0 rebuild si l'image est déjà sur la box. Déployable : `docker compose up -d` (<2 min).
# Usage (sur le PC) : sh lab/export-box.sh  ->  lcd-box-<date>.tar (+ .sha256)
# Sur la box : charger + `docker compose up -d` avec SES fichiers (voir lab/README.md).
set -e
cd "$(dirname "$0")"
STAMP=$(date +%Y%m%d)
docker compose build
IMAGES=$(docker compose config --images | sort -u)
# shellcheck disable=SC2086
docker save -o "lcd-box-${STAMP}.tar" $IMAGES
sha256sum "lcd-box-${STAMP}.tar" > "lcd-box-${STAMP}.tar.sha256"
echo "OK : lcd-box-${STAMP}.tar ($(du -h "lcd-box-${STAMP}.tar" | cut -f1))"
echo "Transférer sur la box (USB/réseau local), puis :"
echo "  docker load -i lcd-box-${STAMP}.tar && docker compose up -d"
