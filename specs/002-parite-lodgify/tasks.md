# Tasks: Parité fonctionnelle Lodgify — intégration LCD V2

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
- [ ] T011 Créer les flags tenant `distribution`, `site_paiement`, `inbox`, `pricing`, `reporting`, `api`, `integrations` dans `v2/src/lib/server/feature-flags.ts`
- [ ] T012 Documenter la convention de migration expand/backfill/contract dans `v2/drizzle/README.md`

**Gate L0**: 5 ADR signés, fournisseur pilote choisi, budget plafonné. Aucune
ligne de code métier avant.

---

## Phase 2 — Fondations partagées

**But**: socle commun à toutes les histoires.

- [ ] T020 [P] Ajouter les helpers d'idempotence `cleIdempotence()` et `hashPayload()` dans `v2/src/domain/idempotence.ts` + tests
- [ ] T021 [P] Ajouter le journal structuré `logger.ts` avec `tenantId`, `requestId`, `canal` dans `v2/src/lib/server/logger.ts`
- [ ] T022 [P] Ajouter les métriques sync/webhook/messages dans `v2/src/lib/server/metriques.ts`
- [ ] T023 [P] Ajouter le chiffrement applicatif des identifiants partenaires dans `v2/src/lib/server/chiffrement.ts` + tests
- [ ] T024 [P] Ajouter le rate limiter générique dans `v2/src/lib/server/rate-limit.ts` + tests
- [ ] T025 Étendre `withTenant()` et les tests RLS aux nouvelles tables dans `v2/src/lib/server/db.ts`
- [ ] T026 [P] Ajouter le harnais de contrat sandbox dans `v2/tests/contract/harnais.ts`
- [ ] T027 [P] Ajouter le test de budget JS dans `v2/tests/budget-js.test.ts`
- [ ] T028 [P] Ajouter le test de rendu sans JS générique dans `v2/tests/e2e/sans-js.spec.ts`

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
- [ ] T100 [P] [US1] Étendre `CapacitesFournisseur` (messaging, multiUnite, googleVr) dans `v2/src/domain/fournisseur.ts` + tests
- [ ] T101 [P] [US1] Ajouter `SanteConnexion` et `EvenementCanal` dans `v2/src/domain/canal.ts` + tests
- [ ] T102 [US1] Étendre `FournisseurCanal` (`lireSante`, `lireMessages`, `envoyerMessage`) dans `v2/src/application/ports/fournisseur-canal.ts`
- [ ] T103 [P] [US1] Étendre `FournisseurRepository` existant (mapping, santé, activation) dans `v2/src/application/ports/fournisseur-repository.ts`
- [x] T104 [P] [US1] Ajouter `EvenementCanalRepository` dans `v2/src/application/ports/evenement-canal-repository.ts` — fait 2026-11-06

### Migration et repositories

- [x] T105 [US1] Migration expand : colonnes santé sur `logements_fournisseurs`, table `evenements_canal` dans `v2/drizzle/` — fait 2026-11-06 (0085 + RLS)
- [x] T106 [US1] Étendre le repository Drizzle `fournisseur-repository.ts` + créer `evenement-canal-repository.ts`, avec RLS — fait 2026-11-06
- [x] T107 [P] [US1] Vérifier RLS de `evenements_canal` via `npm run db:test-rls` (script `verifier-rls.mjs` étendu) — fait 2026-11-06 (isolation insert/select validée)
- [x] T108 [US1] Vérifier/backfiller les mappings `logements_fournisseurs` existants, sans dupliquer `canaux` (script idempotent) — fait 2026-11-06 (`db:test-mappings` ; 0 mapping local, à rejouer en prod)

### Adapter Beds24/Channex

- [ ] T109 [US1] Étendre l'adapter `beds24` existant (santé, messaging, erreurs, rate limit) dans `v2/src/infrastructure/adapters/fournisseurs/beds24.ts`
- [ ] T110 [US1] Compléter `pousserDisponibilites`, `pousserTarifs`, `pousserRestrictions` par différence + batch
- [ ] T111 [US1] Compléter `recupererReservations` + normalisation
- [ ] T112 [US1] Vérifier `verifierWebhook` existant et ajouter `lireSante` à l'adapter
- [ ] T113 [P] [US1] Tests de contrat sandbox ARI dans `v2/tests/contract/beds24-ari.test.ts`
- [ ] T114 [P] [US1] Tests de contrat sandbox booking/webhook dans `v2/tests/contract/beds24-booking.test.ts`
- [ ] T115 [US1] Tests 409/429/timeout et backoff dans `v2/tests/infrastructure/beds24-erreurs.test.ts`

### Use cases

- [ ] T116 [US1] Étendre `affecter-fournisseur` avec test de connexion, santé et activation dans `v2/src/application/use-cases/affecter-fournisseur.ts` + test
- [ ] T117 [US1] Vérifier/étendre `SynchroniserFournisseur` (empreinte, `force` webhook, push complet) — pas d'outbox par opération — dans `v2/src/application/use-cases/synchroniser-fournisseur.ts` + test
- [ ] T118 [US1] Étendre `ImporterReservationsFournisseur` (webhook, anti-écho, conflits) dans `v2/src/application/use-cases/importer-reservations-fournisseur.ts` + test
- [x] T119 [US1] `reconcilierCanal()` : pull de sécurité, comparaison, alerte dans `v2/src/application/use-cases/reconcilier-canal.ts` + test — fait 2026-11-06 (use case + cron `/api/cron/reconcile-fournisseurs`)
- [x] T120 [US1] Vérifier/étendre le scheduler existant `v2/src/lib/server/fournisseur-scheduler.ts` avec la réconciliation + test — fait 2026-11-06 (timer 24 h séparé, verrou partagé, couvert par les tests reconciliation)
- [x] T121 [US1] Vérifier/étendre le webhook existant `/api/fournisseurs/[code]/webhook` (signature, 200 rapide, file) dans `v2/src/routes/api/fournisseurs/[code]/webhook/+server.ts` — fait 2026-11-06 (202 + `demandes_sync`, journal `evenements_canal`, plus de sync inline)
- [x] T122 [US1] Anti-écho : ignorer un événement issu de notre propre push dans `importer-reservations-fournisseur.ts` + test — fait 2026-11-06 (comparaison `contenuIdentique` + test d'idempotence ; les adapters n'exposent pas encore d'origine)

### UI

- [x] T123 [US1] Étendre l'écran santé existant `/supervision/fournisseurs` et la vue tenant `/hote/planning/canaux` (dernier push/pull, erreurs) — fait 2026-11-06 (déjà présent : dernière sync, statut, message, santé)
- [x] T124 [US1] Bouton « resynchroniser » + confirmation + audit — fait 2026-11-06 (confirmation ajoutée, action auditée existante)
- [x] T125 [US1] Alerte si dernier pull > 15 min dans le centre de notifications — fait 2026-11-06 (section « Centre de notifications » sur `/supervision/fournisseurs` : erreur, jamais, retard > 15 min)
- [ ] T126 [US1] Test e2e connexion + réservation sandbox dans `v2/e2e/canaux-temps-reel.spec.ts`
- [ ] T129 [US1] Frais par canal (animaux, ménage, service) + mapping des politiques d'annulation + tests

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
- [~] T209 [US2] Domaines : vérification DNS, statut, activation — fait 2026-11-07 (`domaine-dns.ts`, 5 tests) ; RESTE : TLS, redirection et routage par `Host` (SvelteKit résout la route avant `handle` : la réécriture doit vivre dans le proxy ou un `reroute` de build, cf. ADR-04 § Réserve de routage)
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

- [ ] T300 [P] [US3] Domaine `fil-voyageur.ts` (regroupement, consentement) + tests
- [ ] T301 [P] [US3] Ports `FilsVoyageurRepository`, `AutomatisationsRepository`
- [ ] T302 [US3] Migration `fils_voyageur`, `pieces_jointes_message`, `automatisations`, `executions_automatisation`
- [ ] T303 [US3] Migration additive `messages_voyageur` (`fil_id`, `canal`, `external_id`, `pieces_jointes`)
- [ ] T304 [US3] Backfill : un fil par réservation existante, messages rattachés
- [ ] T305 [US3] Repositories Drizzle + RLS + tests

### Connecteurs

- [ ] T306 [US3] Connecteur OTA (si messaging exposé) : réception + envoi
- [ ] T307 [US3] Connecteur email IMAP/SMTP : parsing, In-Reply-To, pièces jointes
- [ ] T308 [US3] Connecteur SMS Brevo : envoi + statut
- [ ] T309 [US3] Connecteur WhatsApp Business (optionnel, flag)
- [ ] T310 [P] [US3] Tests de contrat connecteurs dans `v2/tests/contract/messagerie.test.ts`

### Automatisations et IA

- [ ] T311 [US3] Use case `ouvrirFil()` + rattachement automatique dans `v2/src/application/use-cases/ouvrir-fil.ts`
- [ ] T312 [US3] Use case `envoyerMessage()` : canal, pièces jointes, audit dans `v2/src/application/use-cases/envoyer-message.ts`
- [ ] T313 [US3] Use case `executerAutomatisation()` : déclencheur, conditions, brouillon dans `v2/src/application/use-cases/executer-automatisation.ts`
- [ ] T314 [US3] Job de déclenchement J-7/J-1/départ/J+1 dans `v2/src/lib/server/planificateur-messages.ts`
- [ ] T315 [US3] IA : prompt contextualisé, brouillon, audit, coût dans `v2/src/application/use-cases/assistant.ts`
- [ ] T316 [US3] Traduction entrante/sortante (optionnelle, flag)
- [ ] T317 [US3] Consentements/opt-out par canal + test

### UI

- [ ] T318 [US3] Inbox `/hote/messages` : liste, filtres, non-lus, assignation
- [ ] T319 [US3] Fil `/hote/messages/[id]` : messages, réponse, pièces jointes, IA
- [ ] T320 [US3] Écran automatisations `/hote/automatisations`
- [ ] T321 [US3] Centre de notifications : messages, réservations à confirmer, retards
- [ ] T322 [US3] Test e2e inbox + brouillon + validation dans `v2/e2e/inbox.spec.ts`

### Gate US3

- [ ] T323 [US3] 80 % des messages de test dans un fil, 0 envoi auto non validé
- [ ] T324 [US3] `check`, Vitest, build, RLS verts

---

## Phase 6 — US4 Pricing (P2)

**Goal**: recommandations explicables, application bornée, push canal.

- [ ] T400 [P] [US4] Domaine `recommandation-prix.ts` (bornes, override, facteurs) + tests
- [ ] T401 [P] [US4] Port `Pricing` dans `v2/src/application/ports/pricing.ts`
- [ ] T402 [US4] Migration `recommandations_prix`
- [ ] T403 [US4] Repository + RLS + tests
- [ ] T404 [US4] Adapter PriceLabs (ou Beyond) : auth, import 18 mois, facteurs
- [ ] T405 [US4] Use case `importerRecommandations()` + job quotidien
- [ ] T406 [US4] Use case `appliquerRecommandation()` : bornes, audit, push canal
- [ ] T407 [US4] Override manuel qui gagne sur la recommandation
- [ ] T408 [US4] Écran `/hote/prix/recommandations` : prix actuel/recommandé/écart
- [ ] T409 [US4] Détail « pourquoi ce prix » : facteurs, confiance, historique
- [ ] T410 [US4] Alerte panne partenaire sans modification des prix
- [ ] T411 [P] [US4] Tests de contrat pricing dans `v2/tests/contract/pricing.test.ts`
- [ ] T412 [US4] Test e2e application + push canal dans `v2/e2e/pricing.spec.ts`
- [ ] T413 [US4] Comparaison RevPAR avant/après sur 30 jours
- [ ] T414 [US4] Gate : 1 logement en dynamique 30 jours, décision documentée

---

## Phase 7 — US5 Reporting et relevés (P2)

**Goal**: occupation/ADR/RevPAR, mix canal, relevé propriétaire récurrent.

- [ ] T500 [P] [US5] Domaine `releve-proprietaire.ts` (agrégats, commission, arrondis) + tests
- [ ] T501 [P] [US5] Ports `RelevesRepository`, `EnvoisRelevesRepository`
- [ ] T502 [US5] Migration `releves_proprietaires`, `envois_releves`
- [ ] T503 [US5] Repositories + RLS + tests
- [ ] T504 [US5] Requêtes d'agrégats occupation/ADR/RevPAR/mix canal dans `v2/src/infrastructure/db/repositories/rapports-repository.ts`
- [ ] T505 [US5] Use case `genererReleve()` : période, logements, revenus, dépenses
- [ ] T506 [US5] PDF relevé + tests de rendu
- [ ] T507 [US5] Use case `envoyerReleve()` + archive + audit
- [ ] T508 [US5] Job de récurrence mensuelle/trimestrielle
- [ ] T509 [US5] Alertes écart de rapprochement/impayé/marge négative
- [ ] T510 [US5] Écran `/hote/rapports` : filtres, KPIs, export
- [ ] T511 [US5] Portail propriétaire : relevés consultables/téléchargeables
- [ ] T512 [US5] Export comptable stable + documentation
- [ ] T513 [US5] Test e2e relevé généré/envoyé/consulté dans `v2/e2e/releves.spec.ts`
- [ ] T515 [US5] Suivi des paiements propriétaires (payouts) + rapprochement + test
- [ ] T514 [US5] Gate : 1 relevé réel envoyé à un propriétaire

---

## Phase 8 — US6 Expérience voyageur (P2)

**Goal**: guide, instructions, serrure, demandes, avis.

- [ ] T600 [P] [US6] Domaine `guide-voyageur.ts` (sections, langues, lien signé) + tests
- [ ] T601 [US6] Migration `guide_contenus`, `acces_serrure`
- [ ] T602 [US6] Repositories + RLS + tests
- [ ] T603 [US6] Éditeur de guide `/hote/logements/[id]/guide`
- [ ] T604 [US6] Page publique guide `/guide/[token]` sans compte, sans JS obligatoire
- [ ] T605 [US6] Job d'envoi instructions J-7/J-1 + lien guide
- [ ] T606 [US6] Adapter Nuki : création/révocation de code, audit
- [ ] T607 [US6] Fallback code manuel si serrure indisponible
- [ ] T608 [US6] Demande départ tardif/extra avec prix + validation staff
- [ ] T609 [US6] Demande d'avis J+1 + affichage des avis publiés
- [ ] T610 [US6] PWA : installation, notifications si supportées
- [ ] T611 [P] [US6] Tests Nuki sandbox dans `v2/tests/contract/nuki.test.ts`
- [ ] T612 [US6] Test e2e guide + code + révocation dans `v2/e2e/experience-voyageur.spec.ts`

---

## Phase 9 — US7 API et intégrations (P3)

**Goal**: API lecture, clés, webhooks, 3 partenaires, Zapier.

- [ ] T700 [P] [US7] Domaine `cle-api.ts` (scopes, hash, expiration) + tests
- [ ] T701 [P] [US7] Ports `ClesApiRepository`, `IntegrationsRepository`
- [ ] T702 [US7] Migration `cles_api`, `integrations_tenant`
- [ ] T703 [US7] Repositories + RLS + tests
- [ ] T704 [US7] Middleware auth API + rate limit + journal dans `v2/src/lib/server/api-auth.ts`
- [ ] T705 [US7] Endpoints `/api/v1/logements`, `/reservations`, `/disponibilites`, `/prix`, `/proprietaires`, `/releves`
- [ ] T706 [US7] Pagination, erreurs, `requestId`, OpenAPI
- [ ] T707 [US7] Webhooks signés + retry + rejeu + UI
- [ ] T708 [P] [US7] Tests de contrat API dans `v2/tests/contract/api-v1.test.ts`
- [ ] T709 [P] [US7] Tests RLS API multi-tenant dans `v2/tests/rls/api-v1.test.ts`
- [ ] T710 [US7] UI clés API `/hote/integrations/api`
- [ ] T711 [US7] Adapter Nuki (réutiliser US6) + page intégration
- [ ] T712 [US7] Adapter guide partenaire (Duve/Touch Stay) si retenu
- [ ] T713 [US7] Adapter Swikly caution
- [ ] T714 [US7] App Zapier/Make générique (optionnelle)
- [ ] T715 [US7] Serveur MCP lecture (optionnel, après API)
- [ ] T716 [US7] Documentation `/developpeurs` + exemples cURL
- [ ] T717 [US7] Test e2e clé + webhook + partenaire dans `v2/e2e/api-integrations.spec.ts`
- [ ] T718 [US7] Gate : 3 intégrations live, API documentée
- [ ] T719 [US7] `check`, Vitest, build, RLS verts
- [ ] T720 [US7] Analytics/pixels et marque blanche par tenant (optionnel, flag)

---

## Phase 10 — US8 Onboarding (P3)

**Goal**: une conciergerie s'installe seule en un jour.

- [ ] T800 [P] [US8] Modèle de check-list et état dans `v2/src/domain/onboarding.ts` + tests
- [ ] T801 [US8] Écran `/hote/onboarding` : étapes, progression, liens
- [ ] T802 [US8] Import CSV logements/réservations + rapport d'erreurs ligne par ligne
- [ ] T803 [US8] Import iCal existant + détection de doublons
- [ ] T804 [US8] Tenant de démonstration en lecture seule + seed
- [ ] T805 [US8] Aide contextuelle par écran + base d'articles
- [ ] T806 [US8] Page publique tarifs FULL/PILOTAGE/KIT + calculateur + FAQ
- [ ] T807 [US8] Parcours de réservation test guidé
- [ ] T808 [P] [US8] Tests d'import et de doublons dans `v2/tests/import.test.ts`
- [ ] T809 [US8] Test e2e onboarding complet dans `v2/e2e/onboarding.spec.ts`
- [ ] T810 [US8] Chrono réel d'onboarding + documentation
- [ ] T811 [US8] Gate : 1 conciergerie onboardée en 1 jour sans le fondateur

---

## Phase 11 — Convergence

- [ ] T900 Mettre à jour `v2/ECARTS-V1.md` pour chaque écart comblé
- [ ] T901 Mettre à jour `docs/analyses/LODGIFY-VS-LCD-2026-11.md` (statuts)
- [ ] T902 Mettre à jour `replica/features.csv` (original/clone/notes)
- [ ] T903 Mettre à jour `docs/registres/changelog.md`
- [ ] T904 Vérifier `npm run check`, `npx vitest run`, `npm run build`, `npm run db:check`, `npm run db:test-rls`, `npm run test:e2e`
- [ ] T905 Vérifier le budget JS et le rendu sans JS
- [ ] T906 Vérifier qu'aucun secret n'est dans Git
- [ ] T907 Rejouer les scénarios de `quickstart.md`
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
