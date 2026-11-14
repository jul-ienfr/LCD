# Research — Ergonomie globale et expérience client

**Date**: 2026-11-12

**Feature**: `004-ergonomie-experience-client`

**Input**: Audit statique de la V2, plans fondateurs, méthode ergonomique en
dix étapes, et revue des parcours existants.

## 1. Cadre méthodologique

### 1.1 Définition opérationnelle

L'ergonomie est traitée ici comme l'adaptation du travail à l'humain, pas comme
un simple habillage graphique. Pour un logiciel, cela signifie réduire :

- la **charge cognitive** (choix, mémoire, compréhension) ;
- la **charge physique** (cibles, gestes, lecture sur petit écran) ;
- les **erreurs** et le temps de reprise ;
- l'**incertitude** (état du système, prochaine étape, délai, prix).

La méthode de référence est l'approche en dix étapes de R. Op De Beeck et al.
(Prevent, 2009), reprise par le centre de connaissances belge Beswic :
<https://beswic.be/fr/themes/ergonomie/de-lanalyse-la-solution-un-plan-par-etapes-pour-lergonomie-de-conception>.

### 1.2 Traduction en plan logiciel

| Étape ergonomique | Livrable logiciel |
|---|---|
| 1. Formuler les problèmes | Registre des frictions, abandons, tickets, observations |
| 2. Impliquer les acteurs | Panel hôte, voyageur, prestataire, support |
| 3. Intégrer le projet | Phasage, responsabilités, calendrier, information |
| 4. Analyser la charge externe | Cartographie des tâches, des écrans et des données |
| 5. Analyser la charge interne | Temps, erreurs, effort, fatigue, charge mentale |
| 6. Recueillir le subjectif | Entretiens, questionnaires, observations |
| 7. Traiter et prioriser | Matrice impact × fréquence × effort |
| 8. Formuler les solutions | Design system, navigation, parcours, contenus |
| 9. Sélectionner et planifier | Contrats d'acceptation, tâches, jalons |
| 10. Informer, évaluer, corriger | Tests utilisateurs, mesures avant/après, boucle |

### 1.3 Grille d'évaluation

La revue combine :

- les **10 heuristiques de Nielsen** (visibilité de l'état, langage du monde
  réel, contrôle, cohérence, prévention, reconnaissance, efficacité, esthétique,
  récupération, aide) ;
- les **WCAG 2.2 AA** (perception, opérabilité, compréhension, robustesse) ;
- les contraintes projet **L0-L3 / 320 px / 44 px / sans-JS** ;
- les **budgets de performance** de `docs/70-front-v1.md`.

## 2. Audit de l'existant

### 2.1 Navigation staff surchargée

`v2/src/routes/hote/+layout.svelte` déclare 48 entrées réparties en cinq
groupes (`principaux`, `operations`, `relation`, `conformite`,
`administration`), dont un doublon `/hote/logements`. Neuf entrées sont
visibles en permanence, le reste est entassé dans un unique panneau « Plus »
(`lignes 14-75`, `132-212`).

Conséquences :

- l'utilisateur doit apprendre une carte mentale de routes, pas de tâches ;
- « Logements » et « Guides logement » pointent tous deux vers
  `/hote/logements`, ce qui brouille le modèle ;
- aucun fil d'Ariane, aucune recherche globale dans l'en-tête, aucun « récent » ;
- la recherche existante (`/hote/recherche`) est enterrée dans le groupe
  Administration.

### 2.2 Tableau de bord orienté indicateurs, pas action

`v2/src/routes/hote/+page.svelte` ouvre sur trois KPI (`lignes 43-61`), puis
deux listes (arrivées/départs) et des raccourcis. Les urgences, retards,
impayés et tâches assignées n'ont pas de place dédiée. L'hôte doit déduire quoi
faire, au lieu que l'écran le lui dise.

### 2.3 Français en dur sur les surfaces publiques

La vitrine (`v2/src/routes/+page.svelte`), la réservation
(`v2/src/routes/reserver/+page.svelte`) et l'aide
(`v2/src/routes/aide/+page.svelte`) contiennent des chaînes françaises en dur.
Le dictionnaire `v2/src/lib/i18n.ts` existe déjà pour le voyageur, et
`i18n-staff.ts` pour le staff, mais il n'existe pas de dictionnaire public
équivalent.

Conséquences : impossible de changer la langue de la vitrine, incohérence avec
la Constitution V, dette de traduction qui augmente à chaque édition.

### 2.4 Langue du document non fiable

`v2/src/app.html` fixe `<html lang="fr">`. Le layout hôte pose bien
`lang={data.langue}` sur un `<div>` (`v2/src/routes/hote/+layout.svelte:91`),
mais le document entier reste annoncé en français aux lecteurs d'écran. Les
pages publiques n'ont pas de mécanisme de langue.

### 2.5 Tunnel de réservation fragmenté

`v2/src/routes/reserver/+page.svelte` (`lignes 142-233`) demande de saisir des
dates, puis de cliquer « Calculer le prix », puis de remplir un second
formulaire. Le serveur sait déjà calculer un devis dès que les dates sont
fournies (`+page.server.ts`, `lignes 98-134`). L'interface ajoute donc une
étape et un changement de contexte inutiles.

Manquent aussi :

- un indicateur d'étape (« 1 sur 2 ») ;
- un récapitulatif persistant (dates, voyageurs, prix) ;
- des contraintes de dates (`min`, `max`, départ > arrivée) ;
- une explication du prix (nuits, taxe, extras) avant l'envoi ;
- une barre d'action mobile qui ne masque pas le contenu.

### 2.6 Espace voyageur long et non hiérarchisé

`v2/src/routes/voyageur/+page.svelte` fait plus de 400 lignes et enchaîne
séjour, guide, extras, préférences, mémoire, avis, questionnaire et départ.
Le premier écran ne répond pas immédiatement aux questions les plus urgentes
(Wi-Fi, accès, heure de départ, urgence). Il n'y a pas de sommaire, pas de
sections repliables, pas de barre d'action contextuelle.

### 2.7 Design system présent mais incomplet

`/design` documente déjà boutons, cartes, champs, alertes, tableaux et
navigation. Les primitives existent (`ui/carte`, `ui/alerte`, `ui/kpi`,
`ui/etat-vide`, `ui/page-entete`), mais il manque :

- un lien d'évitement ;
- un fil d'Ariane ;
- un modèle de navigation par tâches ;
- un indicateur d'étapes ;
- un résumé de prix ;
- une barre d'action mobile ;
- un composant de message d'erreur de champ ;
- un état de chargement/pending homogène.

### 2.8 Cibles tactiles et contrastes

`v2/src/app.css` définit `--hauteur-controle: 2.75rem` (44 px) pour les
contrôles standards, mais `.ui-bouton--petit` descend à `2.25rem` (36 px)
(`lignes 392-396`). Les liens de texte inline sont hors périmètre, mais les
boutons compacts fréquents doivent rester ≥ 44 px.

Les contrastes sont vérifiés par les tests de thème, mais aucune recette
automatisée ne mesure les contrastes réels des pages rendues, ni les cibles
tactiles à 320 px.

### 2.9 Tests d'accessibilité et de parcours incomplets

`v2/e2e/sans-js.spec.ts` vérifie qu'une page rend un `h1` et qu'aucun script
d'hydratation n'est chargé. Il ne vérifie pas qu'une tâche complète aboutit
sans JS. Aucun test axe/Lighthouse n'est branché. `npm run measure:js` existe
pour le budget JS, mais pas de mesure ergonomique (temps, erreur, satisfaction).

### 2.10 Messages et états incohérents

Les pages alternent `ui-alerte--succes` et `ui-alerte--ok`, `role="status"` et
`role="alert"`, et parfois un simple paragraphe sans annonce. Les erreurs de
formulaire ne sont pas toujours reliées au champ concerné. Cela produit des
expériences inégales et des annonces imprévisibles.

## 3. Benchmark et principes de solution

Le benchmark n'est pas une copie : il sert à confirmer des invariants.

### 3.1 Réservation directe

Les parcours de réservation les plus lisibles partagent :

- un prix ou un « à partir de » visible avant la saisie ;
- un seul objectif par écran ;
- un récapitulatif qui reste visible ;
- une explication claire de ce qui se passe après l'envoi ;
- des dates contraintes et des erreurs au bon endroit ;
- une preuve de confiance (avis, contact, conditions, engagement).

### 3.2 Console d'exploitation

Les consoles efficaces pour un opérateur :

- ouvrent sur les exceptions et les échéances, pas sur des graphiques ;
- utilisent une navigation par domaine (Planning, Logements, Voyageurs,
  Finances, Opérations) ;
- offrent une recherche globale et des raccourcis ;
- gardent le contexte (fil d'Ariane, titre, filtre, retour) ;
- rendent les actions destructives difficiles à déclencher par erreur.

### 3.3 Espace voyageur

Les guides de séjour efficaces :

- répondent d'abord aux questions du jour (accès, Wi-Fi, horaires, urgence) ;
- cachent le détail sans le supprimer (sections repliables, sommaire) ;
- utilisent de gros boutons pour les actions rares mais urgentes ;
- fonctionnent hors ligne et sans compte ;
- indiquent clairement l'état d'une demande (reçue, en cours, traitée).

## 4. Décisions de recherche

- **D1 — Navigation par tâches, pas par routes.** Le menu staff est dérivé
  d'un modèle `ModeleNavigation` (domaines, tâches, rôles, priorité), pas d'une
  liste de `href` copiée dans le layout.
- **D2 — Dictionnaire public dédié.** Créer `src/lib/i18n-public.ts` (ou
  équivalent) avec les cinq langues, et rendre la langue par URL/cookie côté
  serveur, sans JS obligatoire.
- **D3 — Aucune librairie UI.** Les composants nouveaux sont Svelte + HTML
  natif + CSS. `bits-ui` reste réservé aux primitives complexes déjà justifiées.
- **D4 — Mesure first-party minimale.** Événements anonymes côté serveur,
  agrégés, sans PII ; pas d'outil tiers. Les retours qualitatifs passent par un
  formulaire signé ou le journal existant.
- **D5 — Thème sous garde-fous.** Le super-admin peut choisir un thème, mais la
  publication vérifie contraste, cibles et lisibilité sur un échantillon.
- **D6 — Tunnel en deux étapes.** On conserve la logique serveur existante
  (dates → devis → demande), mais l'interface explicite les étapes et supprime
  les allers-retours inutiles.
- **D7 — Sept entrées principales maximum.** Les fonctions rares vont dans un
  groupe secondaire nommé, pas dans un fourre-tout « Plus ».
- **D8 — Pas de migration DB en phase 1.** Les mesures utilisent les journaux
  et événements existants ; une table dédiée ne serait ajoutée qu'après preuve
  de besoin.

## 5. Baseline à mesurer avant tout changement

| Métrique | Méthode | Cible |
|---|---|---|
| Temps de demande de réservation | Test utilisateur chronométré | < 3 min |
| Taux de réussite sans aide | Observation | ≥ 80 % |
| Temps pour trouver Wi-Fi/accès/départ | Test voyageur | < 10 s |
| Temps pour 5 tâches hôte | Test opérateur | −30 % |
| Erreurs de formulaire | Journal + observation | −50 % |
| Abandon du tunnel | Événements serveur | −20 % |
| Satisfaction | SEQ 1-7 / SUS | ≥ 5,5 / ≥ 80 |
| Lighthouse mobile | `/`, `/reserver`, `/voyageur`, `/login`, `/hote` | ≥ 90 partout |
| axe | Mêmes pages | 0 sérieuse/critique |
| 320 px / 44 px | Script Playwright | 0 débordement / 100 % |
| JS | `npm run measure:js` | budgets conservés |

## 6. Risques et parades

| Risque | Probabilité | Impact | Parade |
|---|---|---|---|
| Refonte perçue comme cosmétique | Moyenne | Élevé | Mesures avant/après et tests utilisateurs |
| Dette de traduction | Élevée | Moyen | Dictionnaire typé + contrôle CI des clés |
| Navigation staff qui casse les habitudes | Moyenne | Élevé | Groupes stables, recherche, période de double libellé |
| Régression performance | Moyenne | Élevé | Aucun JS ajouté, budget mesuré à chaque build |
| Thèmes qui échouent au contraste | Faible | Moyen | Garde-fous à la publication |
| Tests utilisateurs difficiles à recruter | Moyenne | Moyen | Panel de 5 personnes, sessions courtes |
| Scope creep métier | Élevée | Élevé | Feature limitée à l'usage ; toute fonctionnalité sort |
| Données de mesure personnelles | Faible | Élevé | Anonymisation, pas de PII, revue sécurité |

## 7. Incohérences documentaires à traiter

1. `specs/002-parite-lodgify/contracts/site-public.md` parle de « six langues »
   alors que la Constitution V et `src/lib/i18n.ts` en fixent cinq. Retenir
   cinq et corriger le contrat.
2. Le libellé « Guides logement » pointe vers `/hote/logements` comme
   « Logements » ; clarifier la destination ou supprimer le doublon.
3. Les classes d'alerte `ui-alerte--succes` et `ui-alerte--ok` coexistent ;
   choisir une seule nomenclature et migrer les usages.
4. Le README v2 présente `admin@lcd.test` comme super_admin, alors que le seed
   crée `super@lcd.test` comme super_admin et `admin@lcd.test` comme admin.
   Ce n'est pas un sujet d'ergonomie, mais cela fausse les recettes.

## 8. Sources

- Beswic, « De l'analyse à la solution, un plan par étapes pour l'ergonomie de
  conception » : <https://beswic.be/fr/themes/ergonomie/de-lanalyse-la-solution-un-plan-par-etapes-pour-lergonomie-de-conception>
- `Socle Commun LCD - Conciergerie v1.md`
- `Plan Technique LCD - Pipeline automatisation complet v4.md`
- `Plan Execution LCD - Conciergerie v5.md`
- `docs/10-socle-v2.md`, `docs/70-front-v1.md`
- `v2/docs/80-stack-sveltekit.md`
- `.specify/memory/constitution.md`
- `specs/002-parite-lodgify/contracts/site-public.md`
- `AUDIT-COMPLET-PLANS-VS-V2.md`
