# Archive V1 — corpus gelé

```text
Statut : ARCHIVE
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/INDEX.md (carte active), specs/002, specs/005
Source de vérité : git (ce dossier est immuable)
```

Ce dossier contient le corpus documentaire de la **V1** (Next.js, box,
laboratoire) déplacé hors de la racine et de `docs/` le 2026-11-14, conformément
au lot D2 de `docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md`.

## Règle d'immuabilité

- On ne corrige pas le fond d'un document archivé.
- Une information fausse ou dépassée reçoit un bandeau `REMPLACÉ PAR` en tête,
  avec le chemin du document actif.
- Les liens relatifs internes ont été conservés : les documents qui se
  citaient entre eux restent dans le même dossier.

## Contenu

| Document(s) | Origine | Devenir |
|---|---|---|
| `Plan Comblement Ecarts Lodgify - LCD v1.md` | racine | remplacé par `specs/002-parite-lodgify/` |
| `Plan Execution LCD - Conciergerie v5.md` | racine | remplacé par `docs/plans/PLAN-GLOBAL-SPEC-KIT-2026-11-14.md` |
| `Plan Logement 1 - Santa Severa Saint-Laurent-du-Var v4.md` | racine | hors périmètre V2 |
| `Plan Passerelle Generale Parc - Pilotage Complet v4.md` | racine | remplacé par `specs/002` |
| `Plan Technique LCD - Pipeline automatisation complet v4.md` | racine | remplacé par `docs/20-architecture-v2.md` |
| `Socle Commun LCD - Conciergerie v1.md` | racine | remplacé par `docs/00-vision-portee.md` |
| `DEMARRAGE.md` | racine | remplacé par `docs/README.md` racine et `v2/README.md` |
| `AUDIT-COMPLET-PLANS-VS-V2.md` | racine | remplacé par l'audit du 2026-11-14 |
| `10-socle-v2.md` | `docs/` | remplacé par `docs/10-exigences-produit.md` |
| `20-architecture-contrats.md` | `docs/` | remplacé par `docs/20-architecture-v2.md` |
| `30-passerelle-v5.md` | `docs/` | V1 gelée |
| `40-logement-v5.md` | `docs/` | V1 gelée |
| `50-technique-box-v5.md` | `docs/` | V1 gelée |
| `60-execution-v6.md` | `docs/` | V1 gelée |
| `70-front-v1.md` | `docs/` | V1 gelée |
| `71-production-locale.md` | `docs/` | V1 gelée |
| `72-runbooks-v1.md` | `docs/` | remplacé par `docs/72-runbooks.md` |
| `73-inventaire-donnees.md` | `docs/` | généré V1, gelé |
| `74-etat-verifie.md` | `docs/` | généré V1, gelé |
| `75-versions-verifiees.md` | `docs/` | généré V1, gelé |
| `76-reconstruction.md` | `docs/` | remplacé par `docs/ops/runbook-production.md` § reprise |
| `77-identite-roles-perimetres.md` | `docs/` | V1 gelée |
| `78-plan-stack-deploiement.md` | `docs/` | remplacé par `docs/80-stack-sveltekit.md` |
| `decisions-parc/` | `docs/` | décisions du parc V1 |
| `r01` → `r10`-prep | `docs/registres/` | préparations V1 |
| `exigences.csv` | `docs/registres/` | remplacé par les FR de `specs/*/spec.md` |

## Où est la vérité active

| Question | Document |
|---|---|
| Où en est le produit ? | `README.md` (racine) |
| Quelle est la carte ? | `docs/INDEX.md` |
| Exigences et exécution | `specs/*/spec.md` et `tasks.md` |
| État mesuré | `docs/registres/etat-reel.md` |
| Exploitation | `docs/ops/runbook-production.md`, `v2/` |
