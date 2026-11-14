### R-10 — Une variable d'environnement mal nommée a écrasé le relevé de référence

**Symptôme.** Après une passe de mesure des routes publiques, le fichier
`.artifacts/ergonomie/baseline-320.json` (relevé de référence figé au
checkpoint G0) contenait les 21 routes publiques du jour : le relevé d'origine
avait disparu, sans message d'erreur ni de confirmation.

**Cause.** Deux scripts voisins n'utilisent pas le même nom de variable de
sortie : `audit-a11y.mjs` lit `AUDIT_OUT_NAME`, `audit-ergonomie.mjs` lit
`AUDIT_FICHIER`. La passe a fourni `AUDIT_OUT_NAME` au second, qui a donc pris
sa valeur par défaut : `baseline-320.json`. Or c'est précisément le nom du
fichier de référence — la passe de mesure a écrasé la référence. Une variable
inconnue ne produit aucune erreur : l'outil fait simplement autre chose.

**Parades.**

1. Garde-fou dans le script : une sortie dont le nom contient `baseline` n'est
   jamais écrasée si le fichier existe déjà ; il faut `AUDIT_ECRASER=1` **et**
   nommer la sortie. Sortie 2 et message explicite.
2. Toujours nommer la sortie d'une passe de mesure
   (`AUDIT_FICHIER=apres-320-<sujet>.json`), et vérifier le chemin affiché par
   le script en fin de passe.
3. Les noms de fichiers de référence sont un contrat : les protéger comme des
   migrations (immuables), pas comme des sorties.

**Récupération.** Le relevé a été reconstitué à partir de ce qui avait été
généré *avant* l'écrasement : `rapport-ergonomie.json` (colonnes
`avant`/`apres` par route) et `specs/004-ergonomie-experience-client/baseline/baseline-2026-11-13.md`.
Le fichier reconstitué porte `reconstruit: true` et sa `source` ; le détail par
cible (tag, classe, dimensions) n'est pas récupérable. Leçon générale : un
artefact de référence doit pouvoir être régénéré ou être versionné — sinon il
faut a minima que ses valeurs agrégées vivent dans un document daté.