import { defineConfig } from "@playwright/test";
import base from "./playwright.config";

// Copie locale de la config e2e avec un dossier d'artefacts dédié : une autre
// session partage le dépôt et vide `test-results` au démarrage de chaque run,
// ce qui tue les traces d'un run en cours (ENOENT). Le reste est identique.
export default defineConfig({
  ...base,
  outputDir: "test-results-local",
  // La session concurrente recharge Vite/svelte-kit en pleine exécution
  // (ERR_ABORTED, 500 transitoires) : une seconde passe absorbe ces échecs
  // environnementaux sans masquer les vrais bugs (deux échecs = réel).
  retries: 1,
});
