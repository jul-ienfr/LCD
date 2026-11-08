# ADR 008 — Stack frontend v2 : SvelteKit 3

- Statut : accepté
- Date : 2026-10-25
- Portée : la v2 elle-même, **sans v3 séparée**
- Remplace : Next.js 16 pour la couche UI de la v2
- Conservé : domaine, application, infrastructure, Drizzle, PostgreSQL, Tailwind 4

## Contexte

La v2 utilise Next.js 16.4, React 19.3 et Tailwind 4.3. Elle fonctionne, mais
la refonte intégrale (6 thèmes, composants, coquilles, 111 pages) est le bon
moment pour choisir la stack qui maximisera le design, la performance et le
mode dégradé pour les cinq prochaines années.

Contraintes non négociables :

1. HTML-first : les parcours publics et voyageur fonctionnent sans JavaScript.
2. Budget JS : voyageur < 50 Ko gzip (plancher Next assumé 180,3 Ko),
   staff < 200 Ko.
3. Formulaires, tableaux, auth, 2FA, PWA, offline, PDF, e-mails.
4. Un seul thème global, super-admin only.
5. Domaine pur, ports/adapters, migrations expand/contract.

## Décision

**SvelteKit 3.1 + Svelte 5.57 + Vite 8.3 + Tailwind CSS 4.3**, rendu Node
(`@sveltejs/adapter-node`), **Better Auth 1.7** pour l'authentification,
**Drizzle ORM 0.45 + PostgreSQL** pour la persistance, **Vitest 5** et
**Playwright 1.64** pour les tests.

La conversion se fait **dans `v2/`**, pas dans un dossier v3. L'ancienne UI
Next reste temporairement dans `src/app/` comme référence exclue du build ;
`src/routes/` devient la seule UI active. `src/app/` est supprimée à parité.

Trois profils de rendu dans une seule application :

| Surface | Rendu | JS client | Dégradé |
|---|---|---|---|
| Public (vitrine, aide, légales, réserver) | `prerender` + SSR | `csr = false` | Liens et formulaires natifs |
| Voyageur (guide, questionnaire, police) | SSR | `csr = false` | Formulaires POST natifs, offline = amélioration |
| Staff (74 écrans) | SSR + hydratation | oui, îlots Svelte | Toutes les actions critiques en `<form method="POST">` |
| Pages token (contrat, facture) | SSR | `csr = false` | Impression, liens natifs |

## Pourquoi SvelteKit

- **Form actions natives** : `+page.server.ts` + `<form method="POST">`
  fonctionnent sans JS ; `use:enhance` ajoute le confort quand JS est présent.
  C'est exactement la règle HTML-first du projet, sans code spécifique.
- **Runtime minimal** : Svelte compile, pas de Virtual DOM ; les budgets
  voyageur/staff sont plus faciles à tenir qu'avec React.
- **Plafond design identique** : Tailwind 4, CSS custom properties, View
  Transitions, container queries, `:has()`, animations natives. Le framework
  ne limite pas la direction artistique.
- **Un seul déploiement** : adapter-node dans le Docker/VPS existant, pas de
  second runtime ni de second front.
- **Écosystème 2026 mature** : SvelteKit 3.1, Svelte 5.57, Vite 8.3,
  Better Auth 1.7, Drizzle 0.45 sont tous stables.

## Pourquoi pas les autres

| Option | Raison du refus |
|---|---|
| **Astro 7 + îlots Svelte** | Meilleur pour une vitrine 100 % zéro JS, mais 74 écrans de gestion avec formulaires/tableaux riches rendent Astro Actions et les îlots plus coûteux à maintenir. Excellent choix si la vitrine devenait le produit principal. |
| **Nuxt 4 + Vue 3.5** | Très bon, mais pas de form actions natives équivalentes ; plus de JS à charger ; réécriture équivalente pour un gain design nul. |
| **TanStack Start** | Écosystème trop jeune pour auth/PWA/forms sur 111 pages. |
| **Rester sur Next 16** | Aurait été le choix le moins risqué ; refusé car la demande est explicitement une autre stack. |
| **Qwik / HTMX / Laravel / Rails / Phoenix** | Réécriture de langue ou de modèle, perte du domaine TypeScript existant, aucun gain design. |

## Architecture cible

```
v2/
  src/
    routes/                 # UI SvelteKit active (public, voyageur, staff, token)
    app/                    # ANCIENNE UI Next : référence exclue du build
    lib/
      design/               # jetons CSS, thèmes, composants
      server/               # auth, session, db, files
    domain/                 # pur, sans framework
    application/            # ports + use cases
    infrastructure/         # adapters Drizzle/SMTP/PDF/S3
```

- Le noyau hexagonal (`domain`, `application`, `infrastructure`) reste en
  place : il n'importe ni Next ni Svelte.
- `src/app` (111 pages Next) est réécrit progressivement en `src/routes`.
- L'ancienne UI n'est jamais importée par la nouvelle ; elle est exclue de
  `svelte-check` et du build.

## Mode dégradé

| Capacité | Sans JS | Avec JS | Vieux navigateur |
|---|---|---|---|
| Formulaires | POST natif, rechargement | `use:enhance` | POST natif |
| Navigation | `<a href>` complet | routeur client | `<a href>` |
| Menus | `<details>` | identique | identique |
| Thème | CSS injecté serveur | identique | identique |
| Transitions de page | changement instantané | View Transitions | instantané |
| Grille | CSS Grid | identique | repli flex |
| Container queries | `@supports` → media queries | identique | media queries |
| Offline | non (pas de SW sans JS) | SW + outbox | non |
| Images | `<picture>` JPEG | AVIF/WebP | JPEG |

Règles : aucun contenu critique rendu uniquement côté client ; aucun menu
critique dépendant de JS ; tout formulaire métier a un `action` serveur ;
les animations sont décoratives et respectent `prefers-reduced-motion`.

## Design system

- Tokens CSS (couleurs, typo, formes, ombres, densité) partagés avec v2.
- 6 thèmes : Séjour, Océan, Sable, Nuit, Forêt, Ardoise.
- Composants Svelte serveur par défaut ; îlots client seulement pour les
  widgets qui en ont besoin (calendrier, glisser-déposer, messagerie).
- `bits-ui` uniquement pour les primitives accessibles à comportement
  complexe ; le reste en HTML/CSS natif (`details`, `dialog`, `popover`).
- Polices variables auto-hébergées (`@fontsource-variable`), pas de Google
  Fonts.
- Images via `@sveltejs/enhanced-img` (AVIF/WebP + tailles).
- Galerie `/design` + captures Playwright par thème × mode.

## Migration

1. **Socle** : scaffold `v3`, tokens, thèmes, composants de base, layout.
2. **Noyau** : copier `domain`, `application`, `infrastructure` ; adapter
   `env`, `logger`, `auth`, `session`, `db`.
3. **Auth** : Better Auth SvelteKit, login, 2FA, reset, rôles, aperçu
   voir-comme, session cookie.
4. **Gouvernance** : table `apparence_versions` (déjà modélisée), page
   `/supervision/apparence`, aperçu signé, publication, rollback, audit.
5. **Surfaces** : public, auth, voyageur, staff par grappes, token.
6. **Périphériques** : PWA/offline, cron, e-mails, PDF, exports.
7. **Parité** : 55 specs e2e rejouées, no-JS, visuels, axe, budgets.
8. **Bascule** : v3 en production, v2 archivée ; pas de suppression des
   données.

## Risques

| Risque | Parade |
|---|---|
| SvelteKit 3 très récent (3.1.0) | Spike de validation avant migration ; repli SvelteKit 2.x si blocage |
| 111 pages à réécrire | Grappes parallèles, composants partagés, e2e dès la première grappe |
| Better Auth SvelteKit | Spike auth avant tout le reste ; sinon handler HTTP manuel |
| PWA/offline | Réutiliser le service worker v2, tester la coupure réseau réelle |
| Régression métier | Le noyau ne change pas ; seuls les adapters d'entrée changent |
| Design « beau » subjectif | 3 références visuelles + galerie validée avant généralisation |

## Critères d'acceptation

1. Toutes les pages publiques et voyageur fonctionnent avec
   `javaScriptEnabled: false`.
2. Tous les formulaires staff critiques fonctionnent sans JS.
3. Budget voyageur < 50 Ko gzip ; staff < 200 Ko.
4. 6 thèmes × 2 modes, contraste AA, un seul publié, super-admin only.
5. Parité fonctionnelle avec v2 (routes, rôles, tokens, PDF, e-mails).
6. Aucune dépendance Next/React dans `domain`, `application`,
   `infrastructure`.
7. Rollback de thème < 1 min ; rollback de stack = v2 conservée.

## Plan de retrait

Si SvelteKit 3 bloque : revenir à SvelteKit 2.x (même modèle de routes), puis
à Next 16 en dernier recours. `v2` reste intacte et déployable pendant toute
la migration. Aucune migration destructive de la base.
