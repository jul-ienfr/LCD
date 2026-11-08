# Constitution LCD v2

## Core Principles

### I. Périmètre V2 uniquement
La version active est `v2/` (SvelteKit 3, Svelte 5, Tailwind 4, Better Auth,
Drizzle/PostgreSQL). L’UI Next sous `v2/src/app` et `v2/src/components/*.tsx`
est une référence de parité, jamais importée. La V1 et le lab sont gelés :
aucun script de démarrage, aucune tâche planifiée, aucun conteneur `lcd-*`
n’est relancé sans accord explicite.

### II. HTML-first et domaine pur
Les routes voyageur rendent contenu et formulaires sans JavaScript
(`csr = false`). Le staff utilise SSR et des îlots optionnels. `src/domain/`
n’importe ni SvelteKit, ni Drizzle, ni Stripe, ni Brevo, ni S3. Toute
dépendance externe passe par un port dans `src/application/ports/` et un
adapter dans `src/infrastructure/adapters/`.

### III. Sécurité et isolation tenant
`tenant_id` vient exclusivement de la session, jamais du client. Les tables
métier passent par `withTenant()` et la RLS. Les routes staff vérifient les
rôles ; les API staff utilisent `verifierAccesApi()`. Aucun secret dans Git.
Les liens voyageur vérifient la signature HMAC avant lecture.

### IV. Qualité vérifiable
Toute nouvelle brique a un test, un plan de retrait et une documentation.
Les migrations sont immuables après application (expand/contract). Les
contrôles obligatoires sont : `npm run check`, `npx vitest run`,
`npm run build` et `npm run db:check` dans `v2/`. Un changement n’est déclaré
terminé qu’avec ces preuves et les registres mis à jour.

### V. Accessibilité et i18n progressif
Les cinq langues (`fr`, `en`, `es`, `it`, `de`) sont supportées par un
dictionnaire typé, un cookie de préférence et un repli français explicite.
Aucun texte visible ne doit être ajouté en dur sans clé de traduction.
Les dates et montants utilisent `Intl` avec la langue active. Le HTML porte
l’attribut `lang` correspondant.

## Contraintes supplémentaires

- Les migrations vivent dans `v2/drizzle/` et le journal doit rester cohérent.
- Les exports et PDF ne doivent jamais exposer de données d’un autre tenant.
- Les actions d’argent positif exigent quatre yeux ; le demandeur ne valide
  jamais sa propre sortie.
- Les tests Playwright voyageur s’exécutent sans JavaScript.

## Workflow de développement

1. Spécifier le comportement attendu et les critères mesurables.
2. Planifier les fichiers, contrats et tests avant d’implémenter.
3. Découper en tâches indépendantes et vérifiables.
4. Implémenter, tester, documenter.
5. Mettre à jour `ECARTS-V1.md`, `TESTS-A-FAIRE.md` et le changelog.

## Gouvernance

La constitution prime sur les préférences locales. Toute exception doit être
documentée dans la spec ou le plan, avec son plan de retrait. Les règles de
`AGENTS.md` et `v2/AGENTS.md` restent applicables.

**Version**: 1.0.0 | **Ratifiée**: 2026-11-04 | **Dernière amendement**: 2026-11-04
