## Stack LCD v2 (opposable)

La v2 est une application **SvelteKit 3 + Svelte 5 + Vite 8 + Tailwind 4**,
rendue par `@sveltejs/adapter-node`. Il n'y a pas de v3 : la bascule se fait
dans ce dossier.

- Les routes vivent dans `src/routes/` (`+page.svelte`, `+page.server.ts`,
  `+server.ts`).
- `src/app/`, `src/components/*.tsx`, `src/proxy.ts` et `src/lib/{auth,session,apercu,themes}.ts`
  sont l'**ancienne UI Next conservée en référence**. Elle est exclue du build
  et de `svelte-check` ; ne jamais l'importer. Elle sera supprimée à parité.
- Alias : `@/…` et `$core/…` pointent vers `src/` (`@/lib/...` pour la
  bibliothèque). SvelteKit 3 n'expose plus `$lib` : ne pas l'utiliser.
- SvelteKit 3 : `$app/environment` devient `$app/env` ; `svelte.config.js`
  n'existe plus (adapter déclaré dans `vite.config.ts`) ; `tsconfig` étend
  `$app/tsconfig`.
- Toute mutation passe par une action serveur (`+page.server.ts`) ou un
  endpoint `+server.ts` ; les formulaires restent natifs.
- Le code serveur spécifique (auth, session, cookies) va dans
  `src/lib/server/`.
- Le thème est résolu et injecté côté serveur dans `src/routes/+layout.svelte`.

## Règles projet LCD v2 (opposables)

1. **HTML-first** : toute route voyageur rend son contenu et ses formulaires
   sans JavaScript. Test Playwright `javaScriptEnabled: false`.
2. **JS islands** : aucun composant client obligatoire sur le voyageur ;
   les îlots sont chargés à la demande.
3. **Budget JS** : cible voyageur < 50 Ko gzip, staff < 200 Ko. Les routes
   publiques et voyageur utilisent `export const csr = false` et ne chargent
   aucun îlot obligatoire. Mesurer avant d'ajouter une dépendance.
4. **Domaine pur** : `src/domain/` n'importe ni SvelteKit, ni Drizzle, ni
   Stripe, ni Brevo, ni S3.
5. **Ports/adapters** : toute dépendance externe passe par
   `src/application/ports/` + `src/infrastructure/adapters/`.
6. **Tenant** : `tenant_id` vient de la session, jamais du client ;
   `withTenant()` pour les tables métier.
7. **Idempotence** : toute écriture rejouable porte une `ref` stable.
8. **Migrations** : `drizzle/` immuable après application ; expand/contract ;
   backup + restore testés avant prod.
9. **Pas de secret dans Git** ; `BETTER_AUTH_SECRET` ≥ 32 caractères en prod.
10. **Toute nouvelle brique** a un port, un adapter, un test et un plan de
    retrait.
11. **Lien voyageur** : vérifier la signature HMAC avant toute lecture ;
    ne jamais faire confiance au payload sans vérification ; l'API incident
    reste idempotente par `ref`.
