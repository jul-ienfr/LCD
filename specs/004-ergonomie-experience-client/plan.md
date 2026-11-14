# Implementation Plan: Ergonomie globale et expérience client

**Branch**: `004-ergonomie-experience-client` | **Date**: 2026-11-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-ergonomie-experience-client/spec.md`

## Summary

Refonte de l'ergonomie des surfaces clientes de la V2 sans ajouter de fonction
métier : navigation staff par tâches, tableau de bord actionnable, tunnel de
réservation clarifié, espace voyageur hiérarchisé, dictionnaire public en cinq
langues, accessibilité WCAG 2.2 AA et mesure avant/après. La démarche suit les
dix étapes de l'ergonomie de conception et se déploie en sept phases, avec des
gates mesurables. Aucun JavaScript obligatoire n'est ajouté sur le public et le
voyageur ; aucune migration DB n'est nécessaire en phase 1.

## Technical Context

**Language/Version**: TypeScript 6.0 / SvelteKit 3.1 / Svelte 5.57

**Primary Dependencies**: SvelteKit 3, Svelte 5, Vite 8, Tailwind 4, Better Auth
1.7, Drizzle 0.45, PostgreSQL, `pdf-lib`, `nodemailer` (inchangés)

**Storage**: PostgreSQL existant ; pas de nouvelle table en phase 1. Les mesures
utilisent les événements/journal existants ou des agrégats anonymes.

**Testing**: Vitest 5, Playwright 1.64 (projets `js` et `sans-js`), axe-core
(dev), Lighthouse (dev/CI), scripts 320 px et cibles 44 px.

**Target Platform**: Navigateur mobile et desktop, Node 24 (adapter-node),
PWA/offline existante, mode lite L0-L3.

**Project Type**: Application web multi-tenant, monorepo `v2/`.

**Performance Goals**: LCP < 2,5 s et CLS < 0,1 sur mobile 3G ; JS voyageur
< 50 Ko gzip, staff < 200 Ko ; 0 Ko obligatoire sur public/voyageur.

**Constraints**: HTML-first, `csr = false` sur public/voyageur, un seul thème
global, 5 langues, 320 px, cibles ≥ 44 px, WCAG 2.2 AA, aucune librairie UI
supplémentaire, aucune mesure avec PII.

**Scale/Scope**: 110 routes Svelte, 5 surfaces clientes, 7 rôles, 5 langues,
1 personne à temps partiel, environ 10 à 12 semaines.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Statut | Note |
|---|---|---|
| I. Périmètre V2 uniquement | ✅ PASS | Toutes les modifications sont dans `v2/` |
| II. HTML-first et domaine pur | ✅ PASS | Aucun JS obligatoire ajouté ; composants serveur natifs |
| III. Sécurité et isolation tenant | ✅ PASS | Navigation filtrée par rôle ; aucune donnée client dans les mesures |
| IV. Qualité vérifiable | ✅ PASS | Tests, contrats, mesures et plan de retrait par composant |
| V. Accessibilité et i18n progressif | ✅ PASS | WCAG 2.2 AA, 5 langues, `lang` serveur, repli français |

**Verdict** : PASS — aucune violation. Les dépendances axe/Lighthouse sont des
outils de développement, pas des dépendances d'exécution.

## Design Principles

1. **Tâche d'abord** : chaque écran a un objectif utilisateur et une action
   primaire, pas une collection de fonctions.
2. **Une décision par écran** : un seul CTA primaire, les options secondaires
   sont discrètes.
3. **Reconnaissance plutôt que mémorisation** : navigation par domaines,
   recherche, fil d'Ariane, libellés explicites.
4. **Divulgation progressive** : l'essentiel au premier écran, le détail dans
   des sections repliables ou des pages dédiées.
5. **Cohérence** : mêmes composants, mêmes mots, mêmes états partout.
6. **Feedback immédiat** : chaque action dit ce qui se passe, ce qui a réussi
   ou ce qu'il faut corriger.
7. **Prévention et récupération** : contraintes de saisie, confirmation des
   actions destructives, messages actionnables, retour possible.
8. **Accessible par défaut** : clavier, lecteur d'écran, contraste, cibles,
   zoom, mouvement réduit.
9. **Mobile-first et frugal** : 320 px, 3G, vieux téléphone, sans JS.
10. **Confiance** : prix, délais, inclusions, contact et consentement clairs.

## Project Structure

### Documentation (this feature)

```text
specs/004-ergonomie-experience-client/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── ergonomie.md
│   ├── navigation.md
│   └── mesure.md
├── checklists/
│   └── ergonomie.md
└── tasks.md
```

### Source Code (repository root)

```text
v2/src/
├── app.html                         # lang initial, métadonnées
├── app.css                          # tokens, primitives, cibles, focus
├── hooks.server.ts                  # résolution langue + transformPageChunk
├── lib/
│   ├── i18n-public.ts               # nouveau dictionnaire public 5 langues
│   ├── navigation/
│   │   ├── modele.ts                # modèle pur (domaines, tâches, rôles)
│   │   ├── navigation-staff.ts      # données de navigation par rôle
│   │   └── fil-ariane.ts            # dérivation du fil d'Ariane
│   ├── ergonomie/
│   │   ├── criteres.ts              # seuils et contrôles
│   │   └── parcours.ts              # définition des parcours mesurés
│   ├── components/
│   │   ├── ui/
│   │   │   ├── lien-evitement.svelte
│   │   │   ├── fil-ariane.svelte
│   │   │   ├── recherche-globale.svelte
│   │   │   ├── indicateur-etapes.svelte
│   │   │   ├── resume-prix.svelte
│   │   │   ├── barre-action-mobile.svelte
│   │   │   ├── champ-erreur.svelte
│   │   │   └── etat-chargement.svelte
│   │   └── voyageur/
│   │       ├── sommaire-sejour.svelte
│   │       └── carte-essentielle.svelte
│   └── server/
│       └── langue.ts                # langue depuis URL/cookie, sans JS
├── routes/
│   ├── +layout.svelte               # skip link, langue, bandeaux
│   ├── +page.svelte                 # vitrine
│   ├── reserver/+page.svelte        # tunnel en 2 étapes
│   ├── voyageur/+page.svelte        # premier écran + sommaire
│   ├── aide/+page.svelte            # aide contextuelle
│   ├── hote/+layout.svelte          # navigation par tâches
│   ├── hote/+page.svelte            # tableau de bord actionnable
│   └── supervision/apparence/+page.svelte
├── tests/ergonomie/                 # Vitest (modèle, i18n, critères)
├── e2e/
│   ├── ergonomie.spec.ts
│   ├── accessibilite.spec.ts
│   └── tactile-320.spec.ts
└── scripts/
    ├── audit-a11y.mjs               # axe + parcours
    └── mesurer-cibles.mjs           # 320 px + 44 px
```

**Structure Decision**: Aucun nouveau projet. Les ajouts sont des modules
`lib/` et des composants Svelte serveur dans l'architecture existante. Les
routes et contrats existants sont conservés.

## Phase 0 — Cadrage, baseline et panel (semaine 1)

**Objectif** : mesurer l'existant et aligner les priorités avant de toucher au
code.

- Cartographier les 110 routes par surface, persona, objectif et action
  primaire ; identifier les routes orphelines et les doublons de libellé.
- Conduire un audit heuristique (Nielsen) sur `/`, `/reserver`, `/voyageur`,
  `/login`, `/hote`, `/hote/planning`, `/hote/logements`, `/hote/factures`.
- Mesurer la baseline : Lighthouse mobile, axe, 320 px, cibles 44 px, budget JS,
  LCP/CLS sur 3G simulée.
- Recruter 5 à 8 testeurs (hôte, voyageur, prestataire, prospect) et écrire le
  protocole de test de 30 minutes.
- Définir les 5 tâches hôte prioritaires avec l'exploitant.
- Ouvrir un registre des frictions et prioriser par impact × fréquence × effort.

**Livrables** : baseline chiffrée, cartographie, protocole, backlog priorisé.

**Gate G0** : baseline publiée et panel confirmé. Aucun code de refonte avant.

## Phase 1 — Fondations du design system (semaines 2-3)

**Objectif** : poser les primitives et les contrôles qui rendent les phases
suivantes rapides et cohérentes.

- Étendre `app.css` : échelle typographique, espacements, largeurs de lecture,
  cibles minimales 44 px, focus, `prefers-reduced-motion`,
  `prefers-contrast`, `safe-area-inset`.
- Ajouter le lien d'évitement dans `+layout.svelte`, les landmarks et la
  résolution serveur de `lang` (`hooks.server.ts` + `lib/server/langue.ts`).
- Créer les primitives manquantes : fil d'Ariane, indicateur d'étapes, résumé
  de prix, barre d'action mobile, erreur de champ, état de chargement.
- Unifier les alertes : une seule nomenclature (`ui-alerte--ok`,
  `ui-alerte--danger`, `ui-alerte--attention`), `role="status"` ou
  `role="alert"` selon le cas.
- Créer `i18n-public.ts` : dictionnaire typé fr/en/es/it/de, contrôle de
  complétude, helper de formatage `Intl`.
- Brancher le harnais de mesure : axe, Lighthouse, script 320 px/44 px,
  captures Playwright.
- Documenter chaque primitive dans `/design`.

**Fichiers principaux** : `v2/src/app.css`, `v2/src/routes/+layout.svelte`,
`v2/src/hooks.server.ts`, `v2/src/lib/i18n-public.ts`,
`v2/src/lib/components/ui/*`, `v2/src/routes/design/+page.svelte`.

**Gate G1** : `/design` passe axe, 320 px et 44 px ; le dictionnaire public est
complet dans les cinq langues ; `lang` est correct sur une page test.

## Phase 2 — Public et réservation (semaines 4-6)

**Objectif** : rendre l'acquisition et la demande de séjour évidentes.

- Refondre la vitrine : hiérarchie, preuve de confiance, prix d'appel, un CTA
  primaire, sélecteur de langue, accès voyageur/propriétaire discret.
- Refondre `/reserver` en deux étapes explicites :
  1. dates + voyageurs → prix et disponibilité ;
  2. coordonnées → récapitulatif → envoi.
- Ajouter contraintes de dates (`min`, `max`, départ > arrivée), validation
  inline, résumé d'erreurs, conservation des valeurs.
- Afficher le prix (nuits, total, taxe/extras à venir) et le délai de réponse.
- Ajouter une barre d'action mobile non masquante et un récapitulatif sticky
  desktop.
- Traduire la vitrine, la réservation et l'aide dans les cinq langues.
- Vérifier SEO (`title`, description, canonical, `hreflang`, JSON-LD) et
  performance (image LCP, pas de JS).
- Recette : parcours complet sans JS, 320 px, 3G, clavier.

**Fichiers principaux** : `v2/src/routes/+page.svelte`,
`v2/src/routes/reserver/+page.svelte`,
`v2/src/routes/reserver/+page.server.ts`,
`v2/src/routes/aide/+page.svelte`,
`v2/src/lib/components/entete-publique.svelte`,
`v2/src/lib/components/ui/resume-prix.svelte`,
`v2/src/lib/components/ui/indicateur-etapes.svelte`.

**Gate G2** : 80 % des testeurs terminent la demande en < 3 min ; 0 erreur
critique ; Lighthouse mobile ≥ 90 ; 0 JS obligatoire.

## Phase 3 — Espace voyageur (semaines 6-7)

**Objectif** : répondre aux questions du séjour en un coup d'œil.

- Recomposer le premier écran : logement, dates, accès, Wi-Fi, horaires,
  urgence, contact, action de départ.
- Ajouter un sommaire de séjour et des sections repliables (`details`) pour le
  guide, les règles, les adresses et les extras.
- Mettre les actions rares mais importantes (incident, départ, avis) dans des
  cartes dédiées avec état et délai.
- Ajouter une barre d'action mobile (appeler, écrire, guide) et un mode
  impression lisible.
- Vérifier le mode hors ligne, le rejeu outbox et le bandeau honnête.
- Recette : 320 px, sans JS, mode avion, lecteur d'écran.

**Fichiers principaux** : `v2/src/routes/voyageur/+page.svelte`,
`v2/src/lib/components/voyageur/*`, `v2/src/lib/i18n.ts`.

**Gate G3** : 90 % des testeurs trouvent Wi-Fi/accès/départ en < 10 s ;
informations lisibles hors ligne ; aucune régression outbox.

## Phase 4 — Staff : navigation, tableau de bord et recherche (semaines 8-10)

**Objectif** : réduire le temps de tâche et la charge mentale de l'exploitation.

- Créer `lib/navigation/modele.ts` et `navigation-staff.ts` : domaines,
  tâches, rôles, priorités, raccourcis, breadcrumbs.
- Refaire `hote/+layout.svelte` : au plus 7 entrées principales, groupes
  secondaires nommés, recherche globale, menu utilisateur, langue, sortie.
- Refaire `hote/+page.svelte` : bloc « À faire maintenant » (urgences, retards,
  arrivées/départs, tâches assignées), puis KPI.
- Ajouter le fil d'Ariane sur les écrans profonds et `aria-current` partout.
- Unifier les tableaux : cartes sur mobile, en-tête sticky, filtres, pagination
  et annonce du défilement pour les tableaux secondaires.
- Unifier les formulaires : labels, autocomplete, erreurs inline, résumé,
  pending, succès.
- Ajouter la recherche globale (référence, logement, voyageur, facture) en
  réutilisant `/hote/recherche` et les repositories existants.
- Vérifier les rôles : hôte, admin, comptable, prestataire, propriétaire,
  commercial, super-admin ; « voir comme » recalculé.
- Prévoir un flag serveur temporaire `ERGONOMIE_NAV=ancienne|nouvelle` pour
  comparer et revenir en arrière pendant la phase.

**Fichiers principaux** : `v2/src/routes/hote/+layout.svelte`,
`v2/src/routes/hote/+page.svelte`, `v2/src/routes/hote/+layout.server.ts`,
`v2/src/lib/i18n-nav.ts`, `v2/src/lib/navigation/*`,
`v2/src/lib/components/ui/fil-ariane.svelte`,
`v2/src/lib/components/ui/recherche-globale.svelte`.

**Gate G4** : top 5 des tâches à ≤ 2 clics ; temps médian −30 % ; 0 lien hors
rôle ; navigation utilisable à 320 px et au clavier.

## Phase 5 — Accessibilité, performance et thème (semaines 10-11)

**Objectif** : verrouiller les exigences transverses.

- Corriger les résultats axe sur les surfaces P1 ; ajouter les tests au CI.
- Recette clavier complète, lecteur d'écran (NVDA ou VoiceOver), zoom 200 %.
- Vérifier les contrastes réels sur les six thèmes et en sombre.
- Vérifier les cibles 44 px sur les contrôles fréquents, y compris
  `.ui-bouton--petit`.
- Mesurer LCP/CLS, images, polices, JS ; corriger les régressions.
- Ajouter les garde-fous de publication dans
  `supervision/apparence` : contraste, cibles, aperçu des composants critiques.
- Mettre à jour `/design` et la documentation.

**Gate G5** : Lighthouse ≥ 90 partout, axe 0 sérieuse/critique, 320 px et 44 px
verts, budgets JS conservés, publication de thème bloquée si non conforme.

## Phase 6 — Validation, déploiement et boucle (semaine 12)

**Objectif** : prouver le gain et installer l'amélioration continue.

- Deuxième round de tests utilisateurs (5 personnes) sur les parcours P1.
- Comparer baseline et après : temps, réussite, erreurs, SEQ/SUS, abandons.
- Corriger les 5 frictions les plus coûteuses, puis re-tester.
- Déployer par surface (public, voyageur, staff) avec retour arrière par route.
- Mettre à jour `ECARTS-V1.md`, `TESTS-A-FAIRE.md`, le changelog et les
  registres.
- Programmer une revue ergonomie mensuelle (mesures + retours).

**Gate G6** : SC-001 à SC-012 vérifiés ou explicitement reportés avec motif.

## Testing Strategy

### Automatisé

- **Vitest** : modèle de navigation, filtrage par rôle, fil d'Ariane,
  complétude i18n, calculs de prix, critères ergonomiques.
- **Playwright `js`** : parcours public, réservation, voyageur, staff,
  recherche, formulaires, états d'erreur.
- **Playwright `sans-js`** : parcours complet public/voyageur, POST natifs,
  absence d'hydratation critique.
- **axe-core** : `/`, `/reserver`, `/voyageur`, `/login`, `/hote`, `/design`.
- **Lighthouse** : mobile sur les mêmes pages, seuils ≥ 90.
- **Script 320 px / 44 px** : six surfaces, contrôle positif obligatoire.
- **Captures** : snapshots visuels des écrans P1 en clair/sombre, 320/768/1440.

### Manuel

- Clavier seul, ordre de tabulation, skip link, focus après erreur.
- Lecteur d'écran (NVDA/VoiceOver) sur les trois parcours P1.
- Zoom 200 %, contraste élevé, `prefers-reduced-motion`.
- Téléphone réel (Android ancien et iPhone SE) : 3G, mode avion, offline.
- Test utilisateur : 5 à 8 personnes, tâches chronométrées, observation.

### Non-régression

- Suites existantes : `public`, `sans-js`, `apparence`, `super-admin`,
  `experience-voyageur`, `reservation-directe`, `auth`, `deux-facteurs`.
- `npm run check`, `npm test`, `npm run build`, `npm run db:check`,
  `npm run test:e2e`.

## Rollout et retour arrière

1. Déployer d'abord la phase 1 (fondations) sans changement visible majeur.
2. Déployer le public/réservation, mesurer, corriger.
3. Déployer le voyageur, mesurer, corriger.
4. Déployer le staff derrière `ERGONOMIE_NAV` temporaire, comparer, puis
   supprimer le flag.
5. Conserver les anciens composants jusqu'à validation de la phase suivante.
6. En cas de régression : revenir à la route ou au composant précédent, pas de
   rollback global.

## Risks & Mitigations

| Risque | Parade |
|---|---|
| Refonte cosmétique sans gain | Mesures baseline/après et tests utilisateurs à chaque gate |
| Dette de traduction | Dictionnaire typé, contrôle CI, textes courts |
| Navigation staff déroutante | Groupes stables, recherche, double libellé temporaire, test |
| Régression performance | Aucun JS ajouté, budget mesuré, images et polices surveillées |
| Accessibilité partielle | axe + clavier + lecteur d'écran + zoom à chaque phase |
| Thème non conforme | Garde-fous de publication, aperçu des composants critiques |
| Scope creep | Toute fonctionnalité métier sort de la feature |
| Mesure intrusive | First-party, anonyme, pas de PII, consentement respecté |

## Complexity Tracking

> Aucune violation de constitution — section non applicable.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|---|---|---|
| — | — | — |

## Dependencies

- Phase 1 dépend de la baseline G0.
- Phase 2 dépend des primitives et du dictionnaire public.
- Phase 3 dépend du dictionnaire public et des composants voyageur.
- Phase 4 dépend du modèle de navigation et des primitives.
- Phase 5 dépend des phases 2-4.
- Phase 6 dépend de toutes les gates précédentes.

## Out of Scope

- Nouvelles fonctions métier, nouveaux fournisseurs, nouvelle facturation.
- Application mobile native.
- Refonte de marque ou ajout de thèmes.
- Analytics tiers, tests A/B externes, personnalisation par utilisateur.
- Traduction NL/PT.
- Migration DB en phase 1.
