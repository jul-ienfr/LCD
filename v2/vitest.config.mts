import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Le plugin Svelte est nécessaire pour compiler les composants `.svelte`
  // testés en SSR (`render()` de `svelte/server`) : le projet SvelteKit fournit
  // ce plugin via `vite.config.ts`, que Vitest ne lit pas.
  plugins: [
    svelte({
      preprocess: vitePreprocess(),
      // Le prébundle des bibliothèques Svelte passe par l'optimiseur de
      // dépendances (rolldown, Vite 8), qui échoue sur `node:module` dans
      // l'environnement de test ; les tests n'en ont pas besoin.
      prebundleSvelteLibraries: false,
    }),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts", "src/**/*.test.ts"],
    // Ne jamais ramasser .next/standalone : sinon chaque test tourne deux fois.
    exclude: ["node_modules", ".next", "coverage", "e2e"],
    // L'optimiseur de dépendances (rolldown, Vite 8) échoue sur
    // `node:module` avec le provider de couverture installé ; les tests
    // n'en ont pas besoin.
    deps: { optimizer: { ssr: { enabled: false }, client: { enabled: false } } },
    coverage: {
      provider: "v8",
      // SC-013 (spec 006, FR-030) : périmètre mesuré = domaine + application.
      include: ["src/domain/**", "src/application/**"],
      reporter: ["text-summary", "json-summary"],
      // Seuil appliqué en CI (FR-030) : 80 % partout, la mesure locale est
      // au-dessus (90/91/96/84) ; le seuil arrête une régression, pas la marge.
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
