# Implementation Plan: i18n staff cinq langues

**Branch**: `001-i18n-staff` | **Date**: 2026-11-04 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/001-i18n-staff/spec.md`

## Summary

Étendre le socle i18n déjà livré (connexion, tableau de bord, menus, audit)
aux pages métier staff, par lots indépendants. Chaque page reçoit un
dictionnaire typé à cinq langues, un chargement serveur de `lcd_langue` et des
tests de complétude. Les données métier, exports et PDF restent inchangés.

## Technical Context

**Language/Version**: TypeScript 5.x, Svelte 5, SvelteKit 3, Node 22
**Primary Dependencies**: SvelteKit, Tailwind 4, Drizzle, Vitest, Playwright
**Storage**: PostgreSQL (aucune migration prévue)
**Testing**: Vitest (dictionnaires, pages serveur), `svelte-check`, build
**Target Platform**: serveur Node (adapter-node), navigateurs staff
**Project Type**: application web
**Performance Goals**: aucun JavaScript client ajouté ; rendu serveur
**Constraints**: HTML-first, `csr = false` côté voyageur, budget staff < 200 Ko
**Scale/Scope**: pages staff existantes, cinq langues, zéro nouvelle route

## Constitution Check

- **Périmètre V2** : uniquement `v2/src` et `specs/`. V1/lab intacts.
- **Domaine pur** : les dictionnaires vivent dans `src/lib`, pas dans le
  domaine ; aucun import framework dans `src/domain`.
- **Sécurité tenant** : aucune requête modifiée ; `lcd_langue` n’est qu’une
  préférence d’affichage validée.
- **Qualité** : tests de dictionnaires, `check`, `build`, `db:check`.
- **i18n** : clés typées, repli français, `lang` HTML, `Intl`.

Aucune violation. Aucun test de non-régression Playwright supplémentaire n’est
nécessaire : les parcours et sélecteurs restent identiques.

## Project Structure

### Documentation

```text
specs/001-i18n-staff/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dictionnaires.md
└── tasks.md
```

### Source Code

```text
v2/src/lib/i18n-<page>.ts                    # dictionnaires typés
v2/src/routes/hote/<page>/+page.server.ts    # cookie + t
v2/src/routes/hote/<page>/+page.svelte       # libellés
v2/tests/i18n-staff.test.ts                  # complétude et repli
v2/PLAN-I18N-STAFF.md                        # couverture
v2/ECARTS-V1.md                              # statut global
```

**Structure Decision**: un fichier de dictionnaire par page ou groupe de pages
proches, pour limiter les conflits et permettre des lots indépendants.

## Phase 0 — Recherche

- Recenser les chaînes visibles de chaque page prioritaire.
- Identifier les libellés produits par le domaine (statuts, familles) et
  décider : traduction d’affichage ou conservation de la valeur technique.
- Vérifier les formats `Intl` existants et les usages de `fr-FR`.

## Phase 1 — Contrats

- Type `Traductions<Page>` avec toutes les clés obligatoires.
- `traductions<Page>(langue)` avec `resoudreLangue()`.
- Chaque `+page.server.ts` renvoie `t` et, si utile, `langue`.
- Aucune clé vide ; test générique sur les cinq langues.

## Phase 2 — Lots P1

1. Planning + canaux.
2. Logements.
3. Ménage.
4. Factures + compta.
5. Messages.

Chaque lot : dictionnaire, serveur, Svelte, test, `check`, build.

## Phase 3 — Lots P2/P3

Relation voyageur, conformité, administration. Même méthode, par page.

## Phase 4 — Convergence

- Passer `ECARTS-V1.md` à **Fait** pour i18n staff.
- Mettre à jour `PLAN-I18N-STAFF.md` et le changelog.
- Vérifier `check`, Vitest, build, `db:check`.

## Complexity Tracking

Aucune violation constitutionnelle. La complexité principale est le volume de
chaînes ; elle est réduite par des lots indépendants et des dictionnaires
typés.
