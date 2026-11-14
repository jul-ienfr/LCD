### 2.3 Passe d'accessibilité staff (2026-11-13, après la clôture)

Le contrat 320 px ne mesurait que la taille des cibles. axe a été lancé sur les
**70 routes staff** dérivées du disque (`npm run audit:a11y:staff`, 320 px,
WCAG 2.0/2.1 A+AA) : **10 routes en échec** sur une seule règle, plus **32
champs sans étiquette** révélés par le compteur du rapport 320 px. État final :
**0 violation axe, 0 champ sans étiquette**.

| Défaut mesuré | Cause | Correction | Preuve |
| --- | --- | --- | --- |
| 32 champs sans étiquette accessible : `/hote/etats-des-lieux` (18) et `/hote/rgpd` (14) | champs répétés dans une ligne de tableau, étiquetés par l'en-tête de colonne seulement (`<th>`), donc sans nom accessible individuel | `aria-label` contextuel construit sur le libellé de la ligne (`{t.etatConstate} — {bien.label}`, `{t.colConservation} (mois) — {traitement.finalite}`) ; le sélecteur de couleur de `/supervision/apparence` reçoit `aria-label="Couleur d'accent personnalisée"` | `unlabeledFields = 0` sur les 70 routes ; `sonder-etiquettes.mjs` |
| 10 routes en échec axe (serious) : `scrollable-region-focusable` — `/hote/compta`, `/hote/compta/rapprochement`, `/hote/dispatch`, `/hote/import`, `/hote/police`, `/hote/prix/recommandations`, `/hote/suivi`, `/supervision/apparence/apercu-composants`, `/supervision/assistant`, `/supervision/fournisseurs` | les tableaux larges vivent dans un conteneur `overflow-x: auto` sans accès clavier : un utilisateur au clavier ne peut pas faire défiler la fin du tableau (WCAG 2.1.1) | **56 zones** rendues focusables et nommées : `role="region" tabindex="0" aria-label="…"` (5 l'étaient déjà : `/aide` ×2, `/hote/planning`, `/hote/rapports` ×2) plus `<!-- svelte-ignore a11y_no_noninteractive_tabindex -->` pour garder `svelte-check` à 0 avertissement ; les `<section>` ne reçoivent pas `role="region"` (rôle redondant signalé par Svelte) | axe sur 70 routes : **0 violation** ; `typecheck` 0 erreur / 0 avertissement |
| Détection non rejouable : la liste des routes staff était recopiée à la main (68 alors que le disque en contient 70) | script ad hoc, liste figée dans un fichier d'artefact | `scripts/audit-ergonomie.mjs --staff` et `scripts/audit-a11y.mjs --staff` **dérivent les routes de `src/routes`** et sortent en code 1 si le contrat casse ; alias `npm run audit:ergonomie:staff` et `npm run audit:a11y:staff` | `audit:ergonomie:staff` → 70 routes, 0/0/0/0, code 0 ; `audit:a11y:staff` → 70 routes, 0 violation, code 0 ; test négatif (seuil 60 px) → code 1 |

| Vérification | Résultat | Date |
| --- | --- | --- |
| `npm run audit:ergonomie:staff` | **70 routes, 0 cible, 0 débordement, 0 erreur, 0 champ sans étiquette** | 2026-11-13 |
| `npm run audit:a11y:staff` | **70 routes, 0 violation, 0 erreur** | 2026-11-13 |
| axe élargi (10 routes : P1, `/developpeurs`, `/aide`, `/tarifs`, `/journal`, `/hote`, `/hote/import`) | **0 violation** | 2026-11-13 |
| `npm test` | **257 fichiers, 1 596 réussis, 2 ignorés** | 2026-11-13 |
| `npm run typecheck` | **0 erreur, 0 avertissement** | 2026-11-13 |
| `npm run build` | **0 erreur** | 2026-11-13 |
| e2e ciblé sur les pages touchées (import, audit, police, sinistres, parité, ergonomie staff, accessibilité staff) | **42 réussis, 0 échec** (2,1 min) | 2026-11-13 |

Incident de la passe, consigné pour la suite : un remplacement de texte ligne à
ligne écrit en PowerShell a vidé **sept fichiers** `+page.svelte`
(`/hote`, `/hote/police`, `/hote/sinistres`, `/hote/import`, `/hote/audit`,
`/journal`, `/developpeurs`). Ils ont été restaurés **à l'identique** depuis les
sourcemaps du build serveur (`sourcesContent`), puis la correction a été rejouée
par un script Node idempotent. La recette est conservée :
`.artifacts/ergonomie/restaurer-source.mjs`. Deux enseignements : le build de
production est un filet de récupération exact, et une écriture de masse ne doit
jamais dépendre d'une boucle dont l'échec partiel laisse un fichier vide.