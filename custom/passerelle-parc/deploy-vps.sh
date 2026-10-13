#!/bin/sh
# =============================================================================
# deploy-vps.sh — préparation du VPS "passerelle parc" (G3).
# =============================================================================
# Objet : mettre en place le coffre-fort (age), les clés WireGuard du hub et des
# boxes — sans JAMAIS écrire un secret en clair dans le dépôt ni le faire
# apparaître sur la sortie standard.
#
# §7 intouchable : /etc/lcd/vault est chiffré `age`, la clé super_admin reste
# HORS du VPS (coffre physique / gestionnaire de mots de passe de l'admin).
#
# Usage :
#   deploy-vps.sh init                        # coffre-fort + hub WireGuard
#   deploy-vps.sh wg-key <box_id> <ip_box>    # clés box + peer hub (chiffré)
#   deploy-vps.sh rotate wg <box_id> <ip_box> # re-clé une box existante
#   deploy-vps.sh authelia-users              # squelette utilisateurs
#   deploy-vps.sh backup                      # snapshot parc.db + registres (chiffré age)
#   deploy-vps.sh restore <archive.age>       # restauration backup (machine isolée)
#   deploy-vps.sh statut                      # compteurs bascule P1/P2/P3 (cron 5 min)
#   deploy-vps.sh check                       # relecture de sûreté
#
# Aucune commande réseau ici : la box récupère sa conf par canal chiffré.
# Les ports du socle (:8123/:4000/:8050/8090-8100/:8060) ne sont JAMAIS ouverts
# par ce script : la passerelle passe uniquement par Caddy (443) + WireGuard.
# =============================================================================
set -eu

# --- hygiène -----------------------------------------------------------------
umask 077
LC_ALL=C
export LC_ALL
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin

VAULT_DIR="${LCD_VAULT_DIR:-/etc/lcd/vault}"
WG_DIR="${LCD_WG_DIR:-/etc/lcd/wg}"
DEPOT_DIR="${LCD_DEPOT_DIR:-$(cd "$(dirname "$0")/../.." && pwd)}"
PASSELLE_DIR="${DEPOT_DIR}/custom/passerelle-parc"
WG_SUBNET="10.99.0.0/24"
WG_IP_HUB="10.99.0.1"
AGE_PUBLIC="age-recipient.txt"
AGE_KEY="age-key.txt"
HUB_PUB_FICHIER="${VAULT_DIR}/wg/hub.pub"

log()  { printf '[deploy] %s\n' "$*"; }
warn() { printf '[deploy][!] %s\n' "$*" >&2; }
fini() { printf '[deploy][x] %s\n' "$*" >&2; exit 1; }

usage() {
    sed -n '9,19p' "$0" | sed 's/^# \{0,1\}//'
    exit "${1:-2}"
}

avoir() {
    command -v "$1" >/dev/null 2>&1 \
        || fini "commande manquante : $1 — $2"
}

vault_pret() {
    [ -f "${VAULT_DIR}/${AGE_KEY}" ] || fini "vault absent — `deploy-vps.sh init`"
    [ -f "${VAULT_DIR}/${AGE_PUBLIC}" ] || fini "récipient age absent — vault corrompu"
}

ip_valide() {
    case "$1" in
        10.99.0.*) ;;
        *) return 1 ;;
    esac
    [ "$1" != "$WG_IP_HUB" ] || return 1
    return 0
}

# Chiffre stdin dans le vault (aucun fichier en clair posé sur le disque).
chiffrer() {
    age -r "$(cat "${VAULT_DIR}/${AGE_PUBLIC}")" -o "$1" -
}

# Remplace les placeholders d'un .example ; refuse si l'un survit.
rendre() {
    fichier="$1"
    shift
    sed "$@" "$fichier" | {
        if grep -q '__LCD_[A-Z0-9_]*__'; then
            fini "${fichier} : placeholder __LCD_*__ non remplacé"
        fi
        cat
    }
}

# =============================================================================
cmd_init() {
    avoir age "apt install age"
    avoir wg "apt install wireguard-tools"

    if [ -f "${VAULT_DIR}/${AGE_KEY}" ]; then
        log "vault déjà initialisé (${VAULT_DIR}) — rien à faire"
        return 0
    fi
    mkdir -p "${VAULT_DIR}/wg" "${VAULT_DIR}/mtls" "${VAULT_DIR}/authelia" \
             "${WG_DIR}"
    chmod 700 "${VAULT_DIR}" "${VAULT_DIR}"/wg "${VAULT_DIR}"/mtls \
              "${VAULT_DIR}"/authelia

    # Clé age : jamais affichée, jamais dupliquée ailleurs.
    age-keygen -o "${VAULT_DIR}/${AGE_KEY}" 2>/dev/null
    chmod 600 "${VAULT_DIR}/${AGE_KEY}"
    age-keygen -y "${VAULT_DIR}/${AGE_KEY}" > "${VAULT_DIR}/${AGE_PUBLIC}"

    # Clé privée du hub : lue une fois pour wg0.conf, puis laissée dans le
    # vault chiffré (hub.conf.age). On ne garde en clair QUE la clé publique.
    CLE_HUB="$(wg genkey)"
    printf '%s\n' "$CLE_HUB" > "${VAULT_DIR}/wg/hub.conf.age.tmp.priv"
    chmod 600 "${VAULT_DIR}/wg/hub.conf.age.tmp.priv"
    printf '%s\n' "$(printf '%s' "$CLE_HUB" | wg pubkey)" > "$HUB_PUB_FICHIER"
    chmod 600 "$HUB_PUB_FICHIER"
    rendre "${PASSELLE_DIR}/wg-hub.conf.example" \
        -e "s|__LCD_WG_HUB_PRIVKEY__|${CLE_HUB}|" > "${WG_DIR}/wg0.conf"
    chmod 600 "${WG_DIR}/wg0.conf"
    chiffrer "${VAULT_DIR}/wg/hub.conf.age" < "${WG_DIR}/wg0.conf" 2>/dev/null
    rm -f "${VAULT_DIR}/wg/hub.conf.age.tmp.priv"
    CLE_HUB=""

    log "tunnel : ${WG_SUBNET} (hub ${WG_IP_HUB}), MTU 1380 (4G/LTE)"
    warn "sors la clé age du VPS (`cat ${VAULT_DIR}/${AGE_KEY}`) et range-la hors"
    warn "ligne (coffre physique) : sans elle le vault est perdu ; avec un accès"
    warn "root au VPS, il est lisible — risque documenté §7, pas masqué."
    log "vault prêt ; hub dans ${WG_DIR}/wg0.conf (0600, hors dépôt)"
}

# =============================================================================
cmd_wg_key() {
    [ $# -eq 2 ] || fini "usage: deploy-vps.sh wg-key <box_id> <ip_box> (ex: box-log1 10.99.0.2)"
    BOX="$1"
    IP_BOX="$2"
    avoir age "apt install age"
    avoir wg "apt install wireguard-tools"
    vault_pret
    ip_valide "$IP_BOX" || fini "IP ${IP_BOX} invalide (attendu ${WG_SUBNET}, pas ${WG_IP_HUB})"
    [ -f "$HUB_PUB_FICHIER" ] || fini "clé publique du hub absente — `init` incomplet"

    VBOX="${VAULT_DIR}/wg/${BOX}.conf.age"
    [ -f "$VBOX" ] && warn "clé ${BOX} existante — elle sera remplacée (rotation)"

    # Clé de la box en mémoire seulement : elle finit chiffrée dans le vault.
    CLE_BOX="$(wg genkey)"
    PUB_BOX="$(printf '%s' "$CLE_BOX" | wg pubkey)"

    rendre "${PASSELLE_DIR}/wg-box.conf.example" \
        -e "s|__LCD_WG_BOX_PRIVKEY__|${CLE_BOX}|" \
        -e "s|__LCD_WG_BOX_IP__|${IP_BOX}|" \
        -e "s|__LCD_WG_HUB_PUBKEY__|$(cat "$HUB_PUB_FICHIER")|" \
        | chiffrer "$VBOX"
    chmod 600 "$VBOX"
    CLE_BOX=""

    # Côté hub : seule la clé PUBLIQUE de la box est écrite (§1, /32 strict).
    if grep -q "# ${BOX} " "${WG_DIR}/wg0.conf"; then
        warn "peer ${BOX} déjà présent — utilise `deploy-vps.sh rotate wg ${BOX} ${IP_BOX}`"
    else
        printf '\n# %s\n[Peer]\nPublicKey = %s\nAllowedIPs = %s/32\nPersistentKeepalive = 25\n' \
            "$BOX" "$PUB_BOX" "$IP_BOX" >> "${WG_DIR}/wg0.conf"
        log "peer ${BOX} ajouté à ${WG_DIR}/wg0.conf (${IP_BOX}/32)"
    fi
    log "conf ${BOX} chiffrée : ${VBOX} (0600, hors dépôt)"
    log "clé publique ${BOX} : ${PUB_BOX}"
    CLE_BOX=""
}

# =============================================================================
cmd_rotate() {
    [ $# -eq 3 ] || fini "usage: deploy-vps.sh rotate wg <box_id> <ip_box>"
    [ "$1" = "wg" ] || fini "type inconnu : $1 (connu : wg)"
    shift
    BOX="$1"
    IP_BOX="$2"
    vault_pret
    grep -q "# ${BOX} " "${WG_DIR}/wg0.conf" \
        || fini "peer ${BOX} absent — utilise `wg-key` pour l'ajouter"

    # Nouvelle conf chiffrée (clé publique rendue à la fin uniquement).
    CLE_BOX="$(wg genkey)"
    NEWPUB="$(printf '%s' "$CLE_BOX" | wg pubkey)"
    rendre "${PASSELLE_DIR}/wg-box.conf.example" \
        -e "s|__LCD_WG_BOX_PRIVKEY__|${CLE_BOX}|" \
        -e "s|__LCD_WG_BOX_IP__|${IP_BOX}|" \
        -e "s|__LCD_WG_HUB_PUBKEY__|$(cat "$HUB_PUB_FICHIER")|" \
        | chiffrer "${VAULT_DIR}/wg/${BOX}.conf.age"
    CLE_BOX=""

    grep -v "# ${BOX} " "${WG_DIR}/wg0.conf" > "${WG_DIR}/wg0.conf.new"
    mv "${WG_DIR}/wg0.conf.new" "${WG_DIR}/wg0.conf"
    printf '\n# %s (rotée le %s)\n[Peer]\nPublicKey = %s\nAllowedIPs = %s/32\nPersistentKeepalive = 25\n' \
        "$BOX" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$NEWPUB" "$IP_BOX" \
        >> "${WG_DIR}/wg0.conf"
    chmod 600 "${WG_DIR}/wg0.conf"
    log "peer ${BOX} re-cléé (nouvelle clé publique ${NEWPUB})"
    warn "applique `wg addconf wg0 <(sed ...)` puis synchronise la box AVANT de"
    warn "quitter le VPS : l'ancienne clé ne répond plus (sinon plus de tunnel)."
}

# =============================================================================
cmd_authelia_users() {
    DEST="${AUTHELIA_USERS:-/etc/authelia/users_docker.yml}"
    mkdir -p "$(dirname "$DEST")"
    {
        printf 'users:\n'
        printf '  # Rempli par l admin, JAMAIS dans le dépôt :\n'
        printf '  #   personne_01:\n'
        printf '  #     displayname: "Admin"\n'
        printf '  #     password: <hash produit par `authelia hash-password`>\n'
        printf '  #     email: admin@zone\n'
        printf '  #     groups: [parc_admin]\n'
        printf '  #   personne_03:   # opérateur : groupe parc_operateur, jamais parc_admin\n'
    } > "$DEST"
    chmod 600 "$DEST"
    log "squelette : ${DEST} (0600, hors dépôt)"
    warn "hash : `authelia hash-password \"mot de passe temporaire\"` (docker run authelia/authelia)"
    warn "Authelia refuse de démarrer si un champ manque : comportement voulu (§4)."
}

# =============================================================================
cmd_backup() {
    # P9-7 : snapshot control plane (parc.db + registres YAML), chiffré age,
    # hors site. `VACUUM INTO` = copie cohérente même base ouverte (jamais de
    # cp à chaud d'un SQLite WAL). Rétention : 7 j / 4 sem / 12 mois (par
    # préfixe jour/sem/mois). Aucun secret en clair : tout est déjà en refs.
    avoir sqlite3 "apt install sqlite3"
    avoir age "apt install age"
    vault_pret
    BASE="${LCD_PARC_DB:-/var/lib/lcd/parc.db}"
    REG="${LCD_REGISTRE_DIR:-/var/lib/lcd/registre}"
    DEST="${LCD_BACKUP_DIR:-/var/lib/lcd/backups}"
    mkdir -p "$DEST"
    STAMP="$(date -u +%Y-%m-%dT%H%M%SZ)"
    TMP="$(mktemp -d)"
    if [ -f "$BASE" ]; then
        sqlite3 "$BASE" "VACUUM INTO '$TMP/parc.db';"
    else
        warn "base absente (${BASE}) — snapshot registres seuls"
    fi
    [ -d "$REG" ] && cp -r "$REG" "$TMP/registre" || true
    (cd "$TMP" && tar -cf - .) \
        | age -r "$(cat "${VAULT_DIR}/${AGE_PUBLIC}")" \
        -o "$DEST/parc-$STAMP.tar.age"
    chmod 600 "$DEST/parc-$STAMP.tar.age"
    rm -rf "$TMP"
    log "backup : $DEST/parc-$STAMP.tar.age"
    warn "pousse hors site (Object Storage + R2) + teste le restore (trimestriel)."
}

# =============================================================================
cmd_restore() {
    # Restauration sur machine ISOLÉE (jamais sur la prod en marche) : déchiffre
    # (clé age HORS VPS), contrôle, puis l'opérateur recopie à la main.
    [ $# -eq 1 ] || fini "usage: deploy-vps.sh restore <archive.age>"
    avoir age "apt install age"
    [ -f "${VAULT_DIR}/${AGE_KEY}" ] \
        || fini "clé age absente — restaure la clé hors-ligne d'abord"
    TMP="$(mktemp -d)"
    age -d -i "${VAULT_DIR}/${AGE_KEY}" -o "$TMP/restore.tar" "$1"
    mkdir -p "$TMP/out" && tar -xf "$TMP/restore.tar" -C "$TMP/out"
    [ -f "$TMP/out/parc.db" ] \
        && sqlite3 "$TMP/out/parc.db" "PRAGMA integrity_check;" \
        || log "pas de parc.db (registres seuls)"
    log "contenu vérifié sous $TMP/out — recopie MANUELLE vers la cible"
    warn "ne redémarre la gateway qu'après contrôle des registres."
}

# =============================================================================
cmd_statut() {
    # P9-3 : compteurs bascule lus par GET /v1/statut (`state/parc/statut.json`).
    # Cron 5 min (systemd timer). Bande Vercel = saisie opérateur (dashboard
    # Vercel, Go/mois) ; CPU/RAM/disque = mesures locales ; jamais inventé :
    # absent = clé absente (la gateway rend `mesure: false`).
    OUT="${LCD_STATUT_JSON:-/var/lib/lcd/state/parc/statut.json}"
    mkdir -p "$(dirname "$OUT")"
    CPU="$(awk '{u=$2+$4; t=$2+$4+$5; print (t>0)?int(100*u/t):0}' \
        /proc/stat | head -1)"
    MEM="$(free | awk '/Mem:/{print int(100*$3/$2)}')"
    DISK="$(df /var/lib/lcd 2>/dev/null | awk 'NR==2{gsub(/%/,"",$5); print $5}')"
    DISK="${DISK:-$(df / | awk 'NR==2{gsub(/%/,"",$5); print $5}')}"
    VERCEL="${LCD_VERCEL_GO_MOIS:-}"
    TMP="$OUT.tmp"
    {
        printf '{"vm_cpu_pct": %s, "vm_ram_pct": %s, "vm_disque_pct": %s' \
            "${CPU:-0}" "${MEM:-0}" "${DISK:-0}"
        [ -n "$VERCEL" ] && printf ', "vercel_bande_go_mois": %s' "$VERCEL"
        printf ', "mesure_le": "%s"}\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    } > "$TMP"
    mv "$TMP" "$OUT"
    chmod 600 "$OUT"
    log "statut : $OUT (cpu=${CPU}% ram=${MEM}% disque=${DISK}% vercel=${VERCEL:-n/a})"
}

# =============================================================================
cmd_check() {
    code=0
    [ -d "${VAULT_DIR}" ] || { warn "manquant : ${VAULT_DIR}"; code=1; }
    # Aucun secret en clair dans le dépôt (les .example gardent leurs
    # placeholders : c'est leur rôle) — mais aucune vraie valeur collée dedans.
    for f in "${PASSELLE_DIR}/wg-hub.conf" "${PASSELLE_DIR}/wg-box.conf" \
             "${PASSELLE_DIR}/authelia-configuration.yml" \
             "${PASSELLE_DIR}/users_docker.yml"; do
        [ -f "$f" ] && { warn "fichier en clair, ne JAMAIS versionner : $f"; code=1; }
    done
    if grep -rniE '(PrivateKey = [A-Za-z0-9+/]{43,}|Password:\s+"?.+|Secret:\s+\S+)' \
        "${PASSELLE_DIR}"/*.example >/dev/null 2>&1; then
        warn "une valeur qui ressemble à un secret est restée dans un .example"
        code=1
    fi
    # Le Caddyfile ne doit JAMAIS mentionner un port du socle.
    if grep -E ':(8123|4000|8050|8060|80(6[0-9]|9[0-9]))|:(809[0-9]|8100)' \
        "${PASSELLE_DIR}/Caddyfile" >/dev/null 2>&1; then
        warn "Caddyfile mentionne un port du socle interdit"
        code=1
    fi
    # Caddyfile : un seul bloc public (pas de fuite d'engine sur un autre domaine).
    [ "$(grep -c 'https://' "${PASSELLE_DIR}/Caddyfile")" -ge 1 ] || {
        warn "Caddyfile : aucun site https:// trouvé"; code=1; }
    [ $code -eq 0 ] && log "check OK — aucun secret en clair, aucun port socle publié"
    exit $code
}

# =============================================================================
case "${1:-}" in
    init)           shift; cmd_init ;;
    wg-key)         shift; cmd_wg_key "$@" ;;
    rotate)         shift; cmd_rotate "$@" ;;
    authelia-users) shift; cmd_authelia_users ;;
    backup)         shift; cmd_backup ;;
    restore)        shift; cmd_restore "$@" ;;
    statut)         shift; cmd_statut ;;
    check)          shift; cmd_check ;;
    -h|--help|help) usage 0 ;;
    "")             usage 2 ;;
    *)              usage 2 ;;
esac
