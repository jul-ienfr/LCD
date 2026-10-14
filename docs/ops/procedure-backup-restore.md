# PROCÉDURE BACKUP / RESTORE — Control plane LCD

> **Objet.** Garantir la récupérabilité du control plane LCD (base `parc.db`, registres YAML, volumes `state`) : sauvegarde quotidienne chiffrée `age` vers deux sites hors VM (Oracle Object Storage + Cloudflare R2), rétention 7 j / 4 s / 12 m, restauration testée chaque trimestre sur machine isolée, runbooks incidents prêts (base corrompue, VM perdue, rotation clé `age`).
>
> **Prérequis.** Palier P1 DONE (ou P2/P3) ; `parc.db` sain (`stockage.py --check` vert) ; coffre `age` initialisé (`deploy-vps.sh init`, clé `age-key.txt` exfiltrée hors ligne) ; buckets hors site créés (Oracle Object Storage + R2, accès en lecture seule depuis la VM sauf écriture backup) ; `versions.lock` archivé ; machine isolée disponible pour les tests restore (VM jetable ou conteneur local, jamais la prod).
>
> **Coût : 0 € (sauf P3 ~5 €/mois).** Backup = 0 € : `age` + `sqlite3` + `systemd` inclus, Object Storage Always Free (10 Go) + R2 gratuit (< 10 Go) suffisent pour un parc ≤ 10 logements. Seul P3 ajoute ~5 €/mois de VPS.

## Règles intangibles

- **Jamais de secret en clair** : ni clé `age`, ni credential bucket, ni contenu de vault dans le dépôt, les tickets ou les logs. Secrets = `/etc/lcd/vault` (`0600`) + variables d'environnement fournies par systemd (`EnvironmentFile=` en `0600`), jamais versionnés.
- **Jamais de copie à chaud de `parc.db`** (`cp`/`rsync` sur base ouverte = base potentiellement corrompue). Seule méthode autorisée : `VACUUM INTO` (snapshot SQLite cohérent), puis chiffrement `age`.
- Un backup non testé = pas de backup. Test restore trimestriel obligatoire, critères §5.
- Règle 3-2-1 : 3 copies (VM + 2 sites), 2 supports (Oracle + R2), 1 hors ligne (clé `age` + 1 archive mensuelle hors ligne si possible).

## §1. Quoi sauvegarder (périmètre exact)

| # | Élément | Chemin source (VM) | Méthode | Fréquence |
|---|---|---|---|---|
| 1 | Base SQLite (vérité runtime) | `$LCD_STATE_DIR/parc/parc.db` (`$LCD_STATE_DIR=/opt/lcd/state`) | `VACUUM INTO` → `parc-export.db` (après `wal_checkpoint(TRUNCATE)`) | Quotidien |
| 2 | Registres YAML versionnés | `boxes.yaml`, `annonces.yaml`, `entites.yaml`, `mandats.yaml`, `prospects.yaml`, `llm.yaml`, `config.yaml`, `acces.yaml` (dépôt `custom/`) | `tar` + export `stockage.py --export` (contrôle) | Quotidien (même archive) |
| 3 | Volumes `state` (hors base) | `$LCD_STATE_DIR` **sauf** `parc/parc.db*` : `state/parc/snapshots*/`, `state/parc/journal-parc.jsonl`, `state/parc/statut.json`, outbox, `state/decision/` | `tar -czf` avec `--exclude` base | Quotidien (même archive) |
| 4 | Références système (sans secret) | `versions.lock`, `Caddyfile`, `boxes.yaml`, sortie `wg show` expurgée, `v1/statut` | Fichier `META.txt` dans l'archive | Quotidien |
| 5 | Clé `age` publique (récipient) | `/etc/lcd/vault/age-recipient.txt` (contenu public, copiable) | Incluse en clair dans `META.txt` | — |

**Exclu volontairement (jamais sauvegardé en ligne)** : `/etc/lcd/vault/age-key.txt` (clé privée `age` — hors ligne uniquement), `/etc/lcd/wg/wg0.conf` en clair (reconstructible via `deploy-vps.sh init` + `wg-key`), `users_docker.yml` avec hash (recréé via `authelia-users`), mots de passe, RIB/IBAN (interdits par `config.yaml` §3bis).

Vérification pré-backup (bloquante) :

```bash
sudo python3 /opt/lcd/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --check \
  && echo "BASE SAINE" || echo "BASE KO : voir runbook §6, pas de backup écrasant"
sudo /opt/lcd/passerelle-parc/deploy-vps.sh check
```

## §2. Fréquence, destinations, rétention

- **Fréquence** : 1 backup complet quotidien à 03h00 UTC (heure creuse voyageurs), + snapshot `state/parc/snapshots/` avant chaque écriture (déjà fait par la gateway, ce n'est pas le backup).
- **Destinations hors site** (les deux, à chaque cycle) :
  - (A) **Oracle Object Storage** (bucket `lcd-backups`, région du compartiment, versioning activé) ;
  - (B) **Cloudflare R2** (bucket `lcd-backups`, verrouillage objet si dispo).
- **Nommage** (UTC, triable) : `lcd-parc-YYYYMMDDTHHMMSSZ.age` (ex. `lcd-parc-20261013T030000Z.age`).
- **Rétention GFS** (appliquée sur chaque site) : **7 quotidiens + 4 hebdos (dimanche) + 12 mensuels (1er du mois)**. Les hebdos/mensuels sont des copies logiques (même archive, tag `weekly`/`monthly`), jamais de re-chiffrement.
- **Chiffrement** : `age -r <récipient>` (récipient = `/etc/lcd/vault/age-recipient.txt`). La VM ne détient que le récipient + la clé privée `0600` pour le backup local ; la restauration hors VM exige la clé hors ligne.

## §3. Script de backup (copiable)

Poser sur la VM uniquement (`/opt/lcd/backup-parc.sh`, `0700`, jamais commité avec des valeurs réelles). Variables par `EnvironmentFile=/etc/lcd/backup.env` (`0600`) :

```bash
# /etc/lcd/backup.env (0600, sur la VM uniquement — JAMAIS dans git) :
LCD_STATE_DIR=/opt/lcd/state
LCD_DEPOT_DIR=/opt/lcd/passerelle-parc
LCD_VAULT_DIR=/etc/lcd/vault
LCD_BACKUP_TMP=/var/tmp/lcd-backup
OCI_BUCKET=lcd-backups
OCI_NAMESPACE=<namespace-object-storage>
R2_BUCKET=lcd-backups
R2_ENDPOINT=https://<compte>.r2.cloudflarestorage.com
# Credentials via fichiers 0600 référencés, jamais collés ici :
# OCI_CLI_KEY_FILE=/etc/lcd/oci/key.pem  |  AWS_SHARED_CREDENTIALS_FILE=/etc/lcd/r2/credentials
```

```bash
#!/bin/sh
# /opt/lcd/backup-parc.sh — backup quotidien control plane (VACUUM INTO + age + 2 sites).
set -eu
umask 077
: "${LCD_STATE_DIR:?}" "${LCD_DEPOT_DIR:?}" "${LCD_VAULT_DIR:?}" "${LCD_BACKUP_TMP:?}"
command -v age sqlite3 tar >/dev/null || { echo "[backup][x] age/sqlite3/tar manquant" >&2; exit 1; }
[ -f "${LCD_VAULT_DIR}/age-recipient.txt" ] || { echo "[backup][x] récipient age absent" >&2; exit 1; }

STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
WORK="$(mktemp -d "${LCD_BACKUP_TMP}/lcd-${STAMP}.XXXXXX")"
trap 'rm -rf "$WORK"' EXIT INT TERM
DB="${LCD_STATE_DIR}/parc/parc.db"

# 0. Base saine ? (bloquant : on n'écrase rien sur base KO)
python3 "${LCD_DEPOT_DIR}/stockage.py" --db "$DB" --check || { echo "[backup][x] base KO, backup annulé (voir runbook)" >&2; exit 1; }

# 1. Snapshot cohérent (WAL figé puis VACUUM INTO — seule méthode autorisée)
sqlite3 "$DB" "PRAGMA wal_checkpoint(TRUNCATE); VACUUM INTO '$WORK/parc-export.db';"

# 2. Registres + state (hors base) + META
mkdir -p "$WORK/payload"
cp "$WORK/parc-export.db" "$WORK/payload/parc.db"
cp "${LCD_DEPOT_DIR}/versions.lock" "$WORK/payload/versions.lock"
for f in boxes.yaml annonces.yaml entites.yaml mandats.yaml prospects.yaml llm.yaml config.yaml; do
  [ -f "${LCD_DEPOT_DIR}/$f" ] && cp "${LCD_DEPOT_DIR}/$f" "$WORK/payload/$f"
done
tar -czf "$WORK/payload/state-volumes.tgz" -C "$LCD_STATE_DIR" \
  --exclude='parc/parc.db' --exclude='parc/parc.db-wal' --exclude='parc/parc.db-shm' .
python3 "${LCD_DEPOT_DIR}/stockage.py" --db "$WORK/payload/parc.db" --export > "$WORK/payload/registres-export.yaml"
{
  echo "stamp=$STAMP"; echo "host=$(hostname)"; date -u +"date=%Y-%m-%dT%H:%M:%SZ"
  echo "recipient=$(cat "${LCD_VAULT_DIR}/age-recipient.txt")"
  cp "${LCD_DEPOT_DIR}/versions.lock" /dev/stdout | head -20
  curl -s http://127.0.0.1:8443/v1/statut || echo "statut indisponible au moment du backup"
} > "$WORK/payload/META.txt" 2>/dev/null
tar -czf "$WORK/lcd-parc-${STAMP}.tgz" -C "$WORK/payload" .

# 3. Chiffrement age (aucun secret affiché)
RECIPIENT="$(cat "${LCD_VAULT_DIR}/age-recipient.txt")"
ARCH="lcd-parc-${STAMP}.age"
age -r "$RECIPIENT" -o "$WORK/$ARCH" "$WORK/lcd-parc-${STAMP}.tgz"

# 4. Envoi 2 sites (échec sur un site = alerte mais l'autre suffit)
OCI_NAMESPACE="${OCI_NAMESPACE:?}" OCI_BUCKET="${OCI_BUCKET:?}"
oci os object put --namespace "$OCI_NAMESPACE" --bucket-name "$OCI_BUCKET" \
  --name "$ARCH" --file "$WORK/$ARCH" --no-progress
AWS_SHARED_CREDENTIALS_FILE="${AWS_SHARED_CREDENTIALS_FILE:-/etc/lcd/r2/credentials}" \
  aws --endpoint-url "${R2_ENDPOINT:?}" s3 cp "$WORK/$ARCH" "s3://${R2_BUCKET:?}/$ARCH"

# 5. Rétention GFS (7j / 4 hebdos dimanche / 12 mensuels 1er du mois) sur chaque site
#    Exemple Oracle (adapter préfixe) : lister, trier, supprimer au-delà des seuils.
#    Ne JAMAIS purger le dernier backup sain ni un mensuel de moins d'un an.
echo "[backup] OK $ARCH ($(stat -c%s "$WORK/$ARCH") octets chiffrés, 2 sites)"
```

Test manuel du script (obligatoire après pose) :

```bash
sudo chmod 700 /opt/lcd/backup-parc.sh
sudo chmod 600 /etc/lcd/backup.env
sudo env $(cat /etc/lcd/backup.env | xargs) /opt/lcd/backup-parc.sh
# Attendu : "[backup] OK lcd-parc-<stamp>.age (... octets chiffrés, 2 sites)"
# Vérifier présence sur les 2 sites :
oci os object list --namespace "$OCI_NAMESPACE" --bucket-name lcd-backups | grep <stamp>
AWS_SHARED_CREDENTIALS_FILE=/etc/lcd/r2/credentials aws --endpoint-url "$R2_ENDPOINT" s3 ls "s3://lcd-backups/" | grep <stamp>
```

## §4. Planification : timer systemd (recommandé) ou cron

Timer systemd (recommandé — logs `journalctl`, relance en cas d'échec) :

```ini
# /etc/systemd/system/lcd-backup.service
[Unit]
Description=Backup quotidien control plane LCD (age, hors site)
Wants=network-online.target
After=network-online.target

[Service]
Type=oneshot
User=root
EnvironmentFile=/etc/lcd/backup.env
ExecStart=/opt/lcd/backup-parc.sh
# Jamais de secret en clair : ni ici ni dans les logs (le script n'affiche rien de sensible).
```

```ini
# /etc/systemd/system/lcd-backup.timer
[Unit]
Description=Backup LCD quotidien 03h00 UTC

[Timer]
OnCalendar=03:00
RandomizedDelaySec=600
Persistent=true
Unit=lcd-backup.service

[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now lcd-backup.timer
systemctl list-timers lcd-backup.timer --no-pager
sudo systemctl start lcd-backup.service   # cycle forcé de validation
journalctl -u lcd-backup.service --no-pager | tail -5
```

Repli cron (si systemd indisponible) :

```bash
# crontab root (sudo crontab -e) — une seule ligne :
0 3 * * * . /etc/lcd/backup.env; /opt/lcd/backup-parc.sh >> /var/log/lcd-backup.log 2>&1
```

Supervision : alerter si pas d'archive `< 26 h` sur l'un des sites (vérification hebdo manuelle minimale) :

```bash
# Depuis le poste admin : l'archive du jour existe-t-elle sur les 2 sites ?
echo "Vérifier : 1 objet lcd-parc-$(date -u +%Y%m%d)*.age sur Oracle ET sur R2."
```

## §5. Test restore trimestriel (machine isolée, pas-à-pas)

À faire chaque trimestre + après chaque bascule P2/P3. Machine isolée : VM jetable ou conteneur, **jamais la prod**, réseau coupé sauf SSH admin. Clé `age` fournie **pour la session uniquement** (support amovible ou presse-papier effacé après).

- [ ] 1. Préparer l'isolée (Ubuntu 24.04, `age`, `sqlite3`, `python3`, dépôt copié sans secrets) :

```bash
sudo apt update && sudo apt install -y age sqlite3 python3
mkdir -p /opt/lcd/state/parc /tmp/restore && chmod 700 /tmp/restore
```

- [ ] 2. Récupérer UNE archive hors site (la plus récente) **sans la clé** d'abord, vérifier qu'elle est illisible (chiffrement réel) :

```bash
# Copier lcd-parc-<stamp>.age vers /tmp/restore/ (via scp depuis le poste admin).
file /tmp/restore/lcd-parc-*.age
head -c 100 /tmp/restore/lcd-parc-*.age; echo
# Attendu : "age-encryption.org" en en-tête, contenu illisible. Sinon STOP.
```

- [ ] 3. Déchiffrer (clé fournie pour la session, jamais stockée après) :

```bash
# La clé age-key.txt est posée en /tmp/restore/age-key.txt (0600) pour la session :
chmod 600 /tmp/restore/age-key.txt
age -d -i /tmp/restore/age-key.txt -o /tmp/restore/payload.tgz /tmp/restore/lcd-parc-*.age
mkdir -p /tmp/restore/payload && tar -xzf /tmp/restore/payload.tgz -C /tmp/restore/payload
ls -l /tmp/restore/payload
# Attendu : parc.db, versions.lock, registres YAML, state-volumes.tgz, registres-export.yaml, META.txt.
```

- [ ] 4. Contrôler la base restaurée (critère bloquant) :

```bash
python3 /opt/lcd/passerelle-parc/stockage.py --db /tmp/restore/payload/parc.db --check \
  && echo "BASE RESTAURÉE SAINE" || echo "BASE KO"
sqlite3 /tmp/restore/payload/parc.db "PRAGMA integrity_check;"
# Attendu : "ok" + check vert.
```

- [ ] 5. Monter gateway + registres en isolé et rejouer les lectures (sans réseau WG, `boxes.yaml` local) :

```bash
LCD_STATE_DIR=/tmp/restore/state LCD_HTTP_PORT=8443 LCD_BIND=127.0.0.1 \
  python3 /opt/lcd/passerelle-parc/gateway.py --boxes /tmp/restore/payload/boxes.yaml \
  --config /tmp/restore/payload/config.yaml --serve &
sleep 2
curl -s http://127.0.0.1:8443/health
curl -s http://127.0.0.1:8443/v1/statut | python3 -m json.tool | head -25
kill %1
```

- [ ] 6. Nettoyer (clé + archive en clair détruites sur l'isolée) :

```bash
shred -u /tmp/restore/age-key.txt /tmp/restore/payload.tgz 2>/dev/null || rm -f /tmp/restore/age-key.txt /tmp/restore/payload.tgz
rm -rf /tmp/restore
history -c; echo "Clé effacée de la session."
```

**Critères OK du test trimestriel (tous requis)** : archive déchiffrée avec la clé hors ligne uniquement ; `integrity_check = ok` + `stockage.py --check` vert ; `/health` → `{"ok": true}` et `/v1/statut` cohérent (`nb_logements`, `nb_boxes` attendus, `META.txt` concordant) ; aucune divergence avec `registres-export.yaml` ; nettoyage session vérifié. Noter date + `stamp` testée hors dépôt ; en cas d'échec : incident (voir §6), pas de bascule tant que non résolu.

## §6. Runbooks incidents

### 6.1 Base corrompue (`--check` KO ou `integrity_check` ≠ ok)

```bash
# 1. STOPPER les écritures (figer la casse, garder la base KO pour analyse) :
sudo systemctl stop lcd-gateway  # ou : docker compose -f /opt/lcd/compose.yml stop gateway-parc
sudo cp /opt/lcd/state/parc/parc.db /var/tmp/parc-KO-$(date -u +%Y%m%dT%H%M%SZ).db
# 2. Diagnostiquer (lecture seule sur la copie KO) :
sqlite3 /var/tmp/parc-KO-*.db "PRAGMA integrity_check;"
# 3. Restaurer la DERNIÈRE archive saine (procédure §5 étapes 2-4, mais vers la prod) :
#    - déchiffrer l'archive hors site, --check vert sur l'export,
#    - arrêter gateway, remplacer parc.db (install 640, owner lcd), --check, redémarrer :
sudo install -o lcd -g lcd -m 640 /tmp/restore/payload/parc.db /opt/lcd/state/parc/parc.db
sudo rm -f /opt/lcd/state/parc/parc.db-wal /opt/lcd/state/parc/parc.db-shm
sudo python3 /opt/lcd/passerelle-parc/stockage.py --db /opt/lcd/state/parc/parc.db --check
sudo systemctl start lcd-gateway
curl -s http://127.0.0.1:8443/health; curl -s http://127.0.0.1:8443/v1/statut | grep -E 'phase|nb_'
# 4. Rejouer les snapshots state/ postérieurs à l'archive si sains (snapshots/, journal), jamais la base KO.
```

Perte de données maximale = écritures depuis le dernier backup (≤ 24 h). Réduire en rejouant les journaux moteurs box (source de vérité = box, la passerelle ne fait que relayer/cacher).

### 6.2 VM perdue (destruction, compromission, fin Always Free)

1. Recréer une VM (§2 procédure P1 : mêmes ports, même durcissement).
2. `deploy-vps.sh init` (NOUVEAU vault, NOUVELLES clés — on ne ressuscite pas l'ancien hub).
3. Recréer `users_docker.yml` (nouveaux hash) + monter Caddy/gateway.
4. Restaurer la dernière archive `.age` (clé hors ligne, procédure §5 vers la nouvelle VM : `parc.db` + registres + `state-volumes.tgz`).
5. Re-pair WireGuard box par box (`wg-key`, canal chiffré), DNS déjà correct (TTL 300 le temps de stabiliser).
6. Tests bout-en-bout P1 §8 + `check` vert. Délai cible : < 2 h (dont propagation DNS/ACME).

### 6.3 Rotation / perte de clé `age`

- **Rotation planifiée** (compromission suspectée, départ admin) : sur la VM, générer un nouveau couple (`age-keygen` vers nouveau `age-key.txt`, nouveau `age-recipient.txt`), re-chiffrer le vault existant vers le nouveau récipient, exfiltrer la nouvelle clé hors ligne, révoquer l'ancienne (détruire toute copie), forcer un backup complet immédiat avec le nouveau récipient, tester un restore. Les anciennes archives restent lisibles avec l'ancienne clé : les archiver hors ligne avec étiquette, ne pas les supprimer.
- **Perte de la clé privée** : les archives `.age` existantes sont ILLISIBLES (perte définitive hors site). Conserver la VM (vault encore monté = accès vivant), générer un nouveau couple immédiatement, re-backuper complet, exfiltrer la nouvelle clé hors ligne. Leçon notée : double détention hors ligne (coffre physique + gestionnaire) désormais obligatoire.
- **Compromission de la clé** : traiter comme 6.2 (VM potentiellement compromise) : nouvelle VM + nouveau vault + rotation + audit `wg show` / `users_docker.yml` (re-clé toutes les boxes via `rotate wg`).

```bash
# Rotation (sur la VM, session unique, terminal effacé après) :
sudo age-keygen -o /etc/lcd/vault/age-key.txt.new 2>/dev/null
sudo age-keygen -y /etc/lcd/vault/age-key.txt.new | sudo tee /etc/lcd/vault/age-recipient.txt.new > /dev/null
# Re-chiffrer chaque .age du vault vers le nouveau récipient, basculer, tester déchiffrement, puis :
sudo mv /etc/lcd/vault/age-key.txt.new /etc/lcd/vault/age-key.txt
sudo mv /etc/lcd/vault/age-recipient.txt.new /etc/lcd/vault/age-recipient.txt
sudo chmod 600 /etc/lcd/vault/age-key.txt
# → exfiltrer la nouvelle clé hors ligne, forcer backup, tester restore (§5), détruire l'ancienne clé.
```
