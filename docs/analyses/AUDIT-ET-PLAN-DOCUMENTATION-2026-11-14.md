# Audit complet et plan documentaire — LCD

```text
Statut : ACTIF
Propriétaire : fondateur
Dernière vérification : 2026-11-14
Remplace / remplacé par : docs/archive/v1/AUDIT-COMPLET-PLANS-VS-V2.md
Source de vérité : lecture du dépôt au 2026-11-14
```

**Date** : 2026-11-14
**Périmètre** : `v2/` (SvelteKit), `specs/` (Spec Kit 001 à 004), les 264 documents projet, l'état du dépôt Git et les dépendances externes.
**Méthode** : lecture seule. Aucun code, aucun document existant n'a été modifié. Les compteurs de tâches ont été recalculés sur les `tasks.md` réels ; les résultats de tests sont ceux publiés dans `docs/registres/etat-reel.md` au 2026-11-13 et n'ont pas été rejoués ici.
**Livrable joint** : `docs/analyses/inventaire-documentation-2026-11-14.csv` — inventaire des 306 fichiers Markdown avec famille, taille, statut proposé et priorité.

---

## 0. Réponse directe

Le projet n'a plus un problème de code. Il a trois problèmes, dans cet ordre :

1. **Le travail n'est pas sauvegardé.** Le dernier commit date du **8 novembre**. Depuis, **462 entrées Git** sont modifiées ou non suivies — les livrables de cet audit et la spec 005 compris — dont **133 fichiers source, 61 tests, 16 specs e2e, 14 migrations** et les specs 003/004 entières. Un incident disque ou un `git clean` détruirait six jours de travail. C'est le risque n°1, avant toute documentation.
2. **Les décisions L0 ne sont toujours pas signées.** `docs/decisions/README.md` est à **0/7**, les 5 ADR sont « Proposé », et la date M0 était fixée au **15 novembre 2026** — demain. Soit elles sont signées, soit la roadmap doit être officiellement re-datée.
3. **La documentation est abondante mais sans source de vérité.** 271 documents projet, deux corpus normatifs concurrents (V1 `web/`/`custom/` et V2 `v2/` SvelteKit), 72 documents V1 encore présentés comme référence, 18 documents structurants périmés, et une spec 003 à 0/74 tâches qui double les specs 002 et 004. Le code a dépassé la documentation, pas l'inverse.

**Ce qui reste à implémenter en code est marginal** : migration des données V1→V2, cutover, suppression de l'ancienne UI Next, adaptateur Swikly, page publique `/logement/[slug]`, lecture retour OTA. Le reste des 23 tâches ouvertes de la spec 002 est bloqué par des **preuves externes** (clés sandbox, comptes, conseil juridique, 30 jours de données) ou par la **recette**.

---

## 1. Chiffres clés

| Indicateur | Valeur constatée | Source |
|---|---|---|
| Dernier commit | `b85e474`, 2026-11-08 | `git log` |
| Entrées non commitées | **201 modifiés + 261 non suivis = 462** | `git status --porcelain` |
| Code non suivi | 133 `src/`, 61 `tests/`, 16 `e2e/`, 14 migrations | `git status` |
| Documents Markdown | **306** (271 projet + 35 outillage IA/Spec Kit) | inventaire CSV |
| Specs Spec Kit | 5 (001 close, 002 active, 003 à clôturer, 004 active, 005 créée) | `specs/` |
| Spec 001 i18n | **34/34** | `tasks.md` |
| Spec 002 parité Lodgify | **165 faites / 6 partielles / 23 ouvertes** (194) | `tasks.md` |
| Spec 003 audit | **0/74** | `tasks.md` |
| Spec 004 ergonomie | **99/112** (13 ouvertes, toutes humaines ou déploiement) | `tasks.md` |
| Exigences ECARTS V1→V2 | **83 Fait / 3 Partiel / 2 Exclu** sur 92 | `v2/ECARTS-V1.md` |
| Pages SvelteKit | 112 `+page.svelte` | `v2/src/routes` |
| Endpoints | 61 `+server.ts` | `v2/src/routes` |
| Migrations | 104 | `v2/drizzle` |
| Tests unitaires | 258 fichiers ; 1 596 réussis / 2 ignorés (13/11) | registre |
| Tests e2e | 73 specs ; 252 réussis / 0 échec / 4 instables (13/11) | registre |
| Recette post-déploiement | **6/161** cases | `v2/TESTS-A-FAIRE.md` |
| QA manuelle | **0/21** | `v2/docs/qa-manuel.md` |
| Terrain / box / externe | **0/55** | `docs/checklist-taches-restantes.md` |
| Gate L0 | **0/5 ADR, 0/7 critères** | `docs/decisions/README.md` |
| Déploiement public | **hors service** (HTTP 503 `usage_exceeded`) | test du 14/11 sur `lcd-parc.netlify.app` |

---

## 2. État réel vérifié

### 2.1 Versionnement — alerte rouge

Le dépôt distant `origin/v2` est au commit du **8 novembre 08:19**. Tout ce qui a été produit depuis est uniquement sur le disque :

- specs **003** et **004** entièrement non suivies ;
- 133 fichiers `v2/src` non suivis (ports et cas d'usage US3/US4/US6/US7, pricing, avis, extras, relevés, API, WhatsApp, traduction…) ;
- 61 fichiers de tests, 16 specs e2e, 14 migrations, 11 fichiers `static/`, 9 scripts ;
- le workflow CI `.github/workflows/qualite-ergonomie.yml` ;
- l'audit du 9 novembre lui-même.

Conséquence : **le dépôt n'est pas une sauvegarde du produit**. La CI ne voit pas ces fichiers, un clone ne reproduit pas l'application, et aucune revue de code n'est possible. Avant le plan documentaire, il faut un commit de sauvegarde (idéalement découpé : specs/docs, code, tests) et un tag.

### 2.2 Produit

Le produit local est fonctionnel et très avancé :

- architecture hexagonale (`domain` / `application` / `infrastructure`), 112 pages, 61 endpoints, 104 migrations, RLS multi-tenant ;
- i18n staff et public 5 langues, HTML-first sans JavaScript sur les parcours publics et voyageur ;
- channel manager iCal + 5 adaptateurs fournisseurs, outbox, webhooks signés, réconciliation, santé ;
- Stripe (checkout, webhook, litiges, cautions), factures PDF/Factur-X, compta, rapprochement ;
- inbox voyageur, automatisations en brouillon, IA de rédaction et traduction ;
- pricing explicable (recommandations, bornes, RevPAR), relevés propriétaires, API v1, webhooks, Nuki ;
- onboarding 7 étapes, import CSV, tenant de démonstration, marque blanche et thèmes ;
- ergonomie plan 004 : 0 violation axe sur 70 routes staff et 21 routes publiques, 0 cible < 44 px, Lighthouse mobile 100 partout sauf `/reserver` (93-94).

Le seul `TODO` restant dans `v2/src` est isolé. Le code n'est donc pas le goulot.

### 2.3 Déploiement

- Le site beta `https://lcd-parc.netlify.app` répond **503 `usage_exceeded`** : le plan gratuit Netlify est épuisé.
- `v2/DEPLOIEMENT.md` documente un schéma arrêté à la migration **0025** (état du 25/10) alors que le dépôt en compte **104**.
- `EMAIL_ENABLED=false`, pas de SMTP de production, pas de sauvegarde planifiée active, pas de Sentry/Uptime, base hors UE sur le beta.
- Aucun environnement public ne correspond donc à l'état du code.

### 2.4 Recette

- `v2/TESTS-A-FAIRE.md` : 161 cases, **6 cochées**, toutes dans la section performance (Lighthouse, 320 px, axe). Les sections auth, gestion locative, Stripe, emails, intégrations, observabilité et conformité sont à 0.
- `v2/docs/qa-manuel.md` : 0/21.
- Spec 004 : 13 tâches restantes, toutes bloquées par un humain (5 testeurs, lecteur d'écran, téléphone réel, recette 7 rôles, recette super-admin) ou par le déploiement (T110).

### 2.5 Terrain et externe

`docs/checklist-taches-restantes.md` : **0/55**. P0 matériel (~1 050-1 150 €), P1 box, P3 serrures, P4 énergie, P5 sécurité, P8 go-live, P9 VM réelle, P10 client/RC pro. Ces items sont hors périmètre logiciel mais bloquent le go-live réel.

---

## 3. Cartographie documentaire — les 306 documents

### 3.1 Les deux corpus

Le projet contient **deux corpus normatifs qui se ignorent** :

| Corpus | Où | Ce qu'il décrit | Statut réel |
|---|---|---|---|
| **A — V1 « plan-only »** | 5 plans racine, `docs/00` à `docs/78`, `docs/decisions-parc`, `docs/ops`, `web/*.md`, `custom/*.md`, `lab/*.md`, `deploy/*.md` | `web/` Next.js + `custom/` Python + box HA/Moli, 144 tâches P0-P10 | **gelé depuis le 19/10**, encore présenté comme référence |
| **B — V2 SvelteKit** | `specs/001` à `004`, `v2/*.md`, `docs/80-stack-sveltekit.md` | `v2/` SvelteKit 3, 194 + 112 tâches | **actif**, non commité |

Le mot **« v2 » est ambigu** : `docs/10-socle-v2.md` est le plan « SaaS parfait » de la V1 `web/` (15/10), tandis que le dossier `v2/` est la réécriture SvelteKit (04/11+). Cette collision de noms est la cause racine de la plupart des lectures contradictoires.

### 3.2 Familles et verdict

| Famille | Nb | Rôle | Problème | Verdict proposé |
|---|---:|---|---|---|
| Racine | 9 | plans V1, audit, démarrage, AGENTS | 6 documents obsolètes ou remplacés | garder `AGENTS.md` ; archiver le reste |
| Socle numéroté `docs/` | 30 | 00-80 + docs business | mélange V1 et V2 ; 73/74/75 générés le 23-24/10 sur la V1 | 00/72/80 actifs ; 10/20 à requalifier ; 30/40/50/60/70/71/73/74/75/76/77/78 en archive V1 |
| Spec Kit | 45 | 5 features | 003 vide et redondante ; 005 créée le 14/11 | 001 close ; 002 active ; 003 à clôturer ; 004 à clôturer hors humain ; 005 à exécuter |
| Décisions L0 | 9 | 5 ADR + benchmark + budget + pack | 0/5 signées, échéance dépassée | P0 : signer ou re-dater |
| Décisions parc V1 | 8 | ADR-001 à 008 du lab | V1 gelée | archive V1, sauf ADR-007/008 citées par la V2 |
| Registres | 17 | état réel, changelog, risques, à trancher, R-01 à R-10 | `etat-reel` mélange V1/V2 ; `exigences.csv` est V1 ; 7 préps R-* bloquées | scinder l'état réel ; archiver les préps ; garder 4 registres vivants |
| Analyses | 3 (dont cet audit) | audits datés | l'audit du 9/11 est périmé (62/194) | archiver l'ancien, garder celui-ci comme référence |
| Plans et archives | 14 | 2 plans actifs + 12 archives | le README d'archive pointe vers les plans racine V1 | corriger le README, archiver les racines, mettre à jour la roadmap |
| Exploitation / runbooks | 5 | procédures, runbooks | 3 procédures `docs/ops` sont V1 | requalifier, garder `distribution-temps-reel` et `debloquer-gates-externes` |
| Logements / copro | 13 | dossiers log1/log2 | bloqués par le syndic (REQ-L-001) | actifs, à maintenir |
| Juridique / business | 48 | modèles, stratégie familiale | aucun lien avec les ADR | actifs, ajouter un index |
| Produit V2 | 44 | README, ECARTS, déploiement, runbooks OTA, tests | 18 documents à mettre à jour | actifs, MAJ ciblées |
| Outillage IA | 35 | `.claude`, `.opencode`, `.specify` | hors documentation produit | gouvernance, ne pas indexer comme produit |

Le détail fichier par fichier est dans le CSV joint.

### 3.3 Ce que dit le CSV

- **72 documents** classés `ARCHIVE-V1` (corpus A).
- **74** `ACTIF` + **48** `ACTIF-BUSINESS` + **35** `ACTIF-GOUVERNANCE` + **13** `ACTIF-BLOQUE`.
- **18** `ACTIF-MAJ` (documents structurants périmés).
- **9** `ACTIF-A-SIGNER` (L0).
- **4** `A-CLOTURER` (spec 003).
- **1** `A-METTRE-A-JOUR` (roadmap).

---

## 4. Ce qui est implémenté (et prouvé)

La matrice `v2/ECARTS-V1.md` couvre 92 exigences V1/plans : **83 Fait**, 3 Partiel, 2 Exclu, 1 en attente, 1 non retenu, 2 lignes périmées.

| Domaine | État | Preuve principale |
|---|---|---|
| Public et légal | 5/5 Fait | `/`, `/aide`, `/legales`, cookies, médiation |
| Auth, rôles, sécurité | 9/9 Fait | Better Auth, 2FA, RLS, voir-comme, 4 yeux |
| Super-admin | 5/5 Fait | `/supervision`, `/systeme`, `/secrets`, `/journal`, `/api/metrics` |
| Logements, onboarding | 5/6 Fait, 1 Partiel | onboarding = gates réels ; terrain restant |
| Planning, prix, OTA | 7/8 Fait, 1 Partiel | ICS, canaux, pricing, stop-sell ; >10 unités = contrat |
| Séjour, ménage, incidents | 8/8 Fait | ménage, dispatch, EDL, police |
| Paiements, factures, compta | 8/9 Fait, 1 Partiel | Stripe, PDF, Factur-X, rapprochement ; PDP externe |
| CRM, support, messagerie | 4/4 Fait | pipeline, tickets, 3 fils |
| API, intégrations | 6 Fait, 1 attente, 1 non retenu | API v1, clés, webhooks, Nuki ; Swikly en attente |
| IA, notifications, transverse | 14/16 Fait, 2 Exclu | assistant, LLM, PWA, i18n, RGPD ; voix et matériel exclus |
| Ergonomie (plan 004) | 99/112 | axe, 320 px, cibles, Lighthouse, thèmes, mesure |

### 4.1 Ce que la documentation ne dit pas encore

Le code est en avance sur plusieurs points :

- **Site public multi-pages** (`sites_tenants`, `pages_site`, templates, blocs, SEO) : livré T200-T212, absent de `ECARTS-V1.md`.
- **Channel manager 5 fournisseurs** : livré, mais dispersé entre `CHANNEL-MANAGER.md`, `FOURNISSEURS-CHANNEL-MANAGER.md`, `PLAN-LEVER-LIMITES-OTA.md`, sans section dans ECARTS.
- **Pricing L4** (recommandations, import 18 mois, RevPAR) : livré, seulement décrit dans `docs/analyses/AUDIT-L1-EXISTANT.md`.
- **Relevés L5** (PDF, récurrence, portail) : livré, absent d'ECARTS.
- **Expérience voyageur US6** (guide signé, extras, avis, serrure) : livré, absent d'ECARTS.
- **API v1 + OpenAPI + webhooks** : livré, partiellement décrit.
- **Onboarding US8** (import CSV, tenant démo, chrono) : livré, partiellement décrit.
- **Thèmes** : 6 thèmes (README) alors que `etat-reel` en décrit 4 puis 6 selon les entrées.

---

## 5. Ce qui n'est pas encore implémenté

### 5.1 Blocages humains (aucun code à écrire)

| Élément | État | Ce qu'il faut |
|---|---|---|
| 5 ADR L0 | 0/5 signées | benchmark sandbox, avis juridique ADR-02, signatures, budget plafonné |
| 7 critères de sortie L0 | 0/7 | `docs/decisions/README.md` |
| Pack signature 18 cases | 0/18 | `PACK-SIGNATURE-L0.md` |
| Validation des 5 tâches hôte (004 T008) | bloquée | exploitant |
| Panel 5-8 testeurs (004 T007, T045, T057, T107) | bloqué | participants |
| Lecteur d'écran / téléphone réel / zoom (004 T076-T078) | bloqué | recette humaine |
| Recette 7 rôles (004 T071, T103) | bloquée | humains |

### 5.2 Preuves externes (code prêt, clés manquantes)

| Tâche | Ce qui manque |
|---|---|
| T113/T114 — tests de contrat ARI et booking | clés sandbox Beds24/Channex |
| T126 — e2e sandbox | idem |
| T127 — double-run iCal + API 14 jours | idem + 14 jours calendaires |
| T229 — réservation payée de bout en bout | clé Stripe test + domaine de test |
| T307 — entrée email réelle | boîte dédiée et preuve d'un message entrant |
| T309 — WhatsApp Business | compte Meta, numéro vérifié, modèles approuvés |
| T404/T414 — PriceLabs réel et 30 jours | clé `PRICELABS_API_KEY`, données réelles |
| T713 — Swikly | contrat et identifiants |
| T718 — 3 intégrations live | contrats partenaires |
| T811 — onboarding en 1 jour | client pilote |
| T514 — relevé réel envoyé | propriétaire réel |

### 5.3 Production

| Élément | État |
|---|---|
| Environnement public | beta Netlify **503 usage_exceeded** |
| Schéma de production | arrêté à `0025` dans la doc ; 104 migrations dans le dépôt |
| SMTP | `EMAIL_ENABLED=false`, aucun fournisseur de production |
| Sauvegardes | workflow quotidien non activé |
| Monitoring | Sentry/Uptime absents |
| Domaine personnalisé | T209 partiel (routage applicatif fait, DNS/TLS réels non prouvés) |
| Rotation des secrets | token Netlify à révoquer, mot de passe admin à changer |

### 5.4 Recette

- 155 cases de `TESTS-A-FAIRE.md` non exécutées.
- 21 parcours de `qa-manuel.md` non exécutés.
- 13 tâches de la spec 004 non closes.
- Aucune preuve de paiement réel, d'email réel, de cron réel, de sauvegarde/restauration réelle.

### 5.5 Terrain et box (55 items)

P0 commandes, P1 Proxmox/HAOS/Z2M/Thread/WireGuard/NUT, P3 Nuki/KeyMaster, P4 énergie, P5 sécurité, P8 go-live, P9 VM réelle, P10 client/RC pro/carte G. Budget log1 ~1 050-1 150 €, RC pro ~1-2 k€/an, délai juridique 2-3 mois.

### 5.6 Convergence technique

| Élément | État | Référence |
|---|---|---|
| Migration des données V1→V2 | **absente** | FR-011, audit §5.4 |
| Cutover log1/log2/log3 | **absent, jamais daté** | audit §5.4 |
| Suppression de l'ancienne UI Next (`v2/src/app`, 3 `.tsx`) | **non faite** | T111 ; la constitution la garde comme référence → contradiction à trancher |
| Page publique `/logement/[slug]` | **absente**, écart assumé | `ECARTS-V1.md` |
| Adaptateur Swikly | **absent** | T713 |
| Lecture retour OTA (prix/dispo/restrictions) | **absente** | dépend des clés fournisseur |
| API OTA natives / certification | **exclues** | contrat partenaire |
| Duve / Touch Stay | **non retenu** | aucun contrat |
| Voix BYOD, box physique | **exclus** | matériel |
| Multi-devises | **hors périmètre** (EUR) | FR-072 |
| Blog, 32 langues | **hors périmètre** (6 langues, 4 types de pages) | traçabilité 002 |

### 5.7 Documentation

- Aucun index de toutes les docs ; `docs/README.md` date du 24/10 et annonce 27 documents pour 135.
- 72 documents V1 encore présentés comme référence sans bandeau d'archive.
- 18 documents structurants périmés (liste §7).
- Spec 003 à 0/74 qui double 002 et 004.
- Traçabilité 002 limitée aux 69 écarts de `replica/features.csv`, pas aux 72 exigences FR.
- Aucun document de migration V1→V2 ni de cutover.
- Aucun document de production stable (le seul `DEPLOIEMENT.md` décrit un beta mort).

---

## 6. Spec Kit — état détaillé

### 6.1 Spec 001 — i18n staff

**Close, 34/34.** Aucune action. À déplacer dans un dossier `specs/closes/` ou à marquer `Statut: Terminé` en tête.

### 6.2 Spec 002 — parité Lodgify

**165 faites, 6 partielles, 23 ouvertes.**

| Phase | Fait | Partiel | Ouvert | Reste |
|---|---:|---:|---:|---|
| L0 décisions | 2 | 0 | 10 | benchmark, avis juridique, 5 ADR, budget, signatures |
| Fondations | 9 | 0 | 0 | — |
| US1 distribution | 26 | 1 (T110) | 4 | T113, T114, T126, T127 |
| US2 site + paiement | 29 | 1 (T209) | 1 | T229 |
| US3 inbox | 22 | 2 (T307, T309) | 1 | T306 |
| US4 pricing | 13 | 1 (T404) | 1 | T414 |
| US5 reporting | 15 | 0 | 1 | T514 |
| US6 voyageur | 13 | 0 | 0 | — |
| US7 API | 19 | 0 | 2 | T713, T718 |
| US8 onboarding | 10 | 1 (T810) | 1 | T811 |
| Convergence | 7 | 0 | 2 | T907, T908 |

Sur ces 23 ouvertes, **19 sont des gates humaines ou externes** ; 4 sont des tests de contrat qui ne peuvent pas s'exécuter sans clés. Il n'y a **aucune tâche de développement pure** restante dans la spec 002.

### 6.3 Spec 003 — audit et exécution

**0/74, statut « Active », entièrement non suivie par Git.** Elle a été écrite le 9/11 comme plan d'exécution de l'audit. Depuis, ses lots ont été réalisés dans 002 et 004. Elle n'a plus de valeur d'exécution et fausse tous les tableaux de bord : elle affiche 0 % alors que 85 % de son périmètre est livré. **À clôturer explicitement**, en réaffectant ses tâches à 002/004 et à la spec 005.

### 6.4 Spec 004 — ergonomie

**99/112.** Les 13 restantes :

- humaines : T007, T008, T011, T045, T057, T071, T076, T077, T078, T103, T107 ;
- sans objet : T072 (aucun flag n'a jamais existé) ;
- déploiement : T110.

Les mesures automatisées sont faites : axe 0 violation sur 70 routes staff + 21 publiques, 0 cible < 44 px, 0 débordement 320 px, Lighthouse 100/94. Le plan est donc **proche de la clôture** : il manque la validation humaine, pas le code.

### 6.5 Spec 005 — mise en production

**Créée le 14/11, 96 tâches, statut Draft.** Elle couvre ce que Spec Kit ne
savait pas porter : environnement public, recette, migration V1→V2, bascule et
extinction V1. Quatre histoires : US1 environnement (P1), US2 recette (P1),
US3 migration (P2), US4 bascule (P3).

Fichiers : `specs/005-mise-en-production/{spec.md,plan.md,tasks.md}`,
`contracts/exploitation.md`, `checklists/requirements.md`.

### 6.6 Ce que Spec Kit ne couvre pas

Une seule feature reste hors Spec Kit : **la gouvernance documentaire**
(index, statuts, archivage, contrôle de fraîcheur). Elle est traitée comme les
lots D1-D7 du plan documentaire (§8), pas comme une feature produit.

---

## 7. Écarts documentation → implémentation

| Document | Ce qu'il affirme | Réalité au 14/11 | Action |
|---|---|---|---|
| `AUDIT-COMPLET-PLANS-VS-V2.md` (09/11) | 62/194 tâches, L4-L7 à 0, 93 pages, 48 endpoints, 94 migrations | 165/194, L4-L7 codés, 112 pages, 61 endpoints, 104 migrations | archiver, remplacé par cet audit |
| `v2/ECARTS-V1.md` | Lighthouse « non mesuré » ; pas de section site public / channel manager / L4-L7 | Lighthouse mesuré le 13/11 (100/94) ; site public, channel manager, pricing et relevés livrés | mettre à jour 8 à 10 lignes, ajouter 3 sections |
| `v2/MATRICE-MUST-HAVE-CHANNEL-MANAGER.md` | « le cut-off n'est pas encore modélisé » | cut-off, buffer et restrictions sont implémentés (`PLAN-LEVER` §4.2) | corriger la phrase |
| `v2/README.md` | « Lighthouse n'est pas installé, le rapport indique absent » | mesuré via `npx` (13.6.0), sans dépendance ajoutée | reformuler : « non ajouté aux dépendances ; mesuré par `npx` » |
| `docs/README.md` | index généré le 24/10, **27 documents** | 137 documents dans `docs/`, dont 30 numérotés + 107 en sous-dossiers | régénérer l'index ou le remplacer par `docs/INDEX.md` |
| `docs/73`, `74`, `75` | générés le 23-24/10 depuis le commit V1 `3ff0510` | la branche active est `v2`, 104 migrations | archiver V1 ou régénérer contre la V2 |
| `specs/003/tasks.md` | 0/74, statut Active | périmètre livré dans 002/004 | clôturer, rediriger |
| `specs/002/traceability.md` | 69 écarts `replica/features.csv` | 72 exigences FR dans `spec.md` | ajouter la matrice FR → test → route |
| `docs/plans-archives/README.md` | « les documents de référence sont à la racine » | les plans racine sont V1 gelés le 13/10 | corriger : la référence est `specs/002` + `v2/` |
| Plans racine + `docs/10/30/40/50/60/70` | normatifs V1 `web/` + `custom/` Python | la V2 est SvelteKit, la V1 est gelée | archiver V1, requalifier 10/20, clarifier le mot « v2 » |
| `docs/checklist-taches-restantes.md` | 90/144, base « 60-execution-v6 » | 144 tâches V1 ; la V2 a ses 194+112 tâches | préciser « V1 uniquement » |
| `v2/docs/qa-manuel.md` | décrit l'UI d'avant refonte | routes SvelteKit actuelles | réécrire les 21 parcours |
| `v2/DEPLOIEMENT.md` | beta du 25/10, schéma 0025, email off | beta 503, schéma 0104, aucun SMTP | réécrire la section 0 |
| `docs/analyses/AUDIT-L1-EXISTANT.md` | T315/T316 « non commencés » | faits le 10/11 | ajouter une note de statut datée (document historique) |
| `v2/TESTS-A-FAIRE.md` | 143 cases dans l'audit du 9/11 | 161 cases, 6 cochées | sourcer le bon compte |
| `docs/registres/etat-reel.md` | mélange V1 (lab, box) et V2 (ergonomie) | deux produits dans un registre | scinder `etat-reel-v1.md` / `etat-reel-v2.md` |
| `docs/registres/exigences.csv` | 33 exigences, statut `fige-v1` | V2 = 72 FR + 20 FR | marquer V1, pointer vers specs |
| `.gitignore` | — | 7 fichiers `.artifacts` non suivis, pas ignorés | ajouter `v2/.artifacts/`, `v2/test-results*/` |

---

## 8. Plan pour toutes les documentations

### 8.1 Principe : cinq sources de vérité, tout le reste est annexe

| Question | Document unique | Règle |
|---|---|---|
| Où en est le produit ? | `README.md` (racine) | 1 page, datée, 5 liens |
| Quelle est la carte des docs ? | `docs/INDEX.md` | statut, propriétaire, dernière vérification |
| Quelles sont les exigences et l'exécution ? | `specs/*/spec.md` + `tasks.md` | Spec Kit, une feature active à la fois |
| Quel est l'état mesuré ? | `docs/registres/etat-reel-v2.md` | chiffres + commande + date |
| Comment l'exploiter ? | `v2/README.md`, `v2/DEPLOIEMENT.md`, `v2/RUNBOOK-OTA.md` | procédures exécutables |

Tout document qui ne répond pas à une de ces questions est une **annexe spécialisée** (juridique, copro, stratégie familiale, outillage) ou une **archive**.

### 8.2 En-tête obligatoire

Chaque document structurant commence par :

```text
Statut : ACTIF | ARCHIVE | GÉNÉRÉ | OBSOLÈTE | REMPLACÉ
Propriétaire : <rôle>
Dernière vérification : AAAA-MM-JJ
Remplace / remplacé par : <chemin>
Source de vérité : <chemin ou commande>
```

Un document sans en-tête est exclu de l'index et ne peut pas être cité comme preuve.

### 8.3 Structure cible

```text
README.md                          # état + prochaine action + 5 liens
docs/
  INDEX.md                         # table de toutes les docs (statut, owner, date)
  00-vision.md                     # vision (actif)
  10-exigences-produit.md          # fusion 10/20, renvoie aux FR 002/004
  20-architecture-v2.md            # architecture SvelteKit réelle
  72-runbooks.md                   # runbooks V2
  80-stack-sveltekit.md            # ADR-008 (actif)
  decisions/                       # ADR L0 + ADR-008, un seul registre
  registres/
    etat-reel-v2.md
    changelog.md
    risques.md
    a-trancher.md
  analyses/                        # audits datés
  ops/                             # procédures V2
  archive/v1/                      # tout le corpus A, immuable
specs/
  001-i18n-staff/                  # clos
  002-parite-lodgify/              # actif
  003-audit-parite-plans-initiaux/ # clos, absorbé
  004-ergonomie-experience-client/ # clos hors humain
  005-mise-en-production/          # créée 2026-11-14
v2/
  README.md
  ECARTS-V1.md
  TESTS-A-FAIRE.md
  DEPLOIEMENT.md
  RUNBOOK-OTA.md
  ...
```

### 8.4 Lots documentaires

| Lot | Action | Documents | Livrable | Effort |
|---|---|---|---|---|
| **D0** | Inventaire et audit | tous | cet audit + CSV | fait |
| **D1** | Index et en-têtes | `README.md`, `docs/INDEX.md`, 20 docs structurants | carte navigable | 0,5 j |
| **D2** | Archivage V1 | plans racine, `docs/30/40/50/60/70/71/73/74/75/76/77/78`, `decisions-parc`, préps R-* | `docs/archive/v1/` + README d'archive | 0,5 j |
| **D3** | Clôture Spec Kit | 001, 003, 004 | statuts à jour, 003 absorbée | 0,25 j |
| **D4** | Spec 005 production | fait le 14/11 | spec/plan/tasks 005 + contrat | fait |
| **D5** | Mise à jour des périmés | ECARTS, MATRICE, README, TESTS, qa-manuel, DEPLOIEMENT, etat-reel, changelog | 18 docs corrigés | 0,75 j |
| **D6** | Documents manquants | migration V1→V2, cutover, runbook production, traçabilité FR | 4 docs | 1 j |
| **D7** | Automatisation | `deploy/test-docs.ps1`, CI | contrôle de fraîcheur | 0,5 j |

**Total : ~4 jours-homme**, dont 1,5 jour de rédaction et 2,5 jours de tri/archivage.

### 8.5 Sort de chaque famille

| Famille | Action |
|---|---|
| Racine (9) | créer un `README.md` ; déplacer les 5 plans + `DEMARRAGE.md` + l'ancien audit en `docs/archive/v1/` ; garder `AGENTS.md` |
| Socle numéroté (30) | garder 00, 72, 80 ; réécrire 10/20 en exigences/architecture V2 ; archiver 30/40/50/60/70/71/73/74/75/76/77/78 ; garder les docs business |
| Spec Kit (45) | 001 close, 002 active, 003 close, 004 close hors humain, 005 créée |
| Décisions L0 (9) | signer ou re-dater ; intégrer ADR-008 au registre unique |
| Décisions parc (8) | archive V1 ; conserver ADR-007/008 en référence citée |
| Registres (17) | scinder etat-reel ; garder changelog, risques, a-trancher ; archiver les 7 préps R-* et `exigences.csv` |
| Analyses (2) | archiver l'audit du 9/11 ; cet audit devient la référence du 14/11 |
| Plans/archives (13) | corriger le README d'archive ; archiver les plans racine ; mettre à jour la roadmap |
| Exploitation (5) | requalifier les 3 procédures V1 ; garder les 2 runbooks V2 |
| Logements (13) | actifs, maintenir le statut bloqué REQ-L-001 |
| Juridique/business (48) | actifs, index dédié, liens vers ADR-02 et mandats |
| Produit V2 (44) | actifs, MAJ ciblées (§7) |
| Outillage IA (35) | hors index produit, versionner avec le projet |

### 8.6 Règles de fraîcheur

1. **Une date absolue** partout ; jamais « aujourd'hui », « récemment ».
2. **Un chiffre = une commande** : les compteurs de tests, routes, migrations citent la commande ou le fichier.
3. **Un document généré** porte `GÉNÉRÉ` + la commande + la date ; il n'est jamais édité à la main.
4. **Une archive est immuable** : on n'y corrige pas le fond, on ajoute un bandeau `REMPLACÉ PAR`.
5. **Une feature close** ne reste pas « Active » : `Statut: Terminé` + date.
6. **Revue mensuelle** : `docs/INDEX.md` + `etat-reel-v2.md` + `ECARTS-V1.md` + `TESTS-A-FAIRE.md`.

### 8.7 Automatisation

Étendre `deploy/test-docs.ps1` pour vérifier :

- chaque `.md` a un en-tête `Statut` ;
- chaque lien relatif existe ;
- chaque document `ACTIF` a une date ≤ 90 jours ;
- `docs/INDEX.md` liste tous les documents projet ;
- aucun document `ARCHIVE` n'est cité comme source de vérité ;
- les compteurs de `tasks.md` sont cohérents avec le tableau de bord.

CI : un job `docs` qui échoue si l'index est périmé. Pre-commit : refuser un `.md` sans en-tête dans `docs/`, `specs/`, `v2/`.

### 8.8 Calendrier documentaire

| Date | Lot | Résultat |
|---|---|---|
| 14/11 | D0 | audit + CSV (fait) |
| 15/11 | D1 + D2 | index, en-têtes, archive V1 |
| 16/11 | D3 (D4 fait le 14/11) | Spec Kit propre, spec 005 créée |
| 17-18/11 | D5 + D6 | 18 docs corrigés, 4 docs créés |
| 19/11 | D7 | contrôle automatique |
| 22/11 | revue | index + registres à jour, commit |

---

## 9. Plan d'exécution produit (hors documentation)

### 9.1 Chemin critique

```text
Commit de sauvegarde
   └── L0 signé (ou roadmap re-datée)
         └── Comptes sandbox + Stripe test + PriceLabs
               └── Environnement public à jour (104 migrations, SMTP, backups)
                     └── Recette 161 + 21
                           └── 1 réservation payée (M2)
                                 └── Double-run 14 j (M1)
                                       └── Gates M3-M7
                                             └── Migration V1→V2 + cutover
```

Le terrain (P0-P5) est un chemin parallèle, bloqué par l'accès au logement et le budget.

### 9.2 Phases

| Phase | Quand | Contenu | Sortie | Effort |
|---|---|---|---|---|
| **P0 — Sauver et décider** | 14-16/11 | commit/tag ; signer L0 ou re-dater ; figer le périmètre de la V2 | dépôt sauvegardé, décisions prises | 1 j + 7 h humaines |
| **P1 — Débloquer les preuves** | 17-30/11 | comptes Beds24/Channex/Stripe test/PriceLabs ; benchmark ; avis ADR-02 | clés disponibles, ADR signables | 2-3 j + délais externes |
| **P2 — Environnement public** | 1-10/12 | choisir Netlify/VPS/Render ; appliquer 104 migrations ; SMTP ; sauvegardes ; monitoring ; domaine | URL stable, schéma à jour, `/api/ready` vert | 2-3 j |
| **P3 — Recette** | 8-20/12 | 155 cases + 21 QA ; corriger les écarts | recette verte, écarts tracés | 5-8 j |
| **P4 — Gates M1-M3** | déc-fév | T113/T114/T126/T127 ; T229 ; T307/T309 ; M1/M2/M3 | 0 surbooking, 1 paiement réel, 80 % messages | 5 j + 14 j calendaires |
| **P5 — Gates M4-M7** | fév-avr | T404/T414 ; T514 ; T713/T718 ; T811 | pricing 30 j, relevé, 3 intégrations, onboarding | 5 j + données réelles |
| **P6 — Convergence** | avr-mai | migration V1→V2 ; suppression UI Next ; cutover ; archive V1 | V1 éteinte, V2 seule | 3-5 j |
| **T — Terrain** | parallèle | P0 → P1-box → P3/P4/P5 → P8-8 | log1 en production réelle | 8-12 semaines |
| **J — Juridique** | dès prospect | RC pro, carte G, médiation, INPI | mandat tiers possible | 2-3 mois |

### 9.3 Décisions à prendre maintenant

1. **Signer L0 ou re-dater la roadmap.** La date M0 du 15/11 n'est plus tenable ; garder la date sans signature rend tous les jalons M1-M7 fictifs.
2. **Choisir la cible de production** : Netlify payant, VPS Docker/Caddy, Render, ou Oracle Free. Le beta gratuit est mort.
3. **Trancher la dette de convergence** : supprimer `v2/src/app` (T111) ou assumer qu'elle reste une référence de parité. La constitution et la spec 003 se contredisent.
4. **Trancher le canal manager** : Beds24 (économique) ou Channex (white-label), avec le budget associé (17 €/mois vs 130 $/mois). C'est l'objet d'ADR-01.
5. **Trancher le sort du corpus V1** : archive totale ou maintien d'un sous-ensemble pour la box physique.

---

## 10. Annexes

### A. Preuves et commandes

| Fait | Commande / fichier |
|---|---|
| Comptage des tâches | `grep '^- \[x\]' specs/*/tasks.md` |
| Inventaire code | `find v2/src/routes -name '+page.svelte'` ; `+server.ts` ; `drizzle/*.sql` |
| État Git | `git status --porcelain` ; `git log -1` |
| Beta Netlify | `curl -s -o /dev/null -w '%{http_code}' https://lcd-parc.netlify.app/api/ready` → 503 |
| Tests déclarés | `docs/registres/etat-reel.md`, entrées du 13/11 |
| Recette | `v2/TESTS-A-FAIRE.md`, `v2/docs/qa-manuel.md` |
| Terrain | `docs/checklist-taches-restantes.md` |

### B. Les 23 tâches ouvertes de la spec 002

L0 : T001-T010 (10). US1 : T113, T114, T126, T127 (4). US2 : T229 (1). US3 : T306 (1). US4 : T414 (1). US5 : T514 (1). US7 : T713, T718 (2). US8 : T811 (1). Convergence : T907, T908 (2). Partielles : T110, T209, T307, T309, T404, T810 (6).

### C. Les 13 tâches ouvertes de la spec 004

T007, T008, T011, T045, T057, T071, T072 (sans objet), T076, T077, T078, T103, T107, T110.

### D. Inventaire complet

`docs/analyses/inventaire-documentation-2026-11-14.csv` — 306 lignes, colonnes : chemin, famille, lignes, statut proposé, priorité.

---

## 11. Conclusion

**Le produit est construit ; le projet n'est pas encore prouvé, sauvegardé ni raconté de façon fiable.**

- Le code couvre ~90 % de la parité V1 et 85 % de la spec 002. Les 23 tâches restantes sont des **preuves**, pas des fonctionnalités.
- Les vrais manques sont : **commit de sauvegarde**, **L0 signé**, **environnement public à jour**, **recette**, **migration/cutover**, **terrain**.
- La documentation doit être **réduite et hiérarchisée**, pas augmentée : 5 sources de vérité, 1 index, 72 archives V1 clairement étiquetées, 18 documents corrigés, 4 documents créés.
- La priorité de la semaine n'est pas d'écrire une page de plus : c'est de **committer les 462 entrées**, de **trancher L0**, et de **remettre un environnement public en ligne**.
