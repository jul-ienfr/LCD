### R-09 — Un remplacement de masse en PowerShell a vidé sept fichiers

**Symptôme.** Après une passe de correction automatique sur `src/routes`, sept
`+page.svelte` sont devenus **vides** (0 octet) : `/hote`, `/hote/police`,
`/hote/sinistres`, `/hote/import`, `/hote/audit`, `/journal`,
`/developpeurs`. Le script avait déjà affiché « OK » pour chaque fichier.

**Cause.** Le script reconstruisait le fichier ligne par ligne :
`if ($ligne.TrimStart().StartsWith($motif, '<'))` — l'appel à `StartsWith` avec
un second argument invalide lève une erreur non bloquante à **chaque** ligne,
donc aucune branche n'était exécutée et la liste de sortie restait vide ;
`WriteAllText` a ensuite écrit cette liste vide. Un échec partiel d'une boucle
d'écriture laisse donc un fichier tronqué ou vide, sans code de sortie non nul.

**Parades.**

1. Écrire les remplacements de masse **en Node** (`scripts/*.mjs`), avec
   `readFile`/`writeFile` et une assertion sur le nombre de remplacements
   attendus ; pour un fichier isolé, préférer l'outil d'édition ciblée.
2. Ne jamais écrire le résultat d'une boucle dont une ligne peut être ignorée
   silencieusement : construire la sortie à partir de la source complète
   (`split`/`join` après vérification du nombre de motifs), pas d'une liste
   alimentée par un `if` faillible.
3. Vérifier après coup la taille des fichiers touchés (`Get-Item`) avant de
   lancer la vérification suivante.

**Récupération.** Les sourcemaps du build serveur embarquent la source exacte
(`sourcesContent`) : `node .artifacts/ergonomie/restaurer-source.mjs <chemin>`
restaure un fichier à l'identique (refus d'écraser un fichier non vide). C'est
la raison pour laquelle le build de production est conservé jusqu'à la
vérification finale.