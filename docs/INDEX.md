# Index de la documentation — LCD V2

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/README.md (index V1 historique)
Source de vérité : ce fichier pour la carte ; chaque document pour son contenu
```

**Périmètre** : dépôt `jul-ienfr/LCD`, branche `v2`.
**Inventaire exhaustif** : `docs/analyses/inventaire-documentation-2026-11-14.csv`
(306 documents, avec statut et propriétaire).

> Ce fichier est la carte de navigation. L'ancien index généré
> `docs/README.md` décrit le corpus V1 numéroté : il est conservé pour
> l'histoire. Le corpus V1 lui-même est archivé dans `docs/archive/v1/`.

## Cinq sources de vérité

| Question | Document |
|---|---|
| Où en est le produit ? | `README.md` (racine) |
| Quelle est la carte ? | `docs/INDEX.md` (ce fichier) |
| Exigences et exécution | `specs/*/spec.md` + `tasks.md` |
| État mesuré | `docs/registres/etat-reel.md` |
| Exploitation | `docs/ops/runbook-production.md`, `v2/` |

## Par où commencer

| Besoin | Document | Statut |
|---|---|---|
| État du produit et prochaine action | `README.md` (racine) | ACTIF |
| Comprendre le produit et son périmètre | `docs/00-vision-portee.md` | ACTIF |
| Exigences produit | `docs/10-exigences-produit.md` | ACTIF |
| Architecture V2 | `docs/20-architecture-v2.md` | ACTIF |
| Savoir ce qui reste à faire | `docs/plans/PLAN-GLOBAL-SPEC-KIT-2026-11-14.md` | ACTIF |
| Calendrier de mise en production | `docs/plans/ROADMAP-GO-LIVE-2026-11-14.md` | ACTIF |
| Déployer ou exploiter | `docs/ops/runbook-production.md` | ACTIF |
| Basculer la V1 vers la V2 | `docs/ops/runbook-bascule.md` | ACTIF |
| Exécuter la recette | `docs/ops/recette-2026-11/journal.md` | ACTIF |
| Réagir à un incident | `docs/ops/runbook-production.md` §11 | ACTIF |
| Reprendre la V1 | `docs/plans/PLAN-MIGRATION-V1-V2.md` | ACTIF |

## Décisions (ADR)

| Document | Sujet | Statut |
|---|---|---|
| `docs/decisions/ADR-01-fournisseur-distribution.md` | fournisseur de distribution | accepté |
| `docs/decisions/ADR-02-paiement.md` | paiement | accepté |
| `docs/decisions/ADR-03-pricing.md` | pricing | accepté |
| `docs/decisions/ADR-04-site-public.md` | site public | accepté |
| `docs/decisions/ADR-05-messagerie.md` | messagerie | accepté |
| `docs/decisions/ADR-06-hebergement-production.md` | **VPS Docker + Caddy + PostgreSQL** | **à contresigner** |
| `docs/decisions/PACK-SIGNATURE-L0.md` | ratification L0 | en attente |
| `docs/decisions/BUDGET-PARTENAIRES-2026-11.md` | coûts partenaires | informatif |
| `docs/80-stack-sveltekit.md` | stack SvelteKit (ADR-008) | accepté |

## Plans actifs

| Document | Rôle | Statut |
|---|---|---|
| `docs/plans/PLAN-GLOBAL-SPEC-KIT-2026-11-14.md` | specs 002, 004, 005 et lots documentaires | ACTIF |
| `docs/plans/ROADMAP-GO-LIVE-2026-11-14.md` | jalons R0 → R7 et portes externes du 002 | ACTIF |
| `docs/plans/PLAN-MIGRATION-V1-V2.md` | inventaire V1, matrice, import, réconciliation | ACTIF |
| `docs/plans/ROADMAP-PARITE-2026-11.md` | historique — remplacé le 14/11 | REMPLACÉ |

## Exploitation

| Document | Rôle | Statut |
|---|---|---|
| `docs/ops/runbook-production.md` | variables, DNS, SMTP, supervision, crons, déploiement, migrations, sauvegarde, rollback, incidents, checklist | ACTIF |
| `docs/ops/runbook-bascule.md` | gel, différentiel, DNS, smoke tests, retour arrière, hypercare | ACTIF |
| `docs/ops/recette-2026-11/journal.md` | 155 cases REC + 21 parcours QA, preuves et défauts | ACTIF |
| `docs/ops/recette-2026-11/repetition-locale-2026-11-15.md` | rôle `lcd_app`, RLS et smoke test rejoués hors production | ACTIF |
| `docs/ops/procedure-backup-restore.md` | sauvegarde et restauration (contexte historique) | ARCHIVE |
| `docs/ops/procedure-migration-p2-p3.md` | migration P2 → P3 | ARCHIVE |
| `docs/ops/procedure-p1-mise-en-service.md` | mise en service P1 | ARCHIVE |
| `docs/runbooks/debloquer-gates-externes.md` | preuves externes (fournisseurs, banque, OTA) | ACTIF |
| `docs/runbooks/distribution-temps-reel.md` | distribution temps réel | ACTIF |
| `docs/72-runbooks.md` | index des runbooks V2 | ACTIF |

Côté application :

| Document | Rôle | Statut |
|---|---|---|
| `v2/DEPLOIEMENT.md` | déploiement V2 (résumé exécutable) | ACTIF |
| `v2/DEPLOIEMENT-VPS.md` | guide VPS pas à pas | ACTIF |
| `v2/BACKUPS.md` | sauvegardes, chiffrement, restauration de contrôle | ACTIF |
| `v2/MONITORING.md` | Sentry, Uptime Kuma, logs, checklist | ACTIF |
| `v2/TESTS-A-FAIRE.md` | recette manuelle et vérifications hors CI | ACTIF |
| `v2/RUNBOOK-OTA.md` | synchronisation OTA et channel manager | ACTIF |
| `v2/docs/qa-manuel.md` | 21 parcours manuels | ACTIF |

## Spec Kit

| Feature | Document | État |
|---|---|---|
| 001 — i18n staff | `specs/001-i18n-staff/` | clôturé (34/34) |
| 002 — parité Lodgify | `specs/002-parite-lodgify/` | 23 tâches ouvertes, 19 preuves externes ; matrice `traceability.md` |
| 003 — audit des plans initiaux | `specs/003-audit-parite-plans-initiaux/` | absorbé par 002 |
| 004 — ergonomie et expérience client | `specs/004-ergonomie-experience-client/` | 13 tâches, 11 validations humaines |
| 005 — mise en production | `specs/005-mise-en-production/` | phases 1–2 faites, phases 3–6 externes |
| 006 — autonomie et finitions | `specs/006-autonomie-et-finitions/` | brouillon du 19/11 : exploitation autonome, fiabilité, boucle de preuve, finitions, modules |

## Analyses et audits

| Document | Rôle | Statut |
|---|---|---|
| `docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md` | audit documentaire et lots D1–D7 | ACTIF |
| `docs/analyses/AUDIT-L1-EXISTANT.md` | audit de l'existant (historique) | ARCHIVE |
| `docs/analyses/LODGIFY-VS-LCD-2026-11.md` | comparaison concurrentielle | ACTIF |
| `docs/analyses/inventaire-documentation-2026-11-14.csv` | inventaire machine des 306 documents | GÉNÉRÉ |
| `docs/archive/v1/AUDIT-COMPLET-PLANS-VS-V2.md` | écart plans initiaux / implémentation (09/11) | ARCHIVE |

## Registres

| Document | Rôle | Statut |
|---|---|---|
| `docs/registres/etat-reel.md` | ce qui est réellement fait et prouvé, daté | ACTIF |
| `docs/registres/changelog.md` | journal des phases documentaires et techniques | ACTIF |
| `docs/registres/a-trancher.md` | questions ouvertes | ACTIF |
| `docs/registres/risques.md` | risques | ACTIF |
| `docs/registres/benchmark-oss.md` | veille logicielle libre | ACTIF |
| `docs/registres/radar-projets-rea-replica.md` | veille terrain | ACTIF |
| `docs/registres/teardowns-rea.md` | analyse concurrentielle | ACTIF |
| `docs/archive/v1/exigences.csv` | exigences V1 figées | ARCHIVE |

## Corpus V1 numéroté

Tout le corpus V1 est immuable dans `docs/archive/v1/` (voir son README).
Il ne décrit **pas** l'état de la V2 SvelteKit.

| Document | Rôle |
|---|---|
| `docs/archive/v1/10-socle-v2.md` | socle V1 (remplacé par `docs/10-exigences-produit.md`) |
| `docs/archive/v1/20-architecture-contrats.md` | architecture V1 (remplacée par `docs/20-architecture-v2.md`) |
| `docs/archive/v1/30-passerelle-v5.md` | passerelle de parc |
| `docs/archive/v1/40-logement-v5.md` | logement, planning, prix |
| `docs/archive/v1/50-technique-box-v5.md` | box et terrain |
| `docs/archive/v1/60-execution-v6.md` | exécution V6 |
| `docs/archive/v1/70-front-v1.md` / `71-production-locale.md` | front V1 et production locale |
| `docs/archive/v1/72-runbooks-v1.md` | runbooks R-01 → R-11 |
| `docs/archive/v1/73` → `78` | inventaires générés, versions, reconstruction, rôles, stack |
| `docs/archive/v1/decisions-parc/` | décisions du parc V1 |
| `docs/archive/v1/r*-prep.md` | préparations R-01 → R-10 |

## Archives

| Dossier | Contenu | Statut |
|---|---|---|
| `docs/archive/v1/` | corpus V1 complet, immuable | ARCHIVE |
| `docs/archive/DEPLOIEMENT-NETLIFY-2026-11.md` | déploiement Netlify abandonné | ARCHIVE |
| `docs/plans-archives/` | versions successives des plans V1 (v1 → v4) | ARCHIVE |
| `docs/log1/`, `docs/log2/`, `docs/parc/` | journaux et notes V1 | ARCHIVE |

## Annexes actives

Documents spécialisés qui ne portent ni les exigences ni l'exploitation, mais
restent valides.

| Document | Rôle | Statut |
|---|---|---|
| `docs/ag-sas-p10-12.md` | assemblée générale / SAS | ACTIF |
| `docs/checklist-taches-restantes.md` | tâches terrain V1 (55 items) | ACTIF |
| `docs/decision-serrure-acces.md` | décision serrure et accès | ACTIF |
| `docs/marque-formation-p10-11.md` | marque et formation | ACTIF |
| `docs/panier-p0-chiffre.md` | panier P0 chiffré | ACTIF |
| `docs/revue-modele-eco-p10-10.md` | revue du modèle économique | ACTIF |
| `docs/runbook-export-comptable.md` | export comptable | ACTIF |
| `docs/runbook-fuite-token.md` | fuite de token | ACTIF |
| `docs/runbook-panne-wg-restore.md` | panne passerelle / restauration | ACTIF |
| `docs/runbook-setup-lab-rea.md` | mise en place du lab de rea | ACTIF |
| `docs/runbook-vol-box-vps-vault.md` | vol de box / VPS / coffre | ACTIF |
| `docs/suivi-p0-terrain.md` | suivi P0 terrain | ACTIF |
| `docs/README.md` | index V1 généré le 2026-10-24 | ARCHIVE |

## Règles de lecture

1. **Le code et les tests font foi** pour l'état de la V2 ; les documents datés
   disent ce qui a été vérifié et quand.
2. Une tâche Spec Kit cochée porte une preuve datée ; `[~]` signale un reste
   explicitement écrit.
3. Aucun document ne doit annoncer une action externe (signature, DNS, SMTP,
   paiement) comme faite tant qu'elle ne l'est pas : ces points restent `[~]`.
4. Un document sans en-tête `Statut` est exclu de cet index et ne peut pas être
   cité comme preuve.
5. Un document `ARCHIVE` ne peut pas être cité comme source de vérité.
