/**
 * Captures de recette visuelle (plan 004) sur le serveur de démonstration.
 * Usage : node .artifacts/ergonomie/captures.mjs
 * Base et identifiants surchargeables par BASE / LCD_EMAIL / LCD_MDP.
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const EMAIL = process.env.LCD_EMAIL ?? "super@lcd.test";
const MDP = process.env.LCD_MDP ?? "ChangeMe-2026!";
const DOSSIER = ".artifacts/ergonomie/captures";

const navigateur = await chromium.launch();

/** @param {{ nom: string, chemin: string, largeur: number, hauteur: number, connecte?: boolean }} o */
async function capturer({ nom, chemin, largeur, hauteur, connecte = false }) {
  const contexte = await navigateur.newContext({
    viewport: { width: largeur, height: hauteur },
    deviceScaleFactor: 1,
    locale: "fr-FR",
  });
  const page = await contexte.newPage();
  if (connecte) {
    await page.goto(`${BASE}/login`, { waitUntil: "load" });
    await page.fill('input[name="email"]', EMAIL);
    await page.fill('input[name="password"]', MDP);
    await page.getByRole("button", { name: "Se connecter" }).click();
    await page.waitForURL(/\/hote$|\/presta$|\/proprio$|\/commercial$/, {
      timeout: 30_000,
    });
  }
  await page.goto(`${BASE}${chemin}`, { waitUntil: "load" });
  await page.waitForTimeout(400);
  const cible = `${DOSSIER}/${nom}.png`;
  await page.screenshot({ path: cible, fullPage: hauteur > 900 });
  const titre = await page.title();
  console.log(`${cible} — ${largeur}x${hauteur} — « ${titre} »`);
  await contexte.close();
}

await capturer({
  nom: "public-accueil-360",
  chemin: "/",
  largeur: 360,
  hauteur: 800,
});
await capturer({
  nom: "public-reserver-1280",
  chemin: "/reserver",
  largeur: 1280,
  hauteur: 900,
});
await capturer({
  nom: "staff-hote-1280",
  chemin: "/hote",
  largeur: 1280,
  hauteur: 960,
  connecte: true,
});
await capturer({
  nom: "staff-hote-360",
  chemin: "/hote",
  largeur: 360,
  hauteur: 800,
  connecte: true,
});

await navigateur.close();
