# Feature Specification: Audit & Exécution — Parité Plans Initiaux vs V2

**Feature Branch**: `003-audit-parite-plans-initiaux`

**Created**: 2026-11-09

**Status**: Active

**Input**: User description: "Audit complet de toutes les documentations, plans et specs initiaux vs l'état réel de la V2, avec plan d'exécution détaillé du reste à faire"

## User Scenarios & Testing

### User Story 1 - Signer les décisions L0 (Priority: P1)

En tant que fondateur, je dois signer les 5 ADR et plafonner le budget partenaires pour débloquer la suite du développement et formaliser les choix techniques avant d'engager des dépenses.

**Why this priority**: C'est LE bloquant n°1 identifié par l'audit. Sans L0 signé, la roadmap interdit tout code métier, les tests de contrat sandbox sont impossibles, et chaque jour de retard retarde le calendrier global. Deadline M0 : 15 novembre 2026.

**Independent Test**: Vérifier que `docs/decisions/README.md` passe de 0/7 à 7/7 cases cochées, que les 5 fiches ADR ont un statut "Signé" avec date, et que le budget partenaires est plafonné.

**Acceptance Scenarios**:

1. **Given** aucune ADR n'est signée, **When** je signe ADR-01 (Beds24 pilote), **Then** `docs/decisions/ADR-01-fournisseur-distribution.md` porte le statut "Signé" avec date et la case correspondante est cochée.
2. **Given** les 5 ADR sont signées, **When** je plafonne le budget partenaires, **Then** `docs/decisions/PACK-SIGNATURE-L0.md` passe à 18/18 cases et `docs/decisions/BUDGET-PARTENAIRES-2026-11.md` porte un plafond confirmé.
3. **Given** toutes les signatures sont faites, **When** je mets à jour le README des décisions, **Then** les 7 critères de sortie L0 sont cochés.

---

### User Story 2 - Finaliser US1/US2/US3 de la parité Lodgify (Priority: P2)

En tant que développeur, je dois terminer les tâches restantes des lots US1 (distribution), US2 (site + paiement) et US3 (inbox) pour atteindre les gates M1, M2 et M3.

**Why this priority**: Ces lots sont déjà avancés (14/31, 29/31, 19/25) mais bloqués sur des dépendances externes (clés, comptes) et quelques tâches de code. Les finaliser débloque les jalons commerciaux.

**Independent Test**: Gate M1 = double-run 14 j sans surbooking. Gate M2 = 1 réservation payée de bout en bout. Gate M3 = 80 % des messages dans un fil.

**Acceptance Scenarios**:

1. **Given** les clés sandbox sont créées, **When** j'exécute T126 (e2e sandbox), **Then** le test passe sans erreur de contrat.
2. **Given** une clé Stripe test est configurée, **When** je complète T229, **Then** une réservation est payée de bout en bout sur le domaine de test.
3. **Given** la boîte IMAP est dédiée, **When** je configure T307, **Then** les emails entrants créent des fils voyageur.

---

### User Story 3 - Déployer et recetter (Priority: P2)

En tant que fondateur, je dois déployer la V2 sur un environnement réel et exécuter les 143+21 cases de test post-déploiement pour valider la production.

**Why this priority**: 0/143 + 0/21 cases de recette sont cochées. Sans déploiement réel, aucune validation n'est possible.

**Independent Test**: `npm run check` + `npx vitest run` + `npm run build` passent sur l'environnement de production. 100 % des cases TESTS-A-FAIRE.md cochées.

**Acceptance Scenarios**:

1. **Given** la V2 est déployée, **When** j'exécute la section 0 de TESTS-A-FAIRE.md, **Then** toutes les cases de pré-requis sont vertes.
2. **Given** le déploiement fonctionne, **When** j'exécute qa-manuel.md, **Then** les 21 parcours sont validés sans régression.

---

### User Story 4 - Implémenter L4 Revenue Management (Priority: P3)

En tant que développeur, je dois implémenter l'adapter PriceLabs/Beyond, l'import quotidien, l'écran "pourquoi ce prix" et l'application bornée pour atteindre la gate M4.

**Why this priority**: L4 dépend de L0 (ADR-03) et L1. Une fois ces prérequis satisfaits, c'est le prochain lot de valeur.

**Independent Test**: 1 logement en pricing dynamique pendant 30 jours avec RevPAR comparé.

**Acceptance Scenarios**:

1. **Given** ADR-03 est signée, **When** j'implémente T400-T414, **Then** le port Pricing fonctionne avec PriceLabs en sandbox.
2. **Given** l'adapter fonctionne, **When** j'active le pricing dynamique sur 1 logement, **Then** le prix est mis à jour quotidiennement avec bornes min/max respectées.

---

### User Story 5 - Implémenter L5 Reporting (Priority: P3)

En tant que fondateur, je dois recevoir des relevés propriétaires mensuels/trimestriels et accéder aux KPIs pour piloter l'activité.

**Why this priority**: L5 dépend de L2 (site + paiement). C'est la valeur commerciale visible pour les propriétaires.

**Independent Test**: 1 relevé réel envoyé à un propriétaire.

**Acceptance Scenarios**:

1. **Given** les agrégats sont calculés, **When** je génère un relevé PDF, **Then** il contient brut, charges, net et est envoyé par email.

---

### User Story 6 - Implémenter L6 API publique (Priority: P3)

En tant que développeur, je dois exposer une API v1 en lecture avec clés/scopes et webhooks signés pour permettre les intégrations tierces.

**Why this priority**: L6 dépend de L1-L3. C'est la plateforme d'ouverture.

**Independent Test**: API documentée, 3 intégrations live.

**Acceptance Scenarios**:

1. **Given** l'API v1 est déployée, **When** un client authentifié fait un GET, **Then** il reçoit les données scoping à son tenant.

---

### User Story 7 - Implémenter L7 Onboarding (Priority: P3)

En tant que fondateur, je dois onboarder une conciergerie pilote en moins d'une journée sans intervention technique.

**Why this priority**: L7 dépend de L2, L5 et d'un client pilote. C'est le go-to-market.

**Independent Test**: 1 conciergerie onboardée en 1 jour sans le fondateur.

**Acceptance Scenarios**:

1. **Given** le parcours d'onboarding est implémenté, **When** un nouveau tenant s'inscrit, **Then** il complète la check-list, importe ses données et voit son premier logement en ligne.

---

### Edge Cases

- Que se passe-t-il si une ADR change de direction après signature ? → Plan de retrait documenté dans la spec.
- Que se passe-t-il si le fournisseur sandbox ne fonctionne pas ? → Repli sur l'autre fournisseur (Beds24 ↔ Channex).
- Que se passe-t-il si le gel fin d'année (24 déc - 3 jan) retarde un gate ? → Le calendrier intègre déjà 2 semaines de décalage.

## Requirements

### Functional Requirements

- **FR-001**: Le système MUST permettre de signer les 5 ADR et plafonner le budget avant tout nouveau code métier.
- **FR-002**: Le système MUST terminer les 17 tâches restantes de US1 (distribution).
- **FR-003**: Le système MUST terminer les 2 tâches restantes de US2 (site + paiement).
- **FR-004**: Le système MUST terminer les 6 tâches restantes de US3 (inbox).
- **FR-005**: Le système MUST déployer sur environnement réel et passer 100 % des tests de recette.
- **FR-006**: Le système MUST implémenter les 15 tâches de L4 (revenue management).
- **FR-007**: Le système MUST implémenter les 16 tâches de L5 (reporting).
- **FR-008**: Le système MUST implémenter les 34 tâches de L6 (API publique + intégrations).
- **FR-009**: Le système MUST implémenter les 12 tâches de L7 (onboarding).
- **FR-010**: Le système MUST supprimer l'ancienne UI Next (`src/app/`) après validation de parité.
- **FR-011**: Le système MUST migrer les données V1→V2 avant cutover.
- **FR-012**: Le système MUST maintenir le changelog et les registres à jour.

### Key Entities

- **ADR** : Décision architecturale signée avec date, statut, preuves.
- **Gate** : Jalon de validation avec critères mesurables.
- **Tâche** : Unité de travail avec ID, statut, dépendances, blocage.

## Success Criteria

### Measurable Outcomes

- **SC-001**: Les 5 ADR sont signées avant le 15 novembre 2026 (M0).
- **SC-002**: Le double-run iCal+API de 14 jours se termine sans surbooking (M1, 13 déc 2026).
- **SC-003**: 1 réservation est payée de bout en bout sur domaine de test (M2, 24 jan 2027).
- **SC-004**: 80 % des messages voyageurs sont dans un fil (M3, 14 fév 2027).
- **SC-005**: 1 logement est en pricing dynamique pendant 30 jours (M4, 28 fév 2027).
- **SC-006**: 1 relevé mensuel est envoyé à un propriétaire (M5, 14 mars 2027).
- **SC-007**: L'API publique est documentée avec 3 intégrations live (M6, 4 avr 2027).
- **SC-008**: 1 conciergerie est onboardée en 1 jour sans le fondateur (M7, 18 avr 2027).
- **SC-009**: 100 % des cases TESTS-A-FAIRE.md et qa-manuel.md sont cochées.
- **SC-010**: L'ancienne UI Next est supprimée et le build est propre.

## Assumptions

- Une personne à temps partiel (3-4 jours/semaine) pour l'exécution.
- Gel fin d'année (24 déc 2026 - 3 jan 2027) intégré au calendrier.
- Les comptes sandbox (Beds24, Channex, Stripe, PriceLabs) peuvent être créés gratuitement.
- La V2 est déployable sur Netlify/VPS sans changement architectural majeur.
- Les clés et comptes externes (Stripe, IMAP, WhatsApp) seront créés par le fondateur.
- Le matériel terrain (P0-P5) est hors périmètre de cette spec.
