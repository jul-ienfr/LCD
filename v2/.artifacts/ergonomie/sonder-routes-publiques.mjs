/**
 * Sonde : pour chaque route publique dérivée du disque, indique le statut HTTP
 * et l'URL finale à 320 px, avec la session super-admin si disponible.
 * But : distinguer les routes mesurables (200) des routes qui exigent un jeton
 * ou une session particulière (redirection, 400, 403) avant de fixer la liste
 * durable du contrat public.
 *
 * Usage : BASE_URL=http://127.0.0.1:4173 AUDIT_STORAGE=... node <ce fichier>
 */
import { access, readdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const PREFIXES_STAFF = ["hote", "supervision", "support", "presta"];
const racine = path.join(process.cwd(), "src", "routes");

async function routesPubliques() {
  const trouvees = [];
  async function parcourir(dossier, segments) {
    const entrees = await readdir(dossier, { withFileTypes: true });
    if (entrees.some((e) => e.isFile() && e.name === "+page.svelte")) {
      trouvees.push(segments.length === 0 ? "/" : `/${segments.join("/")}`);
    }
    for (const entree of entrees) {
      if (!entree.isDirectory()) continue;
      if (entree.name.startsWith("[") || entree.name.startsWith("(")) continue;
      if (entree.name.startsWith("_") || entree.name === "api") continue;
      if (segments.length === 0 && PREFIXES_STAFF.includes(entree.name)) continue;
      await parcourir(path.join(dossier, entree.name), [
        ...segments,
        entree.name,
      ]);
    }
  }
  await parcourir(racine, []);
  return [...new Set(trouvees)].sort();
}

const routes = await routesPubliques();
const navigateur = await chromium.launch();
let etat;
if (process.env.AUDIT_STORAGE) {
  try {
    await access(process.env.AUDIT_STORAGE);
    etat = process.env.AUDIT_STORAGE;
    console.log(`Session chargée : ${etat}`);
  } catch {
    console.log("AUDIT_STORAGE absent : sonde anonyme");
  }
}
const contexte = await navigateur.newContext({
  viewport: { width: 320, height: 568 },
  ...(etat ? { storageState: etat } : {}),
});
await contexte.addCookies([
  { name: "lcd_consentement", value: "v1.m1.p0", url: base },
  { name: "lcd_langue", value: "fr", url: base },
]);
const page = await contexte.newPage();

console.log(`\n${routes.length} routes publiques dérivées du disque\n`);
for (const route of routes) {
  let statut = "-";
  let final = "";
  try {
    const reponse = await page.goto(`${base}${route}`, {
      waitUntil: "domcontentloaded",
      timeout: 20000,
    });
    statut = reponse ? String(reponse.status()) : "-";
    final = new URL(page.url()).pathname;
  } catch (erreur) {
    statut = `ERREUR ${erreur.message.split("\n")[0].slice(0, 60)}`;
  }
  const redirige = final && final !== route ? ` -> ${final}` : "";
  console.log(`${statut.padEnd(6)} ${route}${redirige}`);
}

await contexte.close();
await navigateur.close();