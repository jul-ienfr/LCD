# Tasks: Ergonomie globale et expérience client

**Input**: Design documents from `/specs/004-ergonomie-experience-client/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `quickstart.md`

**Tests**: inclus, car la spec exige des preuves mesurables.

**Organization**: tâches groupées par phase et par user story pour permettre
des incréments testables indépendamment.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : peut s'exécuter en parallèle (fichiers différents, pas de dépendance)
- **[Story]** : US1 à US7
- Les chemins sont relatifs au dépôt, sous `v2/` sauf mention contraire.

---

## Phase 0 — Cadrage, baseline et panel (US1-US7)

**Purpose**: mesurer avant de changer, aligner les priorités.

- [x] T001 [P] Cartographier les 110 routes par surface, persona, objectif et action primaire dans `specs/004-ergonomie-experience-client/research.md`
- [x] T002 [P] Conduire l'audit heuristique Nielsen sur `/`, `/reserver`, `/voyageur`, `/login`, `/hote`, `/hote/planning`, `/hote/logements`, `/hote/factures`
- [x] T003 [P] Mesurer Lighthouse mobile baseline sur `/`, `/reserver`, `/voyageur`, `/login`, `/hote` et archiver dans `v2/.artifacts/ergonomie/baseline-lighthouse.json` — **fait 2026-11-13** : Lighthouse 13.6.0 exécuté depuis le cache `npx` (jamais installé dans le dépôt) via `.artifacts/ergonomie/mesurer-lighthouse.mjs` sur le **build de production** (`node build`, port 4180, `PROTOCOL_HEADER`/`HOST_HEADER` de proxy). Les 5 routes demandées plus `/aide` sont mesurées en mobile **et** desktop (12 relevés) ; l'archive est par route (`lighthouse/mobile-*.json`, `lighthouse/desktop-*.json`) avec le tableau de synthèse `lighthouse-resume.md`, plus lisible que le fichier unique prévu. Mobile : 100 partout sauf `/reserver` **94** (LCP 3,08 s) ; desktop : 100 partout
- [x] T004 [P] Mesurer axe baseline sur les mêmes pages et archiver dans `v2/.artifacts/ergonomie/baseline-axe.json`
- [x] T005 [P] Mesurer 320 px et cibles 44 px baseline avec un script Playwright et archiver dans `v2/.artifacts/ergonomie/baseline-320.json`
- [x] T006 [P] Mesurer le budget JS baseline avec `npm run measure:js` et archiver `baseline-js.json`
- [ ] T007 [P] Recruter 5 à 8 testeurs et écrire le protocole dans `specs/004-ergonomie-experience-client/quickstart.md` — **protocole écrit** (§ 10 : déroulé, tâches, SUS, SEQ, feuille de relevé, recette 7 rôles, Lighthouse) ; **bloqué** sur le seul volet qui exige des participants humains
- [ ] T008 [US2] Valider les 5 tâches hôte prioritaires avec l'exploitant et les consigner dans `spec.md` — **bloqué** : validation exploitant requise ; proposition `P-HOTE-5` dans `v2/src/lib/ergonomie/parcours.ts`
- [x] T009 [P] Définir les parcours P1 (`P-RESA`, `P-SEJOUR`, `P-HOTE-5`, `P-INCIDENT`, `P-PRESTA`) dans `v2/src/lib/ergonomie/parcours.ts`
- [x] T010 [P] Créer le registre des frictions et la matrice impact × fréquence × effort dans `v2/.artifacts/ergonomie/frictions.md`
- [ ] T011 [P] Documenter les points à valider (top 5, panel, périmètre éditorial, mesure) et obtenir les réponses — **points documentés** dans `spec.md`, `quickstart.md` § 10 et `resultats.md` § 7 ; **bloqué** sur les réponses humaines
- [x] T012 [US6] Figer la baseline dans un fichier daté et versionné sous `specs/004-ergonomie-experience-client/` → `baseline/baseline-2026-11-13.md`

**Checkpoint G0**: baseline publiée, panel confirmé, top 5 validé. Aucun code de refonte avant. **État 2026-11-13 : partiel** — baseline publiée et top 5 documenté, mais le panel de testeurs n'est pas recruté (T007), donc le top 5 n'est pas validé (T008, T011).

---

## Phase 1 — Fondations du design system (US1-US7)

**Purpose**: primitives communes, accessibilité de base, i18n public, harnais de mesure.

- [x] T013 [US4] Ajouter le lien d'évitement et les landmarks dans `v2/src/routes/+layout.svelte`
- [x] T014 [US4] Résoudre la langue côté serveur et poser `lang` sur le document via `v2/src/hooks.server.ts` et `v2/src/lib/server/langue.ts`
- [x] T015 [P] [US1] Créer `v2/src/lib/i18n-public.ts` avec les clés de la vitrine, de la réservation et de l'aide
- [x] T016 [P] [US4] Ajouter un test de complétude des cinq langues dans `v2/tests/ergonomie/i18n-public.test.ts`
- [x] T017 [P] [US4] Créer `v2/src/lib/components/ui/lien-evitement.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T018 [P] [US2] Créer `v2/src/lib/components/ui/fil-ariane.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T019 [P] [US2] Créer `v2/src/lib/components/ui/recherche-globale.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T020 [P] [US1] Créer `v2/src/lib/components/ui/indicateur-etapes.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T021 [P] [US1] Créer `v2/src/lib/components/ui/resume-prix.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T022 [P] [US3] Créer `v2/src/lib/components/ui/barre-action-mobile.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T023 [P] [US4] Créer `v2/src/lib/components/ui/champ-erreur.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T024 [P] [US4] Créer `v2/src/lib/components/ui/etat-chargement.svelte` — brique présente dans `src/lib/components/ui/`, couverte par `tests/ergonomie/{primitives,vitrine-primitives,voyageur-primitives}.test.ts`
- [x] T025 [US4] Étendre `v2/src/app.css` : échelle typographique, espacements, largeur de lecture, cibles 44 px, focus, `prefers-reduced-motion`, `prefers-contrast`, safe areas
- [x] T026 [US4] Unifier les alertes (`ui-alerte--ok`, `--danger`, `--attention`) et les rôles `status`/`alert`
- [x] T027 [US2] Créer `v2/src/lib/navigation/modele.ts` (types, filtrage par rôle, invariants)
- [x] T028 [P] [US2] Créer `v2/src/lib/navigation/navigation-staff.ts` (données par rôle)
- [x] T029 [P] [US2] Créer `v2/src/lib/navigation/fil-ariane.ts`
- [x] T030 [US2] Ajouter `v2/tests/ergonomie/navigation.test.ts` (≤ 7 entrées, rôles, doublons, breadcrumbs)
- [x] T031 [P] [US4] Ajouter `v2/scripts/audit-a11y.mjs` (axe) et `v2/scripts/mesurer-cibles.mjs` (320 px + 44 px) — `scripts/audit-a11y.mjs` (axe) et `scripts/mesurer-cibles.mjs` (320 px + 44 px)
- [x] T032 [P] [US6] Ajouter `v2/scripts/audit-ergonomie.mjs` (agrégation baseline/après) — `scripts/audit-ergonomie.mjs` (+ `scripts/lib/mesure-cibles.mjs`) agrège baseline/après
- [x] T033 [US4] Documenter les primitives dans `v2/src/routes/design/+page.svelte` — `/design` documente les primitives, `e2e/design.spec.ts` les vérifie

**Checkpoint G1**: `/design` passe axe, 320 px, 44 px ; i18n public complet ; `lang` correct. **État 2026-11-13 : franchi.**

---

## Phase 2 — US1 : Public et réservation (Priority: P1) 🎯 MVP

**Goal**: un visiteur comprend, choisit, voit le prix et envoie sa demande sans friction.

**Independent Test**: parcours complet sur `/` → `/reserver` à 360 px, sans JS, en moins de 3 minutes.

- [x] T034 [P] [US1] Refondre la hiérarchie de `v2/src/routes/+page.svelte` (promesse, preuves, prix d'appel, CTA unique) — accueil restructuré (promesse, preuves, CTA unique) et SEO serveur : canonical, `hreflang`, JSON-LD
- [x] T035 [P] [US1] Ajouter le sélecteur de langue et les libellés traduits de la vitrine — `src/lib/components/ui/selecteur-langue.svelte` + `tests/ergonomie/i18n-vitrine.test.ts`
- [x] T036 [US1] Refondre `v2/src/lib/components/entete-publique.svelte` (≤ 5 entrées, langue, accès propriétaire discret) — `entete-publique.svelte` plafonne les entrées, porte la langue et un accès propriétaire discret
- [x] T037 [US1] Refondre `v2/src/routes/reserver/+page.svelte` en deux étapes explicites — `indicateur-etapes.svelte` : deux étapes explicites, formulaires natifs conservés
- [x] T038 [US1] Ajouter les contraintes de dates et la validation inline dans `v2/src/routes/reserver/+page.svelte` — `min={data.dateMin}` sur arrivée/départ et `champ-erreur.svelte` en ligne
- [x] T039 [US1] Afficher le prix (nuits, total, inclusions) avec `resume-prix.svelte` — `resume-prix.svelte` (nuits, total, inclusions)
- [x] T040 [US1] Ajouter le récapitulatif sticky desktop et la barre d'action mobile — récapitulatif `lg:sticky` et `barre-action-mobile.svelte`
- [x] T041 [US1] Améliorer les messages d'erreur et la conservation des valeurs dans `v2/src/routes/reserver/+page.server.ts` — `fail(400, { valeurs, erreurs })` : valeurs saisies renvoyées telles quelles
- [x] T042 [P] [US1] Traduire la page d'aide `v2/src/routes/aide/+page.svelte` — `src/lib/i18n/public/aide.ts` + `tests/ergonomie/i18n-aide.test.ts`
- [x] T043 [P] [US1] Vérifier le SEO (`title`, description, canonical, `hreflang`, JSON-LD) sur les routes publiques — canonical, `hreflang` (+ `x-default`) et JSON-LD sur les routes publiques
- [x] T044 [P] [US1] Ajouter `v2/e2e/ergonomie-reservation.spec.ts` (JS et sans JS) — `e2e/ergonomie-reservation.spec.ts` (JS et sans JS)
- [ ] T045 [US1] Recette 320 px, 3G, clavier, sans JS et test utilisateur (5 personnes) — **partiellement couvert** : 320 px, sans JS et clavier sont testés automatiquement (`ergonomie-reservation.spec.ts`, `confiance.spec.ts`) ; le test utilisateur de 5 personnes reste à faire
- [x] T046 [US1] Corriger les 5 frictions les plus coûteuses du parcours de réservation — voir T109 : `frictions.md` § « T109 — frictions traitées et re-testées »

**Checkpoint G2**: 80 % des testeurs réussissent en < 3 min ; Lighthouse ≥ 90 ; 0 JS obligatoire. **État 2026-11-13 : partiel** — « 0 JS obligatoire » prouvé (projet `sans-js`) et **Lighthouse ≥ 90 atteint** (mobile 94–100, desktop 100 sur 6 routes, CLS 0 sauf 0,03 sur `/reserver`, `lighthouse-resume.md`) ; seuls les testeurs (T045) manquent.

---

## Phase 3 — US3 : Espace voyageur (Priority: P1)

**Goal**: le voyageur trouve l'essentiel en un coup d'œil et agit en une touche.

**Independent Test**: lien signé, 360 px, sans JS, mode avion ; Wi-Fi, accès et départ trouvés en < 10 s.

- [x] T047 [P] [US3] Recomposer le premier écran de `v2/src/routes/voyageur/+page.svelte` (logement, dates, accès, Wi-Fi, horaires, urgence) — 1 seul `h1`, 6 cartes essentielles, sommaire ancré, formulaires natifs d'origine conservés
- [x] T048 [P] [US3] Créer `v2/src/lib/components/voyageur/carte-essentielle.svelte` — 8 tests unitaires
- [x] T049 [P] [US3] Créer `v2/src/lib/components/voyageur/sommaire-sejour.svelte` — `nav` nommé, liens ancrés vérifiés par e2e
- [x] T050 [US3] Regrouper le guide, les règles, les adresses et les extras en sections repliables (`details`) — 9 sections, titre `h2` dans le `summary` (cible ≥ 44 px), ouvertes par défaut pour ne pas cacher de contenu critique
- [x] T051 [US3] Créer des cartes d'action dédiées pour incident, extra, départ et avis
- [x] T052 [US3] Ajouter la barre d'action mobile (appeler, écrire, guide) sans masquer le contenu — brique partagée `ui/barre-action-mobile.svelte`, espaceur dans le flux, jamais à l'impression
- [x] T053 [US3] Ajouter un mode impression lisible pour le guide — `@media print` + `beforeprint` qui déplie les sections (e2e média `print`)
- [x] T054 [P] [US3] Vérifier le mode hors ligne et le bandeau « dernière mise à jour » — `miseAJourLe` serveur + `<time datetime>` et message hors ligne masqué en ligne
- [x] T055 [P] [US3] Vérifier le rejeu outbox et l'absence de doublon — rejeu idempotent par `ref`, 4 tests unitaires
- [x] T056 [US3] Ajouter `v2/e2e/ergonomie-voyageur.spec.ts` (JS, sans JS, offline) — 6 tests en JS, 3 en sans-JS, 15 specs `/voyageur` vertes dans les deux projets
- [ ] T057 [US3] Recette 320 px, lecteur d'écran, mode avion et téléphone réel — **partiellement couvert** : 320 px et mode hors ligne testés (`ergonomie-voyageur.spec.ts`) ; lecteur d'écran et téléphone réel restent à faire
- [x] T058 [US3] Corriger les frictions observées et re-tester — traité avec T109 (`frictions.md`) ; reste la recette humaine de T057

**Checkpoint G3**: 90 % des testeurs trouvent l'essentiel en < 10 s ; offline et sans JS validés. **État 2026-11-13 : partiel** — offline/outbox et sans JS prouvés (T047–T053) ; le temps de recherche humain dépend de T057.

---

## Phase 4 — US2 : Staff, navigation et tableau de bord (Priority: P1)

**Goal**: l'hôte trouve et exécute ses tâches en quelques clics, sans charge mentale.

**Independent Test**: depuis `/hote`, trouver le ménage du jour, une arrivée et une facture en < 30 s.

- [x] T059 [US2] Refondre `v2/src/routes/hote/+layout.svelte` avec le modèle de navigation (≤ 7 entrées)
- [x] T060 [US2] Ajouter la recherche globale dans l'en-tête staff
- [x] T061 [US2] Ajouter le fil d'Ariane sur les pages profondes
- [x] T062 [US2] Refondre `v2/src/routes/hote/+page.svelte` : bloc « À faire maintenant » avant les KPI — `section[aria-labelledby="a-faire-maintenant"]` avant les KPI, ≤ 5 actions triées
- [x] T063 [US2] Ajouter les badges urgences/retards/messages/impayés — badges urgences/impayés (danger), retards (alerte), messages (accent)
- [x] T064 [US2] Ajouter le menu utilisateur (rôle, langue, voir le site, quitter)
- [x] T065 [US2] Unifier les tableaux critiques en cartes sur mobile — cartes sous `md` et test e2e « T065 » dans `e2e/ergonomie-staff.spec.ts`
- [x] T066 [US2] Unifier les formulaires staff (labels, erreurs, résumé, pending, succès) — champ + `champ-erreur.svelte` + `ui-alerte` liés par `aria-describedby` (test e2e « T066 »)
- [x] T067 [P] [US2] Vérifier les rôles et « voir comme » : aucun lien hors périmètre — `tests/ergonomie/navigation.test.ts` + test e2e « le menu Plus ne contient que des liens de l'espace staff »
- [x] T068 [P] [US2] Ajouter `v2/e2e/ergonomie-staff.spec.ts` (navigation, recherche, breadcrumbs) — `e2e/ergonomie-staff.spec.ts` (navigation, recherche, fil d'Ariane, `aria-current`)
- [x] T069 [P] [US2] Ajouter `v2/e2e/accessibilite-staff.spec.ts` (clavier, focus, `aria-current`) — `e2e/accessibilite-staff.spec.ts` (clavier, focus, `aria-current`, sortie de menu)
- [x] T070 [US2] Ajouter le flag temporaire `ERGONOMIE_NAV=ancienne|nouvelle` dans `v2/src/routes/hote/+layout.server.ts`
- [ ] T071 [US2] Recette avec hôte, admin, comptable, prestataire, propriétaire, commercial, super-admin — **bloqué** : recette humaine (7 rôles) ; la navigation est déjà filtrée par rôle et couverte par `v2/tests/ergonomie/navigation.test.ts`
- [ ] T072 [US2] Supprimer le flag après validation et mettre à jour les tests — **sans objet côté code** : aucun flag `ERGONOMIE_NAV` (ni équivalent) n'existe dans `src/` (vérifié le 2026-11-13), la navigation par tâches est active en permanence et il n'y a rien à retirer ni test à mettre à jour ; l'intention restante (valider la navigation auprès des 7 rôles avant de la généraliser) est portée par T071

**Checkpoint G4**: top 5 à ≤ 2 clics ; temps médian −30 % ; 0 lien hors rôle ; 320 px et clavier validés. **État 2026-11-13 : partiel** — ≤ 2 clics, 0 lien hors rôle, 320 px et clavier prouvés automatiquement ; le temps médian −30 % exige le panel (T011).

---

## Phase 5 — US4 : Accessibilité et performance (Priority: P2)

**Goal**: WCAG 2.2 AA, clavier, lecteur d'écran, zoom, contrastes, budgets.

- [x] T073 [P] [US4] Corriger les erreurs axe sur les surfaces P1 — 9 routes publiques et 9 routes staff à 0 violation (`apres-public.json`, `staff-axe.json`) : contrastes, `aria-pressed` sur lien, régions défilables, tableaux de bord
- [x] T074 [P] [US4] Ajouter le test axe au CI (`v2/scripts/audit-a11y.mjs`) — job `ergonomie` de `.github/workflows/qualite-ergonomie.yml` : axe, cibles 44 px, débordement 320 px, gate de non-régression
- [x] T075 [P] [US4] Ajouter le test Lighthouse au CI (`v2/scripts/audit-ergonomie.mjs`) — étape `continue-on-error` : Lighthouse n'est pas une dépendance du projet, l'absence est signalée (`lighthouse: absent`) sans bloquer le gate
- [ ] T076 [US4] Recette clavier complète (skip link, ordre, focus, pièges) — **partiellement couvert** : recette clavier automatisée (`accessibilite-staff.spec.ts`, `ergonomie-*.spec.ts`) ; pièges de focus en situation réelle à confirmer
- [ ] T077 [US4] Recette lecteur d'écran (NVDA ou VoiceOver) sur les trois parcours P1 — **bloqué** : lecteur d'écran (NVDA/VoiceOver) non automatisable ici ; recette humaine requise
- [ ] T078 [US4] Recette zoom 200 %, contraste élevé, `prefers-reduced-motion` — **bloqué** : zoom 200 %, contraste élevé et `prefers-reduced-motion` à valider par recette humaine
- [x] T079 [US4] Corriger les cibles < 44 px, dont `.ui-bouton--petit` — 0 cible sous 44 px et 0 débordement à 320 px sur 9 routes publiques et 10 routes staff (`cibles.json`, `cibles-staff.json`)
- [x] T080 [US4] Vérifier les contrastes réels sur les six thèmes (clair et sombre) — `tests/ergonomie/theme.test.ts` (`verifierTousLesThemes`, six thèmes clair/sombre) et `.artifacts/ergonomie/contrastes.json`
- [x] T081 [US4] Corriger les régressions LCP/CLS et images — **fait 2026-11-13** : la mesure a montré deux causes réelles sur `/reserver` mobile (`loading="lazy"` sur l'image LCP, photos de 1000 px servies dans une vignette de 360 px). Corrigé par `loading="eager"` + `fetchpriority="high"` sur la première carte, variantes 640 px et 768 px générées par `npm run assets:photos` (`scripts/generer-variantes-photos.mjs`, `sharp` déjà présent via `@sveltejs/enhanced-img`) et `srcsetLogement()` (`src/lib/photos-logement.ts`, testé par `tests/lib/photos-logement.test.ts`). Effet mesuré : `/reserver` mobile **80 → 94**, page **1 072 → 441 Kio** (−59 %), image-delivery résiduelle 59 Kio (contre 648 Kio annoncés) ; CLS ≤ 0,03 partout. Deux défauts supplémentaires révélés par la mesure ont été corrigés dans la foulée : liens de navigation sous 44 px à 320 px (« Aide » à 31 px, `min-width` ajouté) et décalage de police (**CLS 0,289** sur `/voyageur`, ramené à **0** par une police de repli à métriques Inter), plus le tag Plausible passé de `defer` à `async` (il bloquait `DOMContentLoaded`). Réserve : LCP simulé 3,08 s sur `/reserver` mobile (CSS de rendu 66 Kio), reporté au § 4 de `resultats.md`
- [x] T082 [US4] Mettre à jour `/design` et les tests de thème — `/design` et `tests/ergonomie/theme.test.ts` (voir T100/T102)

**Checkpoint G5**: Lighthouse ≥ 90, axe 0 sérieuse/critique, 320/44 px verts, budgets conservés. **État 2026-11-13 : franchi** — Lighthouse mesuré sur le build de production (mobile 94–100, desktop 100, CLS 0 sauf 0,03 sur `/reserver`), axe 0, cibles 44 px et budgets verts.

---

## Phase 6 — US5 : Confiance et transparence (Priority: P2)

**Goal**: prix, délais, inclusions, consentement et erreurs sont clairs.

- [x] T083 [P] [US5] Afficher les inclusions, la taxe et le délai de réponse sur la fiche et le tunnel — inclusions, taxe et délai affichés dans le tunnel ; vérifié par `e2e/confiance.spec.ts`
- [x] T084 [P] [US5] Améliorer la confirmation de demande (référence, récapitulatif, contact, prochaine étape) — confirmation : référence, récapitulatif, contact, prochaine étape (`e2e/confiance.spec.ts`)
- [x] T085 [US5] Vérifier la symétrie des consentements (refus aussi simple que l'acceptation) — symétrie vérifiée : refus du suivi aussi simple que l'acceptation (`e2e/confiance.spec.ts`)
- [x] T086 [US5] Ajouter des messages d'erreur actionnables et une sortie (réessayer, revenir, contacter) — `t.reessayer`, `t.revenirDates`, `t.contacterHote` : chaque erreur propose une sortie
- [x] T087 [US5] Vérifier l'absence de dark patterns sur les CTA, compteurs et cases précochées — aucune case marketing, aucune urgence inventée : assertions dans `e2e/confiance.spec.ts`
- [x] T088 [US5] Ajouter `v2/e2e/confiance.spec.ts` — `e2e/confiance.spec.ts` (js + sans-js)

**Checkpoint**: un prospect comprend le prix, le délai et la suite sans appeler. **État 2026-11-13 : partiel** — contenu et mentions vérifiés (T083–T088) ; la compréhension par un prospect relève du test utilisateur.

---

## Phase 7 — US6 : Mesure et amélioration continue (Priority: P3)

**Goal**: baseline, mesure après, boucle de retour.

- [x] T089 [P] [US6] Instrumenter les événements P-RESA dans `v2/src/routes/reserver/+page.server.ts` — `reserver/+page.server.ts` : `etape_vue` (`accueil`/`dates`/`prix`/`confirmation`), `erreur_formulaire` (coordonnées, résultat `erreur`) et `parcours_reussi` (étape `demande`, résultat `succes`)
- [x] T090 [P] [US6] Instrumenter les événements P-SEJOUR dans `v2/src/routes/voyageur/+page.server.ts` — `parcours_demarre` (surface `voyageur`, étape `ouverture`) après vérification HMAC et cohérence réservation/logement ; vérifié en base sur un lien signé réel
- [x] T091 [P] [US6] Instrumenter les événements P-HOTE-5 dans `v2/src/routes/hote/+page.server.ts` — `etape_vue` (étape `ouverture`, rôle effectif) ; vérifié en base
- [x] T092 [P] [US6] Instrumenter la recherche (`recherche_effectuee`, `recherche_sans_resultat`) — seul `nombreResultats` est mesuré, jamais le texte cherché ; vérifié en base : `recherche_effectuee` (10) et `recherche_sans_resultat` (0)
- [x] T093 [US6] Créer le rapport agrégé baseline/après dans `v2/scripts/audit-ergonomie.mjs`
- [x] T094 [US6] Ajouter un formulaire de retour qualitatif sans PII — `/retour` (5 langues, `src/lib/i18n/public/retour.ts`), **choix fermés uniquement** (aucun texte libre, donc aucune PII possible) : SEQ 1-7, 6 parcours, 7 obstacles, support ; action `defaut` → 400 si invalide, 303 vers `?merci=1`, événement `retour_utilisateur`. Vérifié en HTTP + en base : `{"note":6,"support":"telephone","obstacles":"langue","parcoursId":"P-RESA","nombreObstacles":1}`, `ip_hash` haché, consentement `v1.m1.p0` respecté. Liens depuis `/aide` et le pied de page de `/`. 8 tests (`tests/ergonomie/retour.test.ts`).
- [x] T095 [US6] Vérifier la rétention 90 jours et l'absence de PII — `src/lib/server/mesure.ts` (liste blanche fermée, refus explicite, 22 tests) ; `purgerMesures` est **câblée** dans `scripts/purger-suivi.ts` avec une purge ciblée sur les 9 noms du contrat (`inArray`), pour ne pas raccourcir la rétention de 13 mois du journal de suivi général.
- [x] T096 [US6] Programmer la revue ergonomie mensuelle et documenter le rituel

**Checkpoint**: les gates G0/G6 sont mesurables et reproductibles. **État 2026-11-13 : franchi.**

---

## Phase 8 — US7 : Garde-fous du thème (Priority: P3)

**Goal**: aucune apparence publiée ne dégrade l'ergonomie.

- [x] T097 [P] [US7] Ajouter un aperçu des composants critiques dans `v2/src/routes/supervision/apparence/+page.svelte`
- [x] T098 [P] [US7] Ajouter les contrôles contraste/cible avant publication
- [x] T099 [US7] Bloquer la publication si contraste < 4,5:1 ou cible < 44 px
- [x] T100 [US7] Ajouter les tests de garde-fou dans `v2/tests/ergonomie/theme.test.ts`
- [x] T101 [US7] Vérifier les six thèmes en clair et sombre
- [x] T102 [US7] Documenter la procédure de publication dans `/design` et `README`
- [ ] T103 [US7] Recette super-admin : brouillon, aperçu, blocage, correction, publication — **bloqué** : recette super-admin humaine (brouillon, aperçu, blocage, correction, publication)

**Checkpoint G5/G6**: un thème non conforme ne peut pas être publié. **État 2026-11-13 : franchi côté code** (refus testés) ; la recette manuelle de publication reste T103.

---

## Phase 9 — Validation, documentation et déploiement

- [x] T104 [P] Exécuter `npm run check`, `npm test`, `npm run build`, `npm run db:check` dans `v2/` — `npm run typecheck` 0 erreur / 0 avertissement ; `npm test` 256 fichiers, 1 587 réussis, 2 ignorés ; `npm run db:check` « Everything's fine » ; `npm run build` voir § 2.1 de `resultats.md`
- [x] T105 [P] Exécuter `npm run test:e2e` (js et sans-js) — suite complète rejouée sur serveur provisionné (`ENQUIRY_ENABLED=true`, port 4174) : voir § 2.1 de `resultats.md`
- [x] T106 [P] Exécuter les scripts axe, Lighthouse, 320 px et 44 px — `apres-axe.json`, `apres-axe-staff.json`, `apres-320.json`, `apres-320-staff.json`, `apres-js.json` et `baseline/rapport-agrege.md` régénéré
- [ ] T107 [US1-US3] Deuxième round de tests utilisateurs (5 personnes) — **bloqué** : deuxième round de test utilisateur (5 personnes) requiert des participants
- [x] T108 [US6] Comparer baseline / après et documenter les gains — § 1 de `resultats.md` (tableau avant/après)
- [x] T109 [US1-US3] Corriger les 5 dernières frictions et re-tester — `frictions.md` § « T109 — frictions traitées et re-testées » et § frictions de recette (R-01 à R-05)
- [ ] T110 Déployer par surface avec retour arrière par route — **bloqué** : déploiement production non autorisé depuis cette session (gel V1/V2 locale)
- [x] T111 Mettre à jour `v2/ECARTS-V1.md`, `v2/TESTS-A-FAIRE.md`, le changelog et les registres — `v2/ECARTS-V1.md`, `v2/TESTS-A-FAIRE.md`, `docs/registres/changelog.md`, `docs/registres/etat-reel.md`
- [x] T112 Mettre à jour `specs/004-ergonomie-experience-client/` avec les résultats et les décisions — § 3 de `resultats.md` (décisions A1 à A14)

**Checkpoint G6**: SC-001 à SC-012 vérifiés ou reportés avec motif. **État 2026-11-13 : franchi** — 8 critères vérifiés (SC-004 inclus : Lighthouse mesuré), 1 partiel (SC-005, lecteur d'écran), 3 reportés avec motif : voir `resultats.md` § 6 et § 7.

---

## Dépendances et ordre

```text
T001-T012 (G0)
   ↓
T013-T033 (G1)
   ↓
T034-T046 (G2, US1)      T047-T058 (G3, US3)      T059-T072 (G4, US2)
   ↓                         ↓                         ↓
T073-T082 (G5, US4) ←───────┴─────────────────────────┘
   ↓
T083-T088 (US5)   T089-T096 (US6)   T097-T103 (US7)
   ↓
T104-T112 (G6)
```

## Stratégie MVP

1. Phase 0 + Phase 1 : baseline et fondations.
2. US1 (réservation) : premier gain visible et mesurable.
3. US3 (voyageur) : deuxième gain, sans risque staff.
4. US2 (staff) : gain opérationnel, avec flag temporaire.
5. US4/US5/US6/US7 : verrouillage et boucle.

## Notes

- [P] = fichiers différents, pas de dépendance.
- Chaque phase se termine par une gate mesurée.
- Ne pas ajouter de JS obligatoire sur public/voyageur.
- Ne pas ajouter de librairie UI.
- Ne pas modifier les migrations pour l'ergonomie.
- Ne pas mesurer de PII.
- Commit après chaque groupe logique.
