# Tasks: Audit & Exécution — Parité Plans Initiaux vs V2

```text
Statut : REMPLACÉ
Propriétaire : produit
Dernière vérification : 2026-11-14
Remplace / remplacé par : specs/002-parite-lodgify/
Source de vérité : specs/002-parite-lodgify/tasks.md
```

**Input**: Design documents from `/specs/003-audit-parite-plans-initiaux/`

**Prerequisites**: plan.md (required), spec.md (required for user stories)

**Tests**: inclus pour les gates de validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup — Signer L0 (US1, Priority: P1) 🎯 MVP

**Purpose**: Débloquer tout le reste en signant les 5 ADR et plafonnant le budget.

**Goal**: Gate M0 atteinte — 5 ADR signées, budget plafonné, fournisseur pilote choisi.

**Independent Test**: `docs/decisions/README.md` passe à 7/7 cases cochées.

**Deadline**: 15 novembre 2026

### Actions humaines (non-automatisables)

- [ ] T001 [US1] Créer compte sandbox Beds24 (~30 min)
- [ ] T002 [P] [US1] Créer compte sandbox Channex (gratuit, ~30 min)
- [ ] T003 [P] [US1] Créer compte Stripe test (~30 min)
- [ ] T004 [US1] Remplir `docs/decisions/benchmark-grille.md` avec les 2 sandboxes (2 h, dépend T001+T002)
- [ ] T005 [P] [US1] Demander avis juridique ADR-02 (encaissement pour autrui) (1 h)
- [ ] T006 [US1] Signer ADR-01 (fournisseur distribution) dans `docs/decisions/ADR-01-fournisseur-distribution.md` (15 min, dépend T004)
- [ ] T007 [US1] Signer ADR-02 (paiement Stripe) dans `docs/decisions/ADR-02-paiement.md` (15 min, dépend T005)
- [ ] T008 [P] [US1] Signer ADR-03 (pricing PriceLabs/Beyond) dans `docs/decisions/ADR-03-pricing.md` (15 min)
- [ ] T009 [P] [US1] Signer ADR-04 (site public mini-builder) dans `docs/decisions/ADR-04-site-public.md` (15 min)
- [ ] T010 [P] [US1] Signer ADR-05 (messagerie en couches) dans `docs/decisions/ADR-05-messagerie.md` (15 min)
- [ ] T011 [US1] Plafonner budget partenaires dans `docs/decisions/BUDGET-PARTENAIRES-2026-11.md` (30 min, dépend T006-T010)
- [ ] T012 [US1] Cocher les 18 cases de `docs/decisions/PACK-SIGNATURE-L0.md` (15 min, dépend T011)
- [ ] T013 [US1] Cocher les 7 critères de sortie dans `docs/decisions/README.md` (15 min, dépend T012)
- [ ] T014 [US1] Mettre à jour `docs/registres/changelog.md` avec entrée `signature-l0`

**Checkpoint**: Gate M0 atteinte. Tout code métier L1+ est désormais autorisé.

---

## Phase 2: Foundational — Finaliser US1/US2/US3 (US2, Priority: P2)

**Purpose**: Terminer les 25 tâches restantes des lots déjà entamés.

**⚠️ CRITICAL**: Dépend de Phase 1 (L0 signé) pour les tests sandbox.

### US1 Distribution — 17 tâches restantes

- [ ] T020 [US2] T102 : Push ARI complet (pas de diff) dans `v2/src/infrastructure/adapters/`
- [ ] T021 [US2] T109 : Réservations entrantes temps réel dans `v2/src/application/use-cases/`
- [ ] T022 [US2] T110 : Push complet disponibilité dans `v2/src/infrastructure/adapters/`
- [ ] T023 [US2] T112 : Statut réservation → canal dans `v2/src/application/use-cases/`
- [ ] T024 [US2] T113-T115 : Tests contrat sandbox (dépend clés T001/T002) dans `v2/tests/`
- [ ] T025 [US2] T126 : E2E sandbox complet (dépend T024) dans `v2/e2e/`
- [ ] T026 [US2] T127 : Double-run iCal+API 14 jours (dépend T025, automatique)
- [ ] T027 [US2] T129 : Frais par canal dans `v2/src/domain/`
- [ ] T028 [US2] Vérifier gate M1 : 0 surbooking sur 14 j

### US2 Site + Paiement — 2 tâches + 1 partiel

- [ ] T030 [US2] T229 : Gate réservation payée (dépend clé Stripe test T003) dans `v2/e2e/`
- [ ] T031 [US2] T209 : TLS + routage par Host (config proxy/Caddy) dans `v2/`

### US3 Inbox — 6 tâches restantes

- [ ] T032 [US2] T307 : Configurer boîte IMAP dédiée (action humaine)
- [ ] T033 [US2] T306 : Connecteur messaging OTA (bloqué jusqu'à compte partenaire)
- [ ] T034 [US2] T309 : WhatsApp Business API (bloqué jusqu'à compte Meta)
- [ ] T035 [US2] T310 : Tests contrat complets (dépend T033)
- [ ] T036 [US2] T315 : Brancher IA suggestions 1-tap dans `v2/src/application/use-cases/`
- [ ] T037 [US2] T316 : Traduction auto messages dans `v2/src/infrastructure/adapters/` (dépend T036)

### Fondations transverses — 9 tâches

- [ ] T040 [P] [US2] T020 : Fondation transverse 1 dans `v2/src/`
- [ ] T041 [P] [US2] T021 : Fondation transverse 2 dans `v2/src/`
- [ ] T042 [P] [US2] T022 : Fondation transverse 3 dans `v2/src/`
- [ ] T043 [P] [US2] T023 : Fondation transverse 4 dans `v2/src/`
- [ ] T044 [P] [US2] T024 : Fondation transverse 5 dans `v2/src/`
- [ ] T045 [P] [US2] T025 : Fondation transverse 6 dans `v2/src/`
- [ ] T046 [P] [US2] T026 : Fondation transverse 7 dans `v2/src/`
- [ ] T047 [P] [US2] T027 : Fondation transverse 8 dans `v2/src/`
- [ ] T048 [US2] T028 : Fondation transverse 9 dans `v2/src/`

**Checkpoint**: Gates M1, M2, M3 atteintes. US1/US2/US3 complets.

---

## Phase 3: User Story 4 — L4 Revenue Management (Priority: P3)

**Goal**: 1 logement en pricing dynamique pendant 30 jours.

**Independent Test**: Gate M4 — RevPAR comparé sur 30 j.

**Dépendance**: L0 (ADR-03 signée) + L1 (distribution active)

- [ ] T050 [US4] T400 : Créer port Pricing dans `v2/src/application/ports/`
- [ ] T051 [P] [US4] T401 : Adapter PriceLabs dans `v2/src/infrastructure/adapters/`
- [ ] T052 [P] [US4] T402 : Adapter Beyond dans `v2/src/infrastructure/adapters/`
- [ ] T053 [US4] T403 : Import quotidien 18 mois dans `v2/src/application/use-cases/`
- [ ] T054 [US4] T404 : Écran "pourquoi ce prix" dans `v2/src/routes/hote/prix/`
- [ ] T055 [US4] T405 : Application bornée avec override dans `v2/src/domain/`
- [ ] T056 [US4] T406 : Push canal via L1 dans `v2/src/application/use-cases/`
- [ ] T057 [US4] T407-T414 : Tests + validation + docs (8 tâches)

**Checkpoint**: Gate M4 atteinte.

---

## Phase 4: User Story 5 — L5 Reporting (Priority: P3)

**Goal**: 1 relevé mensuel envoyé à un propriétaire.

**Independent Test**: Gate M5 — relevé réel reçu par email.

**Dépendance**: L2 (site + paiement)

- [ ] T060 [US5] T500 : Agrégats KPI (occupation, ADR, RevPAR, mix canal) dans `v2/src/domain/`
- [ ] T061 [US5] T501 : Relevé PDF dans `v2/src/infrastructure/adapters/`
- [ ] T062 [US5] T502 : Récurrence mensuelle/trimestrielle dans `v2/src/application/use-cases/`
- [ ] T063 [US5] T503 : Portail proprio dans `v2/src/routes/proprio/`
- [ ] T064 [US5] T504 : Exports compta dans `v2/src/routes/api/`
- [ ] T065 [US5] T505-T515 : Alertes, payouts, tests (11 tâches)

**Checkpoint**: Gate M5 atteinte.

---

## Phase 5: User Story 6 — L6 API publique (Priority: P3)

**Goal**: API documentée, 3 intégrations live.

**Independent Test**: Gate M6 — 3 intégrations fonctionnelles.

**Dépendance**: L1-L3

- [ ] T070 [US6] T600-T612 : Expérience voyageur (guide, serrure Nuki, demandes, avis, PWA) — 13 tâches
- [ ] T080 [US6] T700-T720 : API v1 lecture, clés/scopes, webhooks signés, adapters Nuki/Duve/Swikly, Zapier, docs — 21 tâches

**Checkpoint**: Gate M6 atteinte.

---

## Phase 6: User Story 7 — L7 Onboarding (Priority: P3)

**Goal**: 1 conciergerie onboardée en 1 jour sans le fondateur.

**Independent Test**: Gate M7 — chrono < 24 h.

**Dépendance**: L2, L5, client pilote

- [ ] T090 [US7] T800-T811 : Check-list, import CSV/iCal, tenant démo, aide, page tarifs, parcours test, chrono — 12 tâches

**Checkpoint**: Gate M7 atteinte.

---

## Phase 7: Déploiement et Recette (US3, Priority: P2)

**Goal**: 100 % des cases TESTS-A-FAIRE.md et qa-manuel.md cochées.

**Independent Test**: Toutes les cases de recette sont vertes.

- [ ] T100 [US3] Déployer V2 sur VPS/Netlify avec domaine réel
- [ ] T101 [US3] Configurer clés Stripe prod
- [ ] T102 [US3] Configurer SMTP réel
- [ ] T103 [US3] Appliquer migrations 0001→0093 sur prod
- [ ] T104 [US3] Exécuter TESTS-A-FAIRE.md (143 cases) dans `v2/TESTS-A-FAIRE.md`
- [ ] T105 [US3] Exécuter qa-manuel.md (21 cases) dans `v2/docs/qa-manuel.md`
- [ ] T106 [US3] Changer mots de passe dev
- [ ] T107 [US3] Configurer Sentry/monitoring
- [ ] T108 [US3] Cutover log1 pilote
- [ ] T109 [US3] Pilote 7 jours
- [ ] T110 [US3] Bascule log2/log3
- [ ] T111 [US3] Supprimer `v2/src/app/` (ancienne UI Next)

**Checkpoint**: Production validée, ancienne UI supprimée.

---

## Phase 8: Polish & Convergence

**Purpose**: Stabilisation, dette technique, docs

- [ ] T120 T900-T908 : Convergence spec 002 (9 tâches)
- [ ] T121 [P] Mise à jour `docs/registres/changelog.md`
- [ ] T122 [P] Mise à jour `v2/ECARTS-V1.md`
- [ ] T123 [P] Mise à jour `v2/TESTS-A-FAIRE.md`
- [ ] T124 Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (L0)**: No dependencies - can start immediately - BLOCKS all other phases
- **Phase 2 (US1/US2/US3)**: Depends on Phase 1 completion
- **Phase 3 (L4)**: Depends on Phase 1 (ADR-03) + Phase 2 (L1)
- **Phase 4 (L5)**: Depends on Phase 2 (L2)
- **Phase 5 (L6)**: Depends on Phase 2 (L1-L3)
- **Phase 6 (L7)**: Depends on Phase 4 (L5) + client pilote
- **Phase 7 (Déploiement)**: Depends on Phase 2 minimum
- **Phase 8 (Polish)**: Depends on all desired phases being complete

### Parallel Opportunities

- T001, T002, T003 can run in parallel (comptes sandbox)
- T008, T009, T010 can run in parallel (ADR indépendantes)
- T040-T048 (fondations) can run in parallel
- Phases 3, 4, 5 can run in parallel once Phase 2 is done (if staffed)

---

## Implementation Strategy

### MVP First (Phase 1 Only)

1. Complete Phase 1: Signer L0
2. **STOP and VALIDATE**: 7/7 cases cochées dans README décisions
3. Cela débloque tout le reste

### Incremental Delivery

1. Phase 1 → Gate M0 (15 nov)
2. Phase 2 → Gates M1/M2/M3 (déc-fév)
3. Phase 3 → Gate M4 (28 fév)
4. Phase 4 → Gate M5 (14 mars)
5. Phase 5 → Gate M6 (4 avr)
6. Phase 6 → Gate M7 (18 avr)
7. Phase 7 → Production validée
8. Phase 8 → Stabilisation

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Chaque gate correspond à un jalon M0-M7 de la roadmap
- Le gel fin d'année (24 déc - 3 jan) est intégré au calendrier
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
