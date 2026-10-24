import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
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
