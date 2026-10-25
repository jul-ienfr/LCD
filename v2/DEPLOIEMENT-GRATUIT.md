# Déploiement gratuit — alternatives à Netlify

Netlify Free donne **300 crédits par mois**, avec coupure dure : quand ils sont
épuisés, les sites sont mis en pause jusqu’au prochain cycle. Les déploiements
répétés consomment ces crédits. Ce document compare les options gratuites
réellement utilisables pour LCD v2.

## Comparatif

| Option | Coût | Next.js | PostgreSQL | Veille | Production ? |
|---|---|---|---|---|---|
| **Oracle Cloud Always Free** | 0 € | Docker, aucun changement | local dans Docker | non | **oui, recommandé** |
| **Home lab + Cloudflare Tunnel** | 0 € | Docker, aucun changement | local | dépend de la machine | oui si 24/7 |
| **Google Cloud e2-micro** | 0 € | Docker | Neon Free | non | oui, limite 1 Go RAM/1 Go egress |
| **Render Free** | 0 € | Docker | Neon Free | 15 min | démo, SMTP bloqué |
| **Vercel Hobby** | 0 € | natif | Neon Free | non | **non commercial interdit** |
| **Cloudflare Workers** | 0 € | OpenNext/vinext | Neon/Hyperdrive | non | migration lourde |
| **Koyeb / Fly / Railway** | non | — | — | oui | non |

## Option A — Oracle Cloud Always Free (recommandé)

Avantages : 2 OCPU ARM, 12 Go RAM, 200 Go de disque, toujours gratuit, assez
pour Next + PostgreSQL + Caddy. On réutilise `compose.prod.yml` sans changer
le code.

### 1. Créer la VM

- compte Oracle Cloud → **Always Free** ;
- shape **VM.Standard.A1.Flex**, 2 OCPU / 12 Go, Ubuntu 24.04 ARM ;
- disque 60–100 Go, IP publique ;
- clé SSH ;
- règles réseau : 22, 80, 443.

> L’inscription et la capacité ARM peuvent échouer. Réessayer dans une autre
> zone de disponibilité, ou passer en Pay As You Go en restant dans les limites
> Always Free.

### 2. Installer Docker

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER"
# se reconnecter
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 3. Déployer

```bash
sudo mkdir -p /opt/lcd && sudo chown "$USER":"$USER" /opt/lcd
git clone --branch v2 https://github.com/jul-ienfr/LCD.git /opt/lcd
cd /opt/lcd/v2
cp .env.prod.example .env.prod
chmod 600 .env.prod
openssl rand -hex 32   # BETTER_AUTH_SECRET
openssl rand -hex 32   # CRON_SECRET
openssl rand -hex 24   # POSTGRES_PASSWORD
openssl rand -hex 24   # APP_ROLE_PASSWORD
nano .env.prod
```

Renseigner `DOMAIN`, `APP_URL`, `BETTER_AUTH_URL`, les deux mots de passe
Postgres/role, puis :

```bash
docker compose --env-file .env.prod -f compose.prod.yml build
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:seed
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.yml run --rm tools npm run db:test-rls
docker compose --env-file .env.prod -f compose.prod.yml up -d
```

DNS : `A` du domaine vers l’IP publique. Caddy obtient Let’s Encrypt tout seul.
Vérifier `https://DOMAINE/api/ready` → `schema: ok`.

Backups : `scripts/backup-vps.sh` + cron, voir `DEPLOIEMENT-VPS.md`.

## Option B — Google Cloud e2-micro + Neon

Avantages : gratuit permanent, pas de carte à utiliser au-delà de la
vérification. Contraintes : 1 Go RAM, régions US, 1 Go egress/mois.

1. Créer une VM **e2-micro**, Ubuntu 24.04, 30 Go standard, `us-west1` /
   `us-central1` / `us-east1`. Autoriser 80/443.
2. Créer une base **Neon Free** (0,5–1 Go, autosuspend 5 min) en région UE si
   disponible. Récupérer l’URL **owner** et générer le rôle applicatif.
3. Sur la VM : installer Docker, cloner le dépôt, copier `.env.prod`.
4. Renseigner `DATABASE_URL` (rôle `lcd_app`), `MIGRATION_DATABASE_URL`
   (owner Neon), `APP_URL`, `BETTER_AUTH_URL`, secrets.
5. Utiliser la variante sans PostgreSQL local :

```bash
docker compose --env-file .env.prod -f compose.prod.external-db.yml build
docker compose --env-file .env.prod -f compose.prod.external-db.yml run --rm tools npm run db:migrate
docker compose --env-file .env.prod -f compose.prod.external-db.yml run --rm tools npm run db:seed
docker compose --env-file .env.prod -f compose.prod.external-db.yml run --rm tools npm run db:role-app
docker compose --env-file .env.prod -f compose.prod.external-db.yml run --rm tools npm run db:test-rls
docker compose --env-file .env.prod -f compose.prod.external-db.yml up -d
```

> Si Neon refuse `CREATEROLE`, le script `db:role-app` échoue. Deux choix :
> créer le rôle `lcd_app` depuis la console Neon, ou utiliser temporairement
> l’URL owner comme `DATABASE_URL` pour la beta — dans ce dernier cas, RLS
> n’est **pas** appliquée et il faut le documenter comme limite.

Ajouter 2 Go de swap pour le build Next :

```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

Le build peut être lancé en local puis poussé via registry si la VM manque de
RAM. Configurer Cloudflare devant le domaine pour absorber les assets et
limiter l’egress.

## Option C — Render Free + Neon (démo)

`render.yaml` est fourni. Render Free : 512 Mo, veille après 15 min, 5 Go de
bande passante, **SMTP bloqué sur le plan gratuit**. Donc email désactivé.

1. Créer Neon Free, appliquer migrations/seed/rôle **depuis ta machine** :

```powershell
$env:MIGRATION_DATABASE_URL="postgres://owner..."
$env:DATABASE_URL="postgres://lcd_app:..."
npm run db:migrate
npm run db:seed
npm run db:role-app
npm run db:test-rls
```

2. Render → **New → Blueprint** → dépôt `jul-ienfr/LCD`, branche `v2`,
   `render.yaml`.
3. Renseigner `DATABASE_URL`, `BETTER_AUTH_SECRET`, `APP_URL`/`BETTER_AUTH_URL`
   (`https://<service>.onrender.com`), `CRON_SECRET`.
4. Déployer, vérifier `/api/health` et `/api/ready`.
5. Créer un cron GitHub Actions pour OTA/webhooks, car Render Free n’a pas de
   worker permanent.

> Démo uniquement : veille, 512 Mo, pas de backup, SMTP bloqué.

## Option D — Home lab + Cloudflare Tunnel

Si ta machine `lcd-deploy` est allumée 24/7 :

1. lancer la pile compose (locale ou externe) ;
2. installer `cloudflared` ;
3. créer un tunnel Cloudflare gratuit vers `http://localhost:3003` ou Caddy ;
4. pointer un sous-domaine vers le tunnel ;
5. protéger l’admin avec Cloudflare Access si possible.

Avantage : 0 €, aucune migration cloud. Risque : coupure Internet/électricité,
maintenance, sauvegardes hors site obligatoires.

## Option E — Vercel Hobby

Techniquement le plus simple, **mais interdit pour un usage commercial**.
Utilisable seulement pour une démo privée ou un staging. Pour vendre, il faut
Pro (20 $/mois) ou une autre option.

## Netlify : que faire ?

- les 300 crédits se réinitialisent au prochain cycle ;
- certains comptes restent bloqués par un flag de facturation : ouvrir un
  ticket Netlify si les crédits sont revenus mais que les sites restent en
  pause ;
- pour éviter de recommencer : **un seul déploiement par release**, pas de
  preview à chaque commit ;
- Personal à 9 $/mois = 1 000 crédits si tu veux rester sur Netlify.

## Migration de la base Netlify vers Neon

```powershell
# dump owner Netlify
$env:MIGRATION_DATABASE_URL="postgres://owner-netlify..."
npm run db:backup

# restaurer vers Neon (base vide)
# puis appliquer migrations/seed/rôle et vérifier
$env:MIGRATION_DATABASE_URL="postgres://owner-neon..."
npm run db:migrate
npm run db:seed
npm run db:role-app
npm run db:test-rls
```

Ne jamais mettre l’URL owner dans le runtime : `DATABASE_URL` doit rester le
rôle `lcd_app`.

## Recommandation

1. **Oracle Cloud Always Free** si tu peux créer la VM : le plus proche de la
   production, réutilise toute la pile validée.
2. **Home lab + Cloudflare Tunnel** si la machine est déjà fiable.
3. **GCP e2-micro + Neon** en plan B.
4. **Render + Neon** seulement pour montrer une démo.

Dis-moi laquelle tu retiens ; je prépare le `.env.prod`, le DNS, les
migrations, le rôle RLS et la recette de `TESTS-A-FAIRE.md`.
