# Déploiement VPS (Docker + Caddy + PostgreSQL)

Alternative à Netlify quand les crédits Free sont épuisés ou quand on veut
tout maîtriser. Cible : un VPS 2 à 4 Go, Ubuntu 24.04, un nom de domaine.

## 1. Prérequis

- VPS avec accès SSH root/sudo ;
- Docker Engine + plugin Compose ;
- ports **22, 80, 443** ouverts ;
- DNS : `A` (et `AAAA` si IPv6) du domaine vers l'IP du VPS.

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
# se reconnecter pour prendre le groupe docker
```

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

## 2. Récupérer le projet

```bash
sudo mkdir -p /opt/lcd && sudo chown "$USER":"$USER" /opt/lcd
git clone --branch v2 https://github.com/jul-ienfr/LCD.git /opt/lcd
cd /opt/lcd/v2
```

## 3. Configuration

```bash
cp .env.prod.example .env.prod
chmod 600 .env.prod
openssl rand -hex 32   # BETTER_AUTH_SECRET
openssl rand -hex 32   # CRON_SECRET
openssl rand -hex 24   # POSTGRES_PASSWORD (owner)
openssl rand -hex 24   # APP_ROLE_PASSWORD (rôle applicatif)
nano .env.prod
```

Renseigner au minimum :

- `DOMAIN`, `APP_URL`, `BETTER_AUTH_URL` ;
- `POSTGRES_PASSWORD` et `MIGRATION_DATABASE_URL` (owner, même mot de passe,
  hôte `postgres`) ;
- `APP_ROLE_PASSWORD` et `DATABASE_URL` (même mot de passe, utilisateur
  `lcd_app`) ;
- `BETTER_AUTH_SECRET` ;
- `CRON_SECRET` ;
- `ICS_SCHEDULER_ENABLED=true` pour la synchronisation ICS automatique ;
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` pour la première initialisation.

> Les mots de passe Postgres doivent être compatibles URL. Utiliser
> `openssl rand -hex 24` (pas de `@`, `:`, `/`).

## 4. Construire, migrer et créer le rôle applicatif

```bash
docker compose --env-file .env.prod -f compose.prod.yml build
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:seed
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:test-rls
```

`db:role-app` crée `lcd_app` sans aucun privilège owner et accorde les droits
CRUD + privilèges par défaut. `db:test-rls` doit afficher
`RLS VALIDÉE : isolation tenant effective` (0 sans tenant / total avec tenant
/ 0 avec un autre tenant).

Retirer ensuite `SEED_ADMIN_EMAIL` et `SEED_ADMIN_PASSWORD` de `.env.prod`.

## 5. Démarrer

```bash
docker compose --env-file .env.prod -f compose.prod.yml up -d
docker compose --env-file .env.prod -f compose.prod.yml ps
```

Vérifications :

```bash
curl -fsS https://VOTRE-DOMAINE/api/health
curl -fsS https://VOTRE-DOMAINE/api/ready
```

Caddy obtient automatiquement le certificat Let's Encrypt. Ouvrir
`https://VOTRE-DOMAINE/login` et se connecter avec l'admin seedé.

## 5.1 Synchronisation ICS automatique

Le planificateur in-process est activé par `ICS_SCHEDULER_ENABLED=true` dans
`.env.prod`. Il interroge les flux OTA toutes les 5 minutes, sans dépendre d'un
cron externe. Un verrou distribué en base empêche deux instances de doubler les
écritures ; le bail expire seul si le conteneur redémarre brutalement. Les flux
d’un même logement sont traités en série (détection des chevauchements
inter-OTA), les logements différents en parallèle. Les historiques de
synchronisation sont purgés après 30 jours.

Points de contrôle :

```bash
# Santé agrégée des flux (protégée par CRON_SECRET)
curl -fsS -H "Authorization: Bearer $CRON_SECRET" \
  https://VOTRE-DOMAINE/api/ics/sante

# Forcer un cycle immédiat (même secret)
curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://VOTRE-DOMAINE/api/cron/sync-ota?force=1"
```

La découverte cross-tenant est assurée par la fonction SQL `SECURITY DEFINER`
`lister_flux_ics_a_synchroniser`, exécutable par `lcd_app` : le runtime n’a pas
besoin de la connexion owner. `MIGRATION_DATABASE_URL` reste réservé aux
migrations et aux sauvegardes. Sur un hébergement serverless (Netlify), laisser
`ICS_SCHEDULER_ENABLED=false` et utiliser le workflow GitHub
`.github/workflows/v2-sync-ota.yml` ou un cron externe qui appelle
`/api/cron/sync-ota?force=1`.

### 5.2 Channel manager

La page `/hote/planning/canaux` crée un canal par annonce et logement. Chaque
canal peut avoir un flux d’import iCal et une URL d’export signée distincte.
Le buffer de ménage (0 à 7 jours) et l’exclusion du flux cible sont appliqués
au rendu de l’export, pas stockés dans les réservations.

La migration `0066_canaux.sql` est additive et reprend les flux existants en
canaux `generique`. Supprimer un canal supprime son flux et son historique de
synchronisation ; les réservations déjà importées restent dans le planning.
Comme pour l’URL globale, la rotation de `BETTER_AUTH_SECRET` invalide toutes
les URLs par canal : il faut les recoller dans chaque plateforme.

### 5.3 Fournisseurs API (Beds24, Channex, Smoobu, Host Port, Nobeds)

Le super-admin active les fournisseurs et affecte un fournisseur par logement
dans **Supervision → Fournisseurs**. Les clés restent dans `.env.prod` ; aucun
secret n’est stocké en base ni renvoyé au navigateur.

Pour un serveur persistant, activer le planificateur :

```dotenv
FOURNISSEUR_SYNC_ENABLED=true
FOURNISSEUR_SYNC_INTERVAL_MINUTES=15
```

Sinon, appeler le cron avec le même `CRON_SECRET` :

```bash
curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $CRON_SECRET" \
  "https://VOTRE-DOMAINE/api/cron/sync-fournisseurs"
```

Déclarer les webhooks dans chaque fournisseur :
`https://VOTRE-DOMAINE/api/fournisseurs/{code}/webhook`, en
`Content-Type: application/json`, avec le secret partagé ou la signature HMAC
décrits dans
[FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md). Sans
secret configuré, l’endpoint répond `503` et le cron reste la seule voie.

Vérifier après déploiement que la colonne `derniere_empreinte` existe
(migration `0070_etat_sync_fournisseur.sql`), que la table
`restrictions_sejour` existe avec `stop_sell` (migrations
`0071_pale_vance_astro.sql` et `0072_short_spectrum.sql`), que `demandes_sync`
existe (migration `0073_amused_phantom_reporter.sql`), que `logements.cutoff_jours`
existe (migration `0074_sloppy_rage.sql`), que `plans_tarifaires` et les colonnes
`plan_tarifaire_id` existent (migration `0075_military_doctor_spectrum.sql`),
que `plans_tarifaires.mode`, `ajustement_pourcentage` et `herite_restrictions`
existent (migration `0076_concerned_cannonball.sql`), que `logements.buffer_jours`
existe (migration `0077_brainy_alex_power.sql`) et que
`POST /api/cron/sync-fournisseurs` renvoie `200` avec `ownerDisponible: true`.
L’endpoint `GET /api/ready` reste le contrôle global du schéma et des policies.

## 6. Monitoring (optionnel)

```bash
docker compose --env-file .env.prod -f compose.prod.yml --profile monitoring up -d uptime-kuma
```

Uptime Kuma écoute sur `127.0.0.1:3001` ; y accéder par tunnel SSH :

```bash
ssh -L 3001:127.0.0.1:3001 user@VPS
# puis http://localhost:3001
```

Monitors : `/api/health` (60 s), `/api/ready` (60 s), `/login` (5 min),
`/api/ics/sante` et `/api/cron/sante-fournisseurs` (5 min, en-tête
`Authorization: Bearer <CRON_SECRET>`). Ajouter `/api/health/systeme` (5 min,
en-tête `x-health-token: <HEALTH_TOKEN>`) : il renvoie `503` si le disque passe
sous `ALERTE_DISQUE_GO`, si le certificat expire dans moins de
`ALERTE_TLS_JOURS`, ou si la box configurée n’a plus donné de heartbeat.
Configurer une notification email/ntfy.

La box terrain peut signaler sa présence :

```bash
curl -fsS -X POST https://lcd.example.fr/api/box/heartbeat \
  -H "x-box-token: $BOX_TOKEN"
```

Le dernier contact est visible dans `/supervision` (section Santé système).

## 7. Sauvegardes

```bash
chmod +x scripts/backup-vps.sh
./scripts/backup-vps.sh
```

Cron quotidien (03:15) :

```cron
15 3 * * * cd /opt/lcd/v2 && ./scripts/backup-vps.sh >> /var/log/lcd-backup.log 2>&1
```

Les dumps vont dans `v2/backups/`, rétention 14 jours, checksum SHA-256.
Copier régulièrement ce dossier hors du VPS (rsync, R2, autre serveur).

### Chiffrement des sauvegardes VPS

Ajouter dans `.env.prod` une clé base64 de 32 octets (à conserver aussi dans un
coffre séparé, sans elle les archives sont irrécupérables) :

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# .env.prod : BACKUP_ENCRYPTION_KEY=<clé>
```

`backup-vps.sh` lit la clé dans `.env.prod` (ou l'environnement), produit
`lcd-....sql.gz.enc`, supprime le dump en clair et écrit le checksum de
l'archive chiffrée. Sans clé, le script reste compatible et produit un
`.sql.gz` non chiffré.

Les photos de preuve ménage vivent dans le volume Docker `photos`
(`STOCKAGE_LOCAL_DIR=/var/lib/lcd/photos`). Elles ne sont pas dans le dump SQL :
archiver ce volume séparément (ou brancher l'adaptateur S3/R2) et tester sa
restauration. `BODY_SIZE_LIMIT=12M` est déjà posé pour les uploads 10 Mo.

Purge des blobs orphelins (fichiers présents sur le volume mais absents de
`photos_menage`) :

```bash
npm run db:purge-blobs                 # dry-run, liste seulement
npm run db:purge-blobs -- --apply      # supprime les fichiers > 24 h
```

Cron quotidien après la sauvegarde, avec `MIGRATION_DATABASE_URL` dans
`.env.local` pour contourner la RLS :

```cron
45 3 * * * cd /opt/lcd/v2 && npm run db:purge-blobs -- --apply >> /var/log/lcd-purge.log 2>&1
```

Restauration de contrôle (archive chiffrée) :

```bash
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'createdb -U "$POSTGRES_USER" lcd_restore_test'
docker compose --env-file .env.prod -f compose.prod.yml --profile tools \
  run --rm --no-deps -T \
  -v "$PWD/backups:/backups" tools \
  node scripts/dechiffrer-fichier.mjs /backups/lcd-AAAA.sql.gz.enc \
  | gunzip -c \
  | docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d lcd_restore_test -v ON_ERROR_STOP=1'
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d lcd_restore_test -c "select count(*) from tenants;"'
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'dropdb -U "$POSTGRES_USER" lcd_restore_test'
```

Pour une archive non chiffrée, utiliser directement
`gunzip -c backups/lcd-AAAA.sql.gz | ...`. Vérifier le SHA-256 avant toute
restauration.

## 8. Mise à jour

```bash
cd /opt/lcd
git pull --ff-only
cd v2
docker compose --env-file .env.prod -f compose.prod.yml build web
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:test-rls
docker compose --env-file .env.prod -f compose.prod.yml up -d web caddy
```

Faire une sauvegarde avant chaque migration. Tester `/api/ready` et un login.

## 9. Sécurité

- `.env.prod` en `chmod 600`, jamais dans Git ;
- SSH par clé, root désactivé, `fail2ban` recommandé ;
- UFW : seuls 22/80/443 exposés ;
- Postgres n'est **pas** publié sur l'hôte (uniquement réseau Docker) ;
- `DATABASE_URL` = rôle `lcd_app` non-propriétaire, RLS effective ;
- `MIGRATION_DATABASE_URL` = owner, utilisé uniquement pour migrations,
  seed et sauvegardes ;
- Uptime Kuma sur `127.0.0.1` ;
- sauvegardes hors site + test de restauration mensuel ;
- `BETTER_AUTH_SECRET` ≥ 32 caractères, rotation = invalidation des liens
  voyageur/facture.

## 10. Limites

- un seul VPS = point de défaillance ; prévoir un snapshot provider ;
- Caddy + Next + Postgres sur 2 Go suffisent pour 3 logements, pas pour une
  montée en charge forte ;
- pas de zero-downtime : la mise à jour redémarre `web` quelques secondes.

## 11. Validation locale effectuée

La pile compose a été testée de bout en bout sur Docker Desktop :

- builds `web` et `tools` ;
- PostgreSQL 18, migrations `0000` → `0031`, seed admin + prestataire ;
- rôle applicatif `lcd_app` et `db:test-rls` : **RLS VALIDÉE** sur base fraîche ;
- `web` healthy, `/api/health` et `/api/ready` verts ;
- Caddy HTTPS avec certificat local, redirection HTTP 308, HSTS, frame,
  referrer, permissions et `X-Robots-Tag` ;
- suite Playwright **21/21** sur la pile compose, avec `DATABASE_URL` sur
  `lcd_app` et Mailpit pour l’email.
