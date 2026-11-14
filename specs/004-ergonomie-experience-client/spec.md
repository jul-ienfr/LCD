# Feature Specification: Ergonomie globale et expérience client

**Feature Branch**: `004-ergonomie-experience-client`

**Created**: 2026-11-12

**Status**: Draft

**Input**: User description: « Ça manque encore d'ergonomie ; je veux que ce soit ergonomique au maximum. Je trouve que ça manque. Peux-tu me faire un plan avec SpecKit pour refaire toute l'ergonomie du site, afin qu'il soit le plus ergonomique possible, tout en respectant les conditions des plans que j'avais définis à la base, pour offrir une meilleure expérience client ? »

## 1. Contexte et problème

La V2 couvre fonctionnellement l'essentiel du parcours public, voyageur et
staff, mais l'effort demandé à l'utilisateur reste trop élevé :

- l'espace hôte expose près de 50 entrées de navigation (dont un doublon), avec
  un panneau « Plus » qui mélange exploitation, relation, conformité et
  administration ;
- les pages publiques et une partie de l'aide sont rédigées en français en dur,
  alors que la constitution impose cinq langues ;
- le tunnel de réservation sépare la recherche, le calcul du prix et la demande,
  sans indice d'étape ni récapitulatif persistant ;
- l'espace voyageur est long et ne répond pas immédiatement aux questions du
  premier écran (Wi-Fi, accès, départ, urgence) ;
- les formulaires, tableaux, messages d'erreur et états vides ne suivent pas
  encore un contrat commun ;
- l'accessibilité est partiellement traitée (focus visible, réduction des
  animations) mais sans skip link, sans `lang` de document fiable, sans audit
  automatisé WCAG et sans parcours clavier/lecteur d'écran recetté ;
- l'ergonomie n'est pas mesurée : aucune baseline de temps de tâche, d'erreur,
  de satisfaction ou de conversion.

L'objectif n'est pas d'ajouter des fonctions métier. C'est de **rendre les
fonctions existantes évidentes, rapides, accessibles et rassurantes**, sans
casser les invariants des plans fondateurs.

## 2. Méthode retenue

La démarche suit l'approche ergonomique en dix étapes de R. Op De Beeck,
F. Willems, J.P. Demaret et F. Gavray (Prevent, 2009), appliquée au logiciel :

1. formuler correctement les problèmes (plaintes, abandons, erreurs, support) ;
2. impliquer tous les acteurs (direction, hôte, voyageur, prestataire, support) ;
3. intégrer le projet (participation, information, calendrier) ;
4. analyser la charge externe (tâches, organisation, écrans, équipement) ;
5. analyser la charge interne (effort, fatigue, erreurs, temps) ;
6. recueillir l'expérience subjective (entretiens, questionnaires, observations) ;
7. traiter les résultats et prioriser ;
8. formuler des solutions techniques, organisationnelles et humaines ;
9. sélectionner les mesures, planifier les responsabilités et le calendrier ;
10. informer, mettre en œuvre, évaluer et corriger.

Chaque phase du plan doit produire une preuve : mesure avant/après, test
automatisé, recette manuelle ou retour utilisateur documenté.

## 3. Contraintes héritées des plans fondateurs (opposables)

| Source | Contrainte | Impact sur cette feature |
|---|---|---|
| `Socle Commun LCD - Conciergerie v1.md` | Un seul système, multi-tenant, 1 login = 1 dashboard, rôles et périmètres stricts | La navigation et les actions restent filtrées par rôle ; aucune fuite de périmètre |
| `Plan Technique LCD - Pipeline automatisation complet v4.md` | Sans JavaScript en lecture, thème par marque, mobile-first, a11y | Toute refonte publique/voyageur reste utilisable sans JS |
| `docs/70-front-v1.md` §F0 | Serveur d'abord, JS = amélioration, 0 dépendance UI superflue, 0 CDN | Aucune librairie UI ajoutée ; composants natifs et CSS |
| `docs/70-front-v1.md` §F7 | 320 px sans défilement horizontal, cibles ≥ 44 px, L0-L3 | Recette obligatoire à 320 px et sur les contrôles tactiles |
| `docs/70-front-v1.md` §F9 | LCP < 2,5 s, JS < 200 Ko/page, offline, images < 150 Ko | Budgets conservés ; mesure avant/après |
| `docs/10-socle-v2.md` | Zéro friction, 1-clic, SAV < 15 min, PWA séjour | Le parcours voyageur doit tenir en quelques actions claires |
| `v2/docs/80-stack-sveltekit.md` | Public/voyageur `csr = false`, staff SSR + îlots, thème global unique | Pas de JS obligatoire sur le public/voyageur ; pas de thème par utilisateur |
| `.specify/memory/constitution.md` | HTML-first, domaine pur, RLS, i18n 5 langues, qualité vérifiable | Tests et preuves obligatoires ; 5 langues (fr, en, es, it, de) |
| `specs/002-parite-lodgify/contracts/site-public.md` | Site public sans JS, Lighthouse mobile ≥ 90, SEO | Les gains ergonomiques ne dégradent ni le SEO ni la performance |
| `AUDIT-COMPLET-PLANS-VS-V2.md` | Parité fonctionnelle déjà élevée ; ne pas rouvrir les chantiers métier | La feature est une couche d'usage, pas une réécriture métier |

> Écart documentaire à corriger : le contrat `site-public.md` mentionne « six
> langues », alors que la Constitution V et `src/lib/i18n.ts` en fixent cinq.
> Le plan retient **cinq langues** et documente l'écart.

## 4. Personas et tâches principales

| Persona | Tâches principales | Critère de réussite |
|---|---|---|
| Visiteur / prospect | Comprendre l'offre, vérifier les disponibilités, estimer le prix, demander un séjour | Réserver sans aide en moins de 3 minutes |
| Voyageur (lien signé) | Trouver le Wi-Fi, l'accès, les horaires, le départ, signaler un incident | Réponse immédiate au premier écran, sans compte |
| Hôte / opérateur | Voir ce qui est urgent, planning, ménages, messages, prix, factures | Top 5 des tâches à ≤ 2 clics du tableau de bord |
| Administrateur | Gérer les utilisateurs, intégrations, conformité, apparence | Navigation par domaine, pas par liste de routes |
| Prestataire | Voir sa mission, pointer, photographier, clôturer | Parcours mobile, hors ligne, sans ambiguïté |
| Propriétaire | Lire son relevé, ses documents, ses versements | Comprendre le net et l'échéance en moins de 30 s |
| Super-admin | Superviser, prévisualiser et publier l'apparence | Garde-fous ergonomiques avant publication |

## 5. User Scenarios & Testing

### User Story 1 - Réserver sans hésiter (Priority: P1)

En tant que visiteur, je veux comprendre l'offre, choisir des dates, voir un
prix clair et envoyer ma demande sans me perdre, y compris sur mobile, sans
JavaScript et dans ma langue.

**Why this priority**: C'est le parcours qui crée le chiffre d'affaires et la
première impression. Chaque friction ou hésitation coûte une demande.

**Independent Test**: Un testeur découvre `/`, ouvre une adresse, choisit des
dates, voit le prix et envoie une demande sur un téléphone à 360 px, sans JS.
Il ne doit jamais demander « où suis-je ? » ni « combien je paie ? ».

**Acceptance Scenarios**:

1. **Given** un visiteur sur `/`, **When** il choisit « Séjours », **Then** il
   voit les logements disponibles, un prix d'appel et un CTA unique par carte.
2. **Given** une fiche logement, **When** il saisit des dates valides,
   **Then** le prix estimé, le nombre de nuits et le total s'affichent sans
   ambiguïté, avec l'étape « 1 sur 2 ».
3. **Given** un prix affiché, **When** il complète son nom et son e-mail,
   **Then** il voit un récapitulatif (dates, voyageurs, prix, prochaine étape)
   et un seul bouton primaire « Envoyer la demande ».
4. **Given** une date passée, un départ avant l'arrivée ou un tarif manquant,
   **When** il soumet, **Then** un message explique précisément quoi corriger,
   sans perdre les valeurs saisies.
5. **Given** un téléphone de 320 px, **When** il parcourt le tunnel,
   **Then** aucun défilement horizontal n'apparaît et l'action principale reste
   accessible au pouce.
6. **Given** JavaScript désactivé, **When** il réalise le parcours,
   **Then** toutes les étapes restent possibles en formulaires natifs.

---

### User Story 2 - Trouver et agir vite dans l'espace hôte (Priority: P1)

En tant qu'hôte ou administrateur, je veux une navigation par tâches, une
recherche globale et un tableau de bord qui me dit quoi faire maintenant, au
lieu de parcourir une liste de 35 écrans.

**Why this priority**: L'exploitation quotidienne est le cœur du produit. Le
temps perdu et les oublis (ménage, arrivée, impayé) ont un coût direct.

**Independent Test**: Depuis `/hote`, un hôte trouve le ménage du jour, la
prochaine arrivée et une facture en échec en moins de 30 secondes, sans utiliser
le panneau « Plus » plus d'une fois.

**Acceptance Scenarios**:

1. **Given** un utilisateur connecté, **When** il arrive sur `/hote`,
   **Then** il voit d'abord les actions urgentes (P1), les arrivées/départs du
   jour et les tâches en retard, puis les indicateurs.
2. **Given** une navigation staff, **When** il cherche un écran ou une entité,
   **Then** la recherche est accessible partout et accepte une référence, un
   nom de logement, un voyageur ou une facture.
3. **Given** un écran profond, **When** il l'ouvre, **Then** un fil d'Ariane
   indique le domaine et le retour, et l'élément de navigation correspondant
   est marqué `aria-current="page"`.
4. **Given** un rôle non administrateur, **When** il ouvre la navigation,
   **Then** il ne voit que les domaines et actions de son périmètre.
5. **Given** un petit écran, **When** il ouvre le menu, **Then** les groupes
   sont lisibles, les cibles font au moins 44 px et l'action principale reste
   visible.

---

### User Story 3 - Comprendre son séjour en un coup d'œil (Priority: P1)

En tant que voyageur, je veux voir immédiatement l'essentiel de mon séjour
(adresse, accès, Wi-Fi, horaires, urgence, départ) et agir en une touche, même
hors ligne.

**Why this priority**: C'est le moment où la promesse « zéro friction » se
vérifie. Un voyageur qui cherche un code Wi-Fi ou un numéro d'urgence appelle
l'hôte.

**Independent Test**: Un voyageur ouvre son lien signé sur un téléphone à
360 px ; en moins de 10 secondes il trouve le Wi-Fi, le code d'accès et l'heure
de départ ; en mode avion, ces informations restent lisibles.

**Acceptance Scenarios**:

1. **Given** un lien valide, **When** la page s'ouvre, **Then** le premier
   écran affiche le nom du logement, les dates, l'accès, le Wi-Fi et le contact
   d'urgence, avec des actions claires.
2. **Given** une information longue (guide, règles, adresses),
   **When** le voyageur la consulte, **Then** elle est regroupée par section
   repliable, avec un sommaire et une recherche interne si nécessaire.
3. **Given** une action (incident, extra, départ, avis),
   **When** il l'ouvre, **Then** il voit l'état, le délai de réponse et le
   résultat attendu avant de valider.
4. **Given** une coupure réseau, **When** il rouvre la page,
   **Then** les informations déjà chargées restent lisibles et un bandeau
   honnête indique l'état hors ligne.
5. **Given** JavaScript désactivé, **When** il consulte le guide ou signale un
   incident, **Then** le contenu et le POST natif fonctionnent.

---

### User Story 4 - Utiliser le site avec confort et accessibilité (Priority: P2)

En tant qu'utilisateur avec un handicap, un vieux téléphone, un clavier ou un
lecteur d'écran, je veux accomplir les mêmes tâches que tout le monde, sans
piège ni contenu masqué.

**Why this priority**: L'accessibilité est une exigence de la constitution et
une condition d'usage réel sur le terrain (L0-L3, 320 px, vieux navigateurs).

**Independent Test**: Audit axe sans erreur sérieuse, parcours clavier complet
sur `/`, `/reserver`, `/voyageur`, `/login`, `/hote`, et test lecteur d'écran
sur les trois parcours P1.

**Acceptance Scenarios**:

1. **Given** un clavier seul, **When** l'utilisateur tabule,
   **Then** un skip link permet d'aller au contenu, l'ordre est logique, le
   focus est visible et aucun piège ne bloque.
2. **Given** un lecteur d'écran, **When** il lit la page,
   **Then** le `lang`, les titres, les labels, les erreurs et les statuts sont
   annoncés correctement.
3. **Given** un zoom à 200 %, **When** l'utilisateur agrandit,
   **Then** le contenu reste lisible sans perte d'action ni chevauchement.
4. **Given** `prefers-reduced-motion`, **When** il navigue,
   **Then** les animations non essentielles sont supprimées.
5. **Given** un thème sombre ou clair, **When** il lit ou agit,
   **Then** les contrastes restent AA (4,5:1) et les états ne dépendent pas de
   la couleur seule.

---

### User Story 5 - Avoir confiance et comprendre ce qui se passe (Priority: P2)

En tant que client ou prospect, je veux savoir ce qui est inclus, ce qui se
passe après ma demande, qui me répond et comment annuler, sans dark pattern.

**Why this priority**: La confiance réduit les appels, les abandons et les
litiges. Elle est aussi une exigence de transparence des plans.

**Independent Test**: Un prospect lit la fiche, le prix, les conditions et le
délai de réponse sans ouvrir les mentions légales ; après envoi, il sait quoi
attendre et quand.

**Acceptance Scenarios**:

1. **Given** une fiche logement, **When** il lit le prix,
   **Then** il voit ce qui est inclus, ce qui ne l'est pas, la taxe et le
   délai de confirmation.
2. **Given** une demande envoyée, **When** il arrive sur la confirmation,
   **Then** il voit la référence, le récapitulatif, le délai et le contact.
3. **Given** un consentement ou une newsletter, **When** il refuse,
   **Then** le refus est aussi simple que l'acceptation et rien n'est coché
   par défaut.
4. **Given** une erreur, **When** elle s'affiche,
   **Then** elle dit ce qui s'est passé, ce qu'il peut faire et propose une
   sortie (réessayer, revenir, contacter).

---

### User Story 6 - Améliorer l'ergonomie en continu (Priority: P3)

En tant que responsable produit, je veux mesurer les parcours et recueillir les
retours pour prioriser les corrections, sans outil tiers ni donnée personnelle
inutile.

**Why this priority**: Sans mesure, l'ergonomie reste une opinion. La boucle
d'amélioration est ce qui garantit le « maximum » dans la durée.

**Independent Test**: Le tableau de bord ergonomie affiche une baseline et une
mesure après déploiement ; un retour voyageur est visible dans le journal et
peut être traité.

**Acceptance Scenarios**:

1. **Given** une nouvelle version, **When** elle est déployée,
   **Then** les mesures de temps, d'erreur, d'abandon et de satisfaction sont
   comparées à la baseline.
2. **Given** un retour utilisateur, **When** il est déposé,
   **Then** il est horodaté, rattaché à un parcours et traité sans exposer de
   données personnelles.
3. **Given** un test d'utilisabilité, **When** il est réalisé,
   **Then** les observations sont consignées et converties en tâches.

---

### User Story 7 - Publier une apparence sans casser l'ergonomie (Priority: P3)

En tant que super-admin, je veux que le choix du thème et de l'accent soit
prévisualisé avec des garde-fous de lisibilité, de contraste et de cible
tactile, pour ne jamais publier une apparence qui dégrade l'usage.

**Why this priority**: Le thème global est déjà une fonctionnalité ; il doit
rester au service de l'ergonomie, pas l'inverse.

**Independent Test**: Un thème avec un accent trop clair ou une densité trop
faible est signalé et ne peut pas être publié sans correction.

**Acceptance Scenarios**:

1. **Given** un thème sélectionné, **When** le super-admin prévisualise,
   **Then** il voit un échantillon des composants critiques (navigation,
   formulaire, tableau, alerte, voyageur).
2. **Given** un contraste inférieur à 4,5:1 ou une cible inférieure à 44 px,
   **When** il tente de publier, **Then** la publication est bloquée avec un
   motif explicite.
3. **Given** une publication, **When** elle est appliquée,
   **Then** les tests de contraste et de cible passent sur toutes les surfaces.

---

### Edge Cases

- JavaScript désactivé, cassé ou bloqué par un vieux navigateur.
- Réseau lent (3G), coupure, mode avion, retour réseau avec rejeu.
- Écran 320 px, zoom 200 %, orientation paysage, clavier virtuel ouvert.
- Thème sombre, contraste élevé, `prefers-reduced-motion`, `prefers-contrast`.
- Traductions longues (allemand), dates et montants localisés.
- Image manquante, photo lente, données partielles, liste vide.
- Lien voyageur expiré, révoqué ou réutilisé.
- Date passée, départ avant arrivée, tarif manquant, logement vendu.
- Double soumission, retour arrière, onglet multiple, session expirée.
- Rôle changé ou « voir comme » actif : navigation et actions recalculées.
- Recherche sans résultat, requête trop courte, caractères accentués.
- Formulaire avec erreur serveur : valeurs conservées, message actionnable.

## 6. Requirements

### Functional Requirements

- **FR-001** : Toutes les surfaces clientes MUST utiliser un langage visuel
  commun (tokens, typographie, espacements, rayons, ombres, densité) et des
  composants documentés dans `/design`.
- **FR-002** : Chaque page MUST avoir un seul `h1`, une hiérarchie de titres
  cohérente, des landmarks (`header`, `nav`, `main`, `footer`) et un lien
  d'évitement vers le contenu.
- **FR-003** : La navigation staff MUST être organisée par tâches et domaines,
  avec au plus 7 entrées principales, un regroupement secondaire explicite et
  une recherche globale persistante.
- **FR-004** : Le tableau de bord hôte MUST afficher d'abord les actions
  urgentes et les échéances du jour, puis les indicateurs, avec un lien direct
  vers l'action.
- **FR-005** : Le parcours public MUST tenir en deux étapes maximum après le
  choix du logement (dates/prix, puis coordonnées), avec un récapitulatif
  persistant et un seul CTA primaire par étape.
- **FR-006** : Le premier écran voyageur MUST répondre à « où, comment entrer,
  quel Wi-Fi, à quelle heure partir, qui appeler » sans défilement.
- **FR-007** : Tous les textes visibles des surfaces publiques et voyageur
  MUST provenir d'un dictionnaire typé en cinq langues, avec repli français,
  `lang` correct et formats `Intl`.
- **FR-008** : Les formulaires MUST avoir des labels explicites, les bons
  `autocomplete`/`inputmode`, une validation inline, un résumé d'erreurs,
  la conservation des valeurs et un état de succès/erreur annoncé.
- **FR-009** : Les tableaux critiques MUST devenir des cartes ou des listes
  lisibles sur petit écran ; les tableaux secondaires peuvent défiler mais
  doivent annoncer leur défilement et garder un en-tête compréhensible.
- **FR-010** : Toute action MUST donner un retour visible (succès, erreur,
  en attente) et ne jamais échouer silencieusement.
- **FR-011** : L'interface MUST respecter WCAG 2.2 AA : clavier, focus,
  contrastes, cibles 44 px, zoom 200 %, réduction des animations, noms
  accessibles et messages annoncés.
- **FR-012** : Les surfaces publiques et voyageur MUST rester utilisables sans
  JavaScript ; aucune fonction critique ne doit dépendre d'un îlot client.
- **FR-013** : Les erreurs, états vides et pages 404/500 MUST proposer une
  explication, une action de sortie et un contact.
- **FR-014** : Le produit MUST éviter les dark patterns : consentement
  symétrique, pas de case précochée, pas de faux compte à rebours, pas de
  promesse non tenue.
- **FR-015** : La navigation MUST refléter le rôle et le périmètre ; aucun lien
  ou action hors rôle ne doit être visible ou cliquable.
- **FR-016** : L'apparence MUST être prévisualisée avec des garde-fous de
  contraste, de lisibilité et de cible tactile avant publication.
- **FR-017** : Le contenu MUST être rédigé en langage clair : phrases courtes,
  information utile en premier, termes cohérents, pas de jargon interne.
- **FR-018** : Le produit MUST être mobile-first : zones d'action au pouce,
  marges de sécurité, pas de contenu masqué par une barre fixe.
- **FR-019** : Les parcours MUST être mesurables par des événements first-party
  anonymes (route, action, durée, résultat), sans PII et sans outil tiers.
- **FR-020** : La refonte MUST préserver les routes, contrats, règles de
  sécurité, budgets JS, thème global et fonctionnement hors ligne existants.

### Non-Functional Requirements

- **NFR-001 Performance** : LCP < 2,5 s et CLS < 0,1 sur mobile 3G pour `/`,
  `/reserver`, `/voyageur` ; JS voyageur < 50 Ko gzip, staff < 200 Ko.
- **NFR-002 Accessibilité** : 0 erreur sérieuse/critique axe sur les surfaces
  P1 ; parcours clavier et lecteur d'écran validé.
- **NFR-003 Responsive** : 320, 360, 390, 768, 1024, 1440 px ; aucun
  défilement horizontal sur les surfaces clientes.
- **NFR-004 i18n** : 100 % des clés publiques/voyageur présentes dans les cinq
  langues ; aucune chaîne française en dur.
- **NFR-005 Sécurité** : aucune donnée de mesure ne contient d'e-mail, de nom,
  de token ou de contenu de message.
- **NFR-006 Maintenabilité** : tout nouveau composant a un test, une doc dans
  `/design` et un plan de retrait.
- **NFR-007 Dégradation** : L0-L3 conservés ; le mode lite reste fonctionnel.
- **NFR-008 SEO** : titles, descriptions, canonical, `hreflang` et JSON-LD
  conservés ou améliorés.

## 7. Key Entities

- **Surface** : public, voyageur, staff, token (contrat/facture), auth.
- **Parcours** : suite d'étapes mesurables avec entrée, succès, échec et temps
  cible.
- **Écran** : route, rôle, objectif principal, action primaire, état vide.
- **Composant** : primitive du design system (navigation, formulaire, tableau,
  alerte, carte, étape, résumé).
- **Critère ergonomique** : identifiant, surface, métrique, seuil, méthode.
- **Mesure** : événement anonyme (route, action, durée, résultat) ou retour
  qualitatif.
- **Traduction** : clé, contexte, cinq langues, longueur maximale.
- **Thème** : tokens clair/sombre, densité, contraste, cibles.

## 8. Success Criteria

### Measurable Outcomes

- **SC-001** : 80 % des testeurs (n ≥ 5) terminent une demande de réservation
  sans aide en moins de 3 minutes ; 0 erreur critique.
- **SC-002** : Les 5 tâches hôte principales sont accessibles en ≤ 2 clics
  depuis `/hote` ; temps médian réduit d'au moins 30 % par rapport à la
  baseline.
- **SC-003** : 90 % des testeurs trouvent le Wi-Fi, l'accès et l'heure de
  départ en moins de 10 secondes sur `/voyageur`.
- **SC-004** : Lighthouse mobile ≥ 90 en performance, accessibilité, bonnes
  pratiques et SEO sur `/`, `/reserver`, `/voyageur`, `/login`, `/hote`.
- **SC-005** : 0 erreur axe sérieuse/critique ; parcours clavier et lecteur
  d'écran validé sur les trois parcours P1.
- **SC-006** : 320 px sans défilement horizontal sur les six surfaces clientes ;
  100 % des contrôles ≥ 44 px (hors liens de texte inline).
- **SC-007** : 100 % des parcours publics/voyageur critiques fonctionnent sans
  JavaScript ; tests Playwright `javaScriptEnabled: false` verts.
- **SC-008** : Budgets JS conservés : 0 Ko obligatoire sur public/voyageur,
  voyageur < 50 Ko, staff < 200 Ko.
- **SC-009** : 100 % des clés publiques/voyageur traduites dans les cinq
  langues ; `lang` correct sur chaque page.
- **SC-010** : SUS ≥ 80 ou SEQ ≥ 5,5/7 après la refonte ; tickets support liés
  à la navigation et à la réservation réduits d'au moins 30 %.
- **SC-011** : Aucune régression sur les suites `public`, `sans-js`,
  `apparence`, `super-admin`, `experience-voyageur`, `reservation-directe`.
- **SC-012** : Un thème qui échoue au contraste AA ou aux cibles 44 px ne peut
  pas être publié.

## 9. Assumptions

- La refonte se fait dans `v2/` uniquement ; l'UI Next reste une référence
  morte.
- Aucune nouvelle fonction métier n'est ajoutée ; les données et endpoints
  existants suffisent.
- Cinq langues sont la cible (fr, en, es, it, de), avec repli français.
- Les thèmes existants et la marque blanche sont conservés.
- 5 à 8 testeurs peuvent être recrutés dans l'entourage et le réseau prospects.
- Les mesures sont first-party, sans analytics tiers ni cookie de suivi
  supplémentaire.
- Une personne à temps partiel peut exécuter le plan par phases.
- Les contraintes de la spec 003 (ADR L0) ne bloquent pas les changements d'UI ;
  si une action touche un domaine gelé, elle attend la décision correspondante.

## 10. Out of Scope

- Nouveaux moteurs métier, nouveaux fournisseurs, nouvelle facturation.
- Application mobile native.
- Refonte de l'identité de marque ou des six thèmes.
- Analytics tiers, tests A/B avec outil externe, personnalisation par utilisateur.
- Traduction NL/PT (backlog).
- Modifications de schéma DB, sauf besoin de mesure démontré et validé.

## 11. Points à valider avant implémentation

1. **Top 5 des tâches hôte** : confirmer la liste avec l'exploitant (le plan
   propose : arrivées/départs, ménage, messages, prix/planning, factures).
2. **Recrutement des testeurs** : confirmer 5 à 8 personnes et le format
   (30 min, à distance ou sur place).
3. **Périmètre éditorial** : confirmer que les textes de la vitrine et de
   l'aide sont traduits, ou seulement les parcours transactionnels.
4. **Mesure** : confirmer l'absence d'outil tiers et l'usage d'événements
   first-party + journal existant.
