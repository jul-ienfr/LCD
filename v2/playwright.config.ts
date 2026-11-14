import { defineConfig, devices } from "@playwright/test";
import { config as chargerEnv } from "dotenv";

chargerEnv({ path: ".env.local", quiet: true });

const channel =
  process.env.PLAYWRIGHT_CHANNEL ?? (process.env.CI ? undefined : "msedge");

// `PW_SERVEUR=prod` fait tourner la suite contre le build de production
// (`node build`) au lieu du serveur de développement : pas de rechargement HMR
// ni de réécriture de `.svelte-kit/types` pendant le run, et la mesure ne
// dépend plus des éditions concurrentes. `PW_PORT` isole la suite d'un serveur
// déjà lancé (3000 par défaut pour `node build`, 4173 ici).
const port = process.env.PW_PORT ?? "4173";
const serveurProd = process.env.PW_SERVEUR === "prod";
const baseUrl = process.env.PLAYWRIGHT_BASE_URL ?? `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  reporter: process.env.CI
    ? [["list"], ["html", { open: "never" }]]
    : [["list"]],
  use: {
    baseURL: baseUrl,
    headless: true,
    ...(channel ? { channel } : {}),
    // En mode production, l'adaptateur lit le protocole dans cet en-tête
    // (PROTOCOL_HEADER) : sans lui il suppose https et bloque les formulaires.
    ...(serveurProd
      ? {
          extraHTTPHeaders: {
            "x-forwarded-proto": "http",
            // Les requêtes `request.post` (sans navigateur) n'envoient pas
            // d'Origin : SvelteKit les rejette alors en 403. Toutes les
            // requêtes du run sont de même origine.
            origin: baseUrl,
          },
        }
      : {}),
    trace: process.env.CI ? "off" : "retain-on-failure",
  },
  projects: [
    {
      name: "js",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "sans-js",
      use: { ...devices["Desktop Chrome"], javaScriptEnabled: false },
    },
  ],
  webServer: {
    command: serveurProd
      ? "node build"
      : `npm run dev -- --host 127.0.0.1 --port ${port}`,
    port: Number(port),
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ENQUIRY_ENABLED: "true",
      ...(serveurProd
        ? {
            PORT: port,
            HOST: "127.0.0.1",
            // adapter-node suppose https en production quand l'en-tête de
            // protocole n'est pas configuré : SvelteKit rejette alors tout POST
            // de formulaire (« Cross-site POST form submissions are forbidden »).
            PROTOCOL_HEADER: "x-forwarded-proto",
            HOST_HEADER: "host",
            APP_URL: baseUrl,
            BETTER_AUTH_URL: baseUrl,
          }
        : {}),
    },
  },
});
