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
openssl rand -hex 24   # POSTGRES_PASSWORD (et le même dans DATABASE_URL)
nano .env.prod
```

Renseigner au minimum :

- `DOMAIN`, `APP_URL`, `BETTER_AUTH_URL` ;
- `POSTGRES_PASSWORD` et `DATABASE_URL` (même mot de passe, hôte `postgres`) ;
- `BETTER_AUTH_SECRET` ;
- `CRON_SECRET` ;
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` pour la première initialisation.

> Le mot de passe Postgres doit être compatible URL. Si besoin, utiliser
> `openssl rand -hex 24` (pas de `@`, `:`, `/`).

## 4. Construire et migrer

```bash
docker compose --env-file .env.prod -f compose.prod.yml build
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:seed
```

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

## 6. Monitoring (optionnel)

```bash
docker compose --env-file .env.prod -f compose.prod.yml --profile monitoring up -d uptime-kuma
```

Uptime Kuma écoute sur `127.0.0.1:3001` ; y accéder par tunnel SSH :

```bash
ssh -L 3001:127.0.0.1:3001 user@VPS
# puis http://localhost:3001
```

Monitors : `/api/health` (60 s), `/api/ready` (60 s), `/login` (5 min).
Configurer une notification email/ntfy.

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

Restauration de contrôle :

```bash
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'createdb -U "$POSTGRES_USER" lcd_restore_test'
gunzip -c backups/lcd-AAAA.sql.gz | \
  docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d lcd_restore_test -v ON_ERROR_STOP=1'
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'psql -U "$POSTGRES_USER" -d lcd_restore_test -c "select count(*) from tenants;"'
docker compose --env-file .env.prod -f compose.prod.yml exec -T postgres \
  sh -c 'dropdb -U "$POSTGRES_USER" lcd_restore_test'
```

## 8. Mise à jour

```bash
cd /opt/lcd
git pull --ff-only
cd v2
docker compose --env-file .env.prod -f compose.prod.yml build web
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml up -d web caddy
```

Faire une sauvegarde avant chaque migration. Tester `/api/ready` et un login.

## 9. Sécurité

- `.env.prod` en `chmod 600`, jamais dans Git ;
- SSH par clé, root désactivé, `fail2ban` recommandé ;
- UFW : seuls 22/80/443 exposés ;
- Postgres n'est **pas** publié sur l'hôte (uniquement réseau Docker) ;
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
- PostgreSQL 18, migrations `0000` → `0030`, seed admin + prestataire ;
- `web` healthy, `/api/health` et `/api/ready` verts ;
- Caddy HTTPS avec certificat local, redirection HTTP 308, HSTS, frame,
  referrer, permissions et `X-Robots-Tag` ;
- E2E login admin, refus d'inscription publique, isolation prestataire,
  création de logement et journal d'audit sur la pile production.
