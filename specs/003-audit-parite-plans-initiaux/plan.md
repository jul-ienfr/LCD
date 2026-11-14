# Implementation Plan: Audit & Exécution — Parité Plans Initiaux vs V2

```text
Statut : REMPLACÉ
Propriétaire : produit
Dernière vérification : 2026-11-14
Remplace / remplacé par : specs/002-parite-lodgify/
Source de vérité : specs/002-parite-lodgify/spec.md
```

**Branch**: `003-audit-parite-plans-initiaux` | **Date**: 2026-11-09 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/003-audit-parite-plans-initiaux/spec.md`

## Summary

L'audit complet (document `AUDIT-COMPLET-PLANS-VS-V2.md` à la racine) a établi que la V2 est à ~95 % de parité logicielle avec la V1, que la spec 002-parite-lodgify est à 62/194 tâches (32 %), et que le bloquant n°1 est la gate L0 (5 ADR non signées). Ce plan organise l'exécution du reste à faire en 5 phases : A (débloquer L0), B (finaliser L1-L3), C (implémenter L4-L7), D (déployer et recetter), E (terrain/externe en parallèle).

## Technical Context

**Language/Version**: TypeScript 6.0 / SvelteKit 3.1 / Svelte 5.57

**Primary Dependencies**: SvelteKit 3, Svelte 5, Vite 8, Tailwind 4, Better Auth 1.7, Drizzle ORM 0.45, PostgreSQL, nodemailer, pdf-lib, zod

**Storage**: PostgreSQL (94 migrations, RLS active sur 73+ tables)

**Testing**: Vitest (195 fichiers, 950+ tests), Playwright (59 specs e2e)

**Target Platform**: Node.js (adapter-node), déploiement Netlify/VPS

**Project Type**: Web application multi-tenant (SaaS conciergerie)

**Performance Goals**: Budget JS < 50 Ko voyageur / < 200 Ko staff ; HTML-first sans JS sur routes publiques

**Constraints**: Constitution LCD v2 (domaine pur, ports/adapters, RLS, i18n 5 langues, qualité vérifiable)

**Scale/Scope**: 93 pages, 48 endpoints, 1 personne temps partiel (3-4 j/sem), 110 j-h restants estimés

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Note |
|---|---|---|
| I. Périmètre V2 uniquement | ✅ PASS | Tout le travail est dans `v2/` |
| II. HTML-first et domaine pur | ✅ PASS | Architecture hexagonale existante respectée |
| III. Sécurité et isolation tenant | ✅ PASS | RLS active, withTenant(), HMAC |
| IV. Qualité vérifiable | ✅ PASS | Tests obligatoires pour toute nouvelle brique |
| V. Accessibilité et i18n progressif | ✅ PASS | 42 dictionnaires, 5 langues, cookie préférence |

**Verdict** : PASS — aucune violation de constitution.

## Project Structure

### Documentation (this feature)

```text
specs/003-audit-parite-plans-initiaux/
├── spec.md              # Spécification de la feature (créé)
├── plan.md              # Ce fichier
├── tasks.md             # Liste des tâches séquencées
├── quickstart.md        # Comment lire/reprendre l'audit
└── (pas de data-model.md ni contracts/ — feature de pilotage, pas de nouveau schéma DB)
```

### Source Code (repository root)

```text
v2/
├── src/
│   ├── domain/          # 97 fichiers — règles métier pures
│   ├── application/     # 187 fichiers — ports + use-cases
│   ├── infrastructure/  # 101 fichiers — adapters + repositories
│   ├── lib/             # 66 fichiers — i18n + utilitaires
│   ├── lib/server/      # 23 fichiers — auth, session, ICS, fournisseurs
│   └── routes/          # 93 pages + 48 endpoints
├── tests/               # 195 fichiers unitaires
├── e2e/                 # 59 specs Playwright
├── drizzle/             # 94 migrations SQL
└── docs/                # qa-manuel.md, 80-stack-sveltekit.md

docs/
├── decisions/           # ADR-01 à ADR-05, PACK-SIGNATURE-L0, BUDGET
├── plans/               # ROADMAP-PARITE-2026-11.md
├── analyses/            # AUDIT-L1-EXISTANT.md, LODGIFY-VS-LCD
└── registres/           # changelog, risques, exigences

AUDIT-COMPLET-PLANS-VS-V2.md  # Document d'audit standalone (racine)
```

**Structure Decision**: Application web mono-repo dans `v2/`. Pas de nouveau dossier à créer pour cette feature — elle pilote l'exécution de tâches existantes (spec 002) et la signature de décisions (docs/decisions/). Les modifications de code se font dans la structure hexagonale existante.

## Complexity Tracking

> Aucune violation de constitution — section non applicable.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| — | — | — |
