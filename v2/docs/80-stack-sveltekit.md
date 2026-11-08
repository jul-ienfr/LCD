# ADR 008 — Stack frontend v2 : SvelteKit 3

- Statut : accepté et implémenté
- Date : 2026-10-25
- Portée : la v2 elle-même, **sans v3 séparée**
- Remplace : Next.js 16 pour la couche UI de la v2
- Conservé : domaine, application, infrastructure, Drizzle, PostgreSQL, Tailwind 4

## Contexte

La v2 utilisait Next.js 16.4, React 19.3 et Tailwind 4.3. La refonte intégrale
(6 thèmes, composants, coquilles, pages) était le bon moment pour choisir la
stack qui maximise le design, la performance et le mode dégradé.

Contraintes non négociables :

1. HTML-first : les parcours publics et voyageur fonctionnent sans JavaScript.
2. Budget JS : voyageur < 50 Ko gzip, staff < 200 Ko.
3. Formulaires, tableaux, auth, 2FA, PWA, offline, PDF, e-mails.
4. Un seul thème global, super-admin only.
5. Domaine pur, ports/adapters, migrations expand/contract.

## Décision

**SvelteKit 3.1 + Svelte 5.57 + Vite 8.3 + Tailwind CSS 4.3**, rendu Node
(`@sveltejs/adapter-node`), **Better Auth 1.7** pour l'authentification,
**Drizzle ORM 0.45 + PostgreSQL** pour la persistance, **Vitest 5** et
**Playwright 1.64** pour les tests.

La conversion s'est faite **dans `v2/`**, pas dans un dossier v3. L'ancienne UI
Next reste temporairement dans `src/app/` comme référence exclue du build ;
`src/routes/` est la seule UI active. `src/app/` sera supprimée après validation
finale de la parité.

Trois profils de rendu dans une seule application :

| Surface | Rendu | JS client | Dégradé |
|---|---|---|---|
| Public (vitrine, aide, légales, réserver) | SSR | `csr = false` | Liens et formulaires natifs |
| Voyageur (guide, questionnaire, police) | SSR | `csr = false` | Formulaires POST natifs, offline = amélioration |
| Staff (tous les écrans) | SSR + hydratation | oui, îlots Svelte | Actions critiques en `<form method="POST">` |
| Pages token (contrat, facture) | SSR | `csr = false` | Impression, liens natifs |

## Pourquoi SvelteKit

- **Form actions natives** : `+page.server.ts` + `<form method="POST">`
  fonctionnent sans JS ; `use:enhance` ajoute le confort quand JS est présent.
- **Runtime minimal** : Svelte compile, pas de Virtual DOM ; les budgets
  voyageur/staff sont plus faciles à tenir qu'avec React.
- **Plafond design identique** : Tailwind 4, CSS custom properties, View
  Transitions, container queries, `:has()`, animations natives.
- **Un seul déploiement** : adapter-node dans le Docker/VPS existant.
- **Écosystème 2026 mature** : SvelteKit 3.1, Svelte 5.57, Vite 8.3,
  Better Auth 1.7 et Drizzle 0.45 sont stables.

## Pourquoi pas les autres

| Option | Raison du refus |
|---|---|
| **Astro 7 + îlots Svelte** | Meilleur pour une vitrine 100 % zéro JS, mais les écrans de gestion avec formulaires/tableaux riches rendent Astro Actions et les îlots plus coûteux à maintenir. |
| **Nuxt 4 + Vue 3.5** | Très bon, mais pas de form actions natives équivalentes ; plus de JS à charger ; réécriture équivalente pour un gain design nul. |
| **TanStack Start** | Écosystème trop jeune pour auth/PWA/forms sur un parc complet. |
| **Rester sur Next 16** | Aurait été le choix le moins risqué ; refusé car la demande était explicitement une autre stack. |
| **Qwik / HTMX / Laravel / Rails / Phoenix** | Réécriture de langue ou de modèle, perte du domaine TypeScript existant, aucun gain design. |

## Architecture cible

```text
v2/
  src/
    routes/                 # UI SvelteKit active (public, voyageur, staff, token)
    app/                    # ANCIENNE UI Next : référence exclue du build
    lib/
      components/           # composants Svelte partagés
      server/               # auth, session, cookies, apparence
    domain/                 # pur, sans framework
    application/            # ports + use cases
    infrastructure/         # adapters Drizzle/SMTP/PDF/S3
```

- Le noyau hexagonal (`domain`, `application`, `infrastructure`) reste en
  place : il n'importe ni Next ni Svelte.
- `src/app` reste une référence de parité, exclue de `svelte-check` et du build.
- L'ancienne UI n'est jamais importée par la nouvelle.

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
critique dépendant de JS ; tout formulaire métier a un `action` serveur ; les
animations sont décoratives et respectent `prefers-reduced-motion`.

## Design system

- Tokens CSS (couleurs, typo, formes, ombres, densité) injectés côté serveur.
- 6 thèmes : Séjour, Océan, Sable, Nuit, Forêt, Ardoise.
- Un seul thème publié, un brouillon, historique et rollback, super-admin only.
- Composants Svelte serveur par défaut ; îlots client seulement pour les
  widgets qui en ont besoin.
- `bits-ui` uniquement pour les primitives accessibles complexes ; le reste en
  HTML/CSS natif (`details`, `dialog`, `popover`).
- Polices variables auto-hébergées (`@fontsource-variable`), pas de Google
  Fonts.
- Images via `@sveltejs/enhanced-img` (AVIF/WebP + tailles).

## État d'implémentation (2026-10-25)

- `src/routes/` : 73 pages SvelteKit, parité des écrans legacy.
- Thèmes : registre de 6 thèmes, variantes nav/entête, densité, rayons, ombres,
  palettes clair/sombre, contrôle WCAG AA par tests.
- Gouvernance : `apparence_versions`, brouillon + publication uniques, aperçu
  HMAC 30 min lié au compte, rollback, audit.
- Application : pages publiques, voyageur, staff, e-mails SMTP et PDF.
- Budget mesuré : `/`, `/login`, `/reserver` et `/voyageur` chargent 0,1 Ko de
  JavaScript applicatif (hors service worker).
- Vérifications : `npm run check` 0 erreur, `npm test` 521/521, `npm run build`
  vert, Playwright 10/10 (JS et sans JS).
