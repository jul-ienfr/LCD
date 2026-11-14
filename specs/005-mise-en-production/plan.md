# Implementation Plan: Mise en production, recette et bascule V1 → V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md
```

**Branch**: `005-mise-en-production` | **Date**: 2026-11-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-mise-en-production/spec.md`

## Summary

Mettre la V2 SvelteKit en production sur une URL publique fiable, prouver les
parcours par une recette complète, reprendre les données utiles de la V1, puis
basculer le trafic et éteindre la V1. Le code produit est prêt ; le travail est
de l'exploitation, de la preuve et de la migration.

La cible recommandée est le **VPS Docker + Caddy + PostgreSQL** déjà décrit
dans `v2/compose.prod.yml`, `v2/Caddyfile` et `v2/DEPLOIEMENT-VPS.md`. Netlify
n'est pas retenu en l'état : `v2/netlify.toml` pointe encore `.next` alors que
le runtime est `adapter-node`, et le plan gratuit est épuisé. Le choix final
fait l'objet de l'ADR-06.

## Technical Context

**Language/Version**: TypeScript 5.x, Svelte 5, SvelteKit 3, Node 24
**Primary Dependencies**: adapter-node, PostgreSQL 18, Drizzle, Better Auth,
Caddy 2, Docker Compose, Uptime Kuma, Sentry (optionnel), GitHub Actions
**Storage**: PostgreSQL 18 (volume ou base managée UE), volume photos local,
sauvegardes chiffrées AES-256-GCM
**Testing**: Vitest, Playwright, `svelte-check`, `db:check`, `db:test-rls`,
`db:test-migrations`, `db:backup`, `db:restore-test`, recette manuelle
**Target Platform**: Linux VPS (Debian/Ubuntu), Docker, navigateurs modernes,
PWA installable
**Project Type**: application web mono-repo (`v2/`)
**Performance Goals**: `/api/ready` < 1 s ; page publique < 1 s serveur ;
budget JS voyageur < 50 Ko gzip ; disponibilité ≥ 99,5 %
**Constraints**: HTML-first, RLS, migrations immuables, secrets hors dépôt,
retour arrière < 30 min, budget mensuel plafonné
**Scale/Scope**: 1 tenant au départ, 1 000-10 000 logements, quelques milliers
d'objets V1, 104 migrations, 112 pages, 61 endpoints

## Constitution Check

*GATE: Must pass before Phase 0. Re-check after Phase 1.*

| Principe | Respect | Preuve |
|---|---|---|
| I. Périmètre V2 | OUI | uniquement `v2/`, `specs/`, `docs/` ; la V1 est lue, jamais modifiée |
| II. HTML-first / domaine pur | OUI | parcours public et voyageur sans JS ; aucun import d'infra dans `src/domain` |
| III. Sécurité tenant | OUI | rôle `lcd_app` non-propriétaire, `withTenant()`, RLS testée en production |
| IV. Qualité vérifiable | OUI | recette 155 + 21, preuves datées, tests, retour arrière répété |
| V. i18n | OUI | 6 langues déjà livrées ; aucune régression attendue |

**Violations**: aucune. La seule complexité ajoutée est l'exploitation d'un
serveur et la migration de données ; elle est justifiée par l'absence
d'environnement public fiable et par la fin de vie de la V1.

## Architecture cible

```text
Internet
   │ HTTPS 443
   ▼
Caddy (TLS, HSTS, en-têtes)
   │ reverse_proxy web:3000
   ▼
SvelteKit adapter-node (conteneur lcd-web, utilisateur non-root)
   │ DATABASE_URL (rôle lcd_app, RLS)
   ▼
PostgreSQL 18 (volume lcd-pgdata, sauvegarde pg_dump chiffrée)
   │
   ├── volume photos (preuves ménage, EDL)
   ├── Uptime Kuma (health/ready)
   └── Sentry (erreurs, optionnel)
```

Le serveur exécute aussi :

- un cron système ou un planificateur in-process pour ICS, fournisseurs,
  messages, pricing, webhooks et relances — **un seul déclencheur par tâche** ;
- une sauvegarde quotidienne `db:backup`, copiée hors serveur ;
- un script de déploiement et un script de retour arrière.

## Environnements

| Environnement | Base | Usage | Données |
|---|---|---|---|
| Local | Docker `compose.dev.yml` | développement, tests | seed + démo |
| Recette | Copie de production ou base dédiée | recette 155 + 21, migration à blanc | données anonymisées |
| Production | PostgreSQL dédié, région UE | trafic réel | données réelles |

La recette ne doit jamais écrire dans la production. Les tests destructifs
(`db:nettoyer-recette`, imports) s'exécutent sur la base de recette.

## Flux de déploiement

```text
commit tagué
  → CI : check, test, build, e2e
  → image ou artefact versionné
  → sauvegarde pré-déploiement
  → migration (conteneur tools, MIGRATION_DATABASE_URL owner)
  → démarrage web (DATABASE_URL lcd_app)
  → smoke : /api/health, /api/ready, /login, /reserver, /voyageur
  → baseline de monitoring
```

Règles :

1. Le build ne dépend d'aucun fichier non commité.
2. La migration tourne dans un conteneur séparé, jamais au démarrage du web.
3. Un déploiement qui échoue au smoke test déclenche le retour arrière.
4. Le numéro de version est visible dans `/api/health` ou `/systeme`.

## Recette

Le plan de recette reprend `v2/TESTS-A-FAIRE.md` section par section :

| Section | Contenu | Preuve attendue |
|---|---|---|
| 1 | Authentification, rôles, 2FA | captures, journal |
| 2 | Logements, annonces, onboarding | captures, audit |
| 3 | Planning, prix, canaux | captures, log de sync |
| 4 | Séjour, ménage, incidents | captures, PDF/photo |
| 5 | Paiements, cautions, factures | reçu Stripe test, PDF |
| 6 | CRM, support, messagerie | captures, fil |
| 7 | Performance, accessibilité, 320 px | rapports Lighthouse/axe |
| 8 | API, webhooks, intégrations | requêtes, signatures |
| 9 | IA, notifications, RGPD | captures, export |
| 10 | Super-admin, sécurité, sauvegardes | journal, restauration |

Chaque case produit une ligne dans
`docs/ops/recette-2026-11/journal.md` : identifiant, date, opérateur, résultat,
preuve, défaut éventuel. Les défauts sont suivis dans le même journal avec une
sévérité S1-S4.

La QA manuelle (`v2/docs/qa-manuel.md`) est réécrite pour les routes SvelteKit
actuelles avant exécution : les 21 parcours doivent citer l'URL réelle et le
rôle.

## Migration V1 → V2

### Sources à inventorier

| Source | Contenu connu | Devenir probable |
|---|---|---|
| `custom/passerelle-parc/parc.db` | entités, clients, logements, boxes, mandats, prospects, offres, annonces, config LLM, journal | tenants, logements, mandats, CRM, annonces |
| `custom/*.yaml` | logements, accès, branding, design, extras, inventaire, tarifs | configuration des logements et catalogue |
| `custom/*/state/*.jsonl` | décisions caution, facturation, stocks | historique ou exclusion |
| `custom/memoire/voyageurs.yaml` | mémoire voyageurs | à minimiser ou exclure (PII) |
| `state/parc/*.json` | état runtime des boxes | exclusion (runtime) |
| ICS / exports OTA | réservations et disponibilités | import ponctuel ou reprise manuelle |
| `web/` | aucune base locale ; frontend sur gateway | rien à migrer côté données |

### Principe

La migration n'est pas un copier-coller : la V1 raisonne en **entités,
mandats et boxes**, la V2 en **tenants, logements et utilisateurs**. Une
matrice de correspondance est obligatoire avant tout script.

Ordre d'import :

```text
tenants → utilisateurs → logements → mandats → annonces
→ prospects/offres → documents/photos → réservations (si retenues)
→ vérifications de réconciliation
```

Chaque objet reçoit une clé stable (`v1:<type>:<id>`) stockée dans une colonne
de correspondance ou une table de suivi. L'import est rejouable : un objet déjà
présent est ignoré, un objet modifié est signalé, jamais dupliqué.

### Réconciliation

- comptes par type : entités, logements, mandats, prospects, annonces,
  documents ;
- totaux disponibles : commissions, cautions, factures, paiements ;
- objets orphelins : référence absente, doublon, type inconnu ;
- rapport signé : attendu, importé, écart, décision.

### Données personnelles

Les secrets V1 (`secrets.yaml`, tokens, mots de passe) ne sont **jamais**
migrés. Les voyageurs et prospects sont minimisés : seuls les champs
nécessaires à la relation en cours sont repris, avec la durée de conservation
V2. Les documents sont vérifiés avant import (type, taille, malware).

## Bascule

| Moment | Action | Critère de passage |
|---|---|---|
| T-14 j | répétition générale sur préproduction | runbook complet, durée mesurée |
| T-7 j | TTL DNS réduit, communication | TTL ≤ 300 s |
| T-1 j | sauvegarde, gel des écritures V1, différentiel | écart nul ou expliqué |
| T0 | DNS, smoke tests, monitoring renforcé | 5 parcours critiques verts |
| T+1 h | vérification paiements, emails, crons | aucun S1 |
| T+1 j | point de situation | aucun S1, S2 sous contrôle |
| T+14 j | extinction V1, archive, post-mortem | hypercare terminée |

Retour arrière : DNS vers V1, V1 remise en écriture, écritures V2 rejouées vers
V1 ou gelées et réconciliées. Le retour arrière est répété avant T0.

## Risques

| Risque | Probabilité | Impact | Réduction |
|---|---|---|---|
| Quota hébergeur épuisé | haute | bloquant | VPS dédié, pas de plan gratuit |
| Migration partielle | moyenne | majeur | import idempotent, copie, réconciliation |
| Perte de sauvegarde | faible | critique | copie hors serveur, clé séparée, restauration testée |
| Email en indésirable | moyenne | majeur | SPF, DKIM, DMARC, test réel |
| DNS lent | moyenne | mineur | TTL réduit à T-7 |
| Secret exposé | moyenne | critique | rotation, coffre, scan |
| Recette incomplète | haute | majeur | journal par case, signataire |
| Régression pendant la bascule | moyenne | majeur | smoke tests, retour arrière |
| Double cron | moyenne | mineur | un seul déclencheur documenté |

## Décisions ouvertes

1. **ADR-06 — hébergement** : VPS (recommandé), Netlify payant, Render,
   Oracle Free. Critères : coût, région UE, disque persistant, cron, sauvegarde,
   effort d'exploitation.
2. **Base** : PostgreSQL auto-hébergé sur le VPS ou managé (Neon/Supabase UE).
   Critères : RPO/RTO, coût, latence, conformité.
3. **SMTP** : Brevo, OVH, Scaleway ou autre. Critères : délivrabilité, SPF/DKIM,
   coût, journal.
4. **Domaine** : nom public, sous-domaines, emails.
5. **Supervision** : Uptime Kuma auto-hébergé + Sentry, ou service managé.

## Structure

### Documentation

```text
specs/005-mise-en-production/
├── spec.md
├── plan.md
├── tasks.md
├── contracts/exploitation.md
└── checklists/requirements.md

docs/ops/
├── runbook-production.md          # à créer
├── recette-2026-11/
│   ├── journal.md                # à créer
│   └── preuves/                  # captures, logs
└── bascule-2027/
    ├── runbook.md                # à créer
    └── post-mortem.md            # à créer

docs/plans/
├── PLAN-MIGRATION-V1-V2.md       # à créer
└── PLAN-GLOBAL-SPEC-KIT-2026-11-14.md
```

### Code et exploitation

```text
v2/
├── compose.prod.yml              # web, postgres, caddy, tools, uptime-kuma
├── compose.prod.external-db.yml  # base managée
├── Caddyfile                     # TLS, HSTS, reverse proxy
├── Dockerfile                    # build + runtime non-root
├── scripts/
│   ├── backup.mjs                # sauvegarde
│   ├── restore-test.mjs          # restauration
│   ├── test-migrations.mjs       # migrations
│   ├── verifier-rls.mjs          # isolation
│   └── preflight.mjs             # à créer : env, DB, version, secrets
├── .github/workflows/            # CI, sauvegarde, sync OTA
└── docs/                         # runbooks existants à mettre à jour
```

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| Serveur auto-hébergé | adapter-node, cron persistant, disque photos, coût maîtrisé | Netlify gratuit épuisé et inadapté au runtime actuel |
| Import V1 dédié | sources hétérogènes (SQLite, YAML, JSONL) | reprise manuelle non traçable et non rejouable |
| Fenêtre de bascule | données et DNS ne basculent pas instantanément | bascule directe sans retour arrière trop risquée |
