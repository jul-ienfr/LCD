# Feature Specification: Mise en production, recette et bascule V1 → V2

```text
Statut : ACTIF
Propriétaire : exploitation
Dernière vérification : 2026-11-14
Remplace / remplacé par : —
Source de vérité : specs/005-mise-en-production/tasks.md
```

**Feature Branch**: `005-mise-en-production`

**Created**: 2026-11-14

**Status**: In progress — phases 1–2 faites (17 tâches `[x]`, 7 `[~]`) ; phases 3–6 externes

**Input**: Audit du 14/11 (`docs/analyses/AUDIT-ET-PLAN-DOCUMENTATION-2026-11-14.md`) :
« Le produit est construit, mais il n'est ni sauvegardé, ni prouvé, ni exploité.
Il reste à remettre un environnement public à jour, exécuter la recette,
migrer les données utiles de la V1 et éteindre la V1. »

**Contexte de référence** : `v2/DEPLOIEMENT.md`, `v2/DEPLOIEMENT-VPS.md`,
`v2/BACKUPS.md`, `v2/MONITORING.md`, `v2/TESTS-A-FAIRE.md`,
`v2/docs/qa-manuel.md`, `docs/checklist-taches-restantes.md`,
`specs/002-parite-lodgify/`, `specs/004-ergonomie-experience-client/`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Exploiter la V2 sur une URL publique fiable (Priority: P1)

L'exploitant dispose d'une URL HTTPS stable qui sert le code actuel, avec une
base à jour, un emails transactionnel réel, une sauvegarde quotidienne
restaurable et une supervision qui alerte avant les clients. Il peut revenir à
la version précédente en moins de trente minutes.

**Why this priority**: Aujourd'hui, le beta répond 503, le schéma est arrêté à
la migration 0025 pour 104 dans le dépôt, l'email est désactivé et aucune
sauvegarde de production n'est active. Sans cet environnement, aucune preuve de
recette n'est possible.

**Independent Test**: Depuis un serveur vierge et un commit tagué, déployer,
appliquer toutes les migrations, créer le rôle applicatif, se connecter,
recevoir un email, restaurer une sauvegarde et simuler un retour arrière.

**Acceptance Scenarios**:

1. **Given** un commit tagué et un serveur vierge, **When** la procédure de
   déploiement est suivie, **Then** l'application répond en HTTPS et
   `/api/health` renvoie `ok`.
2. **Given** une base vide, **When** les migrations sont appliquées, **Then**
   `/api/ready` renvoie `db: up`, `schema: ok`, `rls: ok` et le nombre de
   migrations correspond au dépôt.
3. **Given** le rôle applicatif non-propriétaire, **When** une requête tente de
   lire un autre tenant, **Then** la RLS la bloque et le test d'isolation passe.
4. **Given** un formulaire public ou voyageur, **When** JavaScript est
   désactivé, **Then** le parcours reste utilisable.
5. **Given** un email de confirmation, **When** il est envoyé depuis la
   production, **Then** il arrive dans une boîte externe en moins de cinq
   minutes et n'est pas classé indésirable.
6. **Given** une sauvegarde quotidienne, **When** elle est restaurée sur une
   base jetable, **Then** les comptes et les totaux correspondent au manifeste
   et l'opération prend moins de trente minutes.
7. **Given** une panne applicative, **When** l'alerte est déclenchée, **Then**
   l'exploitant reçoit une notification et le runbook indique la marche à
   suivre.
8. **Given** un déploiement défectueux, **When** le retour arrière est lancé,
   **Then** la version précédente redevient disponible en moins de trente
   minutes.

---

### User Story 2 - Prouver que les parcours critiques fonctionnent (Priority: P1)

L'exploitant exécute la recette complète sur l'environnement public : les 155
cases de `TESTS-A-FAIRE.md` et les 21 parcours de `qa-manuel.md`. Chaque case
laisse une preuve datée. Les défauts sont classés, corrigés ou acceptés, et la
recette est signée avant l'ouverture.

**Why this priority**: 6 cases sur 155 et 0 parcours sur 21 ont été exécutés.
Sans recette, les tests unitaires et e2e ne prouvent ni les emails réels, ni les
paiements, ni les crons, ni les sauvegardes.

**Independent Test**: Prendre l'environnement de l'histoire 1, exécuter les
deux listes, remplir le journal de recette et vérifier qu'aucun défaut S1 ou S2
ne reste ouvert.

**Acceptance Scenarios**:

1. **Given** l'environnement public, **When** les 155 cases sont exécutées,
   **Then** chacune porte une date, un opérateur, un résultat et une preuve.
2. **Given** un défaut constaté, **When** il est enregistré, **Then** il reçoit
   une sévérité S1 à S4 et un propriétaire.
3. **Given** un défaut S1 ou S2, **When** la recette est clôturée, **Then** il
   est corrigé et rejoué, ou la mise en production est refusée.
4. **Given** un défaut S3, **When** il est accepté, **Then** le contournement
   et le signataire sont documentés.
5. **Given** les 11 validations humaines du plan 004, **When** elles sont
   réalisées ou différées, **Then** la décision est écrite et signée.
6. **Given** la recette terminée, **When** elle est signée, **Then** le journal
   de recette est archivé et référencé dans `etat-reel`.

---

### User Story 3 - Reprendre les données utiles de la V1 (Priority: P2)

L'exploitant identifie les données V1 qui doivent vivre dans la V2, établit la
correspondance, importe à blanc sur une copie, réconcilie les comptes et les
montants, puis rejoue l'import sans doublon. Les données qui ne migrent pas
sont explicitement exclues et justifiées.

**Why this priority**: La V2 est la cible, mais aucune migration n'a été
conçue. La V1 stocke ses données dans SQLite, YAML, JSONL et fichiers d'état,
pas dans une base identique à la V2. Un import improvisé créerait des doublons
ou des pertes.

**Independent Test**: Importer une copie de la V1 dans une base V2 jetable,
comparer les comptes et les totaux, relancer l'import et vérifier qu'aucun
objet n'est dupliqué.

**Acceptance Scenarios**:

1. **Given** les sources V1, **When** l'inventaire est terminé, **Then** chaque
   source, table, fichier et volume est listé avec son propriétaire et son
   devenir.
2. **Given** une source retenue, **When** la correspondance est écrite,
   **Then** chaque champ cible a une règle, une transformation ou une exclusion
   motivée.
3. **Given** un import à blanc, **When** il se termine, **Then** les comptes
   d'entités, logements, mandats, prospects, annonces et documents
   correspondent, ainsi que les totaux financiers disponibles.
4. **Given** le même import relancé, **When** il s'exécute, **Then** aucun
   doublon n'est créé et les objets déjà importés sont ignorés.
5. **Given** une donnée personnelle, **When** elle est migrée, **Then** la
   base légale, la durée de conservation et la purge sont respectées.
6. **Given** un objet non migrable, **When** l'inventaire est signé, **Then**
   son exclusion est écrite et acceptée par l'exploitant.

---

### User Story 4 - Basculer le trafic et éteindre la V1 (Priority: P3)

L'exploitant gèle les écritures V1, rejoue le différentiel, bascule le DNS,
vérifie les parcours critiques, surveille pendant quatorze jours, puis éteint
la V1 et archive son état. Un retour arrière reste possible pendant la fenêtre
convenue.

**Why this priority**: La V1 ne doit pas rester accessible avec des données
divergentes. La bascule est la dernière étape, après la recette et la
migration.

**Independent Test**: Répéter la bascule sur un environnement de préproduction,
mesurer la durée, provoquer un retour arrière et vérifier que la V1 reprend le
trafic sans perte.

**Acceptance Scenarios**:

1. **Given** une date de bascule validée, **When** le gel est prononcé,
   **Then** les écritures V1 sont refusées et le différentiel est mesuré.
2. **Given** le différentiel migré, **When** le DNS bascule, **Then** les
   parcours publics, de connexion, de réservation et de paiement fonctionnent.
3. **Given** un incident pendant la fenêtre, **When** le retour arrière est
   décidé, **Then** la V1 redevient la cible en moins de trente minutes et les
   écritures V2 sont réconciliées.
4. **Given** quatorze jours sans incident S1, **When** l'hypercare se termine,
   **Then** la V1 est arrêtée, sauvegardée et archivée.
5. **Given** l'ancienne UI Next, **When** la V1 est éteinte, **Then** son sort
   est tranché : suppression ou conservation documentée comme référence.
6. **Given** la bascule terminée, **When** le post-mortem est conduit,
   **Then** les écarts, durées et actions sont consignés.

---

### Edge Cases

- Le quota de l'hébergeur est épuisé pendant la mise en production.
- Une migration échoue à mi-parcours et laisse la base dans un état partiel.
- Le fournisseur SMTP refuse le domaine ou les emails partent en indésirable.
- Le DNS a un TTL long et la bascule met plusieurs heures à se propager.
- La clé de chiffrement des sauvegardes est perdue.
- Un import est relancé après une correction partielle.
- Une réservation ou un paiement existe en V1 mais pas dans la source migrée.
- Un administrateur perd l'accès 2FA pendant la bascule.
- Le cron et le planificateur in-process s'exécutent en double.
- Un secret exposé dans l'ancien dépôt ou dans Netlify n'est pas révoqué.
- La bascule est décidée alors qu'un défaut S2 est encore ouvert.

## Requirements *(mandatory)*

### Functional Requirements

**Environnement et exploitation**

- **FR-001**: La cible d'hébergement, la région de la base et le coût mensuel
  MUST être choisis et consignés dans un ADR avant tout provisionnement.
- **FR-002**: Le déploiement MUST partir d'un commit tagué et d'une arborescence
  propre ; aucun fichier non suivi ne doit être nécessaire au build.
- **FR-003**: La base de production MUST être à jour de toutes les migrations
  du dépôt, et l'état MUST être vérifiable par `/api/ready`.
- **FR-004**: L'application MUST utiliser un rôle PostgreSQL non-propriétaire,
  et l'isolation RLS MUST être testée sur la base de production.
- **FR-005**: `/api/health` MUST répondre sans authentification et `/api/ready`
  MUST distinguer base, schéma, RLS et rôle.
- **FR-006**: Le domaine public MUST être servi en HTTPS avec HSTS, et l'URL
  d'authentification MUST correspondre à l'origine réelle.
- **FR-007**: L'email transactionnel MUST être activé vers un fournisseur réel,
  avec une preuve de réception externe.
- **FR-008**: Le compte administrateur de production MUST être dédié, avec un
  mot de passe fort et la 2FA ; aucun compte de démonstration ne doit rester
  actif.
- **FR-009**: Les secrets MUST être stockés dans le coffre de l'hébergeur, jamais
  dans Git ; tout secret exposé MUST être révoqué et remplacé.
- **FR-010**: Une sauvegarde chiffrée MUST être produite quotidiennement, copiée
  hors du serveur et restaurée au moins une fois avant l'ouverture.
- **FR-011**: La supervision MUST couvrir la disponibilité, les erreurs, le
  disque, le certificat et la base, avec une alerte reçue par un humain.
- **FR-012**: Les tâches planifiées (ICS, fournisseurs, messages, pricing,
  webhooks, relances) MUST avoir un déclencheur unique et vérifiable.
- **FR-013**: Les journaux MUST être conservés trente jours, sans secret ni
  donnée personnelle inutile.
- **FR-014**: Un retour arrière vers l'image précédente MUST être documenté,
  scripté et répété ; il doit prendre moins de trente minutes.

**Recette**

- **FR-015**: Les 155 cases de `TESTS-A-FAIRE.md` MUST être exécutées sur
  l'environnement public.
- **FR-016**: Chaque case MUST produire une preuve datée : opérateur, résultat,
  capture ou journal.
- **FR-017**: Les 21 parcours de `qa-manuel.md` MUST être réécrits pour refléter
  l'UI actuelle, puis exécutés.
- **FR-018**: Les défauts MUST être classés S1 (bloquant), S2 (majeur),
  S3 (mineur), S4 (confort), avec un propriétaire et une échéance.
- **FR-019**: Aucun défaut S1 ou S2 ne MUST rester ouvert à l'ouverture ; un S3
  accepté MUST avoir un contournement et un signataire.
- **FR-020**: Les validations humaines du plan 004 MUST être réalisées ou
  explicitement différées avec l'accord de l'exploitant.
- **FR-021**: La recette MUST inclure au moins un email réel, un paiement de
  test, une sauvegarde restaurée, un cron exécuté et un parcours sans
  JavaScript.

**Migration**

- **FR-022**: Toutes les sources V1 MUST être inventoriées : base SQLite,
  registres YAML, fichiers JSONL, états JSON, calendriers ICS, documents et
  photos.
- **FR-023**: Une matrice de correspondance MUST relier chaque source à une
  cible V2, avec transformation ou exclusion motivée.
- **FR-024**: L'import MUST être idempotent, avec une référence stable par
  objet et un journal d'exécution.
- **FR-025**: La réconciliation MUST comparer les comptes par type d'objet et
  les totaux financiers disponibles ; tout écart MUST être expliqué.
- **FR-026**: L'import MUST être répété sur une copie avant toute exécution sur
  la base cible.
- **FR-027**: Les données personnelles MUST être minimisées, protégées et
  purgées selon les durées légales ; les secrets V1 ne MUST pas être migrés.
- **FR-028**: Les objets non migrés MUST être listés, justifiés et acceptés par
  l'exploitant.

**Bascule**

- **FR-029**: Un runbook de bascule MUST décrire le gel, le différentiel, la
  sauvegarde, le DNS, les vérifications et le retour arrière.
- **FR-030**: La bascule MUST être répétée sur un environnement de
  préproduction avant la date réelle.
- **FR-031**: Le DNS MUST être préparé avec un TTL réduit avant la fenêtre.
- **FR-032**: Après la bascule, les parcours public, connexion, réservation,
  paiement et voyageur MUST être vérifiés et tracés.
- **FR-033**: Une période d'hypercare de quatorze jours MUST suivre la bascule,
  avec un point quotidien sur les erreurs, les paiements et les emails.
- **FR-034**: La V1 MUST être arrêtée, sauvegardée et archivée après
  l'hypercare ; son redémarrage MUST être documenté.
- **FR-035**: Le sort de l'ancienne UI Next (`v2/src/app`) MUST être tranché :
  suppression ou conservation comme référence, avec justification.
- **FR-036**: Les documents d'exploitation MUST être mis à jour après la
  bascule : déploiement, sauvegardes, monitoring, runbook, état réel.

### Key Entities

- **Environnement de production** : hébergeur, région, domaine, base, rôle
  applicatif, secrets, sauvegardes, supervision, version déployée.
- **Preuve de recette** : case, date, opérateur, résultat, capture ou journal,
  défaut associé, sévérité, décision.
- **Correspondance de migration** : source, table ou fichier, cible, règle de
  transformation, clé stable, nombre attendu, écart, décision.
- **Fenêtre de bascule** : date, gel, différentiel, sauvegarde, DNS, smoke
  tests, décision de retour arrière, hypercare.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un serveur vierge peut être déployé en moins d'une journée avec
  la procédure documentée.
- **SC-002**: `/api/ready` répond `db: up`, `schema: ok`, `rls: ok` et le nombre
  de migrations appliquées est égal au nombre de migrations du dépôt.
- **SC-003**: Un email transactionnel arrive dans une boîte externe en moins de
  cinq minutes.
- **SC-004**: Une sauvegarde est restaurée en moins de trente minutes, avec des
  comptes identiques au manifeste.
- **SC-005**: 155 cases sur 155 et 21 parcours sur 21 sont exécutés ; aucun
  défaut S1 ou S2 n'est ouvert à l'ouverture.
- **SC-006**: La migration réconcilie 100 % des objets retenus et 100 % des
  totaux disponibles ; un second import crée zéro doublon.
- **SC-007**: La bascule complète prend moins de deux heures et le retour
  arrière moins de trente minutes.
- **SC-008**: Les quatorze jours d'hypercare ne comptent aucun incident S1 et
  la disponibilité mesurée est au moins 99,5 %.
- **SC-009**: Aucun secret n'est présent dans le dépôt ; les secrets exposés
  sont révoqués et remplacés.
- **SC-010**: La V1 est archivée et l'ancienne UI Next a un sort écrit.

## Assumptions

- La cible recommandée est un VPS Docker + Caddy + PostgreSQL, déjà outillé
  dans le dépôt ; Netlify reste une alternative seulement si le quota est
  rétabli et si `netlify.toml` est corrigé.
- Le volume V1 est faible (un tenant, quelques milliers d'objets) et tient dans
  une fenêtre de bascule courte.
- La V1 ne contient pas de base de réservations locale : les réservations
  vivent dans les OTA, les calendriers ICS et des fichiers d'état. Le périmètre
  exact est un livrable de l'inventaire.
- Les fonctionnalités de la spec 002 peuvent rester désactivées par flag à
  l'ouverture ; la production n'exige pas les 19 preuves externes.
- L'exploitant fournit le domaine, le compte SMTP et l'accès au serveur.
- Le terrain, la box et les serrures restent hors périmètre de cette feature.

## Out of Scope

- Les nouvelles fonctionnalités produit et les 19 gates externes de la spec 002.
- Le matériel, Home Assistant, les serrures, l'énergie et la sécurité physique.
- La migration des données qui n'ont pas de valeur légale ou opérationnelle.
- Le multi-devises, le blog et les 32 langues, déjà hors périmètre.
- Les contrats Swikly, PriceLabs, WhatsApp et OTA.
