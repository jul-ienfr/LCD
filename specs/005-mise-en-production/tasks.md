# Tasks: Mise en production, recette et bascule V1 → V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/spec.md
```

**Input**: `specs/005-mise-en-production/spec.md`, `plan.md`,
`contracts/exploitation.md`

**Tests**: la recette et les preuves sont obligatoires (constitution IV). Une
tâche d'exploitation n'est cochée que si sa preuve est datée et archivée.

**Organisation**: par histoire utilisateur. Les tâches `[P]` touchent des
fichiers ou des systèmes différents et peuvent avancer en parallèle.

**Légende**: `[ ]` à faire · `[x]` fait avec preuve · `[~]` partiel avec reste
explicitement écrit.

## Phase 1 — Setup et décisions

**But**: sauvegarder, trancher l'hébergement et préparer les documents
d'exécution. Aucun provisionnement avant l'ADR-06.

- [x] T001 Committer les 460 fichiers en trois lots (specs/docs, code, tests), vérifier `git status --porcelain` vide et poser le tag `v2.0.0-rc1`
  — fait le 2026-11-14 : commits `4271ece`, `4e2b89a`, `d8ff261` ; arbre propre ; tag annoté `v2.0.0-rc1`.
- [x] T002 [P] Inventorier les variables de `v2/.env.example` et de `v2/DEPLOIEMENT.md`, marquer celles qui sont obligatoires, optionnelles ou interdites en production, dans `docs/ops/runbook-production.md` §1
  — fait : 70 variables classées O/F/I/S, secrets et rotation documentés.
- [~] T003 [P] Écrire et signer `docs/decisions/ADR-06-hebergement-production.md` : VPS recommandé, Netlify payant, Render ou Oracle Free ; critères coût, région UE, disque, cron, sauvegarde
  — écrit le 2026-11-14 ; **signature exploitant en attente** (case §Signature).
- [~] T004 [P] Choisir la base de production (PostgreSQL auto-hébergé ou managé UE), la région, le RPO 24 h et le RTO 30 min, dans l'ADR-06 §2
  — PostgreSQL 18 auto-hébergé, UE, RPO 24 h / RTO 30 min retenus par défaut ; à contresigner.
- [~] T005 [P] Choisir le domaine public, les sous-domaines et le titulaire DNS, dans `docs/ops/runbook-production.md` §2
  — procédure et emplacement écrits ; nom de domaine et titulaire à confirmer.
- [~] T006 [P] Choisir le fournisseur SMTP, configurer SPF/DKIM/DMARC et noter les enregistrements dans le runbook §3
  — procédure et contrôles écrits ; fournisseur et enregistrements à créer.
- [~] T007 [P] Choisir la supervision (Uptime Kuma auto-hébergé et/ou Sentry) et la destination des alertes, dans le runbook §4
  — Uptime Kuma retenu, Sentry optionnel ; destinataire des alertes à confirmer.
- [ ] T008 Révoquer le token Netlify exposé, changer le mot de passe admin, générer `BETTER_AUTH_SECRET`, `CRON_SECRET`, `BACKUP_ENCRYPTION_KEY` et les stocker hors dépôt
  — commandes documentées (runbook §1.7) ; action réelle impossible sans serveur et sans accès au compte.
- [x] T009 Trancher `v2/netlify.toml` : corriger pour `adapter-node` ou le marquer obsolète et retirer Netlify de la cible, dans l'ADR-06 §3
  — `v2/netlify.toml` supprimé ; workflows cron passés à `vars.LCD_APP_URL` ; ancien guide archivé.
- [x] T010 [P] Créer `docs/ops/runbook-production.md` : prérequis, installation, déploiement, migration, sauvegarde, restauration, incident, retour arrière
  — fait : 12 sections, matrice cron, procédures et checklist go-live.
- [x] T011 [P] Créer `docs/ops/recette-2026-11/journal.md` avec une ligne par case des 155 tests et des 21 parcours (id, date, opérateur, résultat, preuve, défaut)
  — fait : 155 cases `REC-001…155` + 21 parcours `QA-001…021`, colonnes de preuve et signature.
- [x] T012 [P] Créer `docs/plans/PLAN-MIGRATION-V1-V2.md` : sources, matrice, ordre d'import, réconciliation, données personnelles, retour arrière
  — fait : inventaire V1 réel, matrice, journal `migration_v1`, décisions et retour arrière.

**Gate G0**: arborescence propre, tag posé, ADR-06 signé, runbook et journal
de recette créés.

---

## Phase 2 — Fondations d'exploitation

**But**: outiller le déploiement, la migration, la sauvegarde, la supervision
et le retour arrière avant de toucher à la production.

- [x] T020 Créer `v2/scripts/preflight.mjs` : version Node, variables obligatoires, connexion base, migrations attendues, espace disque, écriture du volume photos ; sortie non nulle au premier échec — **fait** : `v2/scripts/preflight.ts` (exécuté par `tsx`, importe la validation de `env-production.ts`), `npm run preflight`. Validé sur la base locale : `lcd_app`, RLS, 104/104 migrations, 18 Go libres, volume inscriptible ; échec immédiat si un contrôle casse.
- [x] T021 Créer la validation d'environnement de production dans `v2/src/lib/server/env-production.ts` et ses tests : refus des secrets de développement, `EMAIL_ENABLED` cohérent, URL HTTPS — **fait** : 17 tests (`tests/lib/server/env-production.test.ts`), branchée dans `hooks.server.ts` (`init`) uniquement si `NODE_ENV=production` **et** `APP_URL` HTTPS. Vérifié : build local HTTP non bloqué ; démarrage HTTPS sans `BACKUP_ENCRYPTION_KEY` refusé avec la liste des erreurs.
- [x] T022 Ajouter au workflow CI un job déclenché sur tag : `npm ci`, `npm run check`, `npm test`, `npm run build`, `npm run test:e2e` et publication de l'artefact — **fait** : job `release` dans `v2-ci.yml` (`tags: v*`) : typecheck, tests, `db:check`, migrations, seeds, rôle/RLS, build, preflight, e2e sur build de production, artefacts `playwright-*` et `lcd-build-*` (30 j). Non encore exécuté sur GitHub.
- [x] T023 Exposer la version déployée dans `/api/health` ou `/systeme` et la comparer au tag attendu par le preflight — **fait** : `versionDeployee()` lit `LCD_VERSION`, injecté par `scripts/deployer.sh` (`export LCD_VERSION=<tag>` → compose). Vérifié en local : `/api/health` et `/api/ready` renvoient `v2.0.0-rc1`. Le preflight avertit si `LCD_VERSION` est absente.
- [x] T024 Documenter et script le job de migration séparé : conteneur `tools`, `MIGRATION_DATABASE_URL` owner, `npm run db:migrate`, `npm run db:check`, arrêt au premier échec — **fait** : runbook §8 ; `compose.prod.yml` force `MIGRATION_DATABASE_URL: ""` dans `web`, le conteneur `tools` garde la connexion owner. Preflight exécuté dans `tools`.
- [x] T025 Créer le rôle `lcd_app` non-propriétaire, vérifier `npm run db:test-rls`, et documenter la rotation du mot de passe — **fait** : `db:role-app` + `db:test-rls` verts en local (`RLS VALIDÉE`) et dans le job `release` ; rotation documentée runbook §1.7 (redémarrage `web`/`postgres`, vérification `/api/ready`). À rejouer sur la base de production (R2).
- [~] T026 Activer `.github/workflows/v2-backup.yml` ou un cron équivalent : `db:backup`, chiffrement, checksum, copie hors serveur, rétention 30 jours — **workflow prêt** (quotidien 02:00 UTC, artefact 30 j, chiffrement si `BACKUP_ENCRYPTION_KEY`) ; secrets `MIGRATION_DATABASE_URL` et `BACKUP_ENCRYPTION_KEY` à poser, copie hors GitHub à confirmer.
- [~] T027 Répéter `db:restore-test` sur une copie de production et consigner durée, comptes, totaux et éventuelles anomalies — **local validé** (2026-10-26, `RESTAURATION VALIDÉE`, 57 migrations) ; la copie de production n'existe pas encore (R2).
- [x] T028 Configurer les journaux : niveau, rotation, rétention 30 jours, absence de secret et de donnée personnelle inutile — **fait** : rotation Docker 7 × 20 Mo par service (`compose.prod.yml`), logs JSON stdout, purge `db:purge-suivi`, `v2/MONITORING.md` réécrit pour la cible VPS (commandes, monitors, checklist). La rétention 30 j des événements reste réglée par la purge applicative.
- [x] T029 Écrire la matrice des tâches planifiées (ICS, fournisseurs, messages, pricing, webhooks, relances) avec un seul déclencheur par tâche, dans le runbook §5 — **fait** : runbook §5 + `v2/DEPLOIEMENT.md` §5 ; workflows GitHub sur `vars.LCD_APP_URL`.
- [x] T030 Créer `v2/scripts/deployer.sh` et `v2/scripts/revenir.sh` : sauvegarde, migration, démarrage, smoke, rollback, verrou anti-double exécution — **fait** : verrou `flock`, sauvegarde, checkout du tag, build, migrations, `up`, contrôles `/api/health` + `/api/ready` + HTTPS, enregistrement du tag précédent, restauration optionnelle confirmée. Syntaxe `bash -n` vérifiée ; exécution réelle à faire au premier déploiement.
- [x] T031 Ajouter un scan de secrets (gitleaks ou équivalent) à la CI et vérifier l'historique du dépôt — **fait** : job `secrets` (gitleaks v8.24.0) + `.gitleaks.toml` avec allowlist des placeholders/fixtures. Scan local de 397 commits : **0 fuite**.
- [x] T032 Mettre à jour `v2/DEPLOIEMENT.md`, `v2/DEPLOIEMENT-VPS.md`, `v2/BACKUPS.md` et `v2/MONITORING.md` avec les commandes et chemins réels de la cible — **fait** : preflight, `deployer.sh`/`revenir.sh`, `PG_CONTAINER=lcd-postgres`, restauration chiffrée, logs et monitors VPS. `netlify.toml` supprimé, guide Netlify archivé.

**Gate G1**: preflight, CI, migration, sauvegarde, restauration et rollback
sont exécutables sur une machine de test.

---

## Phase 3 — US1 Environnement public sain (P1) 🎯 MVP

**Goal**: une URL HTTPS stable, une base à jour, un email réel, une sauvegarde
restaurable et des alertes.

**Independent Test**: serveur vierge + tag → `/api/ready` vert, email reçu,
sauvegarde restaurée, rollback rejoué.

### Provisionnement

- [ ] T040 [US1] Provisionner le VPS (Debian/Ubuntu, 2 vCPU, 4 Go RAM, 40 Go SSD minimum) et noter l'adresse, la région et le coût dans le runbook §6
- [ ] T041 [US1] Durcir le serveur : utilisateur non-root, clés SSH, pare-feu 22/80/443, mises à jour automatiques, fail2ban
- [ ] T042 [US1] Installer Docker et Docker Compose, vérifier la version et le démarrage au boot
- [ ] T043 [US1] Cloner le dépôt sur le tag `v2.0.0-rc1` et vérifier que `git status` est propre
- [ ] T044 [US1] Créer `.env.prod` depuis le runbook : `DATABASE_URL` (rôle app), `MIGRATION_DATABASE_URL` (owner), `BETTER_AUTH_URL`, secrets, SMTP, `DOMAIN`, `EMAIL_ENABLED=true`
- [ ] T045 [US1] Démarrer PostgreSQL avec volume persistant, vérifier `pg_isready` et l'espace disque

### Base et application

- [ ] T046 [US1] Appliquer toutes les migrations avec le conteneur `tools`, vérifier `db:check` et le nombre de migrations en base
- [ ] T047 [US1] Créer le rôle `lcd_app`, exécuter `db:test-rls` contre la production et archiver la sortie
- [ ] T048 [US1] Créer le compte administrateur dédié, activer la 2FA, supprimer ou désactiver tout compte de démonstration
- [ ] T049 [US1] Construire et démarrer `web`, `caddy` et `uptime-kuma`, vérifier les conteneurs et les journaux
- [ ] T050 [US1] Configurer le DNS et le certificat, vérifier HTTPS, HSTS, redirection HTTP et l'absence d'erreur de certificat
- [ ] T051 [US1] Envoyer un email réel depuis l'application vers une boîte externe, vérifier SPF/DKIM/DMARC et l'absence de classement indésirable
- [ ] T052 [US1] Exécuter le smoke test : `/api/health`, `/api/ready`, `/login`, `/reserver`, `/voyageur`, `/aide`, `/legales`, avec et sans JavaScript
- [ ] T053 [US1] Vérifier l'installation PWA, le service worker, le cache hors ligne et les photos de démonstration remplacées
- [ ] T054 [US1] Activer les tâches planifiées et vérifier une exécution réelle de chaque cron, sans doublon avec un planificateur in-process
- [ ] T055 [US1] Produire une sauvegarde de production, la copier hors serveur, la restaurer sur une base jetable et comparer au manifeste
- [ ] T056 [US1] Configurer Uptime Kuma sur `/api/health` et `/api/ready`, Sentry si retenu, et tester une alerte réelle reçue par l'exploitant
- [ ] T057 [US1] Répéter le retour arrière : déployer le tag précédent, vérifier le smoke, revenir au tag courant, mesurer la durée
- [ ] T058 [US1] Écrire `docs/ops/preuves-mise-en-production-2026-11.md` : URL, version, migrations, rôle, email, sauvegarde, restauration, alertes, rollback

**Checkpoint US1**: l'environnement public est utilisable, sauvegardé,
supervisé et réversible.

---

## Phase 4 — US2 Recette complète (P1)

**Goal**: 155 cases et 21 parcours exécutés, défauts triés, recette signée.

**Independent Test**: journal complet, 0 S1/S2 ouvert, preuves archivées.

### Préparation

- [ ] T070 [US2] Réécrire `v2/docs/qa-manuel.md` pour les routes SvelteKit actuelles : 21 parcours, rôle, URL, résultat attendu, preuve
- [ ] T071 [P] [US2] Exécuter la recette authentification, rôles, 2FA et sessions (`TESTS-A-FAIRE.md` §1)
- [ ] T072 [P] [US2] Exécuter la recette logements, annonces, onboarding et import CSV (§2)
- [ ] T073 [P] [US2] Exécuter la recette planning, prix, canaux, ICS et fournisseurs (§3)
- [ ] T074 [P] [US2] Exécuter la recette séjour, ménage, incidents, EDL et police (§4)
- [ ] T075 [P] [US2] Exécuter la recette paiements, cautions et remboursements avec Stripe test (§5)
- [ ] T076 [P] [US2] Exécuter la recette factures, Factur-X, compta, rapprochement et relevés (§6)
- [ ] T077 [P] [US2] Exécuter la recette CRM, support, fils internes et messagerie (§7)
- [ ] T078 [P] [US2] Exécuter la recette API, clés, webhooks, imports/exports et Nuki (§8)
- [ ] T079 [P] [US2] Exécuter la recette IA, notifications, RGPD, audit et recherche (§9)
- [ ] T080 [P] [US2] Exécuter la recette super-admin, sécurité, sauvegardes et restauration (§10)
- [ ] T081 [P] [US2] Rejouer Lighthouse mobile/desktop, axe, cibles 44 px et 320 px sur l'environnement public, comparer aux baselines 004

### QA et validations humaines

- [ ] T082 [US2] Exécuter les 21 parcours de `v2/docs/qa-manuel.md` et consigner chaque résultat
- [ ] T083 [US2] Réaliser ou différer avec accord les validations humaines 004 : T007, T008, T011, T045, T057, T071, T076, T077, T078, T103, T107
- [ ] T084 [US2] Trier les défauts : sévérité S1-S4, propriétaire, échéance, contournement, dans le journal de recette
- [ ] T085 [US2] Corriger tous les défauts S1 et S2, rejouer les cases concernées et ajouter un test de non-régression quand c'est automatisable
- [ ] T086 [US2] Vérifier les preuves minimales : un email réel, un paiement test, une sauvegarde restaurée, un cron exécuté, un parcours sans JavaScript
- [ ] T087 [US2] Signer la recette : 155/155 et 21/21 exécutés, 0 S1/S2, S3 acceptés avec contournement et signataire
- [ ] T088 [US2] Archiver le journal et les preuves sous `docs/ops/recette-2026-11/` et mettre à jour `docs/registres/etat-reel.md`

**Checkpoint US2**: la recette est prouvée et signée ; l'ouverture peut être
décidée.

---

## Phase 5 — US3 Migration V1 → V2 (P2)

**Goal**: données utiles reprises, réconciliées, import rejouable, exclusions
signées.

**Independent Test**: import sur copie, comptes et totaux conformes, second
import sans doublon.

### Inventaire et correspondance

- [ ] T100 [US3] Inventorier toutes les sources V1 : `custom/passerelle-parc/parc.db`, YAML (`logements.yaml`, `acces.yaml`, `branding.yaml`, `design.yaml`, `vitrines.yaml`, `zones.yaml`), JSONL d'état, `custom/memoire/voyageurs.yaml`, ICS et exports OTA
- [ ] T101 [US3] Décrire chaque source : table ou fichier, volume, propriétaire, qualité, sensibilité, devenir (migrer, archiver, exclure)
- [ ] T102 [US3] Écrire la matrice de correspondance V1 → V2 : entités → tenants, logements → logements, mandats → mandats, prospects/offres → CRM, annonces → annonces, documents → stockage
- [ ] T103 [US3] Statuer sur les données personnelles : base légale, minimisation, durée, purge, et exclure tous les secrets V1
- [ ] T104 [US3] Écrire le script d'extraction V1 en lecture seule, avec empreinte SHA-256 et refus d'écriture dans les sources

### Import et réconciliation

- [ ] T105 [US3] Créer une table ou un journal de correspondance `v1:<type>:<id>` → identifiant V2, avec statut et empreinte
- [ ] T106 [US3] Importer les tenants, utilisateurs et rôles, en refusant les comptes de démonstration et les mots de passe V1
- [ ] T107 [US3] Importer les logements et mandats, avec configuration, commissions, cautions et particularités
- [ ] T108 [US3] Importer les prospects, offres et annonces, en conservant les statuts et les dates utiles
- [ ] T109 [US3] Importer les documents et photos utiles, vérifier type, taille et intégrité, et exclure les fichiers orphelins
- [ ] T110 [US3] Statuer sur les réservations historiques : importer les réservations retenues depuis les exports/ICS ou les exclure avec justification
- [ ] T111 [US3] Tester l'idempotence : relancer l'import complet et vérifier zéro doublon, zéro modification silencieuse
- [ ] T112 [US3] Produire le rapport de réconciliation : comptes par type, totaux financiers disponibles, orphelins, écarts et décisions
- [ ] T113 [US3] Exécuter l'import à blanc sur une copie de la production et corriger les erreurs
- [ ] T114 [US3] Répéter l'import sur une seconde copie, comparer les rapports et signer la migration avec l'exploitant

**Checkpoint US3**: la migration est rejouable, réconciliée et signée ; les
exclusions sont acceptées.

---

## Phase 6 — US4 Bascule et extinction V1 (P3)

**Goal**: trafic sur V2, hypercare 14 jours, V1 archivée, retour arrière
possible pendant la fenêtre.

**Independent Test**: répétition complète sur préproduction, rollback mesuré,
smoke tests verts.

- [ ] T120 [US4] Écrire `docs/ops/bascule-2027/runbook.md` : jalons T-14, T-7, T-1, T0, T+1, T+14, rôles, communications, critères de retour arrière
- [ ] T121 [US4] Répéter la bascule sur un environnement de préproduction avec une copie des données et le DNS de test
- [ ] T122 [US4] Mesurer la durée de la répétition, corriger le runbook et valider la fenêtre avec l'exploitant
- [ ] T123 [US4] Réduire le TTL DNS à 300 s au moins sept jours avant la date
- [ ] T124 [US4] À T-1 : sauvegarder la V1 et la V2, prononcer le gel des écritures V1, mesurer le différentiel
- [ ] T125 [US4] Importer le différentiel, réconcilier et vérifier l'absence d'écart non expliqué
- [ ] T126 [US4] Basculer le DNS vers la V2 et vérifier la propagation
- [ ] T127 [US4] Exécuter les smoke tests critiques : public, connexion, réservation, paiement test, voyageur, email, cron
- [ ] T128 [US4] Ouvrir l'hypercare J0 : point horaire, erreurs, paiements, emails, disponibilité
- [ ] T129 [US4] J+1 : point de situation, vérifier les sauvegardes et les premiers crons de production
- [ ] T130 [US4] J+7 : revue des incidents, des performances et des paiements ; décider de poursuivre ou revenir en arrière
- [ ] T131 [US4] J+14 : clôturer l'hypercare, vérifier 0 S1 et la disponibilité ≥ 99,5 %
- [ ] T132 [US4] Passer la V1 en lecture seule, vérifier qu'aucune écriture ne reste possible, conserver la sauvegarde
- [ ] T133 [US4] Arrêter la V1, archiver son état et son tag, documenter son redémarrage
- [ ] T134 [US4] Trancher le sort de `v2/src/app` : suppression ou conservation comme référence, avec justification dans l'ADR-06 §4
- [ ] T135 [US4] Mettre à jour `v2/README.md`, `v2/DEPLOIEMENT.md`, `v2/BACKUPS.md`, `v2/MONITORING.md`, `docs/registres/etat-reel.md`
- [ ] T136 [US4] Conduire le post-mortem sous sept jours : écarts, durées, incidents, actions, propriétaires
- [ ] T137 [US4] Poser le tag de production finale, clôturer 005 et vérifier que `tasks.md` ne contient plus de `[ ]` ni de `[~]` sans justification

**Checkpoint US4**: la V2 est seule en production, la V1 est archivée, le
retour arrière est documenté.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** : immédiate, mais T003-T007 exigent l'exploitant.
- **Phase 2** : dépend de T001 et T003 ; peut avancer pendant la signature L0.
- **Phase 3 (US1)** : dépend de G1 et de l'accès au serveur.
- **Phase 4 (US2)** : dépend de G1 ; peut démarrer dès que `/api/ready` est vert.
- **Phase 5 (US3)** : dépend de T012 et d'une copie de la V1 ; peut avancer en
  parallèle de US2.
- **Phase 6 (US4)** : dépend de US1, US2 et US3.

### Gates

| Gate | Condition | Débloque |
|---|---|---|
| G0 | dépôt propre, tag, ADR-06, runbook, journal | Phase 2 |
| G1 | preflight, CI, migration, backup, restore, rollback testés | US1, US2 |
| G2 | `/api/ready` vert, email, sauvegarde, alertes, rollback | US2, US3 |
| G3 | recette signée, 0 S1/S2 | US4 |
| G4 | migration réconciliée et signée | US4 |
| G5 | bascule répétée, rollback mesuré | T0 |

### Parallélisme

- T002, T010, T011, T012 en parallèle.
- Les sections de recette T071-T081 en parallèle si plusieurs opérateurs.
- L'inventaire et la matrice de migration T100-T104 en parallèle de la recette.
- Le terrain (55 items) et les contrats 002 avancent hors de cette feature.

## Implementation Strategy

### MVP (US1 seulement)

1. Phase 1 + Phase 2.
2. Phase 3 complète.
3. **STOP** : valider `/api/ready`, email, sauvegarde, alerte, rollback.
4. Ouvrir la recette.

### Livraison complète

1. US1 → environnement fiable.
2. US2 → recette signée.
3. US3 → migration à blanc signée.
4. US4 → bascule, hypercare, extinction V1.
5. Post-mortem et clôture 005.

## Notes

- Ne jamais exécuter la recette destructive sur la production.
- Ne jamais migrer un secret V1.
- Un cron doit avoir un seul déclencheur : planificateur in-process **ou**
  cron HTTP, jamais les deux.
- Une sauvegarde non restaurée n'est pas une sauvegarde.
- Un défaut S2 non corrigé bloque la bascule.
