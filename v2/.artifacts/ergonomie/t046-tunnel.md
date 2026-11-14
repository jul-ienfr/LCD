# T046 — Les 5 frictions les plus coûteuses du tunnel de réservation

**Date** : 2026-11-13
**Périmètre** : tunnel `/reserver` → confirmation `/reserver/[ref]`
**Référence** : `v2/.artifacts/ergonomie/frictions.md` (score = impact × fréquence ÷ effort)
**Preuves** : `v2/e2e/ergonomie-reservation.spec.ts`, `v2/e2e/confiance.spec.ts`,
`v2/e2e/reservation-directe.spec.ts`, `v2/e2e/reservation-directe-paiement.spec.ts`,
`v2/tests/ergonomie/i18n-reservation.test.ts`, `specs/004-ergonomie-experience-client/`.

## Sélection

Les cinq frictions retenues sont celles du registre qui touchent le tunnel public
et dont le score est le plus élevé (F-18 est la friction découverte par revue du
tunnel lui-même ; elle suit la même formule : impact 3 × fréquence 2 ÷ effort 1).

| Rang | Réf | Friction | Score | Traitement |
| --- | --- | --- | --- | --- |
| 1 | F-06 | Cibles tactiles 36 px (`ui-bouton--petit`, `ui-nav-lien`) | 6.0 | périmètre T025/T079/T080 + carte entière cliquable dans le tunnel |
| 2 | F-18 | Échec d'envoi silencieux : erreurs non localisées, valeurs perdues | 6.0 | T038, T041, T086 |
| 3 | F-04 | Aucun sélecteur de langue public (5 langues cibles) | 4.5 | T015/T035 + F-15 ci-dessous |
| 4 | F-10 | Alertes incohérentes (`status` vs `alert`, tons disparates) | 4.0 | T026, T086 |
| 5 | F-17 | Consentement : refus moins visible que l'acceptation | 4.0 | T085, T087, T088 |
| — | F-05 | Réservation en un écran unique, longue et sans étapes | 3.0 | T020, T037–T041 |
| — | F-15 | Libellés codés en dur en français | 2.0 | T042 (chaîne ici : `reservation.ts`) |

F-05 et F-15 sont traités dans le même tunnel et documentés ci-dessous : ils
forment avec F-04 le même chantier (comprendre, se repérer, changer de langue).

---

## 1. F-05 + F-04 + F-15 — un écran unique, en français seulement

**Avant.** `/reserver` affichait tout sur un seul écran : liste des logements,
dates, coordonnées, prix et conditions mélangés ; tous les libellés étaient
écrits en dur en français, sans sélecteur de langue, et le voyageur ne savait
pas où il en était.

**Après.**
- Deux étapes numérotées et ancrées : `1. Vos dates et votre logement`
  (`#etape-1`, formulaire **GET** : l'URL devient partageable et l'étape 2
  n'apparaît qu'avec un devis) puis `2. Vos coordonnées` (`#etape-2`,
  formulaire **POST**). Le composant `IndicateurEtapes` marque l'étape en cours
  (`aria-current="step"`), le voyageur peut revenir aux dates par un lien
  (`Modifier les dates`) — aucune perte de saisie.
- Toute la copie du tunnel et de la confirmation vient de
  `src/lib/i18n/public/reservation.ts` : 5 langues (`fr`, `en`, `it`, `es`,
  `de`), mêmes clés dans les 5 dictionnaires, type `TraductionsReservation`,
  repli français sur code inconnu. L'en-tête public (`EntetePublique`) affiche
  les pastilles de langue (`lang="…"`, `hreflang`, `aria-current`), et la langue
  choisie est propagée par `?lang=` dans les redirections.
- Le déroulé est linéaire, sans JS : `GET /reserver?…&debut=…&fin=…` calcule le
  devis côté serveur, `POST` enregistre la demande. La page fonctionne avec
  `javaScriptEnabled: false`.

**Preuve.** `e2e/ergonomie-reservation.spec.ts` (projet `sans-js`) : titres
`1.`/`2.` visibles, `#etape-1`/`#etape-2` présents, prix affiché sans JS,
0 erreur console. `tests/ergonomie/i18n-reservation.test.ts` : clés identiques
dans les 5 langues, aucune devise en dur, repli `fr`.

## 2. F-18 — échec d'envoi silencieux (nouvelle entrée du registre)

**Avant.** Une demande refusée par le serveur (e-mail invalide, ventes
suspendues, séjour refusé, panne) renvoyait le voyageur sur un tunnel vidé de sa
saisie, sans indiquer quel champ corriger ni quoi faire ensuite ; les dates
invalides étaient rejetées sans message.

**Après.**
- Contraintes de dates côté client **et** côté serveur :
  `min = aujourd'hui` (fuseau Paris), `max = +548 jours` (18 mois glissants),
  `arrivée < départ`, séjour ≤ 60 nuits, arrivée non passée. Chaque cas a son
  message : « La date d'arrivée doit précéder la date de départ. », « Ces dates
  sont déjà passées ou invalides. », « Ces dates sont trop lointaines… »,
  « Ce séjour dépasse 60 nuits… ».
- Erreurs localisées : chaque champ fautif porte `aria-invalid="true"` et
  `aria-describedby="erreur-<champ>"`, et `ChampErreur` rend le message dans un
  `<p role="alert" aria-live="assertive">` juste sous le champ.
- Valeurs conservées : l'action renvoie `fail(400, { valeurs, erreurs })` ;
  `valeurs.nom`/`valeurs.email` sont réinjectées dans les `value=`, et les
  dates/voyageurs restent dans l'URL (donc le devis est recalculé à l'identique).
- Erreur globale actionnable : bandeau `Alerte ton="danger"` (`role="alert"`)
  avec trois sorties : **Réessayer** (re-soumet le formulaire), **Revenir aux
  dates** (`#etape-1`) et **Consulter l'aide** (`/aide`). Le message est traduit
  à partir du code d'erreur serveur (`ERREUR_INATTENDUE`, `VENTES_SUSPENDUES`,
  `DEMANDE_REFUSEE`, …).

**Preuve.** Sonde HTTP : `POST /reserver?…` avec un e-mail invalide →
`400`, page rendue (99 Ko), `aria-invalid="true"`, `aria-describedby="erreur-email"`,
`value="Test Agent"` et `value="pas-un-email"` conservés, message
« Indiquez une adresse e-mail valide… ». `e2e/ergonomie-reservation.spec.ts`
rejoue le chemin **atteignable depuis un navigateur** : `a@b` passe la validation
native du champ `type="email"` mais pas la regex serveur, ce qui déclenche
l'erreur localisée, la conservation des valeurs et les sorties.

## 3. F-10 — alertes incohérentes

**Avant.** Mélange de `<p>` nus, de `role="status"` et de textes rouges sans
`role="alert"` ; un même incident pouvait être annoncé par un ton neutre.

**Après.** Une seule primitive, `Alerte` (jamais dupliquée dans
`components/ui/`), rendue avec le bon rôle : `role="alert"` pour `danger`,
`role="status"` sinon. Dans le tunnel : succès = `role="status"` sur fond
`bg-accent-douce` avec `text-accent-fonce` (contraste 6,49:1, et non
`text-accent` qui plafonne à 4,37:1), avertissements (ventes suspendues, site
indisponible) et erreur bloquante en `danger`. Sur la confirmation, l'échec de
paiement (`form?.message`) est aussi un `role="alert"` avec ses sorties.

**Preuve.** `specs/004` : aucun `text-accent` sur `bg-accent-douce`. Le tunnel et
la confirmation sont analysés par axe (`@axe-core/playwright`, WCAG 2.2 AA) dans
`e2e/confiance.spec.ts` : **0 violation** au total, à 1280 px comme à 390 px et
320 px (§ 4 mesure aussi 0 débordement). Le choix `text-accent-fonce` (6,49:1) est
donc tenu, là où `text-accent` plafonne à 4,37:1 sur `accent-douce`.

## 4. F-17 — consentement symétrique, aucune pression

**Avant.** Refuser le suivi demandait plus d'attention qu'accepter ; le risque
de case pré-cochée et de compte à rebours marketing existait sur les parcours
publics.

**Après (vérifié, sans modification de code hors périmètre).** Bandeau cookies
et page `/consentement` proposent deux actions de même poids
(`ui-bouton--secondaire` pour « Tout refuser » comme pour « Tout accepter »),
aucune case pré-cochée, aucun texte d'urgence. Le tunnel ne demande **aucun**
consentement marketing : il n'y a ni case à cocher pré-cochée, ni engagement,
ni délai artificiel. Les libellés de délai restent qualitatifs (« L'hôte
vérifie les disponibilités puis répond »), sans promesse chiffrée (le test
i18n interdit tout symbole monétaire et toute promesse de délai numérique).

**Preuve.** `e2e/confiance.spec.ts` : sur `/consentement`, les deux boutons
existent, sont de même classe, aucune case n'est cochée par défaut ; dans le
formulaire de demande, zéro `input[type=checkbox]` et aucune mention d'urgence.

## 5. F-06 — cibles tactiles

**Avant.** La carte de logement portait une pastille `ui-bouton--petit`
(36 px) comme seul point d'entrée perçu.

**Après (dans le tunnel).** Toute la carte est un lien (`<a class="block">` :
photo, nom, adresse, note), donc la cible tactile est la carte entière, pas le
libellé de 36 px ; les actions principales du tunnel utilisent `ui-bouton`
(44 px) en pleine largeur, et la barre d'action mobile du bas est construite sur
`BarreActionMobile` (zone sûre `ui-safe-bas`, hauteur `h-20` réservée pour ne
jamais masquer le contenu). Le reste de F-06 (pastilles de navigation, menu
staff) relève de T025/T079/T080 et n'est pas modifié ici.

**Preuve.** `e2e/ergonomie-reservation.spec.ts` : la carte entière est
cliquable, le bouton d'envoi est unique et visible à chaque largeur testée
(1280×720 et 390×844), la barre mobile ne recouvre pas le contenu.

---

## Ajustements de mise en œuvre (constatés en test)

- **Le récapitulatif de prix ne répète plus les inclusions.** `ResumePrix`
  accepte une liste `inclusions` : la lui passer affichait « Compris dans le
  prix » juste au-dessus de l'encart « Inclus dans votre demande », avec les
  mêmes phrases dans le même encart. Le tunnel ne lui transmet plus que les
  montants (`nuits`, `voyageurs`, `prixNuitCentimes`, `totalCentimes`,
  `taxeCentimes`) et garde une seule liste d'inclusions.
- **La validation native du champ e-mail passe avant l'erreur serveur.** Avec
  `type="email" required`, le navigateur refuse de poster « pas-un-email » : le
  message serveur (`EMAIL_INVALIDE`) n'est atteignable qu'avec une adresse
  native valide mais métier invalide (`a@b`), ce que rejoue
  `e2e/ergonomie-reservation.spec.ts`. Le code serveur reste vérifié par sonde
  HTTP directe (`POST` avec `pas-un-email` → `400` + `aria-invalid`).
- **Un 400 du tunnel est un rendu, pas un plantage.** Le POST refusé renvoie la
  page complète avec `role="alert"` ; Chromium journalise alors
  `Failed to load resource: … 400 (Bad Request)`. Ce message est filtré
  explicitement dans `e2e/support/reservation-demo.ts` (`erreursUtiles`), sans
  masquer les autres erreurs console.

---

## Ce qui n'est pas traité ici

- **Fiche logement (`/logement/[slug]`)** : la route n'existe pas dans la v2
  (seuls `/site/[slug]` et `/reserver` publient les logements). T083 (inclusions,
  taxe de séjour, délai de réponse) est donc appliqué au tunnel et à la
  confirmation, seul chemin voyageur existant aujourd'hui ; le détail par
  logement devra être repris quand la fiche sera créée.
- **Taxe de séjour** : affichée uniquement si le tenant a des paramètres
  fiscaux (`ObtenirParametresFiscaux`) et un montant > 0 ; sinon le tunnel et la
  confirmation disent explicitement qu'aucune taxe n'est paramétrée. Le montant
  n'est jamais ajouté au total de la réservation (le total reste les nuitées).
- **F-14 (mesure Lighthouse)** et **T007/T045/T057/T107 (tests utilisateurs)** :
  hors périmètre de cette tâche, voir le registre.
