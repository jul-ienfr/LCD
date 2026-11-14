# Contrat — Mesure de l'ergonomie

**Feature**: `004-ergonomie-experience-client`

**Statut**: proposition

**Portée**: mesure des parcours, des erreurs, de la satisfaction et des
performances. Aucune donnée personnelle, aucun outil tiers.

## 1. Objectifs

1. Établir une baseline avant la refonte.
2. Prouver le gain après chaque phase.
3. Détecter les régressions (temps, erreurs, abandons, accessibilité).
4. Prioriser les corrections avec des données, pas des opinions.
5. Rester conforme : pas de PII, pas de cookie publicitaire supplémentaire.

## 2. Principes

- **First-party** : les événements sont produits et agrégés par l'application.
- **Minimal** : seulement ce qui aide à décider.
- **Anonyme** : route, action, durée, résultat, rôle générique, version.
- **Agrégé** : les rapports montrent des comptes et des médianes, jamais des
  sessions individuelles.
- **Rétention** : 90 jours pour les événements bruts, agrégats conservés.
- **Consentement** : les mesures essentielles sont agrégées et sans PII ; le
  suivi marketing existant reste soumis au consentement.
- **Sans JS** : les événements critiques sont émis côté serveur pour que le
  parcours sans JS soit mesuré aussi.

## 3. Événements

```ts
type EvenementErgonomie = {
  nom:
    | "parcours_demarre"
    | "etape_vue"
    | "etape_validee"
    | "erreur_formulaire"
    | "parcours_abandonne"
    | "parcours_reussi"
    | "recherche_effectuee"
    | "recherche_sans_resultat"
    | "retour_utilisateur";
  parcoursId: string;
  surface: "public" | "reservation" | "voyageur" | "staff" | "auth";
  route: string;
  etape?: string;
  resultat?: "succes" | "erreur" | "abandon";
  dureeMs?: number;
  role?: "visiteur" | "voyageur" | "hote" | "admin" | "presta" | "proprietaire" | "commercial" | "super_admin";
  version: string;
  date: string;
};
```

### Interdits

- E-mail, nom, prénom, téléphone, adresse.
- Token voyageur, identifiant de session, mot de passe.
- Contenu d'un message, d'un incident ou d'un avis.
- Numéro de facture nominatif ou référence de réservation nominative.
- Adresse IP brute (agrégation uniquement, pas de stockage long).
- Toute donnée permettant de réidentifier une personne.

## 4. Parcours mesurés

| ID | Surface | Début | Fin | Cible |
|---|---|---|---|---|
| `P-RESA` | public/réservation | `/` | demande envoyée | < 180 s, ≥ 80 % |
| `P-SEJOUR` | voyageur | ouverture du lien | Wi-Fi + accès + départ vus | < 10 s, ≥ 90 % |
| `P-INCIDENT` | voyageur | clic « Signaler » | incident envoyé | < 60 s |
| `P-HOTE-5` | staff | `/hote` | 5 tâches réalisées | −30 % |
| `P-RECHERCHE` | staff | recherche | résultat ouvert | < 20 s |
| `P-PRESTA` | staff | `/presta` | mission clôturée | < 3 min |

## 5. Baseline

Avant toute modification, mesurer :

- temps et réussite des 5 tâches hôte ;
- temps et réussite du parcours de réservation ;
- temps pour trouver Wi-Fi/accès/départ ;
- taux d'erreur de formulaire ;
- taux d'abandon du tunnel ;
- SEQ (1-7) et SUS si possible ;
- Lighthouse mobile (performance, accessibilité, bonnes pratiques, SEO) ;
- axe (erreurs sérieuses/critiques) ;
- 320 px et cibles 44 px ;
- budget JS et LCP/CLS.

Les résultats sont consignés dans un fichier de baseline daté, versionné, et
reproduits dans `quickstart.md`.

## 6. Protocole de test utilisateur

### 6.1 Panel

- 5 à 8 personnes : 2 hôtes/exploitants, 2 voyageurs, 1 prestataire,
  1 prospect, 1 propriétaire si possible.
- Aucune personne impliquée dans la conception.
- Consentement oral, aucune donnée personnelle conservée.

### 6.2 Déroulé (30 min)

1. Accueil et contexte (3 min).
2. Tâches P1, sans aide (15 min) :
   - réserver un séjour ;
   - trouver le Wi-Fi et l'accès ;
   - trouver le ménage du jour et une facture ;
   - signaler un incident.
3. Questionnaire SEQ (2 min).
4. Entretien court : ce qui a frustré, ce qui a manqué (10 min).

### 6.3 Observation

- Chronométrer chaque tâche.
- Noter les erreurs, hésitations, demandes d'aide.
- Ne pas guider sauf blocage technique.
- Enregistrer les citations anonymisées.

## 7. Rapports

### 7.1 Hebdomadaire (pendant la refonte)

- Nombre de parcours démarrés/réussis/abandonnés.
- Temps médian par étape.
- Top 5 des erreurs de formulaire.
- Recherches sans résultat.

### 7.2 Après chaque phase

- Comparaison baseline / après.
- Décision : continuer, corriger, revenir.
- Mise à jour du backlog.

### 7.3 Mensuel (après déploiement)

- Tendance des parcours P1.
- Tickets support liés à la navigation/réservation.
- SEQ/SUS.
- Accessibilité et performance.

## 8. Tableau de bord minimal

Afficher :

- parcours P1 : démarrés, réussis, abandonnés, temps médian ;
- erreurs : nombre, type, page ;
- recherche : volume, sans résultat ;
- satisfaction : SEQ moyen, nombre de retours ;
- accessibilité : dernière mesure axe/Lighthouse ;
- performance : LCP, CLS, JS.

Aucun détail nominatif, aucune session individuelle.

## 9. Gates

| Gate | Mesure | Seuil |
|---|---|---|
| G0 | Baseline complète | Publiée |
| G1 | axe `/design`, 320 px, 44 px | 0 erreur / 0 débordement / 100 % |
| G2 | P-RESA | < 180 s, ≥ 80 % |
| G3 | P-SEJOUR | < 10 s, ≥ 90 % |
| G4 | P-HOTE-5 | −30 % |
| G5 | Lighthouse + axe + budgets | ≥ 90 / 0 / conservés |
| G6 | SEQ/SUS + non-régression | ≥ 5,5 / ≥ 80 / 0 régression |

## 10. Implémentation

- Phase 1 : instrumenter côté serveur les étapes des parcours P1.
- Phase 2 : ajouter les événements de réservation (démarrage, étape, erreur,
  succès, abandon).
- Phase 3 : ajouter les événements voyageur (ouverture, section vue, action).
- Phase 4 : ajouter les événements staff (recherche, tâche, erreur).
- Phase 5 : brancher axe/Lighthouse dans le CI.
- Phase 6 : produire le rapport avant/après.

## 11. Recette

- [ ] Aucun événement ne contient de PII.
- [ ] Les parcours sans JS sont mesurés côté serveur.
- [ ] Les rapports sont agrégés.
- [ ] La rétention est documentée.
- [ ] Le consentement existant est respecté.
- [ ] Les seuils des gates sont vérifiés.
