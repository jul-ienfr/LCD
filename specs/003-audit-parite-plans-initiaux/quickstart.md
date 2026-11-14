# Quickstart — Audit & Exécution Parité Plans Initiaux vs V2

## Comment lire cet artefact

Cette feature Spec Kit (`003-audit-parite-plans-initiaux`) organise l'exécution du reste à faire identifié par l'audit complet. Elle ne contient pas de nouveau code — elle **pilote** l'exécution de tâches existantes.

### Structure

| Fichier | Rôle |
|---|---|
| `spec.md` | Périmètre, user stories, exigences, critères de succès |
| `plan.md` | Contexte technique, constitution check, structure |
| `tasks.md` | **Liste des tâches à cocher** — c'est le fichier de suivi |
| `quickstart.md` | Ce fichier — comment démarrer |

### Documents associés (hors spec)

| Document | Rôle |
|---|---|
| `AUDIT-COMPLET-PLANS-VS-V2.md` (racine) | L'audit complet détaillé (source de vérité) |
| `specs/002-parite-lodgify/tasks.md` | Les 194 tâches de la parité Lodgify (référence) |
| `docs/plans/ROADMAP-PARITE-2026-11.md` | Le calendrier et les gates |
| `docs/decisions/` | Les 5 ADR à signer |
| `v2/TESTS-A-FAIRE.md` | Les 143 cases de recette post-déploiement |
| `v2/docs/qa-manuel.md` | Les 21 cases de QA manuelle |

## Comment démarrer MAINTENANT

### Étape 1 : Signer L0 (cette semaine, ~7 h)

C'est **LE** bloquant. Tout le reste attend.

1. Ouvrir `docs/decisions/PACK-SIGNATURE-L0.md`
2. Suivre les 5 actions humaines listées
3. Signer chaque ADR dans `docs/decisions/ADR-0X-*.md`
4. Plafonner le budget dans `docs/decisions/BUDGET-PARTENAIRES-2026-11.md`
5. Cocher les 7 critères dans `docs/decisions/README.md`

### Étape 2 : Finaliser US1/US2/US3 (nov-déc)

Une fois L0 signé :
1. Créer les comptes sandbox (Beds24, Channex, Stripe test)
2. Lancer les tests de contrat (T113-T115)
3. Lancer le double-run 14 j (T127)
4. Payer 1 réservation en test (T229)

### Étape 3 : Déployer et recetter

1. Déployer sur environnement réel
2. Exécuter les 143 cases de `TESTS-A-FAIRE.md`
3. Exécuter les 21 cases de `qa-manuel.md`

## Comment suivre la progression

- Cocher les cases `[ ]` → `[x]` dans `tasks.md` au fur et à mesure
- Mettre à jour `docs/registres/changelog.md` à chaque jalon
- Vérifier les gates M0-M7 dans `docs/plans/ROADMAP-PARITE-2026-11.md`

## Comment reprendre si interruption

1. Lire ce fichier (quickstart.md)
2. Ouvrir `tasks.md` et repérer la dernière case cochée
3. Reprendre à la tâche suivante non cochée
4. Vérifier les dépendances dans la section "Dependencies & Execution Order"

## Règles de dérive (de la roadmap)

- Un lot qui dépasse 20 % de sa charge → réduire le périmètre, pas la qualité
- Un gate non atteint → ne pas ouvrir le lot suivant
- Une décision partenaire non signée → geler le lot dépendant
- Un incident client → priorité absolue
- Une nouvelle idée → la noter dans `docs/registres/a-trancher.md`

## Contacts et RACI

| Activité | Responsable |
|---|---|
| ADR partenaires | Fondateur (A/R) + juriste (C pour ADR-02) |
| Benchmark sandbox | Fondateur (R) |
| Code L1-L7 | Fondateur (R/A) |
| Recette métier | Fondateur (A) + client pilote (R) |
| Budget/refacturation | Fondateur (A/R) + comptable (C) |
| Onboarding pilote | Fondateur (A) + client pilote (R) |
