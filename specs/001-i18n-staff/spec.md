# Feature Specification: i18n staff cinq langues

**Feature Branch**: `001-i18n-staff`

**Created**: 2026-11-04

**Status**: Draft

**Input**: User description: "Internationaliser les pages métier staff en cinq langues, après la connexion, le tableau de bord et les menus déjà traduits."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Consulter et filtrer le planning dans sa langue (Priority: P1)

Un membre du staff choisit sa langue depuis l’en-tête, puis ouvre le planning
et les canaux. Les titres, filtres, statuts, messages vides et actions sont
dans la langue choisie ; les noms de logements et de clients restent des
données.

**Why this priority**: Le planning est l’écran quotidien le plus consulté et
le plus dépendant des libellés de statut.

**Independent Test**: Choisir `en`, ouvrir `/hote/planning` et
`/hote/planning/canaux`, vérifier qu’aucun libellé d’interface français ne
subsiste.

**Acceptance Scenarios**:

1. **Given** un staff connecté en français, **When** il choisit l’anglais,
   **Then** le planning se réaffiche en anglais et la préférence persiste.
2. **Given** un planning vide, **When** la page se charge en allemand,
   **Then** le message vide et les en-têtes sont en allemand.

---

### User Story 2 - Gérer les logements et le ménage dans sa langue (Priority: P1)

Le staff consulte, crée et filtre les logements, puis suit les missions de
ménage. Les formulaires, validations, badges et états vides sont localisés.

**Why this priority**: Création et suivi opérationnel sont bloquants pour un
staff non francophone.

**Independent Test**: Créer un logement en italien, provoquer une erreur de
validation, vérifier que le message est en italien.

**Acceptance Scenarios**:

1. **Given** la langue italienne, **When** le formulaire de logement est
   soumis avec un code invalide, **Then** l’erreur est en italien.
2. **Given** la langue espagnole, **When** la liste des ménages est vide,
   **Then** l’état vide est en espagnol.

---

### User Story 3 - Facturer et suivre la comptabilité dans sa langue (Priority: P2)

Le staff consulte les factures, les paiements, les relances et la compta. Les
montants restent en euros, mais les libellés, statuts et actions sont traduits.

**Why this priority**: La facturation est critique mais moins fréquente que le
planning.

**Independent Test**: Ouvrir une facture en allemand et vérifier les libellés
de statut, de paiement et d’export.

**Acceptance Scenarios**:

1. **Given** une facture payée, **When** la page s’affiche en allemand,
   **Then** le statut et les actions sont en allemand.
2. **Given** un export CSV, **When** la langue est l’anglais, **Then** les
   en-têtes du fichier restent stables et documentés.

---

### User Story 4 - Traiter les messages et la relation voyageur (Priority: P2)

Le staff lit et répond aux messages, avis, questionnaires, objets trouvés,
sinistres et demandes de tranquillité avec une interface localisée.

**Why this priority**: La relation voyageur est visible par le client final.

**Independent Test**: Ouvrir `/hote/messages` en espagnol et vérifier les
actions de réponse et les états vides.

**Acceptance Scenarios**:

1. **Given** un fil non lu, **When** la page s’affiche en espagnol,
   **Then** les boutons et libellés sont en espagnol.

---

### User Story 5 - Conformité et administration localisées (Priority: P3)

Le staff traite annonce, onboarding, formation, police, RGPD, recherche,
accès, propriétaires, entité, intégrations, audit, utilisateurs et sécurité
dans sa langue.

**Why this priority**: Ces écrans sont moins fréquents mais nécessaires pour
un staff international.

**Independent Test**: Ouvrir chaque écran dans les cinq langues supportées et
vérifier l’absence de texte français codé en dur.

**Acceptance Scenarios**:

1. **Given** la langue allemande, **When** l’écran RGPD s’affiche, **Then**
   les titres et actions sont en allemand.

### Edge Cases

- Une clé manquante retombe sur le français, jamais sur une clé brute.
- Une langue inconnue dans l’URL ou le cookie retombe sur `fr`.
- Les données métier (noms, adresses, commentaires) ne sont jamais traduites.
- Les montants restent formatés en euros ; seuls les libellés changent.
- Les erreurs de validation serveur doivent être localisées avant affichage.
- Les e-mails et PDF restent hors périmètre de cette spec.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Le staff MUST pouvoir choisir parmi `fr`, `en`, `es`, `it`,
  `de` depuis l’en-tête, sans perdre la page courante.
- **FR-002**: La préférence MUST persister via le cookie `lcd_langue` et être
  validée côté serveur.
- **FR-003**: Chaque page listée MUST utiliser un dictionnaire typé et un
  repli français explicite.
- **FR-004**: Les titres, descriptions, filtres, en-têtes de table, badges,
  états vides, boutons et messages de validation MUST être localisés.
- **FR-005**: Les dates et montants MUST utiliser `Intl` avec la langue active.
- **FR-006**: Le HTML MUST porter l’attribut `lang` correspondant.
- **FR-007**: Les données métier et les identifiants techniques MUST NOT être
  traduits.
- **FR-008**: Les exports CSV et PDF MUST conserver des en-têtes stables,
  indépendants de la langue d’affichage.
- **FR-009**: Les tests MUST couvrir les cinq dictionnaires, le repli et
  l’absence de valeur vide.
- **FR-010**: La documentation MUST recenser les pages traduites et celles
  restantes.

### Key Entities

- **Dictionnaire de page** : ensemble typé de clés pour une page, avec cinq
  langues et un repli.
- **Préférence de langue** : cookie `lcd_langue`, valeur validée, durée un an.
- **Page métier** : route staff listée dans les user stories.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100 % des pages des stories P1 s’affichent sans libellé
  d’interface français dans les cinq langues.
- **SC-002**: 100 % des pages P2 et P3 sont couvertes à la fin de la feature.
- **SC-003**: Aucune clé de dictionnaire vide ; tests des cinq langues verts.
- **SC-004**: `npm run check`, `npx vitest run`, `npm run build` et
  `npm run db:check` passent sans erreur.
- **SC-005**: Le changement de langue conserve la page et prend effet au
  prochain rendu serveur.

## Assumptions

- Les cinq langues sont celles déjà utilisées par le voyageur.
- Les contenus libres et les données importées ne sont pas traduits.
- Les e-mails transactionnels et PDF restent hors périmètre.
- La traduction est statique, revue par un humain ; aucun service de
  traduction automatique n’est appelé au runtime.
- Les pages listées existent déjà ; la feature ne crée pas de nouvelle route.
