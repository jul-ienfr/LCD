# Research — i18n staff

## Décisions

- **Dictionnaire par page** plutôt qu’un catalogue global : limites de conflit
  claires, suppression facile, tests ciblés.
- **Repli français** via `resoudreLangue()` : aucune clé brute affichée.
- **Cookie `lcd_langue`** : préférence durable, validée côté serveur, aucun
  stockage en base.
- **Aucun client JS ajouté** : le sélecteur est un formulaire GET natif.
- **Données métier non traduites** : noms, adresses, commentaires et codes
  restent tels quels.
- **Exports stables** : CSV/PDF conservent leurs en-têtes français, car des
  outils externes en dépendent.

## Alternatives écartées

- Catalogue unique de plusieurs milliers de clés : conflits et revue difficiles.
- Traduction automatique au runtime : coût, latence, confidentialité.
- Traduire les valeurs du domaine : casserait les filtres et les exports.
