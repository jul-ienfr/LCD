<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Règles projet LCD v2 (opposables)

1. **HTML-first** : toute route voyageur rend son contenu et ses formulaires
   sans JavaScript. Test Playwright `javaScriptEnabled: false`.
2. **JS islands** : aucun composant client obligatoire sur le voyageur ;
   les îlots sont chargés à la demande.
3. **Budget JS** : cible voyageur < 50 Ko gzip, staff < 200 Ko. Exception
   acceptée pour la beta : le plancher Next `/voyageur` est à 178,8 Ko gzip
   (décision G1 du 2026-10-25), avec no-JS comme filet et une cible Astro/HTML
   en v2.1. Mesurer avant d'ajouter une dépendance.
4. **Domaine pur** : `src/domain/` n'importe ni Next, ni Drizzle, ni Stripe,
   ni Brevo, ni S3.
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
