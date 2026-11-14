### Trois commandes durcies par la même leçon

En corrigeant la friction R-10, deux autres pièges de même nature ont été
trouvés dans la chaîne de mesure — tous les deux parce qu'une commande
*documentée* écrivait dans un fichier de référence :

| Commande | Comportement avant | Comportement après |
| --- | --- | --- |
| `npm run audit:a11y` (`baseline-axe.json`) | écrasait le relevé de référence axe à chaque exécution : les valeurs « avant » du rapport agrégé redevenaient 0 | refus (code 2) si le fichier existe ; il faut `AUDIT_ECRASER=1` |
| `npm run audit:a11y:verifier` (nouveau) | — | mesure les 4 routes P1, écrit `apres-axe.json` et applique le gate (code 1 en cas de violation) |
| `npm run audit:ergonomie:ecrire` | mesurait d'abord **et** écrivait dans `baseline-320.json` (c'est l'origine de l'écrasement), puis agrégeait | n'exécute plus de mesure : `--ecrire` implique `--sans-audit`, l'agrégation lit les relevés existants |

Conséquence pratique : la comparaison « avant / après » du rapport agrégé ne
peut plus être détruite par une commande de documentation. Le rapport a été
régénéré après ces durcissements, avec exactement les mêmes valeurs « avant »
(`/reserver` 1 cible, `/voyageur` 1 cible, 0 ailleurs) — ce qui vérifie au
passage que le relevé reconstitué est cohérent avec le rapport d'origine. Une
copie du rapport précédent est conservée :
`.artifacts/ergonomie/rapport-ergonomie-archive-2026-11-13.{json,md}`.