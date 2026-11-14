# Contrat — Ergonomie des surfaces clientes

**Feature**: `004-ergonomie-experience-client`

**Statut**: proposition

**Portée**: public, réservation, voyageur, staff, auth et pages token. Ce
contrat décrit le comportement attendu, pas l'implémentation.

## 1. Définitions

- **Action primaire** : l'action que l'utilisateur doit pouvoir trouver et
  exécuter sans hésiter. Une seule par écran.
- **Tâche P1** : tâche dont l'échec bloque le parcours ou coûte de l'argent.
- **Sans JS** : JavaScript désactivé dans le navigateur ; les formulaires
  natifs et les liens doivent suffire.
- **Cible tactile** : bouton, lien-bouton, champ, select, textarea ou contrôle
  actionnable. Les liens de texte inline sont hors périmètre.
- **État** : vide, chargement, erreur, succès, hors-ligne, lecture seule.

## 2. Règles communes

### 2.1 Structure

- Un seul `h1` par page, hiérarchie de titres continue.
- Landmarks : `header`, `nav`, `main`, `footer` ; `main` unique.
- Lien d'évitement « Aller au contenu » en premier élément focusable.
- `aria-current="page"` sur la navigation active.
- Fil d'Ariane sur toute page profonde (plus d'un niveau).
- `lang` du document correct ; `lang` local si un mot étranger est cité.

### 2.2 Actions et feedback

- Toute action affiche un état : en attente, succès, erreur.
- `role="status"` pour un succès non bloquant ; `role="alert"` pour une erreur
  bloquante ; `aria-live="polite"` pour une progression.
- Aucun bouton ne reste actif pendant une soumission ; le double clic ne crée
  pas de doublon.
- Une action destructive demande confirmation et explique la conséquence.
- Un état vide propose une action ou un contact.

### 2.3 Formulaires

- Label visible et associé ; placeholder jamais seul.
- `autocomplete` correct (`name`, `email`, `tel`, `postal-code`, `cc-number` si
  applicable), `inputmode` pour les nombres et téléphones.
- Erreur au niveau du champ + résumé en tête de formulaire avec ancres.
- Les valeurs saisies sont conservées après erreur.
- Les contraintes `required`, `min`, `max`, `pattern` sont utilisées quand
  elles évitent une erreur ; le serveur reste la vérité.
- Le message d'erreur dit quoi faire, pas seulement « invalide ».
- Sans JS : le formulaire POST fonctionne, l'erreur est rendue côté serveur.

### 2.4 Tableaux et listes

- Tableau critique : cartes empilées sous 640 px, avec libellé de colonne
  visible.
- Tableau secondaire : défilement horizontal autorisé mais annoncé
  (`role="region"`, `aria-label`, indication visuelle) et en-tête lisible.
- Tri/filtre accessibles au clavier ; état du filtre visible.
- Pagination ou « charger plus » avec nombre de résultats.
- Aucune donnée critique uniquement dans un tableau non responsive.

### 2.5 Contenus

- Langage clair, phrases courtes, information utile en premier.
- Termes cohérents : « logement », « séjour », « voyageur », « hôte »,
  « demande », « réservation ».
- Pas de jargon interne (`tenant`, `RLS`, `HMAC`, `outbox`) côté client.
- Pas de promesse non tenue, pas de faux compte à rebours, pas de case
  précochée.
- Les prix affichent la devise, la période et ce qui est inclus.

## 3. Surface publique

### 3.1 Accueil

- Le premier écran répond à : quoi, pour qui, où, combien, comment réserver.
- Un CTA primaire « Voir les séjours » ou équivalent.
- Un prix d'appel ou « à partir de » si disponible.
- Preuves de confiance : avis, contact, engagement, sans surcharge.
- Sélecteur de langue visible et accessible.
- Navigation principale ≤ 5 entrées.
- Aucun carrousel automatique bloquant.

### 3.2 Liste des logements

- Chaque carte a un nom, une localisation, un prix, une photo et un CTA.
- Le prix est lisible sans cliquer.
- Les filtres sont facultatifs et ne masquent pas le résultat.
- État vide : explication + contact.
- 320 px : une carte par ligne, pas de débordement.

### 3.3 Fiche logement et réservation

- Le prix, les dates, les voyageurs et le total sont visibles avant l'envoi.
- Le parcours affiche « étape 1 sur 2 » puis « étape 2 sur 2 ».
- Les dates passées et les départs avant arrivée sont bloqués côté client et
  serveur ; le message est explicite.
- Le récapitulatif reste visible (sticky desktop, barre mobile non masquante).
- Le bouton primaire est unique : « Voir le prix » puis « Envoyer la demande ».
- Après envoi : référence, dates, montant, délai de réponse, contact.
- Aucun paiement n'est demandé sans explication.
- Fonctionne sans JS.

## 4. Surface voyageur

### 4.1 Premier écran

Doit contenir, sans défilement sur 360×640 :

- nom du logement et dates ;
- adresse et accès (code/boîte/check-in) ;
- Wi-Fi (réseau + mot de passe) ;
- heure de départ ;
- contact d'urgence ;
- action « Guide du séjour » et « Signaler un incident ».

### 4.2 Navigation du séjour

- Sommaire ancré ou sections repliables.
- Une section = une question utilisateur.
- Le contenu long est regroupé, pas supprimé.
- Les actions (incident, extra, départ, avis) ont leur propre carte avec état.
- Le retour à l'essentiel est toujours possible.

### 4.3 Hors ligne

- Les informations déjà chargées restent lisibles.
- Un bandeau honnête indique « hors ligne » et l'heure de dernière mise à jour.
- Les écritures rejouables utilisent l'outbox existante.
- Aucune donnée sensible n'est mise en cache au-delà de la politique.

## 5. Surface staff

### 5.1 Navigation

- Au plus 7 entrées principales par rôle.
- Groupes secondaires nommés par domaine, pas « Plus ».
- Recherche globale persistante.
- Fil d'Ariane et retour contextuel.
- Menu utilisateur : rôle, langue, voir le site, quitter.
- Aucun lien hors rôle.

### 5.2 Tableau de bord

- Bloc « À faire maintenant » en premier : urgences, retards, arrivées,
  départs, tâches assignées.
- Chaque ligne a une action directe.
- KPI ensuite, avec période et définition.
- Un état vide explique qu'il n'y a rien à faire, sans faux positif.

### 5.3 Recherche

- Accessible depuis toutes les pages staff.
- Accepte une référence, un nom de logement, un voyageur, une facture.
- Résultats groupés par type, avec lien direct.
- Aucun résultat : suggestion de format ou de terme.
- Fonctionne sans JS (form GET) ; raccourci clavier en amélioration.

### 5.4 Tableaux et formulaires

- Les listes critiques deviennent des cartes sur mobile.
- Les filtres sont visibles et réinitialisables.
- Les actions de ligne sont explicites (pas d'icône seule sans `aria-label`).
- Les erreurs de formulaire sont liées au champ et résumées.
- Les actions sensibles (suppression, publication, paiement) demandent une
  confirmation.

## 6. Surface auth

- Un seul `h1`, formulaire court, labels explicites.
- `autocomplete="username"` et `current-password`.
- Erreur non énumérante : « E-mail ou mot de passe incorrect ».
- 2FA : code numérique, `inputmode="numeric"`, `autocomplete="one-time-code"`.
- Lien « mot de passe oublié » visible.
- Langue accessible.
- Aucun secret dans l'URL.

## 7. Pages token (contrat, facture)

- Lecture seule, sans JS.
- En-tête clair : objet, partie, date, montant.
- Bouton « Imprimer » natif (`window.print` en amélioration, pas obligatoire).
- Aucune donnée d'un autre tenant.
- Lien de retour ou contact.

## 8. Thème et apparence

- Un seul thème publié pour tout le site.
- Aperçu super-admin avec échantillon : navigation, formulaire, tableau,
  alerte, carte voyageur, bouton primaire.
- Publication bloquée si :
  - contraste texte normal < 4,5:1 ;
  - contraste grand texte < 3:1 ;
  - cible tactile < 44 px ;
  - focus invisible ;
  - information portée par la couleur seule.
- Le thème sombre est vérifié séparément.
- Aucune préférence de thème par utilisateur.

## 9. Recette d'acceptation

### Automatique

- [ ] axe : 0 erreur sérieuse/critique sur les six surfaces P1.
- [ ] Lighthouse mobile : performance, accessibilité, bonnes pratiques, SEO
      ≥ 90.
- [ ] 320 px : 0 débordement horizontal.
- [ ] 44 px : 100 % des contrôles (hors liens inline).
- [ ] Sans JS : parcours public, réservation, voyageur et incident.
- [ ] `lang` correct sur les cinq langues.
- [ ] Aucune clé i18n manquante.

### Manuelle

- [ ] Clavier seul : skip link, ordre, focus, aucun piège.
- [ ] Lecteur d'écran : titres, labels, erreurs, statuts.
- [ ] Zoom 200 % : aucune perte d'action.
- [ ] `prefers-reduced-motion` : animations supprimées.
- [ ] Téléphone réel : 3G, mode avion, offline.
- [ ] Test utilisateur : 5 personnes, parcours P1.

## 10. Non-régression

- Les routes et contrats existants restent valides.
- Les tests `public`, `sans-js`, `apparence`, `super-admin`,
  `experience-voyageur`, `reservation-directe` passent.
- Les budgets JS et les performances ne régressent pas.
- Aucune donnée de mesure ne contient de PII.
