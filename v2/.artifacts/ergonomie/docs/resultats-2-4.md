### 2.4 Passe hors staff : les routes publiques (2026-11-13)

Le contrat 320 px et l'audit axe ne couvraient que quatre routes P1
(`/`, `/reserver`, `/login`, `/voyageur`). Le reste du dépôt — 21 pages hors
staff — n'avait jamais été mesuré. Une passe dérivée du disque
(`npm run audit:ergonomie:public`, `npm run audit:a11y:public`) a révélé
**191 cibles sous 44 px sur trois pages** et **0 violation axe** ; l'état final
est **0 cible, 0 débordement, 0 champ sans étiquette, 0 violation axe** sur les
21 routes.

| Défaut mesuré | Cause | Correction | Preuve |
| --- | --- | --- | --- |
| `/journal` : **188 cibles** sous 44 px | le bouton de divulgation de chaque ligne du journal (`<summary>Voir</summary>`) mesurait la hauteur de son texte (~24 px) : une cible de 30 × 24 px, répétée 188 fois | `flex min-h-11 min-w-11 cursor-pointer items-center` sur le `<summary>` — le libellé « Voir » est court, la largeur minimale est donc nécessaire en plus de la hauteur | `smallTargets = 0` |
| `/tarifs` : **2 cibles** | deux `<summary>` de questions courtes (« Puis-je changer d'offre ? », « Y a-t-il un engagement ? ») tenaient sur une ligne, donc sous 44 px de haut ; les deux questions longues passaient déjà en se repliant sur deux lignes | `flex min-h-11 cursor-pointer items-center font-medium` sur les quatre `<summary>`, pour un rendu homogène | `smallTargets = 0` |
| `/mot-de-passe-oublie` : **1 cible** | « ← Retour à la connexion » est un lien de navigation hors paragraphe (donc compté comme contrôle), rendu à 20 px de haut | `flex min-h-11 items-center justify-center` : la cible occupe toute la largeur de la carte et 44 px de haut | `smallTargets = 0` |

Le reste de la passe est une **dérivation durable** : les deux scripts
acceptent `--public`, dérivent les routes du disque (hors `hote`,
`supervision`, `support`, `presta`, hors `api`, hors routes à paramètre),
écartent deux pages avec une raison documentée — `/login` (redirige vers
`/hote` quand une session est ouverte, mesurée anonymement dans le contrat P1)
et `/two-factor` (atteignable seulement en cours de vérification 2FA, couverte
par `e2e/auth.spec.ts`) — et appliquent le même gate qu'en staff, avec un code
de sortie 1 en cas d'échec.

| Vérification | Résultat | Date |
| --- | --- | --- |
| `npm run audit:ergonomie:public` | **21 routes, 0 cible, 0 débordement, 0 erreur, 0 champ sans étiquette** | 2026-11-13 |
| `npm run audit:a11y:public` | **21 routes, 0 violation, 0 erreur** | 2026-11-13 |
| `npm run audit:ergonomie:staff` / `audit:a11y:staff` | inchangés : **70 routes, 0/0/0/0** et **0 violation** | 2026-11-13 |
| Test négatif du gate public (seuil 60 px, 3 routes) | **216 cibles détectées, code de sortie 1** — le gate n'est pas creux | 2026-11-13 |
| `npm run typecheck` | **0 erreur, 0 avertissement** | 2026-11-13 |
| `npm test` | **257 fichiers, 1 596 réussis, 2 ignorés** | 2026-11-13 |
| `npm run build` | **0 erreur** | 2026-11-13 |
| e2e ciblé (`tarifs`, `mot-de-passe-oublie`, `parite`, `super-admin`, `accessibilite`) | **10 réussis, 0 échec** | 2026-11-13 |

**Incident de la passe.** Une première mesure a écrit dans
`baseline-320.json` : le script lit la variable `AUDIT_FICHIER`, alors que la
passe lui passait `AUDIT_OUT_NAME` (nom utilisé par `audit-a11y.mjs`). Sans nom
de sortie, le script écrit son relevé de référence — le fichier de référence a
donc été écrasé. Il a été reconstitué à partir des valeurs encore documentées
(`rapport-ergonomie.json`, généré avant l'écrasement, et
`baseline/baseline-2026-11-13.md`) avec un champ `reconstruit: true` ; le détail
par cible n'est pas récupérable. Parade ajoutée au script : un fichier dont le
nom contient `baseline` n'est plus écrasé sans `AUDIT_ECRASER=1`. Friction
consignée : R-10.