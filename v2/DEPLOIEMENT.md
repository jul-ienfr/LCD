# Déploiement Netlify Free + Neon/Supabase

Objectif : une URL publique HTTPS, une base Postgres managée, la PWA
installable, sans payer au démarrage.

## 0. État du déploiement beta (2026-10-25)

- **URL** : <https://lcd-parc.netlify.app>
- **Site Netlify** : `lcd-parc` (`7eb65dbc-dceb-477e-b89e-4ee1d7989b0b`),
  plan Free.
- **Base** : Netlify Database (Postgres managé, région `us-east-2`),
  cible `DATABASE_URL` = rôle `lcd_app` non-propriétaire ; l’ancien
  déploiement utilise encore le owner tant que le rôle n’est pas provisionné.
  `/api/ready` répond `db: up` et `schema: ok` uniquement après application
  des migrations.
- **Admin** : `conciergeriefr@outlook.fr` (mot de passe fourni hors dépôt).
- **Email** : `EMAIL_ENABLED=false` tant qu'aucun SMTP de production
  (Brevo/OVH/Scaleway) n'est configuré.
- **Schéma** : bootstrap initial + table `drizzle.__drizzle_migrations`
  marquée jusqu'à `0025` en production. Les migrations `0026` (commission),
  `0027`-`0028` (webhooks), `0029`-`0030` (cautions) et `0031`
  (entité/mandats) seront appliquées au
  prochain déploiement avec `DATABASE_URL` owner récupéré depuis Netlify.
- **Limites Free** : variables d'environnement non secrètes (lisibles par
  l'équipe), base hors UE, pas de backups/PITR, pas de Sentry/Uptime.
- **Sécurité** : le token Netlify utilisé pour ce bootstrap doit être
  révoqué/rotaté ; le mot de passe admin a été changé via
  `/hote/securite` et doit rester privé.
- **Sauvegardes** : `npm run db:backup` + `npm run db:restore-test` ;
  workflow quotidien `.github/workflows/v2-backup.yml` à activer avec le
  secret `DATABASE_URL` (voir `v2/BACKUPS.md`).

La suite du document décrit la procédure cible (Neon/Supabase ou Netlify
Database) et reste valable pour une installation neuve.

> **Alternative VPS** : si les crédits Netlify sont épuisés, utiliser
> `v2/DEPLOIEMENT-VPS.md` (Docker + Caddy + PostgreSQL + sauvegardes).
> **Alternatives gratuites** : `v2/DEPLOIEMENT-GRATUIT.md` (Oracle Always
> Free, GCP e2-micro + Neon, Render + Neon, home lab + tunnel).

## 1. Base Postgres managée

Créer une base **Neon** ou **Supabase** en région **UE** (Paris/Francfort).
Récupérer la chaîne **owner** (`MIGRATION_DATABASE_URL`, mode pooler si
disponible, avec `sslmode=require`).

Appliquer les migrations **depuis le poste**, sur la base distante :

```powershell
cd v2
$env:MIGRATION_DATABASE_URL="postgres://owner..."
$env:BETTER_AUTH_SECRET="<32+ caracteres aleatoires>"
$env:BETTER_AUTH_URL="https://<site>.netlify.app"
npm run db:migrate
```

Créer le premier admin **sur la base distante** :

```powershell
$env:SEED_ADMIN_EMAIL="admin@votre-domaine.fr"
$env:SEED_ADMIN_PASSWORD="<mot de passe fort, 12+>"
$env:SEED_TENANT_SLUG="lcd"
npm run db:seed
```

Créer le rôle applicatif non-propriétaire et vérifier RLS :

```powershell
$env:APP_ROLE_NAME="lcd_app"
$env:APP_ROLE_PASSWORD="<openssl rand -hex 24>"
npm run db:role-app
$env:DATABASE_URL="postgres://lcd_app:<APP_ROLE_PASSWORD>@<host>/<db>"
npm run db:test-rls
```

`db:test-rls` doit afficher `RLS VALIDÉE`. `DATABASE_URL` (rôle `lcd_app`)
est la seule URL utilisée par l’application ; `MIGRATION_DATABASE_URL`
(owner) reste pour migrations, seed et sauvegardes.

> `seed.ts` charge `.env.local`, mais les variables déjà présentes dans le
> shell gagnent. Vérifier que `MIGRATION_DATABASE_URL` pointe bien sur la base
> distante avant le seed.

## 2. Projet Netlify

1. Netlify → **Add new site** → **Import an existing project**.
2. GitHub → dépôt `jul-ienfr/LCD`, branche `v2`.
3. **Base directory** : `v2`.
4. Build command : `npm run build` (déjà dans `netlify.toml`).
5. Publish directory : `.next` (géré par le plugin Next).
6. Node : `24` (déjà dans `netlify.toml`).

Netlify détecte Next.js et installe `@netlify/plugin-nextjs` au build.
`next.config.ts` désactive `output: "standalone"` quand `NETLIFY=true`.

## 3. Variables d'environnement Netlify

À mettre dans **Site configuration → Environment variables** :

| Variable | Valeur |
|---|---|
| `DATABASE_URL` | URL Postgres du rôle **`lcd_app`** (non-propriétaire, RLS) |
| `BETTER_AUTH_SECRET` | secret aléatoire ≥ 32 caractères |
| `BETTER_AUTH_URL` | `https://<site>.netlify.app` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | URLs de preview, séparées par virgules (optionnel) |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | si stockage fichiers activé |
| `SMTP_URL` / `EMAIL_FROM` | si emails activés |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | si paiement en ligne activé |
| `CRON_SECRET` | si synchronisation OTA quotidienne activée |
| `SENTRY_DSN` | si Sentry activé |

**Ne pas** mettre `SEED_*` en production : le seed est une opération locale
ponctuelle. `MIGRATION_DATABASE_URL` (owner) reste dans le shell local ou le
secret GitHub de sauvegarde, jamais dans le runtime Netlify.

> Netlify Free ne chiffre pas les variables : l’URL du rôle `lcd_app` limite
> les dégâts si elle fuite, car RLS reste appliquée.

## 4. Déployer

```bash
npx netlify-cli login
npx netlify-cli init
npx netlify-cli deploy --build --prod
```

Ou via l'interface Netlify (recommandé pour la première fois) : **Deploy
site**.

Après le premier déploiement :

1. ouvrir `https://<site>.netlify.app/api/health` → `{ ok: true }` ;
2. ouvrir `https://<site>.netlify.app/api/ready` → `{ ok: true, db: "up",
   schema: "ok" }` ; si `schema: "pending"`, appliquer les migrations ;
3. ouvrir `/login` et se connecter avec l'admin seedé ;
4. ouvrir `/voyageur` et vérifier le formulaire sans JS ;
5. installer la PWA (menu navigateur → « Installer ») ;
6. couper le réseau et recharger `/voyageur` → cache/offline ;
7. configurer Uptime Kuma sur `/api/health` et `/api/ready`.

## 4bis. Paiement Stripe (optionnel)

1. Stripe Dashboard → Developers → API keys → récupérer la clé secrète
   (`sk_test_…` puis `sk_live_…`).
2. Ajouter `STRIPE_SECRET_KEY` dans Netlify.
3. Créer un endpoint webhook vers
   `https://<site>.netlify.app/api/stripe/webhook`, événements
   `checkout.session.completed` et
   `checkout.session.async_payment_succeeded`.
4. Copier le signing secret (`whsec_…`) dans `STRIPE_WEBHOOK_SECRET`.
5. Redéployer, ouvrir une facture publique avec un solde et vérifier le
   bouton « Payer en ligne ».
6. Tester en mode test avec la carte `4242 4242 4242 4242`.

Sans ces deux variables, le bouton est masqué et le webhook répond 503.

## 4ter. Cron OTA (optionnel)

1. Générer un secret aléatoire (`openssl rand -hex 32`).
2. Netlify → Environment variables → `CRON_SECRET`.
3. GitHub → Settings → Secrets and variables → Actions → `CRON_SECRET`.
4. Le workflow `.github/workflows/v2-sync-ota.yml` appelle chaque jour à
   03:00 UTC `POST /api/cron/sync-ota`.
5. Tester manuellement : **Actions → v2-sync-ota → Run workflow**.

L’endpoint renvoie `{ total, reussis, erreurs, details }` ; chaque flux
conserve son dernier statut et son message dans `/hote/planning/import`.

Le même `CRON_SECRET` protège `POST /api/cron/webhooks`, appelé chaque heure
par `.github/workflows/v2-webhooks.yml` pour livrer les webhooks HA/Moli.

## 4quater. Monitoring

- `SENTRY_DSN` → erreurs serveur et client (voir `v2/MONITORING.md`) ;
- `docker compose -f compose.monitoring.yml up -d` pour Uptime Kuma ;
- monitors `/api/health`, `/api/ready`, `/login` + notification testée.

## 5. Domaine personnalisé

1. Netlify → **Domain management** → ajouter le domaine.
2. DNS chez OVH/Cloudflare/Infomaniak.
3. TLS Let's Encrypt automatique.
4. Mettre à jour `BETTER_AUTH_URL` avec le domaine final, puis redéployer.
5. Ajouter les URLs de preview dans `BETTER_AUTH_TRUSTED_ORIGINS` si besoin.

## 6. Limites du gratuit

| Ressource | Limite Netlify Free / Neon Free |
|---|---|
| Netlify | 300 crédits/mois, fonctions limitées |
| Neon/Supabase | ~0,5 Go, pause après inactivité |
| Bande passante | selon offre |
| PITR / backups | souvent absent en gratuit |

**Dès le premier client payant**, passer à un VPS 4 Go ou Netlify Pro +
Postgres managé avec PITR. Voir `docs/78-plan-stack-deploiement.md` §8.

## 7. Vérification locale avant déploiement

```bash
cd v2
NETLIFY=true npm run build
npm run lint
npm run typecheck
npm test
npm run db:check
```

Le build Netlify ne doit pas produire de dossier `standalone` ; le build
Docker/VPS, lui, le produit.
