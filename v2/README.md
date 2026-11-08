# LCD v2 — SvelteKit 3, HTML-first

Application de conciergerie locative saisonnière. La v2 est une bascule **dans
ce dossier** (pas de v3) : SvelteKit 3 + Svelte 5 + Vite 8 + Tailwind CSS 4,
rendue par `@sveltejs/adapter-node`, avec PostgreSQL, Drizzle, Better Auth,
SMTP et PDF.

## Démarrer

```bash
npm ci
cp .env.example .env.local
docker compose -f compose.dev.yml up -d   # Postgres + S3Mock + Mailpit
npm run db:migrate
npm run db:seed
npm run db:seed-demo                          # optionnel : 3 logements de démo
npm run dev                                # http://localhost:5173
```

Comptes de développement (à changer avant tout déploiement) :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@lcd.test` | `ChangeMe-2026!` | `super_admin` (promu au seed) |
| `presta@lcd.test` | `ChangeMe-2026!` | `presta` |
| `proprio@lcd.test` | `ChangeMe-2026!` | `proprietaire` |
| `commercial@lcd.test` | `ChangeMe-2026!` | `commercial` |

Un compte super-admin dédié peut être créé avec
`SEED_SUPER_ADMIN_EMAIL` / `SEED_SUPER_ADMIN_PASSWORD`. Le seed est idempotent.

## Vérifier

```bash
npm run check       # svelte-check + sync
npm test            # Vitest (domaine, application, infrastructure)
npm run build
npm run test:e2e    # Playwright (serveur lancé automatiquement)
```

Les tests E2E couvrent les parcours publics, la connexion, l’apparence
(brouillon, aperçu signé, publication, retour arrière), le chargement de toutes
les routes staff et publiques avec et sans JavaScript, et la dégradation sans
JavaScript (`javaScriptEnabled: false`).

Sur une base locale migrée et seedée, `npm run db:test-ics` vérifie la chaîne
ICS réelle (création, déplacement, suppression, blocage, conflit, 304,
historique, bail distribué) dans un tenant jetable supprimé à la fin. `db:test-migrations` et
`db:test-rls` valident les migrations et l’isolation tenant.

## Apparence globale

Un seul thème publié pour tout le site, choisi exclusivement par un
super-admin dans `/supervision/apparence` :

- 6 thèmes (`sejour`, `ocean`, `sable`, `nuit`, `foret`, `ardoise`), clair et
  sombre, typographie, rayons, ombres, densité et variantes de navigation ;
- un brouillon et une version publiée au maximum, garantis par index partiels ;
- aperçu réservé au super-admin via cookie HMAC signé (30 min, lié au compte) ;
- publication, historique et retour arrière versionnés, avec audit ;
- couleurs vérifiées AA (4,5:1) par les tests ;
- les e-mails et les PDF reprennent l’accent et l’identité publiés.

Le thème est résolu côté serveur dans `src/routes/+layout.svelte` : aucune
requête client, aucun flash, aucun JavaScript requis.

## Structure

```text
src/routes/            pages et endpoints SvelteKit
src/domain/            domaine pur (aucun framework)
src/application/       cas d’usage + ports
src/infrastructure/    adapters Drizzle, SMTP, PDF, Stripe, S3
src/lib/server/        auth, session, cookies, apparence
src/lib/components/    composants Svelte partagés
drizzle/               migrations SQL (immuables après application)
tests/                 Vitest
e2e/                   Playwright
static/                assets PWA, service worker, icônes
```

L’ancienne UI Next.js (`src/app/`, `src/components/*.tsx`) est conservée comme
référence de parité, exclue du build et de `svelte-check`. Elle ne doit pas être
importée.

## Règles

- HTML-first : les pages publiques et voyageur fonctionnent sans JavaScript ;
  les mutations passent par des actions serveur ou des endpoints natifs.
- Thème unique global : jamais de préférence par utilisateur, jamais côté client.
- `tenant_id` vient toujours de la session ; `withTenant()` pour les tables
  métier.
- Toute écriture rejouable porte une `ref` stable.
- Pas de secret dans Git ; `BETTER_AUTH_SECRET` ≥ 32 caractères en production.
- Photos de démonstration : `static/photos/` (Unsplash, voir
  `static/photos/ATTRIBUTION.md`). À remplacer par les photos des biens avant
  production.
- Budget JS : voyageur < 50 Ko gzip, staff < 200 Ko. Mesure locale :
  `/`, `/login`, `/reserver` et `/voyageur` chargent **0,1 Ko** de JavaScript
  applicatif (hors service worker), grâce à `csr = false`.

## Channel manager

`/hote/planning/canaux` centralise les plateformes d’un logement : une fiche par
annonce, un flux iCal d’import facultatif, un calendrier d’export signé et un
buffer de ménage de 0 à 7 jours. Le catalogue couvre Airbnb, Booking, Abritel,
Agoda, Trip.com, Gîtes de France, Clévacances, Leboncoin, Pitchup, Hipcamp et un
canal générique.

Le détail du périmètre, des limites et de l’exploitation est dans
[CHANNEL-MANAGER.md](./CHANNEL-MANAGER.md). Le socle iCal reste le filet de
sécurité. Un registre de cinq fournisseurs API optionnels — Beds24, Channex,
Smoobu, Host Port et Nobeds — est activable uniquement par le super-admin dans
`/supervision/fournisseurs`, puis affecté logement par logement. Voir
[FOURNISSEURS-CHANNEL-MANAGER.md](./FOURNISSEURS-CHANNEL-MANAGER.md). Les API
natives Airbnb/Booking/Expedia ne sont jamais appelées hors fournisseur certifié.
Dans **Hôte → Prix**, un prix peut être saisi à la journée ou appliqué sur une
plage (366 jours maximum) avec filtre par jour de semaine ; les plans tarifaires
permettent plusieurs prix et règles par logement. La réservation directe refuse
les nuits en stop-sell, les arrivées/départs interdits et les séjours hors durée
minimale ou maximale.

## Déploiement

Le conteneur de production exécute `node build` derrière Caddy. Caddy transmet
`X-Forwarded-Proto` et `X-Forwarded-Host` ; le `Dockerfile` active
`PROTOCOL_HEADER=x-forwarded-proto` et `HOST_HEADER=x-forwarded-host` pour que
SvelteKit calcule la bonne origine et accepte les formulaires natifs. Sans ces
en-têtes, les POST sont refusés comme « cross-site » (403).

## API et exploitation

- `GET /api/health` (liveness) et `GET /api/ready` (DB, schéma, RLS).
- `POST /api/cron/{memoire,purge-police,relances,sync-ota,sync-fournisseurs,webhooks}`
  protégés par `Authorization: Bearer $CRON_SECRET`. Envoyer
  `Content-Type: application/json`, sinon la protection CSRF répond `403` avant
  le contrôle du secret.
- `POST /api/fournisseurs/{code}/webhook` : webhooks fournisseurs, en
  `Content-Type: application/json`, signature ou secret partagé vérifié avant
  toute lecture.
- `GET /api/ics/sante` : état agrégé des flux ICS (même secret).
- **Synchronisation ICS** : sur un serveur persistant, `ICS_SCHEDULER_ENABLED=true`
  démarre le planificateur in-process (toutes les 5 min, verrou en base). Sur
  Netlify/Vercel, laisser `false` et appeler `/api/cron/sync-ota?force=1` par un
  cron externe. Chaque flux utilise ETag/304 et une empreinte SHA-256 : un
  contenu identique n’est pas réimporté. Backoff progressif, confirmation avant
  suppression d’un calendrier vide et historique `ics_sync_runs`.
- **Synchronisation fournisseurs** : `FOURNISSEUR_SYNC_ENABLED=true` démarre le
  planificateur, ou appeler `/api/cron/sync-fournisseurs` par un cron externe.
  Chaque logement affecté pousse son ARI, importe les réservations OTA et
  enregistre une empreinte pour éviter les pushs identiques. Un webhook signé
  déclenche la même synchronisation immédiatement.
- `POST /api/stripe/webhook` avec vérification de signature.
- Exports staff : `/api/exports/{reservations,factures,paiements,factur-x,audit,modele-rapprochement,tenant}`.
- Calendrier public signé : `/api/calendrier/[logementId]?t=…` (HMAC, lecture
  seule, `noindex`). Cette URL est l’abonnement global ; la page Channel manager
  génère aussi une URL par canal, avec buffer et sans écho de son propre flux.
  La rotation de `BETTER_AUTH_SECRET` invalide ces URLs : il faut alors
  recoller l’URL dans chaque OTA.

## Limites connues

- L’instance ne pousse pas d’écriture native aux OTA (API fermées) ; le socle
  iCal diffuse les indisponibilités avec la latence propre à chaque plateforme
  (souvent 1 à 3 h). Les connecteurs API certifiés (Beds24, Channex, Smoobu,
  Nobeds) peuvent pousser disponibilités et tarifs ; Beds24 et Channex poussent
  aussi les règles de séjour par date (dont le stop-sell), Smoobu les durées
  min/max. Host Port reste en lecture seule. Le cut-off est configurable par
  logement (0–365 jours) ; il ferme les dates proches dans l’ARI poussé et
  refuse les arrivées trop proches à la réservation directe. Le délai de
  préparation (0–7 jours) ferme les nuits après chaque départ et s’applique aux
  réservations directes. Plusieurs plans
  tarifaires par logement isolent leurs prix et règles ; un plan dérivé applique
  un ajustement aux prix de base et peut hériter des règles. Channex pousse
  chaque plan actif mappé à un `rate_plan_id`.
- Aucun encaissement de carte n’est réalisé par la plateforme ; les paiements
  et cautions sont suivis, pas débités.
- L’envoi d’e-mails dépend de la configuration SMTP et de `EMAIL_ENABLED`.
- La parité des écrans est assurée dans `src/routes/` ; l’ancienne UI Next reste
  conservée à titre de référence jusqu’à sa suppression.
