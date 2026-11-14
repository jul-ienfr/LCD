# Registre des frictions — plan 004

**Date** : 2026-11-13
**Sources** : `specs/004-ergonomie-experience-client/research.md`,
`baseline/audit-heuristique.md`, mesures `v2/.artifacts/ergonomie/*.json`.
**Méthode** : impact (1 faible → 3 fort) × fréquence (1 rare → 3 systématique)
divisé par effort (1 faible → 3 fort). Score ≥ 4 = priorité haute.

| Réf | Friction | Surface | Impact | Fréquence | Effort | Score | Traitement |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F-01 | 48 entrées de navigation staff, doublon `/hote/logements` | Staff | 3 | 3 | 2 | 4.5 | T027–T030, T059–T065 |
| F-02 | Aucun lien d'évitement, landmarks incomplets | Toutes | 2 | 3 | 1 | 6.0 | T013, T017 |
| F-03 | `lang="fr"` figé sur toutes les pages | Toutes | 2 | 3 | 1 | 6.0 | T014 |
| F-04 | Aucun sélecteur de langue public (5 langues cibles) | Public | 3 | 3 | 2 | 4.5 | T015, T035, T036 |
| F-05 | Réservation en un écran unique, longue et sans étapes | Public | 3 | 3 | 3 | 3.0 | T020, T037–T041 |
| F-06 | Cibles tactiles 36 px (`ui-bouton--petit`, `ui-nav-lien`) et 40 px (menu) | Toutes | 2 | 3 | 1 | 6.0 | T025, T079, T080 |
| F-07 | Contrastes insuffisants : badge accent 4,37:1 ; libellé `opacity-70` 3,34:1 | Public | 2 | 3 | 1 | 6.0 | T073, T079 |
| F-08 | Zone `overflow-x-auto` non focusable au clavier | Public | 2 | 2 | 1 | 4.0 | T073 |
| F-09 | Premier écran voyageur long, essentiel noyé | Voyageur | 3 | 3 | 3 | 3.0 | T047–T053 |
| F-10 | Alertes incohérentes (`status` vs `alert`, tons disparates) | Staff | 2 | 2 | 1 | 4.0 | T026, T086 |
| F-11 | Aucune recherche globale staff | Staff | 2 | 3 | 2 | 3.0 | T019, T066 |
| F-12 | Aucun fil d'Ariane | Staff | 2 | 3 | 1 | 6.0 | T018, T067 |
| F-13 | Aucune mesure first-party des parcours | Toutes | 2 | 2 | 2 | 2.0 | T083–T095 |
| F-14 | Baseline Lighthouse non mesurée à ce stade | Toutes | 1 | 3 | 1 | 3.0 | T003, T075 |
| F-15 | Libellés publics et une partie du staff codés en dur en français | Toutes | 2 | 3 | 3 | 2.0 | T015, T042, T047, T059 |
| F-16 | Aucun garde-fou de contraste/cible avant publication de thème | Super-admin | 2 | 1 | 2 | 1.0 | T097–T101 |
| F-17 | Consentement : refus moins visible que l'acceptation | Public | 2 | 2 | 1 | 4.0 | T085, T087 |
| F-18 | Échec d'envoi silencieux : erreurs de champ non localisées et valeurs perdues | Public | 3 | 2 | 1 | 6.0 | T038, T041, T086 |

## Ordre de traitement retenu

1. **G1 (fondations)** : F-02, F-03, F-06, F-07, F-08, F-12.
2. **G2 (MVP public)** : F-04, F-05, F-17.
3. **G3 (voyageur)** : F-09.
4. **G4 (staff)** : F-01, F-11, F-15.
5. **G5 (confiance et accès)** : F-10, F-14, F-18.
6. **G6 (mesure)** : F-13.
7. **G7 (thème)** : F-16.

## Frictions restant à confirmer par test utilisateur

- T007 (panel de 5 à 8 testeurs) et T045/T057/T107 : non réalisables sans
  participants humains ; les heuristiques et mesures automatisées servent de
  substitut documenté jusque-là.
- T008 : les 5 tâches hôte prioritaires sont proposées dans `P-HOTE-5`
  (`v2/src/lib/ergonomie/parcours.ts`) et doivent être validées par
  l'exploitant.

## T109 — frictions traitées et re-testées (2026-11-13)

Les cinq frictions les plus coûteuses de T046 ont été reprises puis vérifiées
par mesure ou par test automatisé. Preuves dans
`specs/004-ergonomie-experience-client/resultats.md` (§2).

| Réf | Friction | Traitement | Preuve du re-test | État |
| --- | --- | --- | --- | --- |
| F-06 | Cibles tactiles 36 px / 40 px | T025, T079, T080 : tous les contrôles ≥ 44 px (liens en ligne exclus) | sonde 320 px : `smallTargets = 0` sur 9 routes publiques et 9 routes staff (`apres-320.json`, `apres-320-staff.json`) | Fermée |
| F-18 | Aucun état vide ni message d'erreur explicite sur la recherche staff | T066, T088 : recherche globale + état vide explicite | `e2e/ergonomie-staff.spec.ts` (recherche globale → `GET /hote/recherche?q=`), `apres-320-staff.json` | Fermée |
| F-04 + F-15 | Pas de sélecteur de langue public ; libellés non traduits | T015, T035, T036 : sélecteur 5 langues, libellés i18n | `tests/ergonomie/i18n-*.test.ts` (5 fichiers), `e2e/public.spec.ts` | Fermée |
| F-10 | Alertes incohérentes (`status` vs `alert`, tons disparates) | T026, T086 : primitive unique `ui-alerte` + annonces cohérentes | `tests/ergonomie/primitives.test.ts`, `vitrine-primitives`, `voyageur-primitives` | Fermée |
| F-17 + F-05 | Réservation en un écran unique, longue et sans étapes | T020, T037–T041 : tunnel en étapes nommées, récapitulatif, inclusions/ taxe/délai | `e2e/confiance.spec.ts` (inclusions, taxe, délai, aucune pression), `tests/ergonomie/navigation.test.ts` | Fermée |

## Frictions de l'environnement de recette (hors produit)

Découvertes pendant T105 et écartées du registre produit : elles viennent du
serveur de démonstration lancé à la main, pas de l'interface.

| Réf | Friction de recette | Cause prouvée | Traitement |
| --- | --- | --- | --- |
| R-01 | 10 échecs `e2e/demande-sejour.spec.ts` (formulaire de demande absent) | `.env.demo.local` ne définit pas `ENQUIRY_ENABLED` ; la vitrine ne rend `?/demande` que si le drapeau est actif (`src/routes/site/[slug]/[[page]]/+page.server.ts:104,126`). Le serveur lancé à la main n'a pas la variable que `playwright.config.ts` fournit au serveur qu'il démarre lui-même. | Suite relancée sur un serveur provisionné (`ENQUIRY_ENABLED=true`, port 4174) : 42/42 verts sur les specs concernées. |
| R-02 | `e2e/support.spec.ts` et `e2e/super-admin.spec.ts` en échec | `admin@lcd.test` a le rôle `super_admin` dans `lcd_demo` (vérifié en base) alors que `lcd` le déclare `admin` ; la page `/support` ne reconnaît comme staff que `admin`/`hote`, et le lien « Supervision plateforme » est légitime pour un super-admin. | Specs rendues déterministes : compte `presta` créé dans le spec pour le refus, compte `hote` créé pour la vue staff. Elles ne dépendent plus des données de démonstration. |
| R-03 | `e2e/super-admin.spec.ts:112` attendait `apercu.arreter` | Nom d'action de l'UI Next de référence ; l'action SvelteKit est `apercu.quitter` (`src/routes/preview/quitter/+server.ts:20`). | Assertion corrigée sur `apercu.quitter`. |
| R-04 | `e2e/deux-facteurs.spec.ts` ne trouvait pas le bouton « Quitter » | La déconnexion a été regroupée dans le menu de compte (`<details>` natif) du nouvel en-tête : elle reste utilisable sans JavaScript mais n'est visible qu'après ouverture du menu. | Spec ouverte sur ce comportement volontaire (ouverture du `<details>` puis clic). |
| R-05 | `planning-prix.spec.ts` instable (valeur `cutoffJours` à 0) | État résiduel de la base de démonstration partagée par les runs successifs. | Repassé vert sur relance isolée (3 tests × 2 projets) ; sans modification de code. |
| R-06 | Suite e2e complète lancée contre le **build de production** (`PW_SERVEUR=prod`, port 4180) : 11 échecs, dont 9 sur des specs qui interrogent Mailpit (`messages`, `police`, `inbox`, `factures`, `releves`, `experience-voyageur`) | `playwright.config.ts` ajoute `origin` (et `x-forwarded-proto`) à **toutes** les requêtes du contexte en mode production, y compris les appels `request.get` vers les faux serveurs. Mailpit répond alors `Blocked due to CORS violation` : prouvé par `curl -H "origin: http://127.0.0.1:4180" http://127.0.0.1:8025/api/v1/messages?limit=1` (même requête sans `Origin` : `200`, JSON valide). Les 2 autres échecs sont l'épuisement des créneaux de `e2e/support/reservation-demo.ts` (six tentatives, base `lcd_demo` déjà consommée par les runs précédents). | Aucun changement produit : la suite de référence reste celle du serveur de développement provisionné (port 4174, sans `PW_SERVEUR`), qui est verte. `PW_SERVEUR=prod` reste utilisable pour les specs qui ne parlent ni à Mailpit ni à S3 ; la limite est documentée ici plutôt que corrigée, car le harnais ne permet pas de filtrer `extraHTTPHeaders` par hôte. |
| R-07 | Audit 320 px : `/hote/rgpd` annoncé en débordement de 404 px alors que la page ne défile pas | `documentElement.scrollWidth` agrège le contenu d'un conteneur `overflow-x: auto` : le tableau de 880 px vit dans un `div` de 222 px qui le rogne, le corps du document reste à 320 px et `scrollLeft` refuse toute valeur. Injecter `contain: paint` sur le conteneur ramène la racine à 320 px, ce qui prouve l'artefact. | Mesure corrigée dans `scripts/lib/mesure-cibles.mjs` (débordement calculé sur `body.scrollWidth`, `scrollWidthRacine` publié en comparaison) ; preuve reproductible dans `.artifacts/ergonomie/experience-debordement.mjs`. Les deux débordements réels trouvés par la même campagne (`/hote/compta/rapprochement` 48 px, `/hote/prix/recommandations` 110 px) ont été corrigés. |
| R-08 | Une page staff entière répondait 500 sans qu'aucun test ne le voie | `/hote/demandes` renvoyait l'objet de traductions complet dans son `load` : `devalue` refuse les fonctions (`Cannot stringify a function (data.t.okConvertie)`), donc la page échouait pour tout le monde. Ni `npm test` (unitaire) ni la suite e2e ne visitaient cette route staff. | Défaut produit corrigé (§ 2.2 de `resultats.md`) et garde-fou ajouté (`tests/lib/i18n-demandes.test.ts` vérifie que toute entrée de traduction est sérialisable). Audit staff élargi à **68 routes** : plus aucune erreur serveur. |
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

**Trois commandes durcies après coup.** Le même piège dormait dans deux autres
commandes documentées : `npm run audit:a11y` écrivait dans `baseline-axe.json`
(les valeurs « avant » du rapport agrégé redevenaient 0), et
`npm run audit:ergonomie:ecrire` mesurait avant d'agréger — donc écrivait dans
`baseline-320.json`. Désormais : garde-fou sur les deux scripts,
`npm run audit:a11y:verifier` pour mesurer et prouver les 4 routes P1
(`apres-axe.json`), et `--ecrire` n'exécute plus de mesure (il implique
`--sans-audit`). Règle générale : une commande *documentée* ne doit jamais
écrire dans un fichier de référence.

## R-11 — La suite e2e s'empoisonne avec ses propres fixtures

**Symptôme.** La passe e2e complète du 2026-11-13 se termine sur **2 échecs**
(`e2e/confiance.spec.ts:91` et `e2e/ergonomie-reservation.spec.ts:81`), tous
deux levés par `e2e/support/reservation-demo.ts:207` : « le tunnel de réservation
n'a abouti sur aucune des six tentatives ». La **même** passe, plus tôt dans la
journée, était verte (251 réussites, 0 échec). Aucun des deux tests ne touche
les pages modifiées par les correctifs d'ergonomie du jour.

**Ce que montre la trace.** L'instantané d'échec de Playwright
(`test-results-local/…/error-context.md`) capture l'étape 1 de `/reserver` sur
« Villa Santa Severa », du 2027-02-03 au 2027-02-06, avec l'alerte : « Ce séjour
ne respecte pas les règles de l'hôte : choisissez d'autres dates. » Le prix ne
s'affiche donc jamais.

**Mesures (rôle de migration, donc hors RLS).**

| Mesure | Valeur |
| --- | --- |
| `demandes_sejour` | **0** ligne — l'hypothèse « créneaux déjà pris » du support est fausse |
| `logements` | **617**, tous `statut = actif` |
| `logements` publiés | **64** : 48 fixtures « …E2E… », 13 « Onboarding <horodatage> », 3 logements de démonstration |
| publiés ayant au moins un tarif | **29**, dont seulement **3** non-fixtures |
| tarifs des 3 logements de démonstration | 120 jours chacun, 2026-11-12 → 2027-03-11 |
| cartes de logement sur `/` (relevé curl) | **3** |
| liens de logement sur `/reserver?tenant=lcd` | **64** |

Le support tire ses six tentatives parmi les **3 cartes de l'accueil**. Quand ces
trois cartes sont des fixtures sans tarif (ou à règles restrictives), le bloc de
prix n'apparaît pour aucune tentative : l'échec est **indépendant du code
produit**, il dépend de l'ordre de publication des fixtures.

**Cause.** Chaque passe e2e publie des logements dans le **même tenant** que la
démonstration et ne les supprime jamais. Le vivier de l'accueil grandit donc avec
le nombre d'exécutions, jusqu'à ce que les trois cartes visibles ne soient plus
des logements tarifés.

**Correctif tenté, mesuré, puis rétabli.** Élargir le vivier aux 64 liens du
sélecteur, abandonner une tentative dès l'affichage d'un refus et monter à 12
tentatives a **dégradé** la situation : 2 échecs → **5 échecs**
(5 échecs / 3 instables / 6 réussites en 16,8 min contre 2 / 2 / 10 auparavant),
parce que 61 des 64 candidats sont des fixtures sans tarif — un tirage au sort
n'y tombe presque jamais sur un logement tarifé. La sonde
(`.artifacts/ergonomie/sonder-tunnel.mjs`) confirme que les **trois premiers**
candidats du sélecteur, c'est-à-dire les trois vrais logements, affichent bien le
prix (`prix=OUI` pour 2026-12-13, 2026-12-30 et 2027-01-16). Le support a été
rétabli à l'identique (les cinq remplacements ont été inversés un à un ; le
fichier n'est pas suivi par Git, il n'existe donc aucune version de référence à
restaurer).

**Parades.**

1. **Le nettoyage est réservé au déploiement, après le déploiement** (décision
   du 2026-11-13). Il ne porte pas seulement sur les fixtures nommées « E2E » :
   ce sont **tous les faux comptes et faux logements créés pour tester** — 120
   comptes `@lcd.test` et 614 logements sur 617, plus leurs dépendances (444
   réservations, 549 tarifs, 65 factures, 41 paiements, 57 incidents, 36
   restrictions, 22 avis, 20 extras, 13 blocages). Ces données sont nécessaires
   pour tester : on n'y touche pas maintenant. Procédure complète :
   `v2/DEPLOIEMENT.md` § 8. En attendant, les deux échecs du tunnel sont connus,
   acceptés et tracés.
2. Les specs qui créent un logement doivent le nettoyer en fin de test ou
   travailler dans un tenant dédié — c'est le vrai correctif de fond.
3. Ne **pas** élargir le vivier du tunnel au sélecteur : le remède est dans les
   données, pas dans le tirage (mesuré ci-dessus).
4. Ne pas imputer ces deux échecs aux correctifs d'ergonomie : ils se
   reproduisent à l'identique avec le support d'origine.

**Récupération.** Aucun artefact de référence n'est en jeu ; les correctifs du
jour sont intacts. La passe complète repassera au vert **au déploiement**,
quand le nettoyage des fixtures sera joué — pas avant.
