/**
 * Prépare un profil Chrome persistant avec une session hôte ouverte, pour que
 * Lighthouse CLI puisse mesurer `/hote` (la CLI n'accepte pas de cookie).
 *
 * Usage : node .artifacts/ergonomie/preparer-profil-hote.mjs
 * Sortie : .artifacts/profil-chrome-hote/  (profil jetable, non versionné)
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:4180";
const EMAIL = process.env.LCD_EMAIL ?? "super@lcd.test";
const MDP = process.env.LCD_MDP ?? "ChangeMe-2026!";
const PROFIL = ".artifacts/profil-chrome-hote";

// Le build `adapter-node` sert en http derrière un proxy : il faut lui annoncer
// le protocole et l'hôte (PROTOCOL_HEADER / HOST_HEADER), sinon il suppose
// `https` et rejette tout POST de formulaire en cross-site.
const contexte = await chromium.launchPersistentContext(PROFIL, {
  headless: true,
  viewport: { width: 412, height: 915 },
  locale: "fr-FR",
  extraHTTPHeaders: {
    "x-forwarded-proto": "http",
    "x-forwarded-host": new URL(BASE).host,
  },
});
const page = contexte.pages()[0] ?? (await contexte.newPage());
page.on("console", (m) => {
  if (m.type() === "error") console.log(`console: ${m.text().slice(0, 200)}`);
});

await page.goto(`${BASE}/login`, { waitUntil: "load" });
// Le profil est réutilisé d'une mesure à l'autre : si la session est encore
// valide, `/login` redirige vers l'espace et le formulaire n'existe pas.
const formulaireVisible = await page
  .locator('input[name="email"]')
  .isVisible()
  .catch(() => false);
if (formulaireVisible) {
  await page.fill('input[name="email"]', EMAIL);
  await page.fill('input[name="password"]', MDP);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForTimeout(4000);
} else {
  console.log(`session déjà ouverte : ${page.url()}`);
}

console.log(`après connexion : ${page.url()}`);
const texte = (await page.locator("body").innerText()).replace(/\s+/g, " ").slice(0, 300);
console.log(`contenu : ${texte}`);

const cookies = await contexte.cookies();
console.log(
  `cookies : ${cookies.map((c) => `${c.name}@${c.domain}${c.path}`).join(", ") || "aucun"}`,
);
await contexte.close();
console.log(`profil prêt : ${PROFIL}`);
