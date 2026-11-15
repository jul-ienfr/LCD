# Répétition locale — rôle applicatif, RLS et smoke test

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-15
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/tasks.md (T047, T052)
```

Cette répétition exécute **hors production** la chaîne qui sera rejouée sur
l'environnement public : création du rôle `lcd_app`, vérification RLS,
démarrage du build de production avec ce rôle, puis smoke test HTTP complet.
Elle ne remplace aucune preuve de recette publique ; elle élimine les risques
d'outillage avant d'ouvrir le VPS.

## 1. Environnement

| Élément | Valeur |
|---|---|
| Hôte | Windows 11 Pro 26200, Docker 29.8.2 |
| Base | `postgres:18-alpine` (compose.dev), volume `v2_pgdata` |
| Schéma | 98 tables, 105 migrations appliquées |
| Application | build SvelteKit `node build` (adapter-node) |
| Rôle | `lcd_app` (RLS), propriétaire `lcd` |
| SMTP / S3 | Mailpit et S3Mock locaux, non sollicités par le smoke |

## 2. Ce qui a été exécuté

### 2.1 Rôle applicatif et test négatif

`npm run db:role-app` crée le rôle, accorde les privilèges et applique les
politiques RLS. Le build lancé avec le rôle **propriétaire** renvoie bien un
refus, ce qui prouve que `/api/ready` ne se contente pas de vérifier la
connexion :

```text
GET /api/ready (DATABASE_URL = lcd)
HTTP 503 {"ok":false,"db":"up","schema":"ok","rls":"unsafe","role":"lcd"}
```

### 2.2 Vérification RLS

`npm run db:test-rls` avec `DATABASE_URL` sur `lcd_app` :

```text
{"roleOwner":"lcd","roleApp":"lcd_app","tenant":"…","attendu":3776,
 "sansTenant":0,"avecTenant":3776,"autreTenant":0}
RLS VALIDÉE : isolation tenant effective.
…
RLS VALIDÉE : clés API et intégrations isolées, lecture par empreinte contrôlée.
```

Onze familles de contrôles passent : événements, sites publics, échéances,
demandes de séjour, fils voyageur, échéances et automatisations, recommandations
de prix, paiements propriétaires, guide et serrure, extras et avis, clés API et
intégrations. Aucune ligne d'un autre tenant n'est visible ; les insertions
croisées sont refusées.

### 2.3 Smoke test sur le build de production

Build démarré avec `DATABASE_URL` sur `lcd_app` et `PORT=4181` :

```text
OK   /api/health — 200, ok conformes
OK   /api/ready — 200, ok/db/schema/rls conformes
OK   / — 200, 3 398 caractères rendus sans JS
OK   /reserver — 200, 3 985 caractères rendus sans JS
OK   /login — 200, 295 caractères rendus sans JS
OK   /voyageur — 200, 419 caractères rendus sans JS
OK   /aide — 200, 3 355 caractères rendus sans JS
OK   /legales — 200, 4 904 caractères rendus sans JS
OK   /offline — 200, 252 caractères rendus sans JS
OK   /manifest.webmanifest — manifeste valide (3 icônes)
OK   HTTPS — base en http : contrôle ignoré en local
11/11 contrôles OK.
```

Le même script lancé sur le build relié au rôle propriétaire échoue sur
`/api/ready` (503, `rls=unsafe`) et réussit les dix autres contrôles : le
détecteur discrimine bien les deux situations.

### 2.4 Sauvegarde chiffrée et restauration

```text
OK lcd-20261115-090323.sql.gz.enc (2,42 Mo)
SHA-256 3d0c427c7dbf0b651cddf5db4aca29652be95b9b0876e77429c41916a2bb09ad
Chiffrement AES-256-GCM activé.
Sauvegarde chiffrée : AES-256-GCM vérifié.
Restauration dans lcd_restore_1794733404104…
OK tenants=2 users=723 logements=3776 reservations=1907
   factures=524 paiements=373 blocages=138 tables=98 migrations=105
Comptes conformes au manifeste de sauvegarde.
RESTAURATION VALIDÉE
```

La sauvegarde est produite avec `BACKUP_ENCRYPTION_KEY`, vérifiée par son
empreinte SHA-256, restaurée dans une base jetable puis comparée au manifeste
de comptes. La base restaurée contient 98 tables et 105 migrations.

### 2.5 Préflight production

Exécuté avec `NODE_ENV=production`, une URL HTTPS, le rôle `lcd_app` et un
volume photos dédié :

```text
✓ Version de Node — v24.13.0
✓ Environnement — aucune erreur bloquante
✓ Connexion base de données — rôle lcd_app, RLS appliquée
✓ Migrations — 105/105 migrations
✓ Espace disque — 9,6 Go libres (seuil 2 Go)
✓ Volume photos — inscriptible
Préflight réussi : le déploiement peut démarrer.
```

Les seuls avertissements sont attendus en local : e-mail désactivé,
planificateur ICS désactivé, `LCD_VERSION` absente.

## 3. Portée

Prouvé par cette répétition :

- le rôle `lcd_app` suffit à servir l'application et à passer `/api/ready` ;
- les politiques RLS bloquent les lectures et écritures inter-tenants ;
- le build de production rend les sept pages publiques sans JavaScript ;
- le manifeste PWA est servi et valide ;
- `npm run smoke` est utilisable tel quel et sort en erreur au premier échec ;
- la sauvegarde chiffrée AES-256-GCM se restaure sur une base jetable avec des
  comptes conformes au manifeste ;
- le préflight production accepte l'environnement simulé (105/105 migrations,
  rôle `lcd_app`, volume photos inscriptible).

Non prouvé, et donc encore à faire sur l'environnement public :

- résolution DNS, certificat, redirection HTTP → HTTPS et HSTS ;
- envoi SMTP réel, SPF/DKIM/DMARC ;
- installation PWA et cache hors ligne dans un navigateur ;
- crons réels, copie hors serveur de la sauvegarde, supervision, retour arrière ;
- recette fonctionnelle des 155 cases et des 21 parcours.

## 4. Reproduction

```bash
cd v2
docker compose -f compose.dev.yml up -d
npm ci
npm run db:migrate
export APP_ROLE_PASSWORD="$(openssl rand -hex 24)"
npm run db:role-app
DATABASE_URL="postgres://lcd_app:$APP_ROLE_PASSWORD@127.0.0.1:5432/lcd" \
MIGRATION_DATABASE_URL="$MIGRATION_DATABASE_URL" npm run db:test-rls
npm run build
DATABASE_URL="postgres://lcd_app:$APP_ROLE_PASSWORD@127.0.0.1:5432/lcd" \
PORT=4181 HOST=127.0.0.1 node --env-file=.env.local build &
npm run smoke -- http://127.0.0.1:4181
BACKUP_ENCRYPTION_KEY="$BACKUP_KEY" BACKUP_DIR="$BACKUP_DIR" npm run db:backup
BACKUP_ENCRYPTION_KEY="$BACKUP_KEY" BACKUP_DIR="$BACKUP_DIR" npm run db:restore-test
PREFLIGHT_ENV_FILE=.env.preflight npm run preflight
```

Le job `release` de `.github/workflows/v2-ci.yml` rejoue ce smoke sur chaque
tag `v*`, après migrations, seeds, rôle applicatif et RLS.
