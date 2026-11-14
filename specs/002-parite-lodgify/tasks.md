# Tasks: Parité fonctionnelle Lodgify — intégration LCD V2

```text
Statut : ACTIF
Propriétaire : produit
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/002-parite-lodgify/spec.md
```

**Input**: `specs/002-parite-lodgify/spec.md`, `plan.md`, `research.md`,
`data-model.md`, `contracts/`

**Tests**: obligatoires (constitution IV). Chaque tâche de code inclut son test
ou est suivie d'une tâche de test explicite.

**Organisation**: par histoire utilisateur, dans l'ordre de livraison. Les
tâches `[P]` touchent des fichiers différents et peuvent tourner en parallèle.

## Phase 1 — Setup et décisions (L0)

**But**: trancher les partenariats et préparer le socle, avant toute
implémentation.

- [ ] T001 [P] Benchmark sandbox Beds24 : ARI, booking, webhook, messaging, white-label, coût 1/10/30 logements ; remplir `docs/decisions/benchmark-grille.md` §1
- [ ] T002 [P] Benchmark sandbox Channex : mêmes critères, coût plateforme, dans `docs/decisions/benchmark-grille.md` §1
- [ ] T003 [P] Test API PriceLabs : auth, recommandations 18 mois, facteurs, coût, dans `docs/decisions/benchmark-grille.md` §3
- [ ] T004 [P] Test API Beyond : mêmes critères, dans `docs/decisions/benchmark-grille.md` §3
- [ ] T005 [P] Avis juridique/comptable paiement : tenant marchand vs Connect, TVA, caution, dans `docs/decisions/ADR-02-paiement.md`
- [ ] T006 [P] ADR-01 fournisseur distribution : compléter et signer `docs/decisions/ADR-01-fournisseur-distribution.md`
- [ ] T007 [P] ADR-03 pricing : compléter et signer `docs/decisions/ADR-03-pricing.md`
- [ ] T008 [P] ADR-04 site : compléter et signer `docs/decisions/ADR-04-site-public.md`
- [ ] T009 [P] ADR-05 messagerie : compléter et signer `docs/decisions/ADR-05-messagerie.md`
- [ ] T010 Figer le budget partenaire et le plafond de refacturation dans `docs/decisions/BUDGET-PARTENAIRES-2026-11.md`
- [x] T011 Créer les flags tenant `distribution`, `site_paiement`, `inbox`, `pricing`, `reporting`, `api`, `integrations` dans `v2/src/lib/server/feature-flags.ts` — fait 2026-11-09 (4 tests)
- [x] T012 Documenter la convention de migration expand/backfill/contract dans `v2/drizzle/README.md` — fait 2026-11-09

**Gate L0**: 5 ADR signés, fournisseur pilote choisi, budget plafonné. Aucune
ligne de code métier avant.

---

## Phase 2 — Fondations partagées

**But**: socle commun à toutes les histoires.

- [x] T020 [P] Ajouter les helpers d'idempotence `cleIdempotence()` et `hashPayload()` dans `v2/src/domain/idempotence.ts` + tests — fait 2026-11-09 (12 tests)
- [x] T021 [P] Ajouter le journal structuré `logger.ts` avec `tenantId`, `requestId`, `canal` dans `v2/src/lib/server/logger.ts` — fait 2026-11-09
- [x] T022 [P] Ajouter les métriques sync/webhook/messages dans `v2/src/lib/server/metriques.ts` — fait 2026-11-09
- [x] T023 [P] Ajouter le chiffrement applicatif des identifiants partenaires dans `v2/src/lib/server/chiffrement.ts` + tests — fait 2026-11-09 (10 tests)
- [x] T024 [P] Ajouter le rate limiter générique dans `v2/src/lib/server/rate-limit.ts` + tests — fait 2026-11-09 (8 tests)
- [x] T025 Étendre `withTenant()` et les tests RLS aux nouvelles tables — fait 2026-11-09 (`verifier-rls.mjs` couvre déjà toutes les tables nouvelles : evenements_canal, sites_tenants, echeances_paiement, fils_voyageur, recommandations_prix, demandes_sejour)
- [x] T026 [P] Ajouter le harnais de contrat sandbox dans `v2/tests/contract/harnais.ts` — fait 2026-11-09
- [x] T027 [P] Ajouter le test de budget JS dans `v2/tests/budget-js.test.ts` — fait 2026-11-09 (4 tests)
- [x] T028 [P] Ajouter le test de rendu sans JS générique dans `v2/e2e/sans-js.spec.ts` — fait 2026-11-09 (6 tests e2e)

**Checkpoint**: les fondations sont vertes, les flags existent, les tests
tournent.

---

## Phase 3 — US1 Distribution temps réel (P1) 🎯 MVP

**Goal**: connecter un logement, pousser ARI, importer les réservations,
réconcilier, alerter.

**Independent Test**: réservation sandbox → planning en < 5 min ; annulation →
nuits libérées ; 14 jours sans surbooking.

> **Constat 2026-11-06 — le socle existe déjà.** `beds24.ts`, `channex.ts`,
> `smoobu.ts`, `hostport.ts`, `nobeds.ts`, le webhook signé
> `/api/fournisseurs/[code]/webhook`, `demandes_sync` + `fournisseur-outbox.ts`,
> `PlanificateurSync`, `fournisseur-scheduler.ts`, le verrou distribué, la
> santé et l'empreinte SHA-256 sont en place. Les tâches ci-dessous sont un
> **audit d'écart et une extension**, pas une reconstruction. Ne pas recréer
> d'outbox parallèle.

### Domaine et port

- [x] T099 [US1] Audit runtime du socle existant (santé, tests, webhook, scheduler) et mise à jour de `docs/analyses/AUDIT-L1-EXISTANT.md` — fait 2026-11-06 (build servi, `/api/ready` rls=ok, crons GET/POST + 401, fail-closed prod)
- [x] T100 [P] [US1] Étendre `CapacitesFournisseur` (messaging, multiUnite, googleVr) dans `v2/src/domain/fournisseur.ts` + tests — fait 2026-11-09 (catalogue 5 fournisseurs + test charge mis à jour)
- [x] T101 [P] [US1] Ajouter `SanteConnexion` et `EvenementCanal` dans `v2/src/domain/canal.ts` + tests — fait 2026-11-09 (3 tests ; `EvenementCanal` existait déjà)
- [x] T102 [US1] Étendre `FournisseurCanal` (`lireSante`, `lireMessages`, `envoyerMessage`) dans `v2/src/application/ports/fournisseur-canal.ts` — fait 2026-11-09 (méthodes optionnelles, non-breaking pour les 5 adapters)
- [x] T103 [P] [US1] Étendre `FournisseurRepository` existant (mapping, santé, activation) dans `v2/src/application/ports/fournisseur-repository.ts` — fait 2026-11-09 (`lireSanteAffectation` optionnel)
- [x] T104 [P] [US1] Ajouter `EvenementCanalRepository` dans `v2/src/application/ports/evenement-canal-repository.ts` — fait 2026-11-06

### Migration et repositories

- [x] T105 [US1] Migration expand : colonnes santé sur `logements_fournisseurs`, table `evenements_canal` dans `v2/drizzle/` — fait 2026-11-06 (0085 + RLS)
- [x] T106 [US1] Étendre le repository Drizzle `fournisseur-repository.ts` + créer `evenement-canal-repository.ts`, avec RLS — fait 2026-11-06
- [x] T107 [P] [US1] Vérifier RLS de `evenements_canal` via `npm run db:test-rls` (script `verifier-rls.mjs` étendu) — fait 2026-11-06 (isolation insert/select validée)
- [x] T108 [US1] Vérifier/backfiller les mappings `logements_fournisseurs` existants, sans dupliquer `canaux` (script idempotent) — fait 2026-11-06 (`db:test-mappings` ; 0 mapping local, à rejouer en prod)

### Adapter Beds24/Channex

- [x] T109 [US1] Étendre l'adapter `beds24` existant (santé, erreurs, rate limit) dans `v2/src/infrastructure/adapters/fournisseurs/beds24.ts` — fait 2026-11-09 (rate limiter 600/min anti-burst, reessais:2 avec backoff, classification 409/429/5xx dans http.ts ; messaging NON implémenté : `capacites.messaging=false` tant que non prouvé en sandbox, cf. ADR-01)
- [~] T110 [US1] Compléter `pousserDisponibilites`, `pousserTarifs`, `pousserRestrictions` par différence + batch — fait 2026-11-10 : batch/groupement existants + diff ARI (`src/domain/ari-diff.ts`, 5 tests) ; l'adaptateur Beds24 lit le calendrier distant (`lireDisponibilites`/`lireTarifs`/`lireRestrictions`, test adapter) et le cas d'usage ne pousse que les jours modifiés, avec repli sur l'état complet si la lecture distante échoue ; 1 test de delta. RESTE : preuve sur compte sandbox (T113).
- [x] T111 [US1] Compléter `recupererReservations` + normalisation — fait 2026-11-09 (pagination 20 pages, 6 statuts, normalisation dates/montants/client, retry ajouté)
- [x] T112 [US1] Vérifier `verifierWebhook` existant et ajouter `lireSante` à l'adapter — fait 2026-11-09 (`verifierWebhook` timing-safe confirmé ; `lireSante()` sonde `authentication/details`, retourne toujours une santé, jamais d'exception)
- [ ] T113 [P] [US1] Tests de contrat sandbox ARI dans `v2/tests/contract/beds24-ari.test.ts` — BLOQUÉ : clés sandbox Beds24 requises (harnais `tests/contract/harnais.ts` prêt, skip automatique sans clés)
- [ ] T114 [P] [US1] Tests de contrat sandbox booking/webhook dans `v2/tests/contract/beds24-booking.test.ts` — BLOQUÉ : idem T113
- [x] T115 [US1] Tests 409/429/timeout et backoff dans `v2/tests/infrastructure/beds24-erreurs.test.ts` — fait 2026-11-09 (10 tests : retry 429/5xx/timeout, non-rejeu 409/400, backoff exponentiel plafonné, résilience lireSante)

### Use cases

- [x] T116 [US1] Étendre `affecter-fournisseur` avec test de connexion, santé et activation dans `v2/src/application/use-cases/affecter-fournisseur.ts` + test — fait 2026-11-09 (factory optionnelle, 9 tests : connexion ok/erreur/exception/legacy/null)
- [x] T117 [US1] Vérifier/étendre `SynchroniserFournisseur` (empreinte, `force` webhook, push complet) — pas d'outbox par opération — fait 2026-11-09 (déjà complet : empreinte SHA-256, `force`, push complet par code, plans tarifaires Channex, batch ; aucune extension requise)
- [x] T118 [US1] Étendre `ImporterReservationsFournisseur` (webhook, anti-écho, conflits) — fait 2026-11-09 (déjà complet : anti-écho `contenuIdentique`, conflits chevauchement, statut source, création idempotente avec rattrapage 23505 ; aucune extension requise)
- [x] T119 [US1] `reconcilierCanal()` : pull de sécurité, comparaison, alerte dans `v2/src/application/use-cases/reconcilier-canal.ts` + test — fait 2026-11-06 (use case + cron `/api/cron/reconcile-fournisseurs`)
- [x] T120 [US1] Vérifier/étendre le scheduler existant `v2/src/lib/server/fournisseur-scheduler.ts` avec la réconciliation + test — fait 2026-11-06 (timer 24 h séparé, verrou partagé, couvert par les tests reconciliation)
- [x] T121 [US1] Vérifier/étendre le webhook existant `/api/fournisseurs/[code]/webhook` (signature, 200 rapide, file) dans `v2/src/routes/api/fournisseurs/[code]/webhook/+server.ts` — fait 2026-11-06 (202 + `demandes_sync`, journal `evenements_canal`, plus de sync inline)
- [x] T122 [US1] Anti-écho : ignorer un événement issu de notre propre push dans `importer-reservations-fournisseur.ts` + test — fait 2026-11-06 (comparaison `contenuIdentique` + test d'idempotence ; les adapters n'exposent pas encore d'origine)

### UI

- [x] T123 [US1] Étendre l'écran santé existant `/supervision/fournisseurs` et la vue tenant `/hote/planning/canaux` (dernier push/pull, erreurs) — fait 2026-11-06 (déjà présent : dernière sync, statut, message, santé)
- [x] T124 [US1] Bouton « resynchroniser » + confirmation + audit — fait 2026-11-06 (confirmation ajoutée, action auditée existante)
- [x] T125 [US1] Alerte si dernier pull > 15 min dans le centre de notifications — fait 2026-11-06 (section « Centre de notifications » sur `/supervision/fournisseurs` : erreur, jamais, retard > 15 min)
- [ ] T126 [US1] Test e2e connexion + réservation sandbox dans `v2/e2e/canaux-temps-reel.spec.ts`
- [x] T129 [US1] Frais par canal (animaux, ménage, service) + mapping des politiques d'annulation + tests — fait 2026-11-09 (34 tests : validation frais, calcul fixe/par_nuit/pourcentage, total par canal, 4 politiques annulation, résolution par canal/priorité)

### Gate US1

- [ ] T127 [US1] Double-run iCal + API 14 jours, 0 surbooking, documenté dans `docs/runbooks/distribution-temps-reel.md`
- [x] T128 [US1] `check`, Vitest, build, `db:check`, `db:test-rls` verts — fait 2026-11-06 (783 tests, build OK, RLS OK)

---

## Phase 4 — US2 Site direct et paiement (P1) 🎯 MVP

**Goal**: publier un site, réserver, payer un acompte, gérer l'échéancier et la
caution.

**Independent Test**: site de test sur domaine de test, réservation payée carte
test, confirmation, planning, échéancier, caution.

### Site

- [x] T200 [P] [US2] Domaine `page-publique.ts` (types, validation) dans `v2/src/domain/page-publique.ts` + tests — fait 2026-11-06 (15 tests)
- [x] T201 [P] [US2] Ports `SitesTenantsRepository`, `PagesSiteRepository`, `DomainesRepository` dans `v2/src/application/ports/` — fait 2026-11-06
- [x] T202 [US2] Migration `sites_tenants`, `pages_site`, `sections_site`, `domaines`, `promotions` — fait 2026-11-06 (`0086`, RLS + grants)
- [x] T203 [US2] Repositories Drizzle + RLS + tests — fait 2026-11-06 (RLS 5 tables validée sur base réelle)
- [x] T204 [US2] Use case `publierSite()` : validation, SEO, statut dans `v2/src/application/use-cases/publier-site.ts` + test — fait 2026-11-06 (5 tests)
- [x] T205 [P] [US2] Templates `sejour`, `ocean`, `sable` dans `v2/src/lib/site/templates/` — fait 2026-11-06
- [x] T206 [P] [US2] Blocs hero/galerie/description/équipements/carte/avis/CTA dans `v2/src/lib/site/blocs/` — fait 2026-11-06
- [x] T207 [US2] Rendu `/site/[slug]/[[page]]` avec `csr = false` dans `v2/src/routes/site/[slug]/` — fait 2026-11-06
- [x] T208 [US2] SEO : title/meta/OG/JSON-LD/sitemap/hreflang dans `v2/src/routes/site/[slug]/+page.server.ts` — fait 2026-11-06
- [~] T209 [US2] Domaines : vérification DNS, statut, activation — routage applicatif fait 2026-11-10 (`src/hooks.ts` + `/api/domaine` : un domaine actif sert `/site/<slug>` à la racine via `reroute`, sans réécrire l’API ni les routes applicatives ; fonction SQL `domaine_public_par_hote` SECURITY DEFINER, cache 60 s ; e2e hôte `demo-e2e.localhost`). RESTE : TLS et redirection canonique par le proxy d’hébergement, et domaine réellement délégué.
- [x] T210 [US2] Widget : `/api/widget` + `widget.js` + iframe dans `v2/static/widget.js` — fait 2026-11-06 (e2e sans JS vert)
- [x] T211 [US2] Six langues : nl + dictionnaires site dans `v2/src/lib/i18n-site.ts` — fait 2026-11-06
- [x] T212 [US2] Test e2e site public sans JS dans `v2/e2e/site-public.spec.ts` — fait 2026-11-06 (3 tests verts)

### Paiement

- [x] T213 [P] [US2] Domaine `echeancier.ts` : acompte, solde, caution, remboursement + tests — fait 2026-11-06 (15 tests)
- [x] T214 [P] [US2] Étendre le port `Paiement` (empreinte, capture, remboursement) — fait 2026-11-06
- [x] T215 [US2] Migration `echeances_paiement` + colonnes `paiements` (dont `facture_id` nullable) et `cautions` — fait 2026-11-06 (0087, RLS)
- [x] T216 [US2] Étendre l'adapter Stripe : Checkout réservation, PaymentIntent manuel, refund — fait 2026-11-06 (5 tests)
- [x] T217 [US2] Use case `reserverDirect()` : calcul total, taxe, promo, échéancier dans `v2/src/application/use-cases/reserver-direct.ts` — fait 2026-11-06 (4 tests)
- [x] T218 [US2] Use case `payerEcheance()` + webhook idempotent dans `v2/src/application/use-cases/payer-echeance.ts` — fait 2026-11-06 (branche `echeance_id`, rejeu sans double paiement)
- [x] T219 [US2] Use case `gererCaution()` : empreinte, capture, libération dans `v2/src/application/use-cases/gerer-caution.ts` — fait 2026-11-06 (6 tests)
- [x] T220 [US2] Job de solde J-30 + relances dans `v2/src/lib/server/planificateur-paiement.ts` — fait 2026-11-06 (sélection pure testée)
- [x] T221 [US2] Promotions : early bird, last minute, code, séjour long + application serveur — fait 2026-11-07 (`creer-promotion.ts`, écran `/hote/promotions`, application dans `reserverDirect`, 4 tests) 
- [x] T222 [US2] Prix par personne dans le calcul de total — fait 2026-11-07 (migration 0088 `tarifs.personnes_incluses` + `prix_par_personne_centimes`, `devisDirect(..., { voyageurs })`, formulaires `/hote/prix`)
- [x] T223 [US2] Confirmation + facture + lien de gestion dans `v2/src/lib/server/email-reservation.ts` — fait 2026-11-06 (4 tests)
- [x] T224 [US2] Remboursement/annulation + recalcul dans `v2/src/application/use-cases/annuler-reservation.ts` — fait 2026-11-06 (4 tests)
- [x] T225 [US2] UTM + widget + code tracés dans `reservations.source` — fait 2026-11-06 (domaine `attribution.ts` + formulaires + widget)
- [x] T226 [US2] Relance panier abandonné (optionnelle, flag) — fait 2026-11-06 (`PANIER_RELANCE_ENABLED`, cron `/api/cron/relances-sejour`, 5 tests)
- [x] T227 [P] [US2] Tests paiement (succès, échec, rejeu, remboursement) dans `v2/tests/infrastructure/paiement-reservation.test.ts` — fait 2026-11-06
- [x] T228 [US2] Test e2e réservation + paiement test dans `v2/e2e/reservation-directe-paiement.spec.ts` — fait 2026-11-06 (4 tests sans JS)
- [x] T230 [US2] Pipeline de demande (enquiry) : qualification, conversion, test (optionnel, flag) — fait 2026-11-08 (flag `ENQUIRY_ENABLED`, migration 0089 `demandes_sejour` + RLS, formulaire public sans JS, écran `/hote/demandes`, conversion sans ressaisie, 8 tests unitaires + 5 e2e)

### Gate US2

- [ ] T229 [US2] 1 réservation payée de bout en bout, 0 double réservation, site publié sur domaine de test — BLOQUÉ : exige des clés Stripe de test (`STRIPE_SECRET_KEY`) et un domaine de test réel résolu par le proxy. Le code est prêt (checkout, webhook idempotent, page voyageur) et couvert par 4 tests e2e sans Stripe ; seule la preuve de paiement réel manque.

---

## Phase 5 — US3 Inbox unifiée (P1) 🎯 MVP

**Goal**: un fil par voyageur, tous canaux, automatisations en brouillon, IA.

**Independent Test**: message OTA + email dans le même fil ; scénario J-1 crée
un brouillon ; validation envoie et audite.

### Modèle

- [x] T300 [P] [US3] Domaine `fil-voyageur.ts` (regroupement, consentement) + tests — fait 2026-11-09 (`v2/src/domain/fil-voyageur.ts`, 6 tests)
- [x] T301 [P] [US3] Ports `FilsVoyageurRepository`, `AutomatisationsRepository` — fait 2026-11-09 (+ `canal-message-port.ts`)
- [x] T302 [US3] Migration `fils_voyageur`, `pieces_jointes_message`, `automatisations`, `executions_automatisation` — fait 2026-11-09 (`v2/drizzle/0090_fils_voyageur_messagerie.sql`, + `0091_fils_voyageur_assignation.sql` pour l'assignation)
- [x] T303 [US3] Migration additive `messages_voyageur` (`fil_id`, `canal`, `external_id`, `pieces_jointes`) — fait 2026-11-09 (colonnes `fil_id`, `sens`, `external_id`, `expediteur`, `lu_at`, FK + index partiels ; pièces jointes dans leur propre table)
- [x] T304 [US3] Backfill : un fil par contact existant, messages rattachés — fait 2026-11-09 (`0090` traitait le cas réservation, inopérant sur les données réelles ; `v2/drizzle/0092_backfill_fils_voyageur.sql` regroupe par contact e-mail, sinon par logement). Mesuré sur la base locale : 264 messages, 0 orphelin, 248 fils (113 avec e-mail, 135 par logement)
- [x] T305 [US3] Repositories Drizzle + RLS + tests — fait 2026-11-09 (`fils-voyageur-repository.ts`, `automatisations-repository.ts`, blocs d'isolation dans `v2/scripts/verifier-rls.mjs`)

### Connecteurs

- [ ] T306 [US3] Connecteur OTA (si messaging exposé) : réception + envoi — BLOQUÉ : aucune API messaging OTA accessible sans compte partenaire (dépend du jalon L0) ; la table et le canal `ota` existent, l'envoi lève `CANAL_INDISPONIBLE`.
- [~] T307 [US3] Connecteur email IMAP/SMTP : parsing, In-Reply-To, pièces jointes — 2026-11-10 : sortie SMTP opérationnelle et **entrée par webhook e-mail signé** (`POST /api/email/entrant`, HMAC-SHA256, adresse `reponses+<slug>@EMAIL_INBOUND_DOMAIN`, texte uniquement, HTML ignoré, pièces jointes base64 filtrées 8 Mo/8 pièces, idempotence `Message-ID`, rattachement au fil existant sans création de contact). **In-Reply-To** : le fil du message parent est prioritaire sur l’adresse du contact (test dédié : deux séjours du même voyageur ne fusionnent pas). **Décision ADR-05** : IMAP direct non retenu ; le webhook signé est le connecteur d’entrée, aucun mot de passe de boîte n’est stocké. Domaine + parseur + cas d’usage testés. RESTE : boîte dédiée réelle et preuve d’un message entrant de bout en bout.
- [x] T308 [US3] Connecteur SMS Brevo : envoi + statut — fait 2026-11-09 (adapté derrière `canal-message.ts`, actif si `smsConfigured()`)
- [~] T309 [US3] Connecteur WhatsApp Business (optionnel, flag) — code prêt 2026-11-10 : port `WhatsAppSender` + adapter `whatsapp-cloud.ts` (Meta Cloud API, texte, numéro E.164, `externalId`, erreurs sans fuite du jeton), branché sur `CanalMessagePort` quand `WHATSAPP_ENABLED=true`, token et phone number ID sont fournis ; UI consentement existante. Tests adapter + contrat verts. RESTE : compte Meta, numéro vérifié et modèles approuvés pour la preuve live et l'entrée webhook (T718/T908).
- [x] T310 [P] [US3] Tests de contrat connecteurs dans `v2/tests/contract/messagerie.test.ts` — fait 2026-11-10 : contrat `CanalMessagePort` (7 tests) couvrant email avec reply-to, SMS sans sujet, sujet par défaut, WhatsApp via port (externalId), refus explicite OTA sans connecteur, absence de fournisseur WhatsApp/email/SMS ; l'ancien test dupliqué `tests/infrastructure/canal-message.test.ts` est remplacé par ce contrat.

### Automatisations et IA

- [x] T311 [US3] Use case `ouvrirFil()` + rattachement automatique dans `v2/src/application/use-cases/ouvrir-fil.ts` — fait 2026-11-09 (résolution réservation → clé → contact, complétion sans écrasement)
- [x] T312 [US3] Use case `envoyerMessage()` : canal, pièces jointes, audit dans `v2/src/application/use-cases/envoyer-message.ts` — fait 2026-11-09 (`envoyer()` + `envoyerBrouillon()`, idempotent par `ref`, `AjouterPieceJointe` séparé)
- [x] T313 [US3] Use case `executerAutomatisation()` : déclencheur, conditions, brouillon dans `v2/src/application/use-cases/executer-automatisation.ts` — fait 2026-11-09 (crée toujours un brouillon, jamais d'envoi)
- [x] T314 [US3] Job de déclenchement J-7/J-1/départ/J+1 dans `v2/src/lib/server/planificateur-messages.ts` — fait 2026-11-09 (fonction pure + cron `/api/cron/messages-auto`, flag `MESSAGES_AUTO_ENABLED`, mode `?simulation=1`)
- [x] T315 [US3] IA : prompt contextualisé, brouillon, audit, coût dans `v2/src/application/use-cases/assistant.ts` — fait 2026-11-10 : `RedigerBrouillonFil` charge les six derniers messages utiles du fil, masque les codes, construit l’invite, crée un brouillon dans le fil, enregistre la consommation et laisse l’envoi à validation humaine (`assistant.fil` audité). Bouton « Rédiger un brouillon » dans le fil (6 langues), tests unitaires + e2e `assistant-fil` verts en js et sans-js.
- [x] T316 [US3] Traduction entrante/sortante (optionnelle, flag) — fait 2026-11-10 : flag `TRADUCTION_ENABLED` (défaut false, exige LLM configuré). Domaine pur `traduction.ts` (6 langues, article grammatical, refus des textes vides/trop longs/contenant un code d’accès), port `Traducteur`, adapter LLM, cas d’usage `TraduireMessageFil` (message entrant vers la langue du staff, réponse non envoyée vers la langue du voyageur). Traductions à la demande dans le fil, relues par l’humain et jamais envoyées automatiquement ; audit `assistant.traduction` et UI 6 langues. Tests : 4 domaine + 3 cas d’usage + e2e fils verts.
- [x] T317 [US3] Consentements/opt-out par canal + test — fait 2026-11-09 (`CONSENTEMENTS_DEFAUT`, `messageEstOptout`, `appliquerOptout`, `CONSENTEMENT_REQUIS` à l'envoi, écran de consentement dans le fil, tests)

### UI

- [x] T318 [US3] Inbox : liste, filtres, non-lus, assignation — fait 2026-11-09 sur `/hote/messages/fils` (écart assumé : `/hote/fils` était déjà pris par les fils internes d'équipe ; `/hote/messages` reste l'écran d'envoi par logement)
- [x] T319 [US3] Fil : messages, réponse, pièces jointes, IA — fait 2026-11-09 sur `/hote/messages/fils/[id]` (réponse email/SMS, validation de brouillon, pièces jointes jpg/png/webp/pdf ≤ 8 Mo via `StockageFichiers`, IA branchée via T315)
- [x] T320 [US3] Écran automatisations `/hote/automatisations` — fait 2026-11-09 (création depuis les 5 modèles par défaut, activation/désactivation, édition du modèle, suppression, audit)
- [x] T321 [US3] Centre de notifications : messages, réservations à confirmer, retards — fait 2026-11-09 (`/hote/notifications` : messages non lus, brouillons, réservations `brouillon`, échéances `a_payer` en retard)
- [x] T322 [US3] Test e2e inbox + brouillon + validation dans `v2/e2e/inbox.spec.ts` — fait 2026-11-09 (1 test, 2 projets js et sans-js : regroupement, réponse → Mailpit, validation de brouillon, assignation)

### Gate US3

- [x] T323 [US3] 80 % des messages de test dans un fil, 0 envoi auto non validé — mesuré 2026-11-09 : les messages créés par automatisation sont toujours `statut = brouillon` (tests « prépare un brouillon dans le fil et trace l'exécution » et « ignore les conditions non remplies et les opt-out ») ; le backfill rattache 100 % des messages existants à un fil
- [x] T324 [US3] `check`, Vitest, build, RLS verts — vérifié 2026-11-09 : `svelte-check` 0 erreur, 950 tests unitaires / 191 fichiers, `npm run build` OK, 93 migrations / 85 tables / 73 tables en RLS / 73 policies

---

## Phase 6 — US4 Pricing (P2)

**Goal**: recommandations explicables, application bornée, push canal.

- [x] T400 [P] [US4] Domaine `recommandation-prix.ts` (bornes, override, facteurs) + tests — 2026-11-09 : bornes 20 €–2 000 €, plancher/plafond absolus 10 €/5 000 €, `bornerPrix` arrondi à 50 c., `prixEffectif` (override > recommandation appliquée > catalogue), `joursInclus` bornes comprises ; `v2/tests/domain/recommandation-prix.test.ts` 8 tests
- [x] T401 [P] [US4] Port `Pricing` dans `v2/src/application/ports/pricing.ts` — 2026-11-09 : `PricingPort` (`source`, `nom`, `estDisponible`, `importer`) + `v2/src/application/ports/recommandations-prix-repository.ts`
- [x] T402 [US4] Migration `recommandations_prix` — 2026-11-09 : `v2/drizzle/0093_recommandations_prix.sql` (RLS `recommandations_prix_isolation`, contraintes `source`/`statut`/`confiance`, unique `(tenant, logement, jour, source)`)
- [x] T403 [US4] Repository + RLS + tests — 2026-11-09 : `DrizzleRecommandationsPrixRepository` (upsert idempotent qui ne réécrit jamais le statut d'une décision), `tests/helpers/recommandations-prix-repository-memoire.ts`, `testerIsolationRecommandationsPrix` dans `v2/scripts/verifier-rls.mjs` → « RLS VALIDÉE : recommandations de prix isolées par tenant »
- [~] T404 [US4] Adapter PriceLabs (ou Beyond) : auth, import 18 mois, facteurs — 2026-11-10 : `v2/src/infrastructure/adapters/pricing-pricelabs.ts` (`X-API-Key`, parsing tolérant, facteurs, `PRICING_INDISPONIBLE` sans clé/référence) ; l'écran `/hote/prix/recommandations` ajoute un import dédié **18 mois** (548 jours, plafond 730) en plus de la plage personnalisée. RESTE : exécution contre l'API réelle et clé `PRICELABS_API_KEY` (T414).
- [x] T405 [US4] Use case `importerRecommandations()` + job quotidien — 2026-11-09 : `ImporterRecommandations` (partenaire si disponible, sinon local, ignore confiance < 40, idempotent) + `v2/src/lib/server/planificateur-pricing.ts` (`executerImportPricing`, horizon 90 jours) + `v2/src/routes/api/cron/pricing/+server.ts` (`CRON_SECRET` + `PRICING_IMPORT_ENABLED`, `?simulation=1`)
- [x] T406 [US4] Use case `appliquerRecommandation()` : bornes, audit, push canal — 2026-11-09 : `AppliquerRecommandation` (prix borné + signalé, tarif écrit `source = recommandation`, audit `payload`, échec canal qui n'annule pas l'application locale : `pousseeCanal: ok|ignoree|echec`)
- [x] T407 [US4] Override manuel qui gagne sur la recommandation — 2026-11-09 : `prixEffectif()` (override > recommandation appliquée > catalogue) testé dans `v2/tests/domain/recommandation-prix.test.ts` ; l'e2e vérifie qu'une réimportation ne réécrit ni le catalogue ni une décision déjà prise
- [x] T408 [US4] Écran `/hote/prix/recommandations` : prix actuel/recommandé/écart — 2026-11-09 : `v2/src/routes/hote/prix/recommandations/+page.svelte` (filtres par statut, import par logement et plage, écarts signés, accès depuis `/hote/prix`)
- [x] T409 [US4] Détail « pourquoi ce prix » : facteurs, confiance, historique — 2026-11-09 : colonnes confiance et « pourquoi ce prix » (`resumerFacteurs`, facteurs triés par impact) sur la liste, journal d'audit `prix.recommandation-appliquee` / `prix.recommandation-ignoree` pour l'historique des décisions
- [x] T410 [US4] Alerte panne partenaire sans modification des prix — 2026-11-09 : la liste des sources affiche « PriceLabs — indisponible » sans bloquer l'écran, l'import bascule sur la source locale, et un import impossible laisse tous les prix en place (message « Partenaire de revenue management indisponible : aucun prix n'a été modifié. »), `PRICING_IMPORT_ENABLED=false` par défaut
- [x] T411 [P] [US4] Tests de contrat pricing dans `v2/tests/contract/pricing.test.ts` — 2026-11-09 : dossier `v2/tests/contract/` créé, contrat commun vérifié sur l'adaptateur local, mapping d'un payload PriceLabs réel et refus sans clé ; 4 tests
- [x] T412 [US4] Test e2e application + push canal dans `v2/e2e/pricing.spec.ts` — 2026-11-09 : 1 test vert en `js` et `sans-js` (import, application bornée + tracée, ignoré, réimport idempotent) ; le push canal n'est pas exercé (aucun canal de prix configuré) et reste documenté comme non couvert
- [x] T413 [US4] Comparaison RevPAR avant/après sur 30 jours — 2026-11-09 : `v2/src/domain/performance-prix.ts` (ADR, taux d'occupation, RevPAR, comparaison à durée égale, écart cumulé des décisions) + bloc « RevPAR avant / après décision » sur l'écran ; le « après » est une **projection** (prix appliqués, occupation réalisée) et non une mesure de 30 jours de réservations réelles
- [ ] T414 [US4] Gate : 1 logement en dynamique 30 jours, décision documentée — bloqué : exige une clé partenaire et 30 jours de données réelles post-application (voir `docs/analyses/AUDIT-L1-EXISTANT.md`)

---

## Phase 7 — US5 Reporting et relevés (P2)

**Goal**: occupation/ADR/RevPAR, mix canal, relevé propriétaire récurrent.

- [x] T500 [P] [US5] Domaine `releve-proprietaire.ts` (agrégats, commission, arrondis) + tests — fait 2026-11-09 (17 tests : validation période, ligne relevé avec chevauchement/trimestre, agrégats occupation/ADR/RevPAR, mix canal)
- [x] T501 [P] [US5] Ports `RelevesRepository`, `EnvoisRelevesRepository` — fait 2026-11-09 (idempotence par période et par envoiRef)
- [x] T502 [US5] Migration `releves_proprietaires`, `envois_releves` — fait 2026-11-09 (`0094`, 21 énoncés, RLS + GRANT ; `proprietaire_id` en `text` aligné sur `users.id` — la première version `uuid` échouait sur la FK)
- [x] T503 [US5] Repositories + RLS + tests — fait 2026-11-09 (`releves-repository.ts` : `withTenant` + `onConflictDoNothing` + repli SELECT ; bloc `testerIsolationRelevesProprietaires` dans `verifier-rls.mjs` : 1/0/1/0 + refus d'insertion hors tenant)
- [x] T504 [US5] Requêtes d'agrégats occupation/ADR/RevPAR/mix canal dans `v2/src/infrastructure/db/repositories/rapports-repository.ts` — fait 2026-11-09 (port `rapports-repository.ts` + Drizzle : projections `listerReservationsPeriode` avec filtre de chevauchement et `listerLogementsAvecMandat` avec join `logement_proprietaires`/`logements`/`users` sur mandats actifs ; les agrégats occupation/ADR/RevPAR/mix canal sont calculés par les fonctions pures du domaine `calculerAggregats`/`calculerMixCanal` à partir de ces projections, conformément à l'architecture hexagonale)
- [x] T505 [US5] Use case `genererReleve()` : période, logements, revenus, dépenses — fait 2026-11-09 (`GenererReleve` : validation de la période, calcul des bornes jour, filtrage des mandats du propriétaire, une ligne par logement via `calculerLigneReleve`, agrégation via `construireReleve`, idempotence par période via `RelevesRepository.enregistrer` ; 9 tests)
- [x] T506 [US5] PDF relevé + tests de rendu — fait 2026-11-09 (l'adapter `genererReleveProprietairePdf` existait déjà avec test de rendu `%PDF` ; ajout du mapping domaine → options `pdf-releve-mapping.ts` avec `versOptionsPdfReleve()` et `libellePeriodeReleve()` mensuel/trimestriel)
- [x] T507 [US5] Use case `envoyerReleve()` + archive + audit — fait 2026-11-09 (`EnvoyerReleve` : récupère le relevé, génère le PDF via l'adapter, archive dans `StockageFichiers`, trace l'envoi idempotent par `envoiRef`, envoie l'email avec pièce jointe, marque `echec` si SMTP échoue ; 4 tests : envoi complet, idempotence rejeu, relevé introuvable, échec email tracé)
- [x] T508 [US5] Job de récurrence mensuelle/trimestrielle — fait 2026-11-09 (sélection pure `planifier-releves.ts` : mensuel le 1er du mois M-1, trimestriel le 1er de janvier/avril/juillet/octobre pour le trimestre précédent, passage d'année géré ; endpoint `/api/cron/releves` protégé par CRON_SECRET avec `?simulation=1`, parcours des tenants actifs, génération + envoi idempotents, erreurs par tenant isolées et journalisées ; 14 tests de sélection pure ; l'envoi utilise désormais l'email réel du propriétaire porté par le mandat, avec skip + log si absent)
- [x] T509 [US5] Alertes écart de rapprochement/impayé/marge négative — fait 2026-11-09 (`alertes-releve.ts` : `alerterSurEcartRapprochement` aligné sur le seuil 200 bp de `rapprochement.ts`, `alerterSurImpayes` (danger ≥ 30 j), `alerterSurMargesNegatives` (danger ≤ -1 000 €), `construireAlertesReleves` trié danger puis montant décroissant ; 12 tests ; branchement sur `/hote/rapports` via T510 : impayés depuis `DrizzleEcheancesPaiementRepository.listerEnRetard`, marges négatives depuis mandats actifs + réservations non annulées)
- [x] T510 [US5] Écran `/hote/rapports` : filtres, KPIs, export — fait 2026-11-09 (`+page.server.ts` : `requireRole` admin/hote/comptable, filtre mois avec navigation précédent/courant/suivant, KPIs CA/occupation/ADR/RevPAR via `calculerAggregats`, mix canal via `calculerMixCanal` + `canalDepuisSource`, alertes T509 via `construireAlertesReleves` (impayés depuis `listerEnRetard`, marges négatives depuis mandats actifs), table détail par logement, liens exports réservations/factures/paiements/comptable ; `+page.svelte` HTML-first avec Kpi, alertes danger/alerte, mix canal, détail logement, exports ; `i18n-rapports.ts` 5 langues ; nav ajoutée dans `i18n-nav.ts` (interface + FR/EN/ES/IT/DE) et `+layout.svelte`)
- [x] T511 [US5] Portail propriétaire : relevés consultables/téléchargeables — fait 2026-11-09 (écran `/proprio/releves` : `requireRole` proprietaire/admin/hote, le propriétaire voit ses relevés via `listerParProprietaire`, le staff tout le tenant via `listerParTenant`, table HTML-first période/CA/commission/charges/net (danger si négatif)/généré le + lien PDF ; endpoint `/api/proprio/releves/[id]` : PDF via `versOptionsPdfReleve` + `genererReleveProprietairePdf`, garde 403 si le propriétaire demande le relevé d'un autre, traçage idempotent dans `envois_releves` canal `portail` statut `telecharge` par `envoiRef` `portail:{tenantId}:{releveId}` (création ou mise à jour du statut) ; lien « Relevés archivés » ajouté sur `/proprio`)
- [x] T512 [US5] Export comptable stable + documentation — fait 2026-11-09 (domaine `export-comptable.ts` : schéma v1 figé 9 colonnes, journal VTES partie double par facture émise/payée (411/706/445710/447000), journal TRES par paiement (512000/530000 + 411), tri déterministe date→pièce→compte, brouillon/annulée exclues ; endpoint `/api/exports/comptable` rôles admin/hote/comptable ; 14 tests ; runbook `docs/runbook-export-comptable.md`)
- [x] T513 [US5] Test e2e relevé généré/envoyé/consulté dans `v2/e2e/releves.spec.ts` — fait 2026-11-09 (seed admin via UI : logement + réservation 2026-11 + mandat propriétaire, déclenchement du cron `GET /api/cron/releves?date=2026-12-01` avec `authorization: Bearer ${CRON_SECRET}`, connexion proprio dans un contexte séparé, assertion du relevé « novembre 2026 » / « mensuel » sur `/proprio/releves`, téléchargement PDF via `page.request.get` sur `/api/proprio/releves/[id]` avec vérification `content-type: application/pdf` ; les 4 `goto` post-login utilisent `waitUntil: "domcontentloaded"` pour éviter l'`ERR_ABORTED` d'interception du routeur client SvelteKit ; vert sur les deux projets `js` et `sans-js`)
- [x] T515 [US5] Suivi des paiements propriétaires (payouts) + rapprochement + test — fait 2026-11-09 (domaine `paiement-proprietaire.ts` : cycle `en_attente`→`valide`→`paye`→`rapproche`, écart relatif en bp aligné sur la tolérance 200 bp de `rapprochement.ts`, `estRapproche`/`statutApresPaiement`/`agregerPayouts` avec détection des payouts en écart, validation de cohérence statut/paiement ; 25 tests ; port `paiements-proprietaires-repository.ts` ; migration `0095` : CHECK de cohérence du paiement (statuts payés exigent montant + date), RLS + GRANT ; repository Drizzle idempotent par (tenant, ref) ; bloc `testerIsolationPaiementsProprietaires` dans `verifier-rls.mjs` : 1/0 + refus d'insertion hors tenant ; les tables `releves_proprietaires`/`envois_releves` de 0094 ajoutées à la vérification RLS systématique)
- [ ] T514 [US5] Gate : 1 relevé réel envoyé à un propriétaire

---

## Phase 8 — US6 Expérience voyageur (P2)

**Goal**: guide, instructions, serrure, demandes, avis.

- [x] T600 [P] [US6] Domaine `guide-voyageur.ts` (sections, langues, lien signé) + tests — fait 2026-11-09 (`src/domain/guide-voyageur.ts` : domaine pur sans dépendance SvelteKit/Drizzle, `node:crypto` uniquement avec secret HMAC injecté par l'appelant (pattern `captcha.ts`) ; `LANGUES_GUIDE` aligné sur `LANGUES_PUBLIQUES` (fr/en/es/it/de/nl), 5 sections `arrivee/wifi/sejour/depart/urgence` avec ordre d'affichage, `validerContenuSection` (titre ≤ 120, corps ≤ 5000, langue connue) qui retourne les erreurs sans lever, `resoudreContenuSection` avec repli langue demandée → langue par défaut → français ; lien signé HMAC-SHA256 `base64url(payload).signature` avec `timingSafeEqual` (règle projet 11 : vérification avant lecture), payload `{v:1, tenantId, logementId, reservationId, exp}`, `verifierLienGuide` retourne `null` sur toute anomalie sans jamais lever, expiration ≥ 60 jours ou fin de séjour + 30 jours ; 20 tests)
- [x] T601 [US6] Migration `guide_contenus`, `acces_serrure` — fait 2026-11-09 (migration `0096_guide_contenus_acces_serrure.sql` : ALTER logements ADD `guide_langue_defaut` text DEFAULT 'fr' NOT NULL ; table `guide_contenus` (tenant/logement/section/langue/titre/corps, CHECK section IN arrivee/wifi/sejour/depart/urgence, CHECK langue IN fr/en/es/it/de/nl, UNIQUE (tenant,logement,section,langue)) ; table `acces_serrure` (tenant/logement/reservation nullable/type numerique|manuel/code/statut actif|revoque|expire/fournisseur/expire_le/note, FK reservations ON DELETE SET NULL) ; RLS + GRANT lcd_app sur les deux ; bloc `testerIsolationGuideEtSerrure` dans `verifier-rls.mjs` : 1/0 + refus insertion hors tenant ; schéma Drizzle `guideContenus` + `accesSerrure` + `guideLangueDefaut` sur logements + types exportés)
- [x] T602 [US6] Repositories + RLS + tests — fait 2026-11-09 (port `guides-repository.ts` : `GuideContenusRepository` (enregistrer upsert idempotent par (tenant,logement,section,langue), listerParLogement, trouverParSectionLangue, supprimer) + `AccesSerrureRepository` (creer, trouverParId, listerParLogement avec filtre statut, listerParReservation actifs, revoquer) ; repository Drizzle `guides-repository.ts` : `DrizzleGuideContenusRepository` avec onConflictDoUpdate sur la contrainte unique, `DrizzleAccesSerrureRepository` avec expiration ISO↔Date ; toutes les opérations via `withTenant()` ; RLS validée en T601 par `testerIsolationGuideEtSerrure` dans `verifier-rls.mjs` (1/0 + refus d'insertion hors tenant) ; svelte-check 0 erreur)
- [x] T603 [US6] Éditeur de guide `/hote/logements/[id]/guide` — fait 2026-11-09 (route `+page.server.ts` + `+page.svelte` HTML-first : `requireRole` admin/hote, load avec logement + langueActive depuis param `?langue=` ou `guideLangueDefaut`, sections dans `ORDRE_SECTIONS_GUIDE` avec titre/corps/existe, 6 langues avec indicateur `aContenu` ; actions `enregistrer` (validation `validerContenuSection` + upsert via `DrizzleGuideContenusRepository` + audit `guide.section`), `supprimer` (audit `guide.supprimer`), `langueDefaut` (update `logements.guide_langue_defaut`) ; lien « Guide structuré multilingue » ajouté sur `/hote/logements/[id]` ; `guideLangueDefaut` ajouté au domaine `Logement` + mapping `versDomaine` ; imports statiques `and/eq` drizzle-orm + `logements` schéma — les imports dynamiques dans l'action `langueDefaut` causaient un hang Vitest ; suite 214 fichiers / 1217 tests verts)
- [x] T604 [US6] Page publique guide `/guide/[token]` sans compte, sans JS obligatoire — fait 2026-11-09 (route `/guide/[token]` : `export const csr = false` (règle 3), `verifierLienGuide(env.BETTER_AUTH_SECRET, params.token)` vérifie le HMAC AVANT toute lecture du payload (règle 11), retourne `indisponible: "invalide"|"reservation"|"logement"` sans jamais lever ; vérifie la cohérence réservation↔logement ; charge logement + contenus guide en parallèle ; construit un `GuideVoyageur` virtuel puis résout chaque section via `resoudreContenuSection` avec repli langue par défaut → français ; affiche check-in, consignes, WiFi, urgence (lien `tel:`), sections dans `ORDRE_SECTIONS_GUIDE` ; page HTML-first sans JS obligatoire avec `noindex/nofollow`)
- [x] T605 [US6] Job d'envoi instructions J-7/J-1 + lien guide — fait 2026-11-09 (`ContexteReservationMessage.lienGuide?` ajouté dans `executer-automatisation.ts`, exposé en `guide: contexte.lienGuide ?? ""` dans `variablesAutomatisation` (clé toujours présente : jamais signalée manquante) ; templates J-7 `preparation-sejour` et J-1 `veille-arrivee` dans `automatisations-defaut.ts` enrichis d'une ligne `{{guide}}` ; génération du lien signé dans `planificateur-messages.ts` via `creerLienGuide(env.BETTER_AUTH_SECRET, {tenantId, logementId, reservationId, exp: expirationLienGuide(reservation.fin)})` — le domaine reste pur (secret injecté par la couche serveur) ; le cron `/api/cron/messages-auto` existant crée des brouillons validés humainement dans l'inbox (aucun envoi automatique) ; synchronisation du port étendu T606/T607 : journal idx 97, schéma Drizzle `accesSerrure` + 6 colonnes (`ref`, `valide_de/a`, `revoque_le/par`, `external_id`) + unique (tenant,ref) + index logement/statut, `DrizzleAccesSerrureRepository` réécrit (création idempotente par ref avec `onConflictDoNothing` + fallback, `trouverParRef`, révocation tracée `revoqueLe/revoquePar`), migration 0097 appliquée, inserts `acces_serrure` de `verifier-rls.mjs` complétés (ref + fenêtre de validité) ; 21 tests ciblés verts, suite 214 fichiers / 1217 tests, svelte-check 0 erreur, db:test-rls vert)
- [x] T606 [US6] Adapter Nuki : création/révocation de code, audit — fait 2026-11-09 (port `serrure-connectee.ts` : `SerrureConnecteePort` avec `estDisponible()` (ne lève jamais), `creerCode` et `revoquerCode` (idempotent sur 404) ; adapter `serrures/nuki.ts` : factory injectable `creerSerrureNuki({token?, base?, fetchImpl?})` pour tests déterministes sans toucher au singleton `env`, Nuki Web API — `PUT /smartlock/{id}/authorization` avec `{codepin, name, timeLimited:{from, until}}` → `{codeId}`, `DELETE /smartlock/{id}/authorization/{codeId}` — code strictement 6 chiffres, nom tronqué à 32, idempotence de révocation via `estErreurIntrouvable` (message `(404)`), tout échec lève `ErreurMetier("SERRURE_INDISPONIBLE")` propre pour que T607 bascule en repli manuel ; env `NUKI_API_TOKEN` (optional) + `NUKI_API_BASE` (default `https://api.nuki.io`) dans `env.ts` ; libellés d'audit `serrure.code_creer`/`serrure.code_revoquer` ajoutés à `audit.ts` ; 11 tests dans `tests/infrastructure/serrure-nuki.test.ts` avec fetch mocké (disponibilité, création + forme de la requête, réponse sans codeId, 409 sans retry, révocation DELETE, 404 idempotent, 5xx propagé, sans token) ; le domaine `acces-serrure.ts` décide `nuki`/`manuel` sans jamais appeler le fournisseur (règle 4) ; svelte-check 0 erreur, suite 215 fichiers / 1228 tests verts)
- [x] T607 [US6] Fallback code manuel si serrure indisponible — fait 2026-11-10 (use case `creer-acces-serrure.ts` : orchestration hexagonale — fenêtre d'accès via `fenetreAcces` (domaine pur, lève si dates incohérentes), référence stable `refAcces` pour idempotence (règle 7), `trouverParRef` pour détecter le rejeu (`existant: true` sans re-création), génération `genererCodeAcces` (6 chiffres), choix fournisseur via `choisirFournisseur(serrure.estDisponible() && Boolean(serrureId))` ; si nuki choisi : tentative `serrure.creerCode` → catch → bascule en repli manuel (`fallback: true`, `type: "manuel"`, `externalId: null`) sans jamais bloquer l'arrivée ; si manuel ou indisponible : direct `type: "manuel"` ; persistance via `AccesSerrureRepository.creer` idempotent par ref ; l'audit `serrure.code_creer` est à la charge de la route appelante (pattern projet) ; 6 tests dans `tests/application/creer-acces-serrure.test.ts` avec ports mockés : création nuki + forme de la persistance, fallback sur erreur nuki, manuel si indisponible, manuel si serrureId null, idempotence par ref (0 appel fournisseur, 0 création), propagation erreur domaine fenêtre incohérente ; svelte-check 0 erreur, suite 216 fichiers / 1234 tests verts)
- [x] T608 [US6] Demande départ tardif/extra avec prix + validation staff — fait 2026-11-10 (migration `0098_demandes_extra_avis_voyageur.sql` appliquée : tables `demandes_extra` + `avis_voyageur` avec RLS + GRANT, contraintes type/statut/prix, index uniques par ref et par réservation ; repository Drizzle `demandes-extra-repository.ts` : `enregistrer` idempotent par (tenant, ref) via `onConflictDoNothing` + fallback SELECT retournant `{id, cree}`, `trouverParId`/`trouverParRef`/`lister` avec filtre logement/réservation/statut/`listerParReservation`/`marquerStatut` traçant `decideeLe`/`decideePar`/`motifRefus`, mapping ISO↔Date pour `creeLe`/`decideeLe` ; bloc RLS `testerIsolationDemandesExtraAvis` ajouté à `verifier-rls.mjs` avec création préalable d'une réservation (FK obligatoire), ajout des deux tables à la liste de vérification systématique, validé par `db:test-rls` : `{"extraAvecTenant":1,"extraAutreTenant":0,"avisAvecTenant":1,"avisAutreTenant":0,"refusExtra":true,"refusAvis":true}` ; libellé d'audit `demande_extra.decider` ajouté à `audit.ts` ; route staff HTML-first `/hote/demandes-extra` (`+page.server.ts` + `+page.svelte`) : `requireRole` admin/hote, tenant depuis session, load avec filtre par statut, action unique `decider` qui applique la validation domaine pure `deciderDemandeExtra` (motif de refus ≥ 10 caractères, auteur obligatoire, refus si déjà décidée) puis persiste via `marquerStatut` et audite via insert `auditLogs` dans `withTenant` ; le domaine `demande-extra.ts` préexistant porte les prix `prixDepartTardif`/`prixArriveeAnticipee` (arrondi au multiple de 50 c supérieur, bornés par plancher/plafond absolus), la ref stable `refDemandeExtra` et les transitions de statut ; suite 217 fichiers / 1238 tests verts, svelte-check 0 erreur, db:test-rls vert)
- [x] T609 [US6] Demande d'avis J+1 + affichage des avis publiés — fait 2026-11-10 (le socle existait déjà : domaine `avis-voyageur.ts` avec cycle invite→recu→publie→masque, validation de note 1–5, motif de masquage ≥ 10 caractères, réponse hôte, moyenne/répartition ; port `avis-voyageur-repository.ts` ; repository Drizzle idempotent par (tenant, ref) et (tenant, réservation) ; table `avis_voyageur` + RLS validée par `testerIsolationDemandesExtraAvis`) ; ajouts : `refAvisVoyageur(reservationId)` stable (`AVIS-<8 majuscules>`) pour l'idempotence ; use cases `gerer-avis-voyageur.ts` — `InviterAvisVoyageur` (invitation J+1 rejouable, retrouve l'existant sans réécrire), `DeposerAvisVoyageur` (note + commentaire, refus hors statut invité), `ModererAvisVoyageur` (publier/masquer motivé/répondre) ; branchement J+1 dans `planificateur-messages.ts` : création de l'invitation avant le brouillon, injection de `lienAvis` (URL absolue `/avis/<token voyageur HMAC>`) et de `lienGuide` désormais en URL absolue ; variable `{{avis}}` ajoutée à `variablesAutomatisation` et au modèle par défaut J+1 ; page voyageur `/avis/[token]` HTML-first (`csr = false`) : `verifierTokenVoyageur` AVANT lecture du payload (règle 11), cohérence réservation↔logement, création paresseuse de l'invitation si le lien précède J+1, formulaire note/commentaire, audit `avis.creer` ; écran staff `/hote/avis-voyageur` : `requireRole` admin/hote, filtre par statut, publication sans note minimale (transparence), masquage motivé, réponse publique, audit `avis.moderation`, lien depuis `/hote/avis` ; affichage public : la page `/site/[slug]/[page]` charge les avis `publie` du logement (ou du tenant) et `BlocAvis` les affiche comme « Voyageur vérifié » en plus du contenu éditorial ; 12 tests applicatifs (`tests/application/avis-voyageur.test.ts` + repository mémoire) ; suite 218 fichiers / 1250 tests verts, svelte-check 0 erreur)
- [x] T610 [US6] PWA : installation, notifications si supportées — fait 2026-11-10 (le socle existait : `manifest.webmanifest` dynamique avec thème/identité, `static/sw.js` network-first + cache-first + fallback `/offline` + purge, `static/register-sw.js` chargé depuis `app.html`, icônes 192/512/maskable) ; ajouts : manifest enrichi `dir: "ltr"` et `prefer_related_applications: false` ; service worker versionné `lcd-v2-2026-11-10-1` avec handlers `push` (payload JSON `{titre, corps, url}` → `showNotification`) et `notificationclick` (focus/navigation vers `url`, sinon `openWindow`), sans jamais mettre en cache `/hote`, `/api/` ni les espaces sécurisés ; îlot optionnel `static/pwa.js` (< 4 Ko, chargé uniquement sur la page staff) : détection `display-mode: standalone`, capture de `beforeinstallprompt` + bouton d'installation, `appinstalled`, détection de support et `Notification.requestPermission()` avec notification de confirmation via le service worker ; page staff `/hote/installation` (`requireRole` admin/hote) avec instructions par navigateur, boutons `data-pwa-installer`/`data-pwa-notifications`, zone de statut `role="status"` ; lien depuis `/hote/notifications` ; 5 tests de garde statique `tests/lib/pwa.test.ts` (manifest installable, handlers push/notificationclick, exclusions de cache, taille de l'îlot, réservation admin/hote) ; suite 221 fichiers / 1 278 tests verts (mesure du 2026-11-10 après T612), svelte-check 0 erreur)
- [x] T611 [P] [US6] Tests Nuki sandbox dans `v2/tests/contract/nuki.test.ts` — fait 2026-11-10 (fichier déjà présent et vérifié : contrat de forme toujours exécuté — `PUT /smartlock/{id}/authorization` avec `codepin`/`name`/`timeLimited`, `DELETE …/authorization/{codeId}`, 404 de révocation idempotent, code non numérique refusé sans appel réseau ; contrat sandbox opt-in via `evaluerSandbox(["NUKI_API_TOKEN","NUKI_SANDBOX_SERRURE_ID"])` + `describe.skipIf`, activation `SANDBOX_TESTS=1`, timeout 20 s, création puis double révocation sur une serrure de test ; exécution : 5 tests dont 1 sandbox sauté sans clés, `npx vitest run tests/contract/nuki.test.ts` vert)
- [x] T612 [US6] Test e2e guide + code + révocation dans `v2/e2e/experience-voyageur.spec.ts` — fait 2026-11-10 (parcours voyageur complet dans un seul test, vert sur les deux projets : `1 passed` en `js` (22,0 s) et en `sans-js` (10,1 s) via `npx playwright test e2e/experience-voyageur.spec.ts --project=js|sans-js`. Le test crée un logement et une réservation par l'UI, enregistre une section de guide par le formulaire staff (« Enregistrer Arrivée »), ouvre `/guide/<jeton>` sans cookie de session et vérifie la section publiée puis qu'un jeton falsifié ne fait fuiter aucun contenu. Il dépose ensuite une demande d'extra `depart-tardif` depuis le guide (prix affiché, statut en attente) et la fait valider sur `/hote/demandes-extra` ; il crée un code d'accès **lié à la réservation** sur `/hote/logements/<id>/serrure`, vérifie que le voyageur voit ce code dans `/guide/<jeton>` (`[data-code-acces]`), le révoque avec un motif ≥ 10 caractères, puis vérifie que le guide ne l'affiche plus (`toHaveCount(0)`) ; enfin il dépose un avis 5/5 sur `/avis/<jeton>` et le publie depuis `/hote/avis-voyageur`. Le jeton HMAC est recalculé avec `createHmac("sha256", BETTER_AUTH_SECRET)` sur `{v,tenantId,logementId,reservationId,exp}` en base64url ; la base est lue via `MIGRATION_DATABASE_URL` (le rôle applicatif est filtré par RLS) et `afterAll` supprime avis, demandes, accès, contenus de guide, réservation et logement. Ajout fonctionnel nécessaire au parcours : la page guide affiche désormais le code d'accès actif de la réservation (`DrizzleAccesSerrureRepository.listerParReservation`, section `[data-code-acces]`), qui disparaît dès la révocation. `npm run check` : 0 erreur / 0 warning ; suite unitaire 221 fichiers / 1278 tests verts.)

---

## Phase 9 — US7 API et intégrations (P3)

**Goal**: API lecture, clés, webhooks, 3 partenaires, Zapier.

- [x] T700 [P] [US7] Domaine `cle-api.ts` (scopes, hash, expiration) + tests — fait 2026-11-10 (`v2/src/domain/cle-api.ts` : six scopes `logements:lire`, `reservations:lire`, `disponibilites:lire`, `prix:lire`, `proprietaires:lire`, `releves:lire` ; génération `lcd_` + 32 octets base64url via `node:crypto`, préfixe d'affichage de 12 caractères, empreinte SHA-256 hexadécimale, création validée (nom 2–80, scopes connus/dédupliqués, expiration future), `cleApiUtilisable`, `scopeAutorise`, révocation idempotente conservant la première date ; 12 tests dans `v2/tests/domain/cle-api.test.ts`, verts)
- [x] T701 [P] [US7] Ports `ClesApiRepository`, `IntegrationsRepository` — fait 2026-11-10 (`v2/src/application/ports/api-integrations.ts` : CRUD clés avec `trouverParHash` cross-tenant documenté, `marquerUsage(tenantId, id)` et révocation idempotente ; intégrations `nuki|duve|touchstay|swikly|zapier` avec `config` non secrète, upsert par (tenant, fournisseur) et validation `fournisseurIntegrationValide`)
- [x] T702 [US7] Migration `cles_api`, `integrations_tenant` — fait 2026-11-10 (`v2/drizzle/0099_cles_api_integrations_tenant.sql` appliquée : `cles_api` avec hash unique global, scopes jsonb contrôlés tableau, expiration/dernier usage/révocation, `integrations_tenant` avec contrainte fournisseur et config objet, index uniques, RLS + GRANT `lcd_app` ; fonction `api_cle_par_hash(text)` SECURITY DEFINER à `search_path` figé, seule lecture cross-tenant et limitée à une empreinte ; journal `_journal.json` idx 99 ; `db:check` vert)
- [x] T703 [US7] Repositories + RLS + tests — fait 2026-11-10 (`DrizzleClesApiRepository` : création, `trouverParHash` via la fonction SQL, lecture/listing/revocation via `withTenant`, `marquerUsage` tracé ; `DrizzleIntegrationsRepository` : upsert idempotent, listing, suppression ; bloc `testerIsolationClesApiIntegrations` ajouté à `verifier-rls.mjs` + tables ajoutées à la liste systématique ; `db:test-rls` vert : `{"cleAvecTenant":1,"cleAutreTenant":0,"integrationAvecTenant":1,"integrationAutreTenant":0,"refusCle":true,"refusIntegration":true,"parHashSansTenant":1,"hashInconnu":0}`)
- [x] T704 [US7] Middleware auth API + rate limit + journal dans `v2/src/lib/server/api-auth.ts` — fait 2026-11-10 (`authentifierApi` : Bearer `lcd_…`, recherche par empreinte uniquement, refus 401 clé inconnue/expirée/révoquée, 403 scope absent, 429 à 120 req/min avec `Retry-After`, `X-Request-Id` repris ou généré, en-têtes `X-RateLimit-*` ; usage et audit `api.appel` tracés sans bloquer la réponse ; `erreurApi` homogène ; 9 tests dans `v2/tests/lib/api-auth.test.ts`, verts)
- [x] T705 [US7] Endpoints `/api/v1/logements`, `/reservations`, `/disponibilites`, `/prix`, `/proprietaires`, `/releves` — fait 2026-11-10 (six routes GET sous `v2/src/routes/api/v1/` avec un scope par ressource ; filtres réservations `logementId`/`debut`/`fin`, disponibilités jour par jour sur 366 nuits max avec contrôle du logement, tarifs par plage, propriétaires avec `logementIds`, relevés filtrés par mois ; aucune donnée d'un autre tenant, tout passe par les repositories `withTenant`)
- [x] T706 [US7] Pagination, erreurs, `requestId`, OpenAPI — fait 2026-11-10 (`v2/src/lib/server/api-v1.ts` : `page`/`limite` bornée à 200, métadonnées `total`/`pages`, réponses `{data}` ou `{data,pagination}`, erreurs 400/404/500 homogènes ; `v2/src/lib/server/api-openapi.ts` + `GET /api/v1/openapi` documentent les six chemins, les scopes, le schéma d'erreur et la pagination en OpenAPI 3.1)
- [x] T707 [US7] Webhooks signés + retry + rejeu + UI — fait 2026-11-10 (vérifié : `src/domain/webhook.ts`, adapter `infrastructure/adapters/webhook-http.ts` avec `X-LCD-Signature: sha256=…`, `LivrerWebhooks` 5 tentatives et backoff `[0,1,5,15,60]` minutes, cron `/api/cron/webhooks`, UI `/hote/integrations` ; tests domaine + HTTP verts, 6/6)
- [x] T708 [P] [US7] Tests de contrat API dans `v2/tests/contract/api-v1.test.ts` — fait 2026-11-10 (8 tests : OpenAPI 3.1 sur l'origine réelle, six chemins avec leur scope, pagination bornée, `data`/`total`/`pages`, `requestId` et `cache-control`, erreur homogène, dates et paramètres requis ; 8/8 verts)
- [x] T709 [P] [US7] Tests RLS API multi-tenant dans `v2/tests/rls/api-v1.test.ts` — fait 2026-11-10 (4 garde-fous statiques sur la migration 0099 : RLS activée sur les deux tables, policies `app.tenant_id`, fonction SECURITY DEFINER avec `search_path` figé et droits révoqués, présence du bloc exécutable `db:test-rls` ; le test réel `npm run db:test-rls` est vert avec `cleAutreTenant=0`, `integrationAutreTenant=0`, `refusCle/refusIntegration=true`, `parHashSansTenant=1`, `hashInconnu=0`)
- [x] T710 [US7] UI clés API `/hote/integrations/api` — fait 2026-11-10 (page admin/hôte : création avec nom, six scopes et expiration 30/90/365 jours, clé en clair affichée une seule fois, liste des préfixes/scopes/statuts, révocation idempotente, journal `api.cle_creer`/`api.cle_revoquer` ; lien depuis `/hote/integrations` ; 4 tests statiques)
- [x] T711 [US7] Adapter Nuki (réutiliser US6) + page intégration — fait 2026-11-10 (`/hote/integrations/nuki` : état `NUKI_API_TOKEN` via `creerSerrureNuki().estDisponible()`, activation/désactivation persistée dans `integrations_tenant` avec audit, mise en service et liens vers les codes d'accès par logement ; adapter Nuki US6 conservé, contrat 5 tests dont 1 sandbox sauté)
- [x] T712 [US7] Adapter guide partenaire (Duve/Touch Stay) si retenu — fait 2026-11-10 (révision de la décision du même jour) : guide partenaire hébergé par logement (`guide_partenaire_nom`, `guide_partenaire_url` HTTPS), configuration depuis la fiche logement, affichage dans `/guide/[token]` et l’espace voyageur, lien `noopener noreferrer`. Aucun secret ni contenu partenaire n’est dupliqué ; l’API Duve/Touch Stay n’est pas branchée faute de contrat. Preuves : migration 0102, validation d’URL, e2e guide signé.
- [ ] T713 [US7] Adapter Swikly caution — en attente du contrat Swikly et des identifiants ; la caution interne de `v2/src/domain/caution.ts` reste opérationnelle
- [x] T714 [US7] App Zapier/Make générique (optionnelle) — décision 2026-11-10 : non retenue, couverte fonctionnellement par l’API v1 en lecture + webhooks signés ; aucune app dédiée sans compte partenaire.
- [x] T715 [US7] Serveur MCP lecture (optionnel, après API) — fait 2026-11-10 : serveur stdio JSON-RPC `scripts/mcp-lecture.ts` (`npm run mcp:lecture`) et module testable `src/lib/server/mcp-lecture.ts`. Six outils en lecture seule (logements, réservations, disponibilités, prix, propriétaires, relevés), schémas d’arguments stricts, réutilisation de la clé/scopes API via `LCD_API_KEY`, erreurs HTTP sans fuite de corps ni de clé, notifications ignorées. Documentation `/developpeurs`. 6 tests unitaires verts. Le gate T718 (3 intégrations live) reste inchangé.
- [x] T716 [US7] Documentation `/developpeurs` + exemples cURL — fait 2026-11-10 (page `csr=false` : authentification Bearer, tableau des six scopes, six endpoints et paramètres, pagination, erreurs/limites, formule d'erreur, webhooks HMAC et renvois vers `/api/v1/openapi` et `/hote/integrations/api` ; exemple cURL)
- [x] T717 [US7] Test e2e clé + webhook + partenaire dans `v2/e2e/api-integrations.spec.ts` — fait 2026-11-10 (parcours réel : 401 sans clé, création UI avec scope logements, appel `GET /api/v1/logements` 200 avec pagination et `X-Request-Id`, 403 sur `/releves` sans scope, révocation UI puis 401, page Nuki accessible ; `1 passed` en `js` (5,4 s) et `sans-js` (2,3 s) ; le webhook reste couvert par `e2e/integrations.spec.ts`)
- [ ] T718 [US7] Gate : 3 intégrations live, API documentée
- [x] T719 [US7] `check`, Vitest, build, RLS verts — fait 2026-11-10 (`npm test` 228 fichiers / 1 330 tests verts, 2 sautés sandbox ; `npm run check` 0/0 ; `npm run build` OK ; `npm run db:check` OK ; `npm run db:test-rls` : clés API et intégrations isolées, `cleAutreTenant=0`, `integrationAutreTenant=0`, `parHashSansTenant=1`, `hashInconnu=0`)
- [x] T720 [US7] Analytics/pixels et marque blanche par tenant (optionnel, flag) — fait 2026-11-10 (révision de la décision du même jour, à la demande produit) : consentement explicite `lcd_consentement` (mesure/publicité, révocable via `/consentement`), journal first-party `suivi_evenements` (pages vues, clics, soumissions, conversions, campagnes ; IP hachée, purge 13 mois), interfaces d’administration `/hote/suivi`, chargement conditionnel Google Analytics 4, Matomo, Plausible, Meta Pixel, Google Ads et TikTok. Aucun script tiers n’est injecté avant accord ; la marque blanche par tenant reste non retenue (apparence globale). Preuves : migration 0101, tests domaine/scripts, e2e `suivi.spec.ts` (3 scénarios consentement/API/hôte).

---

## Phase 10 — US8 Onboarding (P3)

**Goal**: une conciergerie s'installe seule en un jour.

- [x] T800 [P] [US8] Modèle de check-list et état dans `v2/src/domain/onboarding.ts` + tests — fait 2026-11-10 (`v2/src/domain/import-csv.ts` porte `PARCOURS_ONBOARDING` (7 étapes avec lien), `progressionOnboarding` (faites, total, pourcentage, terminé, prochaine) et le parseur/analyseur CSV ; tests `v2/tests/import.test.ts` 10/10)
- [x] T801 [US8] Écran `/hote/onboarding` : étapes, progression, liens — fait 2026-11-10 (écran existant conservé : sélection du logement, 7 étapes, progression, actions copropriété/publication, messages de succès et d'erreur ; ajout des liens « Importer un CSV » et « Centre d'aide »)
- [x] T802 [US8] Import CSV logements/réservations + rapport d'erreurs ligne par ligne — fait 2026-11-10 (`/hote/import` : deux formulaires natifs `multipart/form-data`, parseur `,`/`;` avec guillemets, BOM et CRLF, validation code/nom, recherche du logement par code, refus des chevauchements et doublons, création des lignes valides malgré les erreurs, rapport numéroté et audit `import.csv`)
- [x] T803 [US8] Import iCal existant + détection de doublons — fait 2026-11-10 (vérifié : `/hote/planning/import`, `ImporterIcs` renvoie `crees`/`deja`/`ignores`, `SynchroniserFluxIcs` conserve l'idempotence par UID)
- [x] T804 [US8] Tenant de démonstration en lecture seule + seed — fait 2026-11-10 (colonne `tenants.lecture_seule` + migration 0100 ; garde `hooks.server.ts` : toute écriture authentifiée d'un tenant démo est refusée en 303 vers `/hote?lectureSeule=1`, les appels `/api/*` reçoivent 403 `LECTURE_SEULE`, les lectures et `/api/auth/*` restent ouvertes ; cache 30 s ; `scripts/seed.ts` crée le tenant `demo` et son compte si `SEED_DEMO_PASSWORD` est fourni ; `seed-demo.mjs` accepte `SEED_DEMO_TENANT_SLUG=demo` ; 4 tests de règles pures)
- [x] T805 [US8] Aide contextuelle par écran + base d'articles — fait 2026-11-10 (vérifié : `/aide` documente les parcours, `/hote/formation` sert de base d'articles et la navigation hôte pointe vers l'aide)
- [x] T806 [US8] Page publique tarifs FULL/PILOTAGE/KIT + calculateur + FAQ — fait 2026-11-10 (`/tarifs` HTML-first `csr=false` : trois offres, calculateur GET logements × CA, plancher FULL 149 €, PILOTAGE 149 €/logement, KIT 890 € + 240 €/an, FAQ ; domaine `offres.ts` + 5 tests, e2e sans JS vert)
- [x] T807 [US8] Parcours de réservation test guidé — fait 2026-11-10 (`/hote/onboarding/reservation-test` : création d'un séjour `TEST-…` sur un logement actif, refus des dates invalides et chevauchements, lien guide HMAC, annulation, audit `reservation.test_creer`/`reservation.test_annuler` ; e2e `import-onboarding.spec.ts` 1/1 js (7,4 s) et sans-js (3,1 s))
- [x] T808 [P] [US8] Tests d'import et de doublons dans `v2/tests/import.test.ts` — fait 2026-11-10 (10 tests : parseur, guillemets, BOM/CRLF, colonnes, codes invalides/doublons, réservation valide, logement inconnu, dates inversées, ref en double, progression onboarding)
- [x] T809 [US8] Test e2e onboarding complet dans `v2/e2e/onboarding.spec.ts` — fait 2026-11-10 (vérifié : création logement, onboarding, blocage copropriété, publication et apparition sur `/reserver`)
- [~] T810 [US8] Chrono réel d'onboarding + documentation — instrumenté 2026-11-10 (`/hote/onboarding` : section « Chrono d'onboarding » calculée depuis `tenants.created_at` et le journal d'audit — création du compte, premier logement, copro vérifiée, publication, réservation test ; durées par étape et total, étape absente non comptée ; domaine pur + 4 tests, e2e js/sans-js). RESTE : mesurer une conciergerie réelle de bout en bout (T811).
- [ ] T811 [US8] Gate : 1 conciergerie onboardée en 1 jour sans le fondateur — gate externe, non franchi

---

## Phase 11 — Convergence

- [x] T900 Mettre à jour `v2/ECARTS-V1.md` pour chaque écart comblé — fait 2026-11-10 (section « API, intégrations, développeurs », lignes import CSV et réservation test, priorités mises à jour)
- [x] T901 Mettre à jour `docs/analyses/LODGIFY-VS-LCD-2026-11.md` (statuts) — fait 2026-11-10 (§10 bis : API, webhooks, Nuki, onboarding, tarifs, limites)
- [x] T902 Mettre à jour `replica/features.csv` (original/clone/notes) — fait 2026-11-10 (API publique, webhooks, import CSV, tarifs publics)
- [x] T903 Mettre à jour `docs/registres/changelog.md` — fait 2026-11-10 (entrée US7/US8 avec preuves et limites)
- [x] T904 Vérifier `npm run check`, `npx vitest run`, `npm run build`, `npm run db:check`, `npm run db:test-rls`, `npm run test:e2e` — fait 2026-11-10 : check 0/0, 1 334 tests unitaires verts (2 sautés), build OK, `db:check` OK, `db:test-rls` OK ; e2e projet `js` 97 verts (15,2 min) et projet `sans-js` 96 verts / 1 sauté (PWA) / 0 échec. Corrigé au passage : hydratation des pages staff (`data.t.*`) — `t = $derived(factory(langue))` dans 24 pages, doublon du message de réservation dans `/hote/planning`, doublon du statut par ligne dans `/hote/utilisateurs` (message global conservé), attentes obsolètes (`cautions`, 2FA, utilisateurs, objets trouvés, inbox, super-admin), URL ICS unique par run, soumission RC atomique dans `dispatch`, et délais des scénarios longs — complément du soir, suite portée à 204 tests : 200 verts / 3 échecs / 1 sauté (24,9 min) puis reliquat corrigé et vérifié par spec ; cause racine du dernier échec de navigation interne : libellés i18n paramétrés non sérialisables (dernier appel `data.t.*` dans `/hote/assistant`, converti en dictionnaire client + `langue` exposée) ; `cookies.spec.ts` réécrite sur le bandeau « Choix de suivi » et la page de consentement ; timeouts 120 s sur `avis` et `voyageur` ; `ENQUIRY_ENABLED=true` requis côté serveur déjà lancé (fourni par `playwright.config.ts` sinon). Re-mesures : `npm run check` 0/0, vitest 242 fichiers / 1 402 tests verts (2 sautés), e2e `cookies` 2/2 (5,7 s), `voyageur` 2/2, `avis` 1/1, `extras` 1/1, `demande-sejour` 5/5 (22,8 s avec `avis`), `experience-voyageur` 2/2 ; ajout d’un mode de mesure sur build figé (`PW_SERVEUR=prod` + `PW_PORT`, en-têtes `x-forwarded-proto` et `origin`) : 194/204 en 23,6 min, écarts expliqués — 3 CSRF `request.post` (corrigé, 10/10 en reprise), 3 traces effacées par un run concurrent, 2 Mailpit injoignable, 1 `factures` restée en brouillon (à instruire, vu uniquement en mode production)
- [x] T905 Vérifier le budget JS et le rendu sans JS — fait 2026-11-10 (`tests/budget-js.test.ts` 3 verts / 1 sauté ; e2e `api-integrations`, `import-onboarding`, `onboarding` et `tarifs` verts en projet `sans-js`)
- [x] T906 Vérifier qu'aucun secret n'est dans Git — fait 2026-11-10 (seuls `.env.example`/`.env.prod.example` suivis ; recherche `sk_live_`, `NUKI_API_TOKEN=`, `BREVO_API_KEY=`, `STRIPE_SECRET_KEY=` : seule occurrence factice dans un test de chiffrement)
- [ ] T907 Rejouer les scénarios de `quickstart.md` — partiel 2026-11-10 : scénarios internes couverts par e2e (`experience-voyageur` guide/avis/extras/serrure, `api-integrations` clé/401/403/révocation/Nuki, `import-onboarding` CSV/réservation test, `onboarding`) ; scénarios 1–5 (canal sandbox, Stripe, inbox OTA, PriceLabs, relevé réel) non rejouables sans comptes sandbox et données de production
- [ ] T908 Revue de sortie : 0 surbooking, 1 réservation directe payée, 1 relevé envoyé, 3 intégrations

---

## Dependencies et ordre

```text
L0 (T001-T012)
  └─ Fondations (T020-T028)
       ├─ US1 Distribution (T100-T128)
       │    ├─ US3 Messagerie (T300-T324)  [OTA messaging dépend de US1]
       │    └─ US4 Pricing (T400-T414)     [push dépend de US1]
       ├─ US2 Site/Paiement (T200-T229)
       │    ├─ US5 Reporting (T500-T514)
       │    └─ US6 Expérience (T600-T612)
       ├─ US7 API (T700-T719)              [après US1-US3]
       └─ US8 Onboarding (T800-T811)       [après US2, US5]
```

## MVP

Le MVP vendable est **US1 + US2 + US3** :

- distribution temps réel ;
- réservation directe payée ;
- inbox unifiée.

US4-US8 sont des incréments de rétention et de scale.

## Parallélisation

- US1 et US2 peuvent démarrer ensemble après les fondations (le site ne dépend
  pas du canal).
- US3 peut démarrer par email/SMS avant le messaging OTA.
- US4 et US5 peuvent tourner en parallèle de US6/US7 si la capacité le permet.
- US8 ne démarre qu'après un pilote réel sur US2 et US5.

## Notes

- Chaque tâche de code doit avoir son test ou une tâche de test associée.
- Les migrations sont numérotées et ne sont jamais éditées après application.
- Un flag tenant permet de désactiver chaque module.
- Aucune tâche ne touche la V1 ou le lab.
