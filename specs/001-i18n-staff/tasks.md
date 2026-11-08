# Tasks: i18n staff cinq langues

**Input**: `specs/001-i18n-staff/spec.md`, `plan.md`

**Tests**: obligatoires (dictionnaires, repli, complétude).

## Phase 1 — Fondations (déjà livré)

- [x] T001 Socle `resoudreLangue()` et cookie `lcd_langue`
- [x] T002 Endpoint `/api/langue` avec retour interne validé
- [x] T003 Connexion, tableau de bord et menus en cinq langues
- [x] T004 Journal d’audit localisé (hors libellés d’actions techniques)
- [x] T005 Tests de dictionnaires et repli

## Phase 2 — US1 Planning et canaux (P1)

- [x] T010 [P] [US1] Recenser les chaînes de `/hote/planning`
- [x] T011 [P] [US1] Recenser les chaînes de `/hote/planning/canaux`
- [x] T012 [US1] Créer `v2/src/lib/i18n-planning.ts` (5 langues)
- [x] T013 [US1] Charger `lcd_langue` et `t` dans les `+page.server.ts`
- [x] T014 [US1] Remplacer les libellés dans les deux `+page.svelte`
- [x] T015 [US1] Tester les dictionnaires et le repli
- [x] T016 [US1] `check`, Vitest, build

## Phase 3 — US2 Logements et ménage (P1)

- [x] T020 [P] [US2] Créer `v2/src/lib/i18n-logements.ts`
- [x] T021 [P] [US2] Créer `v2/src/lib/i18n-menage.ts`
- [x] T022 [US2] Brancher la page serveur et le formulaire logements
- [x] T023 [US2] Localiser les erreurs de validation serveur du ménage
- [x] T024 [US2] Tester les cinq langues de logements
- [x] T025 [US2] `check`, Vitest, build, `db:check`

## Phase 4 — US3 Factures et compta (P2)

- [x] T030 [P] [US3] Dictionnaires factures/compta
- [x] T031 [US3] Brancher listes, détail, paiements et exports
- [x] T032 [US3] Vérifier que les en-têtes CSV/PDF restent stables
- [x] T033 [US3] Tests et vérifications

## Phase 5 — US4 Relation voyageur (P2)

- [x] T040 [P] [US4] Dictionnaires messages/avis/questionnaires
- [x] T041 [P] [US4] Dictionnaires objets trouvés/sinistres/tranquillité
- [x] T042 [US4] Brancher les pages et actions
- [x] T043 [US4] Tests et vérifications

## Phase 6 — US5 Conformité et administration (P3)

- [x] T050 [P] [US5] Dictionnaires annonce/onboarding/formation/police/RGPD
- [x] T051 [P] [US5] Dictionnaires recherche/accès/propriétaires/entité
- [x] T052 [P] [US5] Dictionnaires intégrations/utilisateurs/sécurité
- [x] T053 [US5] Finaliser les libellés d’actions du journal d’audit — décision : codes techniques bruts hors français, l’interface affiche le code et les filtres restent localisés
- [x] T054 [US5] Tests et vérifications

## Phase 7 — Convergence

- [x] T060 Passer `ECARTS-V1.md` i18n à **Fait**
- [x] T061 Mettre à jour `PLAN-I18N-STAFF.md` et le changelog
- [x] T062 `npm run check`, `npx vitest run`, `npm run build`, `npm run db:check`
