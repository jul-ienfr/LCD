# Data Model — i18n staff

## Dictionnaire de page

- **Clé** : identifiant stable (`titre`, `creer`, `aucun`, …).
- **Valeurs** : cinq chaînes (`fr`, `en`, `es`, `it`, `de`), jamais vides.
- **Fonctions** : uniquement pour les messages avec interpolation (compteur,
  code, jours).
- **Repli** : `fr` si la langue est absente ou inconnue.

## Préférence de langue

- **Cookie** : `lcd_langue`.
- **Valeurs** : `fr | en | es | it | de`.
- **Durée** : un an, `SameSite=Lax`, `Secure` en HTTPS.
- **Validation** : `resoudreLangue()` à chaque lecture.

## Page localisée

- **Route** : route staff existante.
- **Entrées** : données métier + `t` (dictionnaire) + `langue`.
- **Sorties** : HTML rendu serveur avec `lang` correct.
- **Invariants** : aucun identifiant, montant ou donnée client traduit.
