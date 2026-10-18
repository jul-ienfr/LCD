// web/vite.config.ts — vitest : alias "@" (Next = tsconfig paths équivalent).
// Sans config, vitest ne lit PAS tsconfig paths : les imports "@/..." des
// tests échouent (socle.test.ts F2 importe les dicts plugins préfixés).
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
