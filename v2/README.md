# LCD v2 — squelette migration-friendly

Nouvelle base Next.js 16.4 + React 19.3 + TypeScript 6.0.3 (lint) / 7.0.2
(tsc) + Tailwind 4.3 + PostgreSQL 18 + Drizzle. Objectif : remplacer v1 en
fast-track, sans perdre la capacité de migrer plus tard (voir
`docs/78-plan-stack-deploiement.md`).

## Démarrer

```bash
npm ci
cp .env.example .env.local
docker compose -f compose.dev.yml up -d   # Postgres + S3Mock + Mailpit
npm run db:generate
npm run db:migrate
npm run db:seed          # tenant "lcd" + admin@lcd.test
npm run dev
```

Compte de développement créé par le seed :

| Email | Mot de passe | Rôle |
|---|---|---|
| `admin@lcd.test` | `ChangeMe-2026!` | `admin` |
| `presta@lcd.test` | `ChangeMe-2026!` | `presta` |
| `proprio@lcd.test` | `ChangeMe-2026!` | `proprietaire` |
| `commercial@lcd.test` | `ChangeMe-2026!` | `commercial` |

À changer avant tout déploiement. Le seed est idempotent.

## Vérifier

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

E2E (serveur + DB seedés requis) :

```bash
npm run dev
# autre terminal
npm run test:e2e
```

Les tests couvrent : login staff, création d'un logement, prix, planning,
anti-chevauchement, audit, facture + fiscalité auto + Factur-X + statuts +
compta + exports CSV, health/readiness, PWA offline, voyageur signé + incident
**sans JavaScript** + idempotence + outbox, missions staff → prestataire,
propriétaire rattaché + relevé + isolation, CRM prospect + pipeline + offre,
support ticket + réponse + résolution, guide + extra commandé, 320 px.

## Pages

| Route | Rôle |
|---|---|
| `/` | accueil public |
| `/login` | connexion staff |
| `/two-factor` | vérification TOTP |
| `/hote` | tableau de bord (logements, CA, arrivées/départs) |
| `/hote/logements` | logements (création + liste) |
| `/hote/logements/[id]` | guide, WiFi, check-in, règles |
| `/hote/extras` | catalogue extras + commandes |
| `/hote/prix` | prix par jour et par logement |
| `/hote/planning` | réservations + calendrier + anti-chevauchement |
| `/hote/compta` | CA, factures, TVA, taxe, exports |
| `/hote/compta/parametres` | TVA, taxe de séjour, préfixe et mentions légales |
| `/hote/factures` | liste + création de factures |
| `/hote/factures/[id]` | facture imprimable / PDF + statuts + export Factur-X |
| `/hote/missions` | missions staff + assignation prestataire |
| `/hote/proprietaires` | rattachement propriétaire ↔ logement |
| `/hote/securite` | 2FA |
| `/presta` | missions du prestataire + statuts |
| `/proprio` | relevé propriétaire (lecture seule) |
| `/commercial` | pipeline prospects |
| `/commercial/prospects/[id]` | prospect + offres + statuts |
| `/support` | tickets support (staff = tous, autres = les leurs) |
| `/support/[id]` | fil de messages + réponses + statuts |
| `/voyageur?t=<token>` | séjour réel + incident (sans JS) |
| `/offline` | fallback PWA hors ligne |
| `/api/health` | liveness (sans DB) |
| `/api/ready` | readiness (ping DB) |
| `/api/voyageur/incident` | API incident signée + idempotente |
| `/api/exports/reservations` | export CSV des réservations |
| `/api/exports/factures` | export CSV des factures |
| `/api/factures/[id]/factur-x` | export XML CII Factur-X (authentifié) |

## Fiscalité et Factur-X

- `/hote/compta/parametres` : TVA en points de base, taxe de séjour par nuit
  et par personne, plafond facultatif, préfixe de facture, mentions légales ;
- à la création d’une facture, laisser TVA/taxe vides applique les paramètres
  du tenant ; saisir une valeur force le montant (surcharge manuelle) ;
- TVA calculée en centimes entiers (`HT × taux / 10 000`, arrondi au centime) ;
- taxe calculée sur `nuits × voyageurs × tarif`, plafonnée si configuré ;
- numérotation `PREFIXE-AAAA-0001`, préfixe validé (2-8 caractères A-Z/0-9) ;
- export `GET /api/factures/[id]/factur-x` : XML CII EN 16931, réservé aux
  rôles `admin`, `hote`, `comptable`, `Cache-Control: private, no-store` ;
- **préparation** : le PDF/A-3, la signature et la validation par une
  plateforme de dématérialisation ne sont pas encore branchés.

## PWA

- `src/app/manifest.ts` : manifest installable, icônes 192/512/maskable.
- `public/sw.js` : service worker maison, versionné.
- `/offline` : fallback hors ligne.
- `public/icons/` : icônes générées localement (aucun CDN).
- Enregistrement uniquement en production (`PwaRegister`).

Test réel :

```bash
npm run test:e2e   # inclut PWA offline + API jamais cachée
```

Mesure du JS initial :

```bash
npm run dev        # ou npm start
npm run measure:js
```

**Mesure du 2026-10-24 : 178,8 Ko gzip sur `/voyageur` (8 chunks).**
C'est au-dessus du budget voyageur de 50 Ko : la gate G1 est déclenchée.
Le HTML fonctionne toujours sans JS ; la décision « Astro pour le voyageur »
ou « accepter le plancher Next » reste à prendre (voir docs/78 §12).

## Portail voyageur

- lien signé **HMAC-SHA256** par réservation, généré depuis `/hote/planning` ;
- payload : tenant, logement, réservation, expiration ;
- lien valable au moins 60 jours, puis jusqu'à 30 jours après le départ ;
- formulaire d'incident **sans JS** (Server Action) ;
- API `POST /api/voyageur/incident` idempotente par `ref` ;
- **outbox IndexedDB** : hors ligne, l'incident est mis en attente puis rejoué
  au retour du réseau ;
- 2xx = retiré, 4xx = retiré (définitif), 5xx/réseau = conservé ;
- la rotation de `BETTER_AUTH_SECRET` invalide les liens déjà émis.

## Guide et extras voyageur

- guide par logement : heure de check-in, consignes, WiFi, règles, urgence,
  bonnes adresses ;
- catalogue d’extras global ou par logement ;
- commande depuis le lien voyageur signé, quantité 1-20, `ref` idempotente ;
- total calculé en centimes ;
- staff : création d’extras, suivi et statuts des commandes
  (demandée → confirmée/refusée → livrée) ;
- audit `logement.guide`, `extra.creer`, `commande_extra.*`.

## Support

- ticket : sujet, priorité, message initial ;
- fil de messages avec auteur et horodatage ;
- statuts : ouvert → en cours → résolu / fermé ;
- staff (`admin`, `hote`) voit tous les tickets ;
- les autres rôles ne voient que leurs propres tickets ;
- audit `ticket.creer`, `ticket.message`, `ticket.statut`.

## CRM commercial

- pipeline : nouveau, qualifié, visite, offre, gagné, perdu ;
- transitions contrôlées par domaine ;
- offres : brouillon, envoyée, acceptée, refusée ;
- montants en centimes ;
- audit `prospect.*` / `offre.*` ;
- isolation par tenant via RLS.

## Portail propriétaire

- rattachement explicite `logement_proprietaires` ;
- un propriétaire ne voit que ses logements ;
- relevé mensuel : séjours, CA, factures, TTC ;
- lecture seule par construction ;
- commission de mandat et net propriétaire à venir avec le module mandats.

## Observabilité

- `/api/health` : liveness, ne dépend pas de la DB.
- `/api/ready` : readiness, ping PostgreSQL, 503 si la DB est down.
- logs JSON via `src/lib/logger.ts` (ts, niveau, message, contexte).
- pages d'erreur `error.tsx` et `global-error.tsx`.
- à brancher : Sentry, Uptime Kuma, alertes.

## Auth

- **Better Auth 1.7.12**, email/password, TOTP actif.
- Routes : `/login`, `/two-factor`, `/hote/securite`, `/api/auth/[...all]`.
- Enrôlement TOTP : `/hote/securite` (QR code + codes de secours).
- Vérification à la connexion : `/two-factor`.
- Session cookie httpOnly ; le tenant et le rôle viennent de `session.user`.
- `requireRole(["admin","hote"])` protège les pages staff.
- Déconnexion : bouton sur `/hote`.

## Architecture

```text
src/
  domain/           # pur : règles, calendrier, planning, tarifs, factures
  application/
    ports/          # interfaces des dépendances externes
    use-cases/      # orchestration métier
  infrastructure/
    db/             # Drizzle, schéma, auth-schema, repositories
    adapters/       # S3, email, Stripe, queue, LLM, OTA, box
  app/              # Next : routes, RSC, Server Actions
  lib/              # env, auth, session, flags, utils neutres
tests/
  domain/           # tests purs
  application/      # tests avec dépôts mémoire
  migrations/       # à venir : base vide → migrations → smoke
  e2e/              # Playwright (JS on/off, 320 px, offline)
```

**Règle de dépendance** : `domain ← application ← infrastructure ← app`.
Aucun import de Next, Drizzle, Stripe, Brevo ou S3 dans `domain/`.

> **TypeScript 6.0.3, pas 7.0.2, pour l'instant** : Next 16.4.3 accepte TS 7
> pour le build, mais `typescript-eslint` 8.72 (dans `eslint-config-next`
> 16.4.3) refuse TS 7.0. On passera à TS 7 quand le lint le supportera.

## Migrations

- `drizzle/` est versionné et **immuable** après application.
- `npm run db:generate` génère le SQL depuis `src/infrastructure/db/schema.ts`.
- `npm run db:migrate` applique en local/staging/prod.
- `npm run db:check` détecte une dérive schéma/migrations.
- Changements destructifs : expand/contract en deux releases.
- Avant prod : backup + dump + test de restauration.

Le helper `withTenant()` positionne `app.tenant_id` dans la transaction ;
les policies RLS PostgreSQL s'appuient dessus pour `logements`,
`reservations`, `audit_logs` et `idempotency_keys`. Les tables Better Auth
(`users`, `session`, `account`, `verification`, `two_factor`) ne sont pas
sous RLS : la connexion doit retrouver un utilisateur par email avant de
connaître son tenant.

Migrations actuelles :

- `0000_*.sql` : 11 tables (7 métier + 4 Better Auth) ;
- `0001_rls.sql` : policies RLS des tables métier ;
- `0002_*.sql` : tarifs + colonnes réservation ;
- `0003_rls_tarifs.sql` : RLS des tarifs ;
- `0004_*.sql` : factures + lignes de facture ;
- `0005_rls_factures.sql` : RLS des factures ;
- `0006_*.sql` : incidents voyageur ;
- `0007_rls_incidents.sql` : RLS des incidents ;
- `0008_*.sql` : missions prestataire ;
- `0009_rls_missions.sql` : RLS des missions ;
- `0010_*.sql` : rattachement propriétaire ↔ logement ;
- `0011_rls_proprietaires.sql` : RLS des rattachements ;
- `0012_*.sql` : prospects + offres ;
- `0013_rls_commercial.sql` : RLS du CRM ;
- `0014_*.sql` : tickets + messages ;
- `0015_rls_support.sql` : RLS du support ;
- `0016_*.sql` : guide logement + extras + commandes ;
- `0017_rls_extras.sql` : RLS des extras et commandes ;
- `0018_*.sql` : paramètres fiscaux par tenant ;
- `0019_rls_parametres_fiscaux.sql` : RLS des paramètres fiscaux.

Total : **23 tables** (19 métier + 4 Better Auth).

## Ports & adapters

Chaque dépendance externe a une interface dans `src/application/ports/` et
une implémentation dans `src/infrastructure/adapters/` :

| Port | Adapter prévu |
|---|---|
| `AuthProvider` | Better Auth 1.7.12 (+ TOTP) / OIDC |
| `StockageFichiers` | S3 / R2 / S3Mock (dev) |
| `EmailSender` | Brevo / SMTP |
| `Paiement` | Stripe |
| `Queue` | Inngest / QStash / BullMQ |
| `LlmProvider` | OpenAI / Anthropic / local |
| `OtaSource` | API/ICS |
| `RuntimeBox` | HA / Moli HTTP |

## Déploiement

Guide pas à pas : [`DEPLOIEMENT.md`](./DEPLOIEMENT.md).

- **Beta** : Netlify Free (ou Cloudflare) + Neon/Supabase + R2.
- **Premier client** : VPS 4 Go ou Netlify Pro + Postgres managé.
- **Portabilité** : `output: "standalone"` sur Docker/VPS, désactivé quand
  `NETLIFY=true` (plugin Next). Aucune API Netlify dans le code métier.
- Build Netlify validé : `NETLIFY=true npm run build`.
- Variables standard : `DATABASE_URL`, `S3_*`, `SMTP_URL`,
  `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BETTER_AUTH_TRUSTED_ORIGINS`,
  `STRIPE_*`, `SENTRY_DSN`.

## Règles non négociables

1. Les routes voyageur fonctionnent **sans JS**.
2. Les écritures sont idempotentes (`ref`).
3. `tenant_id` vient de la session, jamais du client.
4. Aucun secret dans Git.
5. Toute nouvelle brique a un port, un adapter, un test et un plan de retrait.
