# Feature Specification: Parité fonctionnelle Lodgify — intégration dans LCD V2

**Feature Branch**: `002-parite-lodgify`

**Created**: 2026-11-06

**Status**: Draft

**Input**: User description: "Utilise REA, Replica et Spec Kit pour faire un plan pour intégrer tout ce qui manque dans mon projet."

**Contexte de référence** : `docs/analyses/LODGIFY-VS-LCD-2026-11.md`,
`replica/recon.md`, `replica/features.csv` (123 fonctionnalités, 30 absentes,
39 partielles), `Plan Comblement Ecarts Lodgify - LCD v1.md`.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Distribuer en temps réel sur les canaux (Priority: P1)

Une conciergerie connecte un logement à Airbnb et Booking via un fournisseur
certifié. Les disponibilités, prix, restrictions et réservations circulent en
temps réel. Une réservation créée sur un canal apparaît dans LCD en moins de
cinq minutes ; une annulation libère le calendrier ; aucun doublon ni
surbooking n'est possible.

**Why this priority**: Sans distribution temps réel, LCD reste un outil de
suivi interne et ne peut pas servir une conciergerie au-delà de quelques
logements. C'est l'écart n°1 identifié par l'analyse.

**Independent Test**: Connecter un logement de test à un fournisseur sandbox,
créer une réservation côté canal, vérifier l'apparition dans le planning, puis
annuler et vérifier la libération. Répéter sur 14 jours.

**Acceptance Scenarios**:

1. **Given** un logement connecté à un fournisseur, **When** une réservation
   est créée sur le canal, **Then** elle apparaît dans LCD avec le bon canal,
   les bonnes dates et le bon montant, en moins de 5 minutes.
2. **Given** une réservation existante, **When** le voyageur modifie ses dates
   sur le canal, **Then** LCD met à jour la réservation sans créer de doublon
   et recalcule les disponibilités.
3. **Given** une réservation existante, **When** elle est annulée sur le canal,
   **Then** LCD la marque annulée et libère les nuits.
4. **Given** un prix ou un stop-sell saisi dans LCD, **When** la synchronisation
   s'exécute, **Then** le canal affiche le nouveau prix ou bloque la vente.
5. **Given** une coupure réseau de dix minutes, **When** la connexion revient,
   **Then** les changements en attente sont rejoués sans perte ni doublon.
6. **Given** deux canaux connectés au même logement, **When** une réservation
   arrive sur l'un, **Then** l'autre est bloqué avant toute nouvelle vente.

---

### User Story 2 - Vendre en direct et encaisser à la réservation (Priority: P1)

Un voyageur arrive sur le site public d'une conciergerie, consulte plusieurs
pages (accueil, logement, région, contact), choisit ses dates, voit le prix
total, paie un acompte en ligne et reçoit une confirmation. La conciergerie
retrouve la réservation dans son planning, avec l'échéancier et la caution.

**Why this priority**: Le site direct est le seul canal sans commission. Sans
paiement à la réservation, il reste une vitrine et ne finance pas son coût.

**Independent Test**: Publier un site de test sur un domaine de test, réserver
et payer avec une carte de test, vérifier la confirmation, le planning,
l'échéancier et la caution.

**Acceptance Scenarios**:

1. **Given** un site publié, **When** le voyageur ouvre l'accueil, une page
   logement et une page région, **Then** chaque page se charge sans JavaScript
   obligatoire et présente un appel à réserver.
2. **Given** des dates disponibles, **When** le voyageur lance la réservation,
   **Then** il voit le prix de la nuit, les frais de ménage, la taxe de séjour
   et le total avant paiement.
3. **Given** un acompte configuré à 30 %, **When** le voyageur paie, **Then**
   Stripe encaisse l'acompte, la réservation passe en confirmée et le solde est
   planifié à J-30.
4. **Given** une caution configurée, **When** la réservation est confirmée,
   **Then** une empreinte bancaire est créée ou une demande de caution est
   envoyée, sans débit immédiat.
5. **Given** un code promotionnel valide, **When** il est saisi, **Then** la
   remise s'applique au total et le motif est visible.
6. **Given** un paiement réussi, **When** le webhook est rejoué, **Then** un
   seul paiement est enregistré et la réservation n'est pas dupliquée.

---

### User Story 3 - Centraliser et automatiser les messages (Priority: P1)

Le staff ouvre une seule boîte de réception. Les messages Airbnb, Booking,
email, SMS et WhatsApp d'un même voyageur sont regroupés dans le fil de sa
réservation. Des scénarios envoient un brouillon à J-7 et J-1 ; l'IA propose
une réponse contextualisée ; un humain valide avant tout envoi.

**Why this priority**: Répondre vite est le premier coût caché d'une
conciergerie et la première cause de mauvais avis. Un inbox dispersé ne passe
pas à l'échelle.

**Independent Test**: Envoyer un message depuis un canal sandbox et un email,
vérifier qu'ils arrivent dans le même fil, déclencher le scénario J-1 et
vérifier qu'un brouillon est créé, pas un envoi automatique.

**Acceptance Scenarios**:

1. **Given** une réservation Airbnb, **When** le voyageur écrit sur Airbnb,
   **Then** le message apparaît dans le fil de la réservation avec le canal.
2. **Given** le même voyageur, **When** il envoie un email, **Then** le message
   rejoint le même fil et le staff peut répondre depuis LCD.
3. **Given** un scénario J-1 actif, **When** la date est atteinte, **Then** un
   brouillon est créé avec les variables de la réservation.
4. **Given** un brouillon IA, **When** le staff le valide, **Then** le message
   est envoyé sur le bon canal et l'envoi est audité.
5. **Given** un message non lu, **When** le staff ouvre l'inbox, **Then** il
   voit le canal, l'ancienneté, le logement et la réservation associée.
6. **Given** un voyageur qui refuse les SMS, **When** un scénario s'exécute,
   **Then** le canal est ignoré et le consentement est respecté.

---

### User Story 4 - Piloter les prix avec une recommandation explicable (Priority: P2)

La conciergerie importe des recommandations de prix marché, voit pourquoi un
prix est proposé, applique en un clic dans les bornes définies, ou ignore la
recommandation. Le prix appliqué est poussé vers les canaux.

**Why this priority**: Le prix est le premier levier de marge. Lodgify
l'inclut dans ses plans hauts ; LCD a trois stratégies fixes.

**Independent Test**: Importer 30 jours de recommandations pour un logement,
vérifier l'écran d'explication, appliquer un prix, vérifier le push canal et
l'audit.

**Acceptance Scenarios**:

1. **Given** un logement avec pricing activé, **When** les recommandations
   sont importées, **Then** chaque date affiche un prix proposé, le prix actuel
   et l'écart.
2. **Given** une recommandation, **When** le staff ouvre le détail, **Then** il
   voit les facteurs (saison, occupation, événement, délai) et la source.
3. **Given** un prix hors bornes, **When** le staff tente de l'appliquer,
   **Then** LCD le ramène dans les bornes ou demande une confirmation.
4. **Given** un prix appliqué, **When** le job de synchronisation passe,
   **Then** le canal reçoit le prix et l'audit conserve l'auteur et la valeur.
5. **Given** le fournisseur de pricing indisponible, **When** le job échoue,
   **Then** les prix existants restent inchangés et une alerte est créée.

---

### User Story 5 - Produire les chiffres et les relevés propriétaires (Priority: P2)

La conciergerie consulte le taux d'occupation, l'ADR, le RevPAR, la part de
chaque canal et le pick-up. Elle envoie chaque mois un relevé PDF à chaque
propriétaire, avec revenus, dépenses, commission et ménage.

**Why this priority**: Ces chiffres sont ce que la conciergerie vend à ses
propriétaires. Sans relevé automatisé, elle reste dans Excel.

**Independent Test**: Générer un relevé sur un mois de test, vérifier les
calculs, l'envoyer, vérifier l'archive et l'accès propriétaire.

**Acceptance Scenarios**:

1. **Given** des réservations et paiements, **When** le rapport s'ouvre,
   **Then** occupation, ADR, RevPAR et mix canal correspondent aux données.
2. **Given** un propriétaire avec plusieurs logements, **When** le relevé
   mensuel est généré, **Then** il agrège les logements et détaille chaque
   ligne.
3. **Given** un relevé envoyé, **When** le propriétaire se connecte, **Then**
   il voit le relevé et peut le télécharger.
4. **Given** un écart de rapprochement, **When** le job passe, **Then** une
   alerte est créée et le relevé n'est pas envoyé silencieusement faux.

---

### User Story 6 - Accompagner le voyageur de la réservation au départ (Priority: P2)

Le voyageur reçoit un guide numérique, les instructions d'arrivée, un code de
serrure temporaire et les demandes de check-in. Il peut demander un départ
tardif ou un service supplémentaire. Le staff voit l'état de chaque séjour.

**Why this priority**: C'est la partie visible de la qualité de service et un
levier d'upsell. LCD a déjà l'EDL, les extras et la police ; il manque le
parcours numérique et les serrures.

**Independent Test**: Sur une réservation test, envoyer le guide, créer un code
Nuki, vérifier sa validité sur les dates, le révoquer au départ.

**Acceptance Scenarios**:

1. **Given** une réservation confirmée, **When** le guide est publié, **Then**
   le voyageur reçoit un lien signé accessible sans compte.
2. **Given** une serrure connectée, **When** le séjour commence, **Then** un
   code temporaire valide sur les dates est créé.
3. **Given** le départ, **When** le ménage commence, **Then** le code est
   révoqué et l'accès est audité.
4. **Given** une demande de départ tardif, **When** le voyageur la soumet,
   **Then** le staff reçoit une demande avec le prix et peut accepter.

---

### User Story 7 - Ouvrir la plateforme aux outils de la conciergerie (Priority: P3)

La conciergerie crée une clé API, lit ses logements et réservations, reçoit des
webhooks et connecte Nuki, un guide voyageur et une caution. Elle peut aussi
passer par Zapier ou Make sans développer.

**Why this priority**: Une conciergerie a déjà des outils. Sans API, LCD devient
un silo et perd les comptes qui grandissent.

**Independent Test**: Créer une clé, lire les réservations d'un tenant, vérifier
qu'un autre tenant est invisible, recevoir un webhook, créer un code Nuki.

**Acceptance Scenarios**:

1. **Given** une clé API valide, **When** elle lit `/api/v1/reservations`,
   **Then** elle ne voit que les réservations de son tenant.
2. **Given** une clé sans scope écriture, **When** elle tente une écriture,
   **Then** la requête est refusée.
3. **Given** un abonnement webhook, **When** une réservation est créée,
   **Then** l'événement est livré, signé et rejouable.
4. **Given** une serrure Nuki, **When** un séjour est confirmé, **Then** un
   code est créé et révocable.

---

### User Story 8 - Onboarder une conciergerie sans le fondateur (Priority: P3)

Une nouvelle conciergerie crée son compte, importe ses logements et
réservations, connecte ses canaux, publie son site, invite son équipe et fait
une réservation test en une journée, avec l'aide en ligne.

**Why this priority**: Tant que l'onboarding est manuel, LCD ne peut pas vendre
au-delà du réseau direct.

**Independent Test**: Créer un tenant vierge, suivre la check-list, importer
trois logements, connecter un canal sandbox, publier un site, faire une
réservation test, sans intervention du fondateur.

**Acceptance Scenarios**:

1. **Given** un compte vierge, **When** le staff ouvre l'onboarding, **Then**
   une check-list indique les étapes et l'état de chacune.
2. **Given** un fichier CSV de logements, **When** il est importé, **Then** les
   erreurs sont ligne par ligne et les doublons sont signalés.
3. **Given** un tenant de démonstration, **When** un prospect le visite,
   **Then** il peut parcourir les écrans en lecture seule.
4. **Given** une question, **When** le staff ouvre l'aide, **Then** il trouve
   un article lié à l'écran courant.

### Edge Cases

- Une réservation arrive deux fois (webhook + polling) : un seul enregistrement.
- Un webhook arrive avant l'import initial : il est mis en file et rejoué.
- Un canal renvoie 429 : backoff exponentiel, pas de perte de changement.
- Un prix est modifié manuellement pendant une recommandation : le manuel gagne
  et la recommandation est ignorée pour cette date.
- Un paiement réussit mais le webhook est perdu : la réconciliation quotidienne
  retrouve le paiement.
- Un remboursement partiel après annulation : l'échéancier et la facture sont
  recalculés, jamais négatifs.
- Un domaine est déjà pris ou mal configuré : le site reste accessible sur le
  sous-domaine LCD, l'erreur est explicite.
- Un message OTA contient une pièce jointe non supportée : le fil affiche un
  lien de téléchargement, pas une erreur bloquante.
- Un voyageur change de canal : les fils sont fusionnés manuellement, jamais
  automatiquement sur simple homonymie.
- Un logement est supprimé alors qu'une connexion canal existe : la connexion
  est désactivée avant la suppression.
- Une clé API est compromise : révocation immédiate, audit, rotation.

## Requirements *(mandatory)*

### Functional Requirements

#### Distribution (US1)

- **FR-001**: LCD MUST connecter un logement à un fournisseur certifié
  (Beds24 ou Channex) et pousser disponibilités, prix et restrictions.
- **FR-002**: LCD MUST importer les réservations, modifications, annulations et
  no-shows du fournisseur, avec un identifiant externe stable.
- **FR-003**: LCD MUST dédoublonner les réservations reçues par webhook et par
  polling, et rendre les webhooks rejouables.
- **FR-004**: LCD MUST réconcilier quotidiennement l'état local et l'état du
  fournisseur, et signaler tout écart.
- **FR-005**: LCD MUST afficher la santé de chaque connexion (dernier push,
  dernier pull, erreurs, âge de la dernière synchronisation).
- **FR-006**: LCD MUST appliquer un buffer ménage de 0 à 7 jours et les
  restrictions de séjour existantes lors du push.
- **FR-007**: LCD MUST gérer les prix et frais par canal (majoration, animaux,
  ménage, service) sans casser le prix de référence.
- **FR-008**: LCD MUST supporter plusieurs logements et plusieurs unités par
  connexion, avec un mapping explicite.
- **FR-009**: LCD MUST conserver iCal comme repli pour les canaux non couverts.
- **FR-010**: LCD MUST exposer Google Vacation Rentals via le fournisseur si
  celui-ci le supporte, sans flux maison non certifié.

#### Site direct et paiement (US2)

- **FR-011**: LCD MUST permettre de composer un site public avec au moins
  quatre types de pages : accueil, logement, région, contact.
- **FR-012**: LCD MUST fournir au moins trois templates réutilisant les thèmes
  existants et un éditeur de blocs (hero, galerie, description, équipements,
  carte, avis, CTA).
- **FR-013**: LCD MUST publier le site sur un domaine personnalisé avec HTTPS
  et redirection canonique.
- **FR-014**: LCD MUST produire les métadonnées SEO, le sitemap et les données
  structurées `LodgingBusiness`.
- **FR-015**: LCD MUST supporter six langues publiques : fr, en, es, it, de, nl.
- **FR-016**: LCD MUST fournir un widget embarquable (script + iframe) pointant
  vers le tunnel de réservation.
- **FR-017**: LCD MUST encaisser un paiement en ligne à la réservation via
  Stripe Checkout, avec 3DS2.
- **FR-018**: LCD MUST gérer un échéancier configurable (acompte, solde,
  date d'exigibilité) et relancer les échéances impayées.
- **FR-019**: LCD MUST gérer une caution par empreinte bancaire (capture
  manuelle) ou par partenaire, sans débit immédiat.
- **FR-020**: LCD MUST gérer des promotions (early bird, last minute, code,
  séjour long) avec règles par logement et par date.
- **FR-021**: LCD MUST calculer un prix par personne et par séjour si le
  logement le configure.
- **FR-022**: LCD MUST tracer l'origine de chaque réservation directe (UTM,
  widget, code) et permettre une relance de panier abandonné.
- **FR-023**: LCD MUST envoyer une confirmation, une facture et un lien de
  gestion de réservation après paiement.
- **FR-024**: LCD MUST rembourser ou annuler selon la politique du logement,
  avec recalcul de l'échéancier et de la facture.

#### Messagerie (US3)

- **FR-025**: LCD MUST regrouper les messages d'un même voyageur dans un fil
  unique, quel que soit le canal (OTA, email, SMS, WhatsApp, interne).
- **FR-026**: LCD MUST recevoir les messages OTA via le fournisseur lorsqu'il
  l'expose, et par email sinon.
- **FR-027**: LCD MUST envoyer et recevoir des emails dans le fil, avec pièces
  jointes.
- **FR-028**: LCD MUST envoyer des SMS et, si le volume le justifie, des
  messages WhatsApp Business.
- **FR-029**: LCD MUST exécuter des scénarios déclenchés par réservation,
  date, statut ou canal, avec variables.
- **FR-030**: LCD MUST créer un brouillon à valider par défaut ; l'envoi
  automatique n'est possible qu'après activation explicite.
- **FR-031**: LCD MUST proposer une réponse IA contextualisée (réservation,
  logement, guide, historique) et auditer chaque envoi.
- **FR-032**: LCD MUST traduire un message entrant et une réponse sortante
  dans la langue du voyageur ou du staff.
- **FR-033**: LCD MUST respecter les consentements et opt-out par canal.
- **FR-034**: LCD MUST afficher les messages non lus, les retards et les
  réservations à confirmer dans un centre de notifications.
- **FR-035**: LCD MUST assigner un fil à un membre du staff et suivre le temps
  de première réponse.

#### Revenue management (US4)

- **FR-036**: LCD MUST importer des recommandations de prix depuis un
  partenaire (PriceLabs ou Beyond) sur au moins 18 mois.
- **FR-037**: LCD MUST afficher, pour chaque date, le prix actuel, le prix
  recommandé, l'écart et les facteurs.
- **FR-038**: LCD MUST appliquer une recommandation en un clic, dans les bornes
  min/max du logement, avec audit.
- **FR-039**: LCD MUST permettre un override manuel qui gagne sur la
  recommandation pour la date concernée.
- **FR-040**: LCD MUST exécuter le job de pricing quotidiennement et échouer
  sans modifier les prix existants.
- **FR-041**: LCD MUST pousser les prix appliqués vers les canaux via US1.
- **FR-042**: LCD MUST calculer le pick-up, l'occupation et l'ADR pour éclairer
  la décision.

#### Reporting et propriétaires (US5)

- **FR-043**: LCD MUST calculer occupation, ADR, RevPAR, durée moyenne,
  annulations et mix canal par période, logement, entité et propriétaire.
- **FR-044**: LCD MUST générer un relevé propriétaire avec revenus, dépenses,
  commission, ménage, extras et taxes.
- **FR-045**: LCD MUST envoyer ce relevé en PDF par email selon une récurrence
  mensuelle ou trimestrielle.
- **FR-046**: LCD MUST archiver chaque relevé et le rendre consultable par le
  propriétaire dans son portail.
- **FR-047**: LCD MUST alerter sur un écart de rapprochement, un impayé ou une
  marge négative avant envoi.
- **FR-048**: LCD MUST exporter les données comptables dans un format stable
  et documenté.

#### Expérience voyageur (US6)

- **FR-049**: LCD MUST publier un guide numérique par logement (accès, règles,
  équipements, adresse, contacts) accessible par lien signé.
- **FR-050**: LCD MUST envoyer les instructions d'arrivée et de départ selon un
  calendrier configurable.
- **FR-051**: LCD MUST créer et révoquer des codes de serrure temporaires via
  un partenaire (Nuki en premier).
- **FR-052**: LCD MUST permettre au voyageur de demander un départ tardif ou un
  extra, avec prix et validation staff.
- **FR-053**: LCD MUST envoyer une demande d'avis après le départ et afficher
  les avis publiés sur le site.
- **FR-054**: LCD MUST fonctionner en PWA installable avec notifications
  lorsque le navigateur le permet.

#### Plateforme et intégrations (US7)

- **FR-055**: LCD MUST exposer une API publique REST en lecture (logements,
  réservations, disponibilités, prix) versionnée.
- **FR-056**: LCD MUST gérer des clés API par tenant, avec scopes, rate limit,
  expiration et journal d'usage.
- **FR-057**: LCD MUST émettre des webhooks signés pour réservation, message,
  tâche, paiement et relevé, avec retry et rejeu.
- **FR-058**: LCD MUST fournir une documentation OpenAPI et des exemples.
- **FR-059**: LCD MUST connecter au moins trois partenaires : serrure (Nuki),
  guide voyageur (Duve ou Touch Stay), caution (Swikly).
- **FR-060**: LCD MUST fournir une app Zapier/Make générique basée sur l'API
  et les webhooks.
- **FR-061**: LCD MAY exposer un serveur MCP en lecture seule après l'API.

#### Onboarding et exploitation (US8)

- **FR-062**: LCD MUST fournir une check-list d'onboarding avec état par étape.
- **FR-063**: LCD MUST importer logements et réservations depuis CSV et iCal,
  avec rapport d'erreurs ligne par ligne et détection de doublons.
- **FR-064**: LCD MUST fournir un tenant de démonstration en lecture seule.
- **FR-065**: LCD MUST fournir une aide contextuelle par écran et une base
  d'articles consultable.
- **FR-066**: LCD MUST afficher une page publique de tarifs (FULL, PILOTAGE,
  KIT) avec calculateur et FAQ.
- **FR-067**: LCD MUST permettre à un nouveau tenant de faire une réservation
  test de bout en bout sans intervention manuelle.
- **FR-068**: LCD SHOULD permettre de qualifier une demande de réservation
  (enquiry) et de la convertir en réservation sans ressaisie.
- **FR-069**: LCD SHOULD suivre les paiements aux propriétaires (payouts) et
  les rapprocher des relevés.
- **FR-070**: LCD MUST documenter et appliquer les politiques d'annulation par
  canal lors d'un remboursement.
- **FR-071**: LCD MAY activer Google Analytics, des pixels publicitaires et une
  marque blanche par tenant.
- **FR-072**: LCD MUST rester en euros en v1 ; le multi-devises est hors
  périmètre et documenté comme tel.

### Key Entities

- **Connexion canal** : lien entre un logement et un fournisseur, avec
  identifiants externes, capacités, état de santé et dernier échange.
- **Réservation externe** : réservation importée, identifiée par
  `(fournisseur, external_id)`, rattachée à une réservation LCD.
- **Demande de synchronisation** : changement sortant idempotent (dispo, prix,
  restriction), avec état, tentatives et erreur.
- **Page publique** : page d'un site tenant, avec template, blocs, langue,
  statut de publication et SEO.
- **Domaine** : domaine personnalisé d'un tenant, avec statut de vérification
  et certificat.
- **Promotion** : règle de remise (type, valeur, conditions, période, code).
- **Échéance de paiement** : montant, date d'exigibilité, statut, moyen.
- **Fil voyageur** : conversation unique rattachée à une réservation, avec
  canal, participants, assignation et statut.
- **Message** : message entrant ou sortant, avec auteur, canal, pièces jointes
  et statut de livraison.
- **Scénario de message** : déclencheur, conditions, modèle, mode brouillon ou
  auto, langue.
- **Recommandation de prix** : date, logement, prix proposé, facteurs, source,
  statut (proposée, appliquée, ignorée).
- **Relevé propriétaire** : période, logements, revenus, dépenses, commission,
  PDF, statut d'envoi.
- **Clé API** : tenant, scopes, hash, expiration, dernier usage.
- **Intégration tenant** : partenaire, identifiants chiffrés, état, options.
- **Accès serrure** : logement, réservation, code, validité, état.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Zéro surbooking constaté sur 30 jours avec au moins deux canaux
  connectés.
- **SC-002**: 95 % des réservations canal apparaissent dans LCD en moins de
  5 minutes après le webhook.
- **SC-003**: Une réservation directe payée de bout en bout est possible sur
  mobile et desktop, avec confirmation en moins de 2 minutes.
- **SC-004**: 80 % des messages de test (OTA, email, SMS) sont regroupés dans
  un fil unique.
- **SC-005**: 100 % des envois automatiques sont tracés et aucun n'est parti
  sans validation lorsque le mode brouillon est actif.
- **SC-006**: Un logement pilote fonctionne 30 jours avec des recommandations
  de prix appliquées et un RevPAR comparé à la période précédente.
- **SC-007**: Un relevé propriétaire mensuel est généré, envoyé et archivé
  automatiquement, avec des chiffres rapprochés.
- **SC-008**: Trois intégrations partenaires sont opérationnelles (serrure,
  guide, caution).
- **SC-009**: Une nouvelle conciergerie importe trois logements, connecte un
  canal et fait une réservation test en moins d'un jour.
- **SC-010**: 100 % des routes publiques et voyageur restent lisibles sans
  JavaScript (hors tunnel de paiement).
- **SC-011**: Le budget JavaScript reste sous 50 Ko gzip côté voyageur et
  200 Ko côté staff.
- **SC-012**: Les contrôles `check`, tests, build, `db:check`, `db:test-rls` et
  e2e passent à chaque lot.

## Assumptions

- Un fournisseur certifié (Beds24 ou Channex) est contractualisé avant L1.
- Le paiement est encaissé par le tenant ou via Stripe Connect, après avis
  juridique ; LCD ne devient pas prestataire de services de paiement.
- Le pricing est fourni par PriceLabs ou Beyond ; LCD n'écrit pas d'algorithme
  de marché.
- Les apps natives, le builder complet, la marketplace 25+, le financement et
  l'assurance restent hors périmètre.
- Le self-service avec essai gratuit n'ouvre qu'après 20 clients.
- Les six langues publiques sont fr, en, es, it, de, nl ; pt et ru plus tard.
- Les partenaires sont refacturables et plafonnés ; l'infrastructure reste à
  0-5 €/mois.
- Les données existantes (V2, 73 tables) sont conservées ; les migrations sont
  additives et immuables après application.

## Out of Scope

- Applications iOS et Android natives.
- Builder de site complet avec blog, thèmes infinis et 32 langues.
- Marketplace de 25+ intégrations.
- API OTA native sans contrat de connectivité.
- Crédit, assurance et financement embarqués.
- Self-service avec essai gratuit avant 20 clients.
- Refonte de la V1 ou redémarrage du lab.
