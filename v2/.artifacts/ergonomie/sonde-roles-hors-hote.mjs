/**
 * Sonde de recette : redirection par surface depuis `/hote` pour chaque rôle
 * qui n'appartient pas à l'espace hôte, et accès conservé à la sécurité
 * personnelle. Usage :
 *   node --env-file=.env.local .artifacts/ergonomie/sonde-roles-hors-hote.mjs
 */
import { chromium } from "playwright";

const base = process.env.SONDE_BASE ?? "http://127.0.0.1:4173";
const comptes = [
  ["prestataire", process.env.SEED_PRESTA_EMAIL, process.env.SEED_PRESTA_PASSWORD, /\/presta$/],
  ["propriétaire", process.env.SEED_PROPRIO_EMAIL, process.env.SEED_PROPRIO_PASSWORD, /\/proprio$/],
  [
    "commercial",
    process.env.SEED_COMMERCIAL_EMAIL,
    process.env.SEED_COMMERCIAL_PASSWORD,
    /\/commercial$/,
  ],
];

const navigateur = await chromium.launch();
for (const [libelle, email, motDePasse, attendu] of comptes) {
  if (!email || !motDePasse) {
    console.log(`${libelle} : identifiants absents, ignoré`);
    continue;
  }
  const contexte = await navigateur.newContext();
  const page = await contexte.newPage();
  await page.goto(`${base}/login`);
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', motDePasse);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL(attendu, { timeout: 15_000 });
  const racineHote = await page.goto(`${base}/hote`);
  const auditHote = await page.goto(`${base}/hote/audit`);
  const securite = await page.goto(`${base}/hote/securite`);
  const h1 = (await page.locator("h1").first().textContent()) ?? "";
  console.log(
    [
      `${libelle} : connexion ok`,
      `/hote → ${racineHote?.url()}`,
      `/hote/audit → ${auditHote?.url()}`,
      `/hote/securite → ${securite?.url()} (h1 « ${h1.trim().slice(0, 30)} »)`,
    ].join(" | "),
  );
  await contexte.close();
}
await navigateur.close();
