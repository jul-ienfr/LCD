# LCD v2 — squelette migration-friendly

Nouvelle base Next.js 16.4 + React 19.3 + TypeScript 6.0.3 (lint) / 7.0.2
(tsc) + Tailwind 4.3 + PostgreSQL 18 + Drizzle + Better Auth + SMTP
(nodemailer) + PDF (pdf-lib). Objectif : remplacer v1 en fast-track, sans
perdre la capacité de migrer plus tard (voir `docs/78-plan-stack-deploiement.md`).

## Déploiement beta

- URL : <https://lcd-parc.netlify.app>
- Netlify Free + Netlify Database (Postgres managé, `us-east-2`) ;
- `/api/health` et `/api/ready` verts ;
- email désactivé (`EMAIL_ENABLED=false`) tant qu'aucun SMTP de production
  n'est configuré ;
- variables d'environnement non secrètes sur le plan Free, base hors UE,
  backups/Sentry/Uptime à ajouter ;
- **alternative VPS prête** : `compose.prod.yml` + `Caddyfile` + Dockerfile
  multi-stage + sauvegardes ; voir `v2/DEPLOIEMENT-VPS.md` ;
- procédure et limites : `v2/DEPLOIEMENT.md`.

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
anti-chevauchement, audit, facture + fiscalité auto + Factur-X XML + PDF +
paiements + facture publique + email (si Mailpit) + statuts + compta + exports
CSV, health/readiness, PWA offline, import ICS + blocages + idempotence +
conflit + flux HTTPS, Stripe (gating sans clés + tests unitaires), webhooks
signés + outbox, cautions + retenues, voyageur signé + incident **sans
JavaScript** + idempotence + outbox + i18n FR/EN, missions staff → prestataire,
propriétaire rattaché + commission + relevé + isolation, CRM prospect +
pipeline + offre, support ticket + réponse + résolution, guide + extra
commandé, comptes utilisateurs (création, connexion, réinitialisation,
désactivation), 2FA TOTP (activation, connexion, désactivation), 320 px.

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
| `/hote/planning/import` | import ICS OTA + blocages + conflits |
| `/hote/cautions` | dépôts de garantie + retenues |
| `/hote/compta` | CA, factures, TVA, taxe, paiements, exports |
| `/hote/compta/parametres` | TVA, taxe de séjour, préfixe et mentions légales |
| `/hote/factures` | liste + création de factures |
| `/hote/factures/[id]` | facture imprimable / PDF + statuts + paiements + Factur-X |
| `/hote/missions` | missions staff + assignation prestataire |
| `/hote/proprietaires` | rattachement propriétaire ↔ logement + commission |
| `/hote/integrations` | webhooks HA/Moli + livraisons |
| `/hote/securite` | 2FA |
| `/hote/utilisateurs` | comptes de l’équipe (admin) |
| `/presta` | missions du prestataire + statuts |
| `/proprio` | relevé propriétaire (lecture seule) |
| `/commercial` | pipeline prospects |
| `/commercial/prospects/[id]` | prospect + offres + statuts |
| `/support` | tickets support (staff = tous, autres = les leurs) |
| `/support/[id]` | fil de messages + réponses + statuts |
| `/facture/[token]` | facture publique signée, sans compte |
| `/voyageur?t=<token>` | séjour réel + incident (sans JS) |
| `/offline` | fallback PWA hors ligne |
| `/api/health` | liveness (sans DB) |
| `/api/ready` | readiness (ping DB) |
| `/api/voyageur/incident` | API incident signée + idempotente |
| `/api/exports/reservations` | export CSV des réservations |
| `/api/exports/factures` | export CSV des factures |
| `/api/exports/paiements` | export CSV des paiements |
| `/api/factures/[id]/factur-x` | export XML CII Factur-X (authentifié) |
| `/api/factures/[id]/pdf` | PDF facture + XML Factur-X incorporé |
| `/api/stripe/webhook` | webhook Stripe Checkout signé |
| `/api/cron/sync-ota` | synchronisation cron des flux ICS (`CRON_SECRET`) |
| `/api/cron/webhooks` | livraison cron des webhooks (`CRON_SECRET`) |

## Partage client et email

- lien signé HMAC par facture, valable 90 jours, page `/facture/[token]` ;
- page publique sans compte, sans JavaScript, responsive 320 px ;
- le lien n'est généré que pour une facture `emise` ou `payee` ;
- envoi email depuis la fiche facture, avec adresse pré-remplie si connue ;
- adapter SMTP (`nodemailer`) : Mailpit en dev (`smtp://127.0.0.1:1025`),
  Brevo/OVH/Scaleway en production via `SMTP_URL` + `EMAIL_FROM` ;
- audit `facture.email` ;
- la rotation de `BETTER_AUTH_SECRET` invalide les liens déjà émis.

## Paiements en ligne Stripe

- bouton « Payer en ligne » sur la facture publique quand la facture est
  `emise` et qu’il reste un solde ;
- Stripe Checkout Session créée côté serveur (`STRIPE_SECRET_KEY`) ;
- retour sur la facture publique `?paiement=ok|annule|erreur` ;
- webhook `POST /api/stripe/webhook` : signature `stripe-signature` vérifiée
  en HMAC SHA-256, tolérance 5 minutes ;
- `checkout.session.completed` → paiement `cb` idempotent (`ref` dérivée de
  la session), facture soldée automatiquement ;
- désactivé automatiquement si `STRIPE_SECRET_KEY` ou
  `STRIPE_WEBHOOK_SECRET` manque ;
- audit `paiement.stripe` ;
- mode test/live à choisir dans Stripe ; aucune carte n’est stockée.

## Cautions

- une caution par réservation, montant en centimes ;
- cycle : `attendue` → `recue` → `restituee` ou `retenue` ;
- retenue partielle avec montant et motif obligatoires ;
- page `/hote/cautions` : création, réception, restitution, retenue ;
- audit `caution.creer` / `caution.statut` ;
- la caution ne modifie pas le CA et reste distincte de la taxe de séjour.

## Paiements

- modes : virement, espèces, chèque, carte bancaire, autre ;
- montant en centimes, date, référence libre et notes ;
- écriture idempotente par `ref` (UUID généré par le formulaire) ;
- surpaiement refusé : le montant ne peut pas dépasser le reste à payer ;
- paiement partiel : la facture reste `emise` avec un reste affiché ;
- solde atteint : la facture passe automatiquement en `payee` ;
- une facture en brouillon ou annulée ne peut pas être encaissée ;
- compta : total encaissé du mois, liste des paiements, export CSV ;
- audit `paiement.creer`.

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
- export `GET /api/factures/[id]/pdf` : PDF facture (lignes, totaux, paiements)
  avec le XML Factur-X en pièce jointe ; accessible avec session staff ou
  token public `?t=…` ;
- **préparation** : le PDF n'est pas encore PDF/A-3 signé ; la validation par
  une plateforme de dématérialisation reste à faire.

## Intégrations HA/Moli

- page `/hote/integrations` : webhooks HTTPS signés HMAC-SHA256 ;
- événements : `reservation.created`, `paiement.created`, `mission.status`,
  `ticket.created` ;
- en-têtes `X-LCD-Event`, `X-LCD-Delivery`, `X-LCD-Signature: sha256=…` ;
- outbox persistée : livraison immédiate par cron horaire
  `POST /api/cron/webhooks` (`CRON_SECRET`), 5 essais avec backoff
  (1, 5, 15, 60 min) ;
- page de suivi des livraisons (statut, essais, code HTTP, message) ;
- URL validée (HTTPS public, localhost/IP privées refusés), secret ≥ 16
  caractères ;
- audit `webhook.enregistrer` / `webhook.supprimer` ;
- workflow `.github/workflows/v2-webhooks.yml`.

## PWA

- `src/app/manifest.ts` : manifest installable, icônes 192/512/maskable.
- `public/sw.js` : service worker maison, versionné.
- `/offline` : fallback hors ligne.
- `public/icons/` : icônes générées localement (aucun CDN).
- Enregistrement uniquement en production (`PwaRegister`).
- Jamais mis en cache : `/hote`, `/login`, `/two-factor`, `/api/`,
  `/presta`, `/proprio`, `/commercial`, `/support` et `/facture/*` ;
  seules les pages publiques et voyageur sont mises en cache.
- `public/robots.txt` + en-tête `X-Robots-Tag` : pages privées et liens
  signés en `noindex, nofollow, noarchive`.

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
C'est au-dessus du budget voyageur de 50 Ko. **Décision G1 (2026-10-25)** :
Next est conservé pour la beta ; le HTML fonctionne sans JS, la PWA/offline est
intégrée, et un découpage Astro ajouterait une deuxième base de code. La cible
< 50 Ko reste l'objectif d'une surface voyageur séparée en v2.1, à réévaluer
après les premiers clients ou si le LCP mobile se dégrade.

## Import OTA / ICS

- page `/hote/planning/import` : coller un flux ICS ou déposer un fichier ;
- flux HTTPS enregistrés par logement (libellé + URL), URL validée
  (HTTPS public, localhost/IP privées refusés) ;
- synchronisation à la demande depuis la page, ou quotidienne via
  `POST /api/cron/sync-ota` protégé par `CRON_SECRET` ;
- workflow GitHub Actions `.github/workflows/v2-sync-ota.yml` (03:00 UTC) :
  secret `CRON_SECRET` à configurer dans le dépôt ;
- parseur iCal pur : lignes pliées, dates `VALUE=DATE` ou date-time,
  `DURATION`, échappements, annulations ignorées ;
- réservations importées en `confirmee`, source `import-ics` ;
- événements « Not available / Blocked / Closed » importés en **blocages**
  (table `blocages`), sans impact sur le CA ;
- idempotence par UID OTA → `ref` stable `ics-…` ;
- conflit avec une réservation ou un blocage existant : signalé, non importé ;
- montant récupéré si `Total: 450` figure dans la description, sinon 0 ;
- audit `planning.import_ics`, `flux_ics.enregistrer`, `flux_ics.sync`,
  `flux_ics.supprimer`.

## Portail voyageur

- lien signé **HMAC-SHA256** par réservation, généré depuis `/hote/planning` ;
- payload : tenant, logement, réservation, expiration ;
- lien valable au moins 60 jours, puis jusqu'à 30 jours après le départ ;
- formulaire d'incident **sans JS** (Server Action) ;
- **i18n voyageur** : `?lang=fr|en|it|es|de`, sélecteur sans JS, fallback
  français, dictionnaires `src/lib/i18n.ts` ; les redirections conservent la
  langue ;
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
- relevé mensuel : séjours, CA, commission, net propriétaire, TTC ;
- commission de mandat par logement (0 à 50 %, 20 % par défaut), calculée sur
  le CA réservations hors taxe de séjour ; net = CA − commission ;
- lecture seule par construction ;
- audit `proprietaire.assigner` / `proprietaire.retirer`.

## Observabilité

- `/api/health` : liveness, ne dépend pas de la DB.
- `/api/ready` : readiness, ping PostgreSQL, 503 si la DB est down.
- logs JSON via `src/lib/logger.ts` (ts, niveau, message, contexte).
- **Sentry sans SDK** : `SENTRY_DSN` → erreurs serveur et erreurs client
  (`POST /api/telemetry`), secrets masqués, timeout 3 s, no-op sans DSN.
- **Uptime Kuma** : `compose.monitoring.yml`, monitors `/api/health`,
  `/api/ready`, `/login` ; guide `v2/MONITORING.md`.
- pages d'erreur `error.tsx` et `global-error.tsx`.

## Sauvegardes

- `npm run db:backup` : dump gzip + checksum SHA-256, rétention 14 jours ;
- `npm run db:restore-test` : restauration dans une base jetable + contrôle
  des comptes tenants/users/logements/réservations/factures/paiements/blocages ;
- workflow GitHub Actions quotidien `.github/workflows/v2-backup.yml`
  (artefact privé 30 jours) ; secret `DATABASE_URL` à configurer ;
- procédure, variables et drill mensuel : `v2/BACKUPS.md`.

## Gestion des utilisateurs

- page `/hote/utilisateurs`, réservée au rôle **admin** ;
- création directe d’un compte email/password avec rôle :
  `admin`, `hote`, `comptable`, `presta`, `proprietaire`, `commercial` ;
- mot de passe provisoire de 12 à 128 caractères, jamais journalisé ;
- réinitialisation du mot de passe par un admin : toutes les sessions de la
  personne sont fermées ;
- désactivation : sessions supprimées immédiatement et connexion refusée
  (`databaseHooks.session.create.before` vérifie `users.actif`) ;
- garde-fous : impossible de désactiver son propre compte ou le dernier
  administrateur actif ;
- audit `utilisateur.creer`, `utilisateur.activer`,
  `utilisateur.desactiver`, `utilisateur.motdepasse` ;
- email unique au niveau plateforme, normalisé en minuscules.

## Auth

- **Better Auth 1.7.12**, email/password, TOTP actif.
- Routes : `/login`, `/two-factor`, `/hote/securite`, `/api/auth/[...all]`.
- Enrôlement TOTP : `/hote/securite` (QR code + codes de secours).
- Vérification à la connexion : `/two-factor`.
- Session cookie httpOnly ; le tenant et le rôle viennent de `session.user`.
- `requireRole(["admin","hote"])` protège les pages staff.
- Changement de mot de passe sur `/hote/securite` (12 caractères minimum,
  révoque les autres sessions).
- Gestion des comptes sur `/hote/utilisateurs` (admin) : création, rôles,
  réinitialisation, désactivation ; un compte désactivé ne peut plus ouvrir
  de session.
- La connexion fait une **navigation complète** après sign-in (cookie de
  session appliqué par le serveur) ; le service worker ignore les requêtes
  RSC de Next.js.
- Si la connexion semble bloquée : `Ctrl+F5`, puis DevTools → Application →
  Service Workers → *Unregister*, et réessayer. La connexion staff nécessite
  JavaScript ; l’espace voyageur, non.
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
- `0019_rls_parametres_fiscaux.sql` : RLS des paramètres fiscaux ;
- `0020_*.sql` : paiements ;
- `0021_rls_paiements.sql` : RLS des paiements ;
- `0022_*.sql` : blocages calendrier OTA ;
- `0023_rls_blocages.sql` : RLS des blocages ;
- `0024_*.sql` : flux ICS OTA par logement ;
- `0025_rls_flux_ics.sql` : RLS des flux ICS ;
- `0026_*.sql` : commission de mandat sur les rattachements ;
- `0027_*.sql` : webhooks + livraisons ;
- `0028_rls_webhooks.sql` : RLS des webhooks ;
- `0029_*.sql` : cautions / dépôts de garantie ;
- `0030_rls_cautions.sql` : RLS des cautions.

Total : **29 tables** (25 métier + 4 Better Auth).

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
