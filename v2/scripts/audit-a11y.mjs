/**
 * T031 / T004 / T074 — Audit axe-core (WCAG 2.1 A/AA) des surfaces.
 *
 * Usage de base (inchangé) :
 *   node scripts/audit-a11y.mjs
 *   → écrit `.artifacts/ergonomie/baseline-axe.json`
 *
 * Surfaces authentifiées (staff, supervision) — T074 :
 *   AUDIT_EMAIL=admin@lcd.test AUDIT_MOT_DE_PASSE=… \
 *   AUDIT_OUT_NAME=apres-axe-staff.json \
 *   AUDIT_PAGES=/hote,/hote/planning \
 *   node scripts/audit-a11y.mjs
 *
 * Périmètres dérivés du disque, avec gate (sortie 1 en cas d'échec) :
 *   node scripts/audit-a11y.mjs --staff    → /hote, /supervision, /support, /presta
 *   node scripts/audit-a11y.mjs --public   → tout le reste (hors /login et
 *                                            /two-factor, écartées avec motif)
 *   Ces deux modes exigent une session (AUDIT_EMAIL/AUDIT_MOT_DE_PASSE ou
 *   AUDIT_STORAGE) et écrivent respectivement `apres-axe-staff.json` et
 *   `apres-axe-public.json`.
 *
 * Variables :
 *   BASE_URL          base de l'application (défaut http://127.0.0.1:4173)
 *   AUDIT_PAGES       routes séparées par des virgules
 *   AUDIT_WIDTH/HEIGHT viewport (défaut 320 × 568)
 *   AUDIT_OUT         dossier de sortie (défaut .artifacts/ergonomie)
 *   AUDIT_OUT_NAME    nom du fichier de sortie (défaut baseline-axe.json)
 *   AUDIT_STORAGE     chemin d'un `storageState` Playwright (cookies + origines),
 *                     passé à `browser.newContext({ viewport, storageState })`
 *   AUDIT_EMAIL       identifiant staff : ouvre une session avant l'audit
 *   AUDIT_MOT_DE_PASSE mot de passe associé (jamais journalisé)
 *   AUDIT_SESSION_OUT chemin d'écriture du `storageState` obtenu
 *   AUDIT_HEADERS     JSON d'en-têtes supplémentaires (ex. cookie de session)
 *
 * Compatibilité ascendante : sans AUDIT_STORAGE / AUDIT_HEADERS /
 * AUDIT_OUT_NAME, le comportement et le fichier produit sont identiques aux
 * versions précédentes.
 *
 * Le `storageState` contient des cookies de session : ne jamais le committer
 * (il vit sous `.artifacts/`, ignoré par Git).
 */
import { AxeBuilder } from "@axe-core/playwright";
import { chromium } from "@playwright/test";
import { access, mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
const modeStaff = process.argv.slice(2).includes("--staff");
const modePublic = process.argv.slice(2).includes("--public");
const modeVerifier = process.argv.slice(2).includes("--verifier");

if (modeStaff && modePublic) {
  console.error("Choisir un seul périmètre : --staff ou --public.");
  process.exit(2);
}

/**
 * Surfaces staff du dépôt, dérivées du disque (même règle que
 * `scripts/audit-ergonomie.mjs --staff`). Une page staff créée demain est
 * auditée sans toucher au script ; les routes à paramètre sont écartées, faute
 * de données réelles.
 */
const PREFIXES_STAFF = ["hote", "supervision", "support", "presta"];

async function routesStaff() {
  const racine = path.join(process.cwd(), "src", "routes");
  const trouvees = [];
  async function parcourir(dossier, segments) {
    const entrees = await readdir(dossier, { withFileTypes: true });
    if (entrees.some((entree) => entree.isFile() && entree.name === "+page.svelte")) {
      if (segments.length > 0) trouvees.push(`/${segments.join("/")}`);
    }
    for (const entree of entrees) {
      if (!entree.isDirectory()) continue;
      if (entree.name.startsWith("[") || entree.name.startsWith("(")) continue;
      if (entree.name.startsWith("_") || entree.name === "node_modules") continue;
      await parcourir(path.join(dossier, entree.name), [...segments, entree.name]);
    }
  }
  for (const prefixe of PREFIXES_STAFF) {
    const depart = path.join(racine, prefixe);
    try {
      await access(depart);
    } catch {
      continue;
    }
    await parcourir(depart, [prefixe]);
  }
  return [...new Set(trouvees)].sort();
}

/**
 * Routes hors staff du dépôt, dérivées du disque. `/login` (redirige vers
 * `/hote` avec une session) et `/two-factor` (atteignable seulement en cours
 * de 2FA) sont écartées, comme dans `scripts/audit-ergonomie.mjs --public`.
 */
const ROUTES_PUBLIQUES_EXCLUES = ["login", "two-factor"];

async function routesPubliques() {
  const racine = path.join(process.cwd(), "src", "routes");
  const trouvees = [];
  async function parcourir(dossier, segments) {
    const entrees = await readdir(dossier, { withFileTypes: true });
    if (entrees.some((entree) => entree.isFile() && entree.name === "+page.svelte")) {
      trouvees.push(segments.length === 0 ? "/" : `/${segments.join("/")}`);
    }
    for (const entree of entrees) {
      if (!entree.isDirectory()) continue;
      if (entree.name.startsWith("[") || entree.name.startsWith("(")) continue;
      if (entree.name.startsWith("_") || entree.name === "node_modules") continue;
      if (entree.name === "api") continue;
      if (segments.length === 0) {
        if (PREFIXES_STAFF.includes(entree.name)) continue;
        if (ROUTES_PUBLIQUES_EXCLUES.includes(entree.name)) continue;
      }
      await parcourir(path.join(dossier, entree.name), [
        ...segments,
        entree.name,
      ]);
    }
  }
  await parcourir(racine, []);
  return [...new Set(trouvees)].sort();
}

const routes = modeStaff
  ? await routesStaff()
  : modePublic
    ? await routesPubliques()
    : (process.env.AUDIT_PAGES ?? "/,/reserver,/login,/voyageur")
      .split(",")
      .map((route) => route.trim())
      .filter(Boolean);

if (modeStaff) {
  if (!process.env.AUDIT_STORAGE && !process.env.AUDIT_EMAIL) {
    console.error(
      "Mode staff : AUDIT_EMAIL/AUDIT_MOT_DE_PASSE (ou AUDIT_STORAGE) requis — les routes /hote redirigent sans session.",
    );
    process.exit(2);
  }
  process.env.AUDIT_OUT_NAME ??= "apres-axe-staff.json";
  console.log(`Mode staff : ${routes.length} routes dérivées de src/routes.`);
}

const outDir = process.env.AUDIT_OUT ?? ".artifacts/ergonomie";
if (modePublic) {
  process.env.AUDIT_OUT_NAME ??= "apres-axe-public.json";
  console.log(
    `Mode public : ${routes.length} routes hors staff dérivées de src/routes (${ROUTES_PUBLIQUES_EXCLUES.join(", ")} exclues).`,
  );
}

const outName =
  process.env.AUDIT_OUT_NAME ??
  (modeVerifier ? "apres-axe.json" : "baseline-axe.json");
const viewport = {
  width: Number(process.env.AUDIT_WIDTH ?? 320),
  height: Number(process.env.AUDIT_HEIGHT ?? 568),
};

function lireEntetes() {
  const brut = process.env.AUDIT_HEADERS;
  if (!brut) return {};
  try {
    const valeur = JSON.parse(brut);
    if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) {
      throw new Error("objet JSON attendu");
    }
    return Object.fromEntries(
      Object.entries(valeur).map(([cle, val]) => [cle, String(val)]),
    );
  } catch (error) {
    console.error(
      `AUDIT_HEADERS ignoré (JSON invalide : ${error instanceof Error ? error.message : String(error)})`,
    );
    return {};
  }
}

const entetes = lireEntetes();
const storagePath = process.env.AUDIT_STORAGE;
let storageState;
if (storagePath) {
  try {
    await access(storagePath);
    storageState = storagePath;
    console.log(`Session staff chargée : ${storagePath}`);
  } catch {
    console.error(
      `AUDIT_STORAGE introuvable (${storagePath}) : audit anonyme, les routes protégées redirigeront.`,
    );
  }
}

/**
 * Session staff par identifiants (`AUDIT_EMAIL`, `AUDIT_MOT_DE_PASSE`).
 *
 * Permet d'auditer les surfaces `/hote/...` sans gérer un fichier de session à
 * la main : la connexion est faite une fois, l'état est réutilisé pour chaque
 * route et peut être écrit (`AUDIT_SESSION_OUT`) pour les mesures suivantes.
 * Le consentement de mesure est posé comme pour un visiteur réel.
 */
async function ouvrirSessionStaff(navigateur) {
  const email = process.env.AUDIT_EMAIL;
  const motDePasse = process.env.AUDIT_MOT_DE_PASSE;
  if (!email || !motDePasse) return storageState;
  const contexte = await navigateur.newContext({ viewport });
  await contexte.addCookies([
    { name: "lcd_consentement", value: "v1.m1.p0", url: base },
    { name: "lcd_langue", value: "fr", url: base },
  ]);
  const page = await contexte.newPage();
  await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', motDePasse);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.startsWith("/login"), {
    timeout: 30000,
  });
  const fichier = process.env.AUDIT_SESSION_OUT;
  if (fichier) {
    await contexte.storageState({ path: fichier });
    console.log(`Session staff écrite : ${fichier}`);
  }
  console.log(`Session staff ouverte (${email})`);
  return contexte.storageState();
}

console.log(
  `Audit axe — ${routes.length} route(s), entêtes : ${Object.keys(entetes).length}, session : ${storageState ? "oui" : "non"}`,
);

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
storageState = await ouvrirSessionStaff(browser);
const results = [];

for (const route of routes) {
  const context = await browser.newContext({ viewport, storageState });
  if (Object.keys(entetes).length > 0) {
    await context.setExtraHTTPHeaders(entetes);
  }
  const page = await context.newPage();
  try {
    const response = await page.goto(`${base}${route}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    await page.waitForTimeout(400);
    const analysis = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const violations = analysis.violations.map((violation) => ({
      id: violation.id,
      impact: violation.impact,
      help: violation.help,
      nodes: violation.nodes.length,
      targets: violation.nodes.slice(0, 5).map((node) => node.target.join(" ")),
      details: violation.nodes.slice(0, 5).map((node) => ({
        target: node.target.join(" "),
        html: node.html.slice(0, 180),
        data: node.any?.[0]?.data ?? null,
      })),
    }));

    results.push({
      route,
      status: response?.status() ?? null,
      finalUrl: page.url(),
      violations,
      seriousOrCritical: violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      ).length,
    });

    console.log(
      `${route} status=${response?.status() ?? "?"} violations=${violations.length} serious/critical=${results.at(-1).seriousOrCritical}`,
    );
    for (const violation of violations) {
      console.log(
        `  - [${violation.impact}] ${violation.id} (${violation.nodes}) ${violation.help}`,
      );
    }
  } catch (error) {
    results.push({ route, error: String(error) });
    console.error(`${route} ERROR ${String(error)}`);
  } finally {
    await context.close();
  }
}

await browser.close();
const target = path.join(outDir, outName);
/**
 * Garde-fou (friction R-10) : le relevé de référence axe n'est jamais écrasé
 * par une passe de mesure. Écraser volontairement :
 *   AUDIT_ECRASER=1 AUDIT_OUT_NAME=baseline-axe.json npm run audit:a11y
 * Pour mesurer sans risque : `npm run audit:a11y:verifier` (écrit apres-axe.json).
 */
if (/baseline/i.test(outName) && process.env.AUDIT_ECRASER !== "1") {
  const existe = await access(target).then(
    () => true,
    () => false,
  );
  if (existe) {
    console.error(
      `Refus d'écraser le relevé de référence ${outName} (déjà présent).`,
    );
    console.error(
      "  Mesurer sans risque : npm run audit:a11y:verifier (écrit apres-axe.json).",
    );
    console.error(
      "  Écraser volontairement : AUDIT_ECRASER=1 AUDIT_OUT_NAME=baseline-axe.json.",
    );
    process.exit(2);
  }
}
await writeFile(
  target,
  `${JSON.stringify(
    {
      base,
      viewport,
      routes,
      authentifie: Boolean(storageState),
      entetes: Object.keys(entetes),
      results,
    },
    null,
    2,
  )}\n`,
);
console.log(`\nRapport: ${target}`);

/**
 * Gate axe : aucune violation `serious`/`critical` sur les routes du périmètre
 * (WCAG 2.0/2.1 A+AA, viewport 320 px). Sortie 1 si le contrat casse, pour être
 * rejouable en vérification :
 *   - `npm run audit:a11y:staff`  → surfaces /hote, /supervision, …
 *   - `npm run audit:a11y:public` → tout le reste du dépôt
 */
if (modeStaff || modePublic || modeVerifier) {
  const perimetre = modeStaff ? "staff" : modePublic ? "public" : "P1";
  const enEchec = results.filter(
    (resultat) => (resultat.seriousOrCritical ?? 0) > 0,
  );
  const enErreur = results.filter((resultat) => resultat.error);
  const total = results.reduce(
    (somme, resultat) => somme + (resultat.violations?.length ?? 0),
    0,
  );
  console.log(
    `\nBilan a11y ${perimetre} : ${results.length} routes, ${total} violation(s), ${enEchec.length} route(s) en échec, ${enErreur.length} erreur(s).`,
  );
  for (const resultat of enEchec) {
    console.error(
      `  ${resultat.route} → ${resultat.seriousOrCritical} violation(s) serious/critical`,
    );
  }
  for (const resultat of enErreur) {
    console.error(`  ${resultat.route} → ${resultat.error}`);
  }
  if (enEchec.length + enErreur.length > 0) {
    console.error(`Gate a11y ${perimetre} : ÉCHEC (code de sortie 1).`);
    process.exit(1);
  }
  console.log(
    `Gate a11y ${perimetre} : OK (0 violation serious/critical, 0 erreur).`,
  );
}
