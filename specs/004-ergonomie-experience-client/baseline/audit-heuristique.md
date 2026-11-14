# Audit heuristique Nielsen — baseline 2026-11-13

**Périmètre** : `/`, `/reserver`, `/voyageur`, `/login`, `/hote`,
`/hote/planning`, `/hote/logements`, `/hote/factures`.
**Méthode** : inspection serveur + rendu 360 px et 320 px, navigation clavier,
JavaScript désactivé, lecture des JSON `v2/.artifacts/ergonomie/`.

## Synthèse par heuristique

| # | Heuristique | Constat | Sévérité |
| --- | --- | --- | --- |
| H1 | Visibilité de l'état du système | Pas d'indicateur d'étape en réservation ; pas d'état de chargement standardisé ; le voyageur ne sait pas quand les données ont été synchronisées | Moyenne |
| H2 | Correspondance avec le monde réel | Vocabulaire correct côté voyageur ; « Canaux », « Dispatch », « Conformité » peu explicites pour un nouvel hôte | Moyenne |
| H3 | Contrôle et liberté | Aucun lien d'évitement ; pas de fil d'Ariane ; retour arrière non explicite dans le tunnel de réservation | Haute |
| H4 | Cohérence et standards | Alertes `status`/`alert` incohérentes ; cibles 36 px à côté de cibles 44 px ; `lang` figé | Haute |
| H5 | Prévention des erreurs | Validation de dates côté serveur mais peu visible inline ; valeurs perdues possibles sur erreur | Haute |
| H6 | Reconnaissance plutôt que rappel | 48 entrées de navigation sans recherche globale ni regroupement par tâche ; doublon `/hote/logements` | Haute |
| H7 | Flexibilité et efficacité | Aucun raccourci ; pas de récapitulatif sticky ; pas de barre d'action mobile | Moyenne |
| H8 | Esthétique et minimalisme | Le premier écran voyageur noie l'essentiel ; la vitrine empile les sections | Moyenne |
| H9 | Aide à la reconnaissance et correction des erreurs | Messages d'erreur techniques par endroits, sans suggestion de correction | Moyenne |
| H10 | Aide et documentation | `/aide` existe mais n'est pas traduite ; pas de contexte d'aide dans les formulaires | Faible |

## Constats mesurés (baseline)

- 320 px : aucun débordement horizontal sur `/`, `/reserver`, `/login`,
  `/voyageur` (0 px), mais 3 cibles < 44 px sur `/` (menu 40×40, deux champs
  de 20 px de haut).
- axe : `/reserver`, `/login`, `/voyageur` sans violation ; `/` présente
  2 violations sérieuses (`color-contrast` sur `.ui-badge` à 4,37:1 et sur un
  libellé à 3,34:1 ; `scrollable-region-focusable` sur `.overflow-x-auto`).
- JS : 0,1 Ko gzip sur `/`, `/reserver`, `/login` ; 1,1 Ko sur `/voyageur`.
- `lang="fr"` sur toutes les pages ; aucun lien d'évitement ; `h1` unique
  partout sur les pages auditées.

## Recommandations prioritaires

1. Poser les fondations accessibles (évitement, `lang`, cibles, contrastes,
   alertes) avant toute refonte visuelle — Phase 1.
2. Transformer la réservation en deux étapes avec récapitulatif persistant —
   Phase 2.
3. Recomposer le premier écran voyageur autour de cinq cartes essentielles —
   Phase 3.
4. Réduire la navigation staff à 7 entrées principales plus des domaines,
   avec recherche globale et fil d'Ariane — Phase 4.
5. Instrumenter les parcours P1 pour objectiver les gains — Phase 6.
