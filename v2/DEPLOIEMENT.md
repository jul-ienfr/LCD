# Déploiement Netlify Free + Neon/Supabase

Objectif : une URL publique HTTPS, une base Postgres managée, la PWA
installable, sans payer au démarrage.

## 0. État du déploiement beta (2026-10-25)

- **URL** : <https://lcd-parc.netlify.app>
- **Site Netlify** : `lcd-parc` (`7eb65dbc-dceb-477e-b89e-4ee1d7989b0b`),
  plan Free.
- **Base** : Netlify Database (Postgres managé, région `us-east-2`),
  `DATABASE_URL` injecté par Netlify ; `/api/ready` répond `db: up`.
- **Admin** : `conciergeriefr@outlook.fr` (mot de passe fourni hors dépôt).
- **Email** : `EMAIL_ENABLED=false` tant qu'aucun SMTP de production
  (Brevo/OVH/Scaleway) n'est configuré.
- **Schéma** : bootstrap initial + table `drizzle.__drizzle_migrations`
  marquée jusqu'à `0021`. Les migrations suivantes se lancent avec
  `DATABASE_URL` owner récupéré depuis Netlify.
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

## 1. Base Postgres managée

Créer une base **Neon** ou **Supabase** en région **UE** (Paris/Francfort).
Récupérer la chaîne `DATABASE_URL` (mode pooler si disponible, avec
`sslmode=require`).

Appliquer les migrations **depuis le poste**, sur la base distante :

```powershell
cd v2
$env:DATABASE_URL="postgres://..."
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

> `seed.ts` charge `.env.local`, mais les variables déjà présentes dans le
> shell gagnent. Vérifier que `DATABASE_URL` pointe bien sur la base distante
> avant de lancer le seed.

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
| `DATABASE_URL` | URL Postgres managée (UE) |
| `BETTER_AUTH_SECRET` | secret aléatoire ≥ 32 caractères |
| `BETTER_AUTH_URL` | `https://<site>.netlify.app` |
| `BETTER_AUTH_TRUSTED_ORIGINS` | URLs de preview, séparées par virgules (optionnel) |
| `S3_ENDPOINT` / `S3_BUCKET` / `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` | si stockage fichiers activé |
| `SMTP_URL` / `EMAIL_FROM` | si emails activés |
| `SENTRY_DSN` | si Sentry activé |

**Ne pas** mettre `SEED_*` en production : le seed est une opération locale
ponctuelle.

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
2. ouvrir `https://<site>.netlify.app/api/ready` → `{ ok: true, db: "up" }` ;
3. ouvrir `/login` et se connecter avec l'admin seedé ;
4. ouvrir `/voyageur` et vérifier le formulaire sans JS ;
5. installer la PWA (menu navigateur → « Installer ») ;
6. couper le réseau et recharger `/voyageur` → cache/offline ;
7. configurer Uptime Kuma sur `/api/health` et `/api/ready`.

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
