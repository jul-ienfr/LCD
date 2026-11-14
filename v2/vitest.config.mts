import { fileURLToPath } from "node:url";
import { svelte, vitePreprocess } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

export default defineConfig({
  // Le plugin Svelte est nécessaire pour compiler les composants `.svelte`
  // testés en SSR (`render()` de `svelte/server`) : le projet SvelteKit fournit
  // ce plugin via `vite.config.ts`, que Vitest ne lit pas.
  plugins: [svelte({ preprocess: vitePreprocess() })],
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
  },
});
