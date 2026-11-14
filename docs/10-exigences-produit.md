# Exigences produit — LCD V2

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/archive/v1/10-socle-v2.md
Source de vérité : specs/002-parite-lodgify/spec.md, specs/004-ergonomie-experience-client/spec.md, specs/005-mise-en-production/spec.md
```

Ce document ne réécrit pas les exigences : il indique **où elles vivent** et
comment les lire. Une exigence sans identifiant stable dans une spec n'est pas
une exigence opposable.

## Les trois specs qui portent les exigences

| Spec | Périmètre | Exigences |
|---|---|---|
| `specs/002-parite-lodgify/` | parité fonctionnelle avec Lodgify : distribution, site public, paiement, inbox, pricing, reporting, API, onboarding | FR de `spec.md`, matrice `traceability.md` |
| `specs/004-ergonomie-experience-client/` | ergonomie, accessibilité, thèmes, cibles tactiles, revue mensuelle | FR de `spec.md`, mesures dans `baseline/` |
| `specs/005-mise-en-production/` | environnement public, recette, migration V1 → V2, bascule | FR-001 → FR-036 de `spec.md` |

## Règles

1. Une exigence est identifiée `FR-xxx` dans **une** spec active.
2. Une exigence satisfaite cite une preuve datée (test, mesure, capture) dans
   `tasks.md` ou `traceability.md`.
3. Une exigence non satisfaite reste `[ ]` ou `[~]` avec son reste écrit.
4. Les documents V1 archivés ne créent plus d'exigence.

## Où sont les parcours client

| Parcours | Référence |
|---|---|
| Site public et réservation | `specs/002-parite-lodgify/` (US site public) |
| Connexion et espace staff | `specs/001-i18n-staff/` (clos) |
| Recette manuelle | `v2/TESTS-A-FAIRE.md` (161 cases) et `docs/ops/recette-2026-11/journal.md` (155 REC + 21 parcours) |
| Mise en production | `specs/005-mise-en-production/` |
