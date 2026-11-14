/**
 * T005 / T032 / T075 / T093 — Audit ergonomique 320 px, agrégation
 * baseline / après, gate de non-régression et état de Lighthouse.
 *
 * Modes (un seul point d'entrée) :
 *
 * 1. Audit visuel Playwright 320 × 568 (défaut) :
 *      node scripts/audit-ergonomie.mjs
 *    Écrit `.artifacts/ergonomie/baseline-320.json` (`apres-320.json` si
 *    `AUDIT_FICHIER=apres-320.json`). Le relevé de référence n'est jamais
 *    écrasé : un fichier `baseline*` déjà présent exige `AUDIT_ECRASER=1`.
 *
 * 1 bis. Périmètres dérivés du disque, avec gate (sortie 1 en cas d'échec) :
 *      node scripts/audit-ergonomie.mjs --staff    → /hote, /supervision, …
 *      node scripts/audit-ergonomie.mjs --public   → tout le reste, hors
 *        /login (mesurée anonymement dans le jeu P1) et /two-factor (2FA)
 *    Sorties respectives : `apres-320-staff.json`, `apres-320-public.json`.
 *    Les deux modes exigent une session (AUDIT_EMAIL/AUDIT_MOT_DE_PASSE ou
 *    AUDIT_STORAGE).
 *
 * 2. Rapport agrégé :
 *      node scripts/audit-ergonomie.mjs --ecrire
 *    Lit tous les JSON de `.artifacts/ergonomie/` — `baseline-axe.json`,
 *    `apres-axe.json`, `baseline-320.json`, `apres-320.json`, `baseline-js*`,
 *    `apres-js*`, `cibles.json`, `contrastes.json` — et écrit :
 *      - `v2/.artifacts/ergonomie/rapport-ergonomie.json` (données brutes) ;
 *      - `v2/.artifacts/ergonomie/rapport-ergonomie.md` (rapport lisible) ;
 *      - `specs/004-ergonomie-experience-client/baseline/rapport-agrege.md`
 *        (rapport de référence du plan 004).
 *
 * 3. Gate de non-régression :
 *      node scripts/audit-ergonomie.mjs --verifier     (ou ERGONOMIE_VERIFIER=1)
 *    Code de sortie 1 si une route P1 régresse : violations axe en hausse,
 *    débordement 320 px > 0, ou cible < 44 px hors lien de texte inline.
 *
 * Options : --ecrire, --verifier, --sans-audit, --rapport <chemin>.
 *
 * T075 — Lighthouse : détecté via `require.resolve("lighthouse")`, le PATH ou
 * `npx --no-install lighthouse --version`. Absent, il n'échoue jamais : le
 * rapport porte `lighthouse: "absent"` et la commande exacte à lancer le jour
 * où il sera disponible :
 *   npx --yes lighthouse@13 http://127.0.0.1:4173/ --preset=desktop \
 *     --chrome-flags="--headless=new" --output=json \
 *     --output-path=.artifacts/ergonomie/apres-lighthouse.json
 */
import { chromium } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { access, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mesurerCiblesPage } from "./lib/mesure-cibles.mjs";

const require = createRequire(import.meta.url);
const ici = path.dirname(fileURLToPath(import.meta.url));
const racineDepot = path.resolve(ici, "..", "..");

const base = process.env.BASE_URL ?? "http://127.0.0.1:4173";
let routes = (process.env.AUDIT_PAGES ?? "/,/reserver,/login,/voyageur")
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);
const outDir = process.env.AUDIT_OUT ?? ".artifacts/ergonomie";
const seuilPx = Number(process.env.AUDIT_SEUIL_PX ?? 44);

/**
 * Session staff optionnelle (`AUDIT_EMAIL` / `AUDIT_MOT_DE_PASSE`).
 *
 * Les routes `/hote/...` redirigent sans session : la mesure 320 px et 44 px
 * des surfaces staff exige une connexion. Elle est faite une fois, l'état est
 * réutilisé pour toutes les routes, et peut être écrit avec `AUDIT_SESSION_OUT`.
 * Sans identifiants, l'audit reste anonyme (comportement historique).
 */
async function ouvrirSessionStaff(navigateur) {
  const email = process.env.AUDIT_EMAIL;
  const motDePasse = process.env.AUDIT_MOT_DE_PASSE;
  const existant = process.env.AUDIT_STORAGE;
  if (existant) {
    try {
      await access(existant);
      console.log(`Session staff chargée : ${existant}`);
      return existant;
    } catch {
      console.error(`AUDIT_STORAGE introuvable (${existant}) : audit anonyme.`);
    }
  }
  if (!email || !motDePasse) return undefined;
  const contexte = await navigateur.newContext({
    viewport: { width: 320, height: 568 },
  });
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
  const etat = await contexte.storageState();
  await contexte.close();
  return etat;
}

/** Routes P1 : celles qui bloquent un parcours ou coûtent de l'argent. */
const ROUTES_P1 = (
  process.env.ERGONOMIE_P1 ?? "/,/reserver,/voyageur,/login,/hote"
)
  .split(",")
  .map((route) => route.trim())
  .filter(Boolean);

/**
 * Surfaces staff du dépôt, dérivées du disque.
 *
 * La liste des routes est lue dans `src/routes` plutôt que recopiée : une
 * nouvelle page staff est ainsi mesurée dès sa création, sans risque d'oubli.
 * Les routes à paramètre (`[id]`, `[token]`) sont écartées : sans données
 * réelles, elles redirigent ou répondent 404 et fausseraient le bilan.
 */
const PREFIXES_STAFF = ["hote", "supervision", "support", "presta"];

/**
 * Routes hors staff du dépôt, dérivées du disque. Deux routes publiques sont
 * écartées volontairement :
 *   - `/login` : avec une session ouverte elle redirige vers `/hote`, donc elle
 *     se mesure anonymement — c'est déjà le cas dans le contrat P1 ;
 *   - `/two-factor` : atteignable seulement en cours de vérification 2FA
 *     (couvert par `e2e/auth.spec.ts`).
 * Les routes à paramètre, l'API et les groupes de layout sont écartés comme
 * pour les surfaces staff.
 */
const ROUTES_PUBLIQUES_EXCLUES = ["login", "two-factor"];

async function routesPubliques() {
  const racine = path.join(racineDepot, "v2", "src", "routes");
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

async function routesStaff() {
  const racine = path.join(racineDepot, "v2", "src", "routes");
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
      await parcourir(path.join(dossier, entree.name), [
        ...segments,
        entree.name,
      ]);
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

const args = process.argv.slice(2);
const ecrire = args.includes("--ecrire") || process.env.ERGONOMIE_ECRIRE === "1";
const verifier = args.includes("--verifier") || process.env.ERGONOMIE_VERIFIER === "1";
const sansAudit = args.includes("--sans-audit") || verifier || ecrire;
const staff = args.includes("--staff");
const public_ = args.includes("--public");

if (staff && public_) {
  console.error("Choisir un seul périmètre : --staff ou --public.");
  process.exit(2);
}

if (public_ && !process.env.AUDIT_PAGES) {
  routes = await routesPubliques();
  process.env.AUDIT_FICHIER ??= "apres-320-public.json";
  console.log(
    `Mode public : ${routes.length} routes hors staff dérivées de src/routes (${ROUTES_PUBLIQUES_EXCLUES.join(", ")} exclues).`,
  );
  if (!process.env.AUDIT_EMAIL && !process.env.AUDIT_STORAGE) {
    console.error(
      "Mode public : AUDIT_EMAIL/AUDIT_MOT_DE_PASSE (ou AUDIT_STORAGE) requis — /journal, /secrets, /proprio et /preview redirigent sans session.",
    );
    process.exit(2);
  }
}

if (staff && !process.env.AUDIT_PAGES) {
  routes = await routesStaff();
  process.env.AUDIT_FICHIER ??= "apres-320-staff.json";
  console.log(`Mode staff : ${routes.length} routes dérivées de src/routes.`);
  if (!process.env.AUDIT_EMAIL && !process.env.AUDIT_STORAGE) {
    console.error(
      "Mode staff : AUDIT_EMAIL/AUDIT_MOT_DE_PASSE (ou AUDIT_STORAGE) requis — les routes /hote redirigent sans session.",
    );
    process.exit(2);
  }
}
const indexRapport = args.indexOf("--rapport");
const rapportDemande = indexRapport >= 0 ? args[indexRapport + 1] : undefined;
const rapportSpec = path.resolve(
  rapportDemande ??
    process.env.AUDIT_RAPPORT ??
    path.join(
      racineDepot,
      "specs",
      "004-ergonomie-experience-client",
      "baseline",
      "rapport-agrege.md",
    ),
);
const rapportJson = path.resolve(
  process.env.AUDIT_RAPPORT_JSON ?? path.join(outDir, "rapport-ergonomie.json"),
);
const rapportMd = path.resolve(
  process.env.AUDIT_RAPPORT_MD ?? path.join(outDir, "rapport-ergonomie.md"),
);

// --- 0. Détection de Lighthouse (T075) --------------------------------------

const COMMANDE_LIGHTHOUSE =
  'npx --yes lighthouse@13 http://127.0.0.1:4173/ --preset=desktop ' +
  '--chrome-flags="--headless=new" --output=json ' +
  "--output-path=.artifacts/ergonomie/apres-lighthouse.json";

function detecterLighthouse() {
  try {
    require.resolve("lighthouse/package.json");
    return { etat: "present", source: "module résolu" };
  } catch {
    // module absent localement : on tente le binaire du PATH puis npx.
  }
  const binaire = spawnSync(
    process.platform === "win32" ? "lighthouse.cmd" : "lighthouse",
    ["--version"],
    { encoding: "utf8", timeout: 20000 },
  );
  if (binaire.status === 0 && String(binaire.stdout ?? "").trim()) {
    return { etat: "present", source: String(binaire.stdout).trim() };
  }
  // `npx` n'existe qu'en `.cmd` sous Windows : on le localise sans shell
  // (évite le DEP0190 de `spawnSync` avec `shell: true`).
  const localisation = spawnSync(
    process.platform === "win32" ? "where" : "which",
    ["npx"],
    { encoding: "utf8", timeout: 15000 },
  );
  if (localisation.status === 0) {
    const executable = String(localisation.stdout ?? "").trim().split(/\r?\n/)[0];
    if (executable) {
      const npx = spawnSync(executable, ["--no-install", "lighthouse", "--version"], {
        encoding: "utf8",
        timeout: 30000,
      });
      if (npx.status === 0 && String(npx.stdout ?? "").trim()) {
        return { etat: "present", source: String(npx.stdout).trim() };
      }
    }
  }
  return { etat: "absent", source: null };
}

// --- 1. Audit visuel 320 px -------------------------------------------------

async function auditerRoute(page, route) {
  let status = null;
  try {
    const response = await page.goto(`${base}${route}`, {
      waitUntil: "load",
      timeout: 30000,
    });
    status = response?.status() ?? null;
    await page.waitForTimeout(400);

    const cibles = await mesurerCiblesPage(page, { seuilPx });
    const audit = await page.evaluate(() => {
      const doc = document.documentElement;
      const fields = [
        ...document.querySelectorAll(
          'input:not([type="hidden"]), select, textarea',
        ),
      ];
      const unlabeledFields = fields.filter((element) => {
        if (
          element.getAttribute("aria-label") ||
          element.getAttribute("aria-labelledby")
        ) {
          return false;
        }
        if (element.id) {
          const label = document.querySelector(
            `label[for="${CSS.escape(element.id)}"]`,
          );
          if (label) return false;
        }
        return !element.closest("label");
      }).length;

      return {
        h1Count: document.querySelectorAll("h1").length,
        lang: doc.lang,
        skipLink: [...document.querySelectorAll('a[href^="#"]')].some((link) =>
          /contenu|skip|évitement|evitement/i.test(link.textContent ?? ""),
        ),
        imagesWithoutAlt: [...document.images].filter(
          (image) => !image.hasAttribute("alt"),
        ).length,
        unlabeledFields,
      };
    });

    console.log(
      `${route} status=${status} overflow=${cibles.overflowPx}px h1=${audit.h1Count} lang=${audit.lang} skip=${audit.skipLink} small=${cibles.smallTargets.length} unlabeled=${audit.unlabeledFields} imgAlt=${audit.imagesWithoutAlt}`,
    );

    return {
      route,
      status,
      overflowPx: cibles.overflowPx,
      smallTargets: cibles.smallTargets.map((cible) => ({
        tag: cible.tag,
        type: cible.type,
        name: cible.name,
        classe: cible.classe,
        libelleHtml: cible.libelleHtml,
        text: cible.text,
        width: cible.width,
        height: cible.height,
      })),
      ...audit,
    };
  } catch (error) {
    console.error(`${route} ERROR ${String(error)}`);
    return { route, status, error: String(error) };
  }
}

async function lancerAuditVisuel() {
  await mkdir(outDir, { recursive: true });
  const browser = await chromium.launch();
  const results = [];
  const storageState = await ouvrirSessionStaff(browser);
  try {
    for (const route of routes) {
      const page = await browser.newPage({
        viewport: { width: 320, height: 568 },
        deviceScaleFactor: 1,
        ...(storageState ? { storageState } : {}),
      });
      try {
        results.push(await auditerRoute(page, route));
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  const fichierAudit = process.env.AUDIT_FICHIER ?? "baseline-320.json";
  const cible = path.join(outDir, fichierAudit);
  /**
   * Garde-fou : le relevé de référence ne doit jamais être écrasé par une
   * passe de mesure courante. Avec un nom explicite et `AUDIT_ECRASER=1`,
   * l'écrasement reste possible (le premier relevé se crée normalement).
   */
  if (/baseline/i.test(fichierAudit) && process.env.AUDIT_ECRASER !== "1") {
    const existe = await access(cible).then(
      () => true,
      () => false,
    );
    if (existe) {
      console.error(
        `Refus d'écraser le relevé de référence ${fichierAudit} (déjà présent).`,
      );
      console.error(
        "  Nommer la sortie : AUDIT_FICHIER=apres-320-<sujet>.json (le gate staff lit apres-320-staff.json).",
      );
      console.error(
        "  Écraser volontairement : AUDIT_ECRASER=1 AUDIT_FICHIER=baseline-320.json.",
      );
      process.exit(2);
    }
  }
  await writeFile(
    cible,
    `${JSON.stringify({ base, routes, results }, null, 2)}\n`,
    "utf8",
  );
  console.log(`\nRapport d'audit : ${cible}`);
}

if (!sansAudit) {
  await lancerAuditVisuel();
}

/**
 * Gate 320 px : les routes mesurées doivent répondre, ne pas déborder, ne
 * contenir aucune cible sous le seuil et aucun champ sans étiquette. Sert de
 * contrat rejouable après toute retouche d'interface :
 *   - `npm run audit:ergonomie:staff`  → surfaces /hote, /supervision, …
 *   - `npm run audit:ergonomie:public` → tout le reste du dépôt
 */
if ((staff || public_) && !ecrire && !verifier) {
  const perimetre = public_ ? "public" : "staff";
  const fichier = path.join(
    outDir,
    process.env.AUDIT_FICHIER ?? `apres-320-${perimetre}.json`,
  );
  const donnees = JSON.parse(await readFile(fichier, "utf8"));
  const enErreur = donnees.results.filter((r) => r.status !== 200);
  const enDebordement = donnees.results.filter((r) => (r.overflowPx ?? 0) > 0);
  const avecCibles = donnees.results.filter(
    (r) => (r.smallTargets ?? []).length > 0,
  );
  const sansEtiquette = donnees.results.filter((r) => (r.unlabeledFields ?? 0) > 0);
  const total = donnees.results.reduce(
    (n, r) => n + (r.smallTargets ?? []).length,
    0,
  );
  const totalSansEtiquette = donnees.results.reduce(
    (n, r) => n + (r.unlabeledFields ?? 0),
    0,
  );
  console.log(
    `\nBilan ${perimetre} 320 px : ${donnees.results.length} routes, ${total} cible(s) < ${seuilPx} px, ${enDebordement.length} débordement(s), ${enErreur.length} erreur(s), ${totalSansEtiquette} champ(s) sans étiquette.`,
  );
  for (const route of enErreur) console.error(`  ${route.route} → HTTP ${route.status}`);
  for (const route of enDebordement)
    console.error(`  ${route.route} → débordement ${route.overflowPx} px`);
  for (const route of avecCibles)
    console.error(
      `  ${route.route} → ${(route.smallTargets ?? []).length} cible(s) sous ${seuilPx} px`,
    );
  for (const route of sansEtiquette)
    console.error(
      `  ${route.route} → ${route.unlabeledFields} champ(s) sans étiquette`,
    );
  if (
    enErreur.length +
      enDebordement.length +
      avecCibles.length +
      sansEtiquette.length >
    0
  ) {
    console.error(`Gate ${perimetre} : ÉCHEC (code de sortie 1).`);
    process.exit(1);
  }
  console.log(
    `Gate ${perimetre} : OK (0 cible, 0 débordement, 0 erreur, 0 champ sans étiquette).`,
  );
  process.exit(0);
}

// --- 2. Lecture des sources -------------------------------------------------

function lireTexte(buffer) {
  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return buffer.toString("utf16le").replace(/^\uFEFF/, "");
  }
  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return new TextDecoder("utf-16be").decode(buffer).replace(/^\uFEFF/, "");
  }
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return buffer.toString("utf8").replace(/^\uFEFF/, "");
  }
  return buffer.toString("utf8");
}

async function lireJson(chemin) {
  try {
    return JSON.parse(lireTexte(await readFile(chemin)));
  } catch {
    return null;
  }
}

function estBaseline(nom) {
  return nom.startsWith("baseline-") || nom.startsWith("avant-");
}

function estApres(nom) {
  return nom.startsWith("apres-") || nom.startsWith("apres_") || nom.startsWith("après-");
}

function rangNom(nom) {
  if (estBaseline(nom)) return 0;
  if (estApres(nom)) return 1;
  return 2;
}

function comparerNoms(a, b) {
  return rangNom(a) - rangNom(b) || a.localeCompare(b, "fr");
}

async function chargerSources() {
  let fichiers = [];
  try {
    fichiers = await readdir(outDir);
  } catch {
    return [];
  }
  const sources = [];
  const noms = fichiers
    .filter((f) => f.endsWith(".json"))
    // Ne jamais se relire soi-même : le rapport JSON n'est pas une mesure.
    .filter((f) => !/^rapport-/.test(f))
    .sort(comparerNoms);
  for (const nom of noms) {
    const donnees = await lireJson(path.join(outDir, nom));
    if (donnees) sources.push({ nom, donnees, absent: false });
  }
  return sources;
}

const FICHIERS_ATTENDUS = [
  "baseline-axe.json",
  "apres-axe.json",
  "baseline-320.json",
  "apres-320.json",
  "baseline-js.json",
  "apres-js.json",
];

function sourceAbsente(sources, nom) {
  return !sources.some((source) => source.nom === nom);
}

// --- 3. Extraction des métriques par route ---------------------------------

function estSource(type, source) {
  const attendu = type === "apres" ? estApres(source.nom) : estBaseline(source.nom);
  if (!attendu) return false;
  if (!Array.isArray(source.donnees?.results)) return false;
  return true;
}

function routesDepuis(sources, type, predicatNom) {
  const parRoute = new Map();
  for (const source of sources) {
    if (!estSource(type, source)) continue;
    if (predicatNom && !predicatNom(source.nom)) continue;
    for (const resultat of source.donnees.results) {
      if (!resultat?.route) continue;
      parRoute.set(resultat.route, { resultat, nom: source.nom });
    }
  }
  return parRoute;
}

function violationsRoute(resultat) {
  if (!Array.isArray(resultat?.violations)) return 0;
  return resultat.violations.reduce((total, violation) => {
    const nodes = Number(violation?.nodes);
    return total + (Number.isFinite(nodes) ? nodes : 1);
  }, 0);
}

function ciblesInlineHorsPerimetre(resultat) {
  // Les petits gabarits produits par `mesurer-cibles.mjs` excluent déjà les
  // liens inline ; `baseline-320.json` ne les excluait pas. On ne peut pas
  // rejuger après coup : on documente la provenance.
  return Array.isArray(resultat?.smallTargets) ? resultat.smallTargets.length : 0;
}

function comparer() {
  const parRoute = new Map();
  const ajouter = (route) => {
    if (!parRoute.has(route)) {
      parRoute.set(route, {
        route,
        axe: { avant: null, apres: null, delta: null },
        overflow: { avant: null, apres: null },
        cibles: { avant: null, apres: null },
        h1: { avant: null, apres: null },
        lang: { avant: null, apres: null },
        skipLink: { avant: null, apres: null },
        p1: ROUTES_P1.includes(route),
      });
    }
    return parRoute.get(route);
  };

  for (const [type, filtre] of [
    ["avant", (nom) => /axe/i.test(nom)],
    ["apres", (nom) => /axe/i.test(nom)],
  ]) {
    for (const [route, { resultat }] of routesDepuis(sourcesGlobales, type, filtre)) {
      ajouter(route).axe[type] = violationsRoute(resultat);
    }
  }

  for (const type of ["avant", "apres"]) {
    for (const [route, { resultat }] of routesDepuis(
      sourcesGlobales,
      type,
      (nom) => /320/.test(nom),
    )) {
      const entree = ajouter(route);
      entree.overflow[type] = Number.isFinite(resultat.overflowPx)
        ? resultat.overflowPx
        : null;
      entree.cibles[type] = ciblesInlineHorsPerimetre(resultat);
      entree.h1[type] = resultat.h1Count ?? null;
      entree.lang[type] = resultat.lang ?? null;
      entree.skipLink[type] = resultat.skipLink ?? null;
    }
  }

  // `cibles.json` (T031) est la mesure de référence des cibles : règles plus
  // strictes et liens inline exclus.
  const ciblesGlobales = sourcesGlobales.find((s) => /^cibles/.test(s.nom));
  if (ciblesGlobales && Array.isArray(ciblesGlobales.donnees?.results)) {
    for (const resultat of ciblesGlobales.donnees.results) {
      if (!resultat?.route) continue;
      const entree = ajouter(resultat.route);
      entree.cibles.apres = Array.isArray(resultat.smallTargets)
        ? resultat.smallTargets.length
        : null;
      if (Number.isFinite(resultat.overflowPx)) {
        entree.overflow.apres = resultat.overflowPx;
      }
      entree.ciblesSource = ciblesGlobales.nom;
    }
  }

  for (const entree of parRoute.values()) {
    entree.axe.delta =
      entree.axe.avant === null || entree.axe.apres === null
        ? null
        : entree.axe.apres - entree.axe.avant;
  }

  return [...parRoute.values()].sort((a, b) => a.route.localeCompare(b.route, "fr"));
}

function budgetJs(sources, type) {
  let total = 0;
  let present = false;
  for (const source of sources) {
    if (!/-js/.test(source.nom)) continue;
    const attendu = type === "apres" ? estApres(source.nom) : estBaseline(source.nom);
    if (!attendu) continue;
    const ko = Number(source.donnees?.totalGzipKo);
    if (!Number.isFinite(ko)) continue;
    present = true;
    total += ko;
  }
  return present ? Math.round(total * 10) / 10 : null;
}

function echecsContraste(sources) {
  for (const source of sources) {
    const donnees = source.donnees ?? {};
    if (!/contraste/i.test(source.nom) && !Array.isArray(donnees.themes)) continue;
    if (typeof donnees.resume?.echecs === "number") return donnees.resume.echecs;
    if (Array.isArray(donnees.echecs)) return donnees.echecs.length;
    if (Array.isArray(donnees.themes)) {
      return donnees.themes.reduce(
        (total, theme) => total + (theme?.echecs?.length ?? 0),
        0,
      );
    }
  }
  return null;
}

// --- 4. Verdict de non-régression -------------------------------------------

function evaluerRegressions(comparaisons) {
  const regressions = [];
  for (const entree of comparaisons) {
    if (!entree.p1) continue;
    if (entree.axe.delta !== null && entree.axe.delta > 0) {
      regressions.push({
        route: entree.route,
        regle: "axe",
        detail: `${entree.axe.avant} → ${entree.axe.apres} nœud(s) en violation`,
      });
    }
    if ((entree.overflow.apres ?? 0) > 0) {
      regressions.push({
        route: entree.route,
        regle: "overflow-320",
        detail: `${entree.overflow.apres} px de débordement horizontal à 320 px`,
      });
    }
    // Les liens de texte inline sont déjà exclus par `mesurer-cibles.mjs`.
    if ((entree.cibles.apres ?? 0) > 0) {
      regressions.push({
        route: entree.route,
        regle: "cible-44px",
        detail: `${entree.cibles.apres} cible(s) sous ${seuilPx} px`,
      });
    }
  }
  return regressions;
}

// --- 5. Rendu du rapport ----------------------------------------------------

function formater(valeur, suffixe = "") {
  if (valeur === null || valeur === undefined) return "—";
  return `${valeur}${suffixe}`;
}

function ecart(avant, apres, suffixe = "") {
  if (typeof avant !== "number" || typeof apres !== "number") return "—";
  const delta = Math.round((apres - avant) * 10) / 10;
  const signe = delta > 0 ? "+" : "";
  const verdict = delta === 0 ? "stable" : delta < 0 ? "amélioré" : "régressé";
  return `${signe}${delta}${suffixe} (${verdict})`;
}

function rendreMarkdown(rapport) {
  const lignes = [
    "# Rapport agrégé — ergonomie et accessibilité (004)",
    "",
    "> Généré par `v2/scripts/audit-ergonomie.mjs --ecrire` (tâches T032/T093).",
    "> Ne pas éditer à la main : relancer le script après chaque campagne de",
    "> mesure (`baseline-*` avant, `apres-*` après).",
    "",
    "## 1. Méthode",
    "",
    "- Viewport de référence : 320 × 568 (mobile étroit), seuil de cible 44 px",
    "  (largeur **ou** hauteur), liens de texte inline exclus",
    "  (`contracts/ergonomie.md`).",
    "- Sources : JSON de `v2/.artifacts/ergonomie/` préfixés `baseline-` /",
    "  `avant-` (avant) et `apres-` (après) ; les absents sont ignorés.",
    "- Mesures anonymes, agrégées, sans PII (`contracts/mesure.md`) : aucune",
    "  donnée de session n'entre dans ce rapport.",
    `- Routes P1 surveillées : ${ROUTES_P1.join(", ")}.`,
    "",
    "## 2. Sources",
    "",
    "| Fichier | État |",
    "|---|---|",
  ];
  for (const ligne of rapport.sources) {
    lignes.push(`| \`${ligne.fichier}\` | ${ligne.etat} |`);
  }
  for (const source of rapport.sourcesSupplementaires) {
    lignes.push(`| \`${source}\` | lu (bonus) |`);
  }

  lignes.push(
    "",
    "## 3. Lighthouse (T075)",
    "",
    rapport.lighthouse.etat === "present"
      ? `Lighthouse disponible (${rapport.lighthouse.source ?? "version inconnue"}).`
      : "**Lighthouse absent** de cet environnement : aucune mesure de performance n'a été produite, la CI ne doit pas échouer pour autant.",
    "",
    "Commande à lancer dès que Lighthouse est disponible :",
    "",
    "```bash",
    rapport.lighthouse.commande,
    "```",
    "",
    "## 4. Synthèse avant / après",
    "",
    "| Métrique | Avant | Après | Écart | Cible |",
    "|---|---|---|---|---|",
  );
  for (const ligne of rapport.synthese) {
    lignes.push(
      `| ${ligne.metrique} | ${formater(ligne.avant)} | ${formater(ligne.apres)} | ${ecart(ligne.avant, ligne.apres)} | ${ligne.cible} |`,
    );
  }

  lignes.push(
    "",
    "## 5. Détail par route",
    "",
    "| Route | P1 | Violations axe avant | Violations axe après | Δ | Overflow avant | Overflow après | Cibles avant | Cibles après | h1 | lang | Skip link |",
    "|---|---|---|---|---|---|---|---|---|---|---|---|",
  );
  for (const entree of rapport.routes) {
    lignes.push(
      `| ${entree.route} | ${entree.p1 ? "oui" : "non"} | ${formater(entree.axe.avant)} | ${formater(entree.axe.apres)} | ${ecart(entree.axe.avant, entree.axe.apres)} | ${formater(entree.overflow.avant, " px")} | ${formater(entree.overflow.apres, " px")} | ${formater(entree.cibles.avant)} | ${formater(entree.cibles.apres)} | ${formater(entree.h1.apres ?? entree.h1.avant)} | ${formater(entree.lang.apres ?? entree.lang.avant)} | ${
        (entree.skipLink.apres ?? entree.skipLink.avant) === true
          ? "oui"
          : (entree.skipLink.apres ?? entree.skipLink.avant) === false
            ? "non"
            : "—"
      } |`,
    );
  }
  if (rapport.routes.length === 0) {
    lignes.push("| — | — | — | — | — | — | — | — | — | — | — | — |");
  }

  lignes.push(
    "",
    "> L'« après » des cibles vient de `cibles.json` (T031), dont les règles",
    "> d'exclusion (liens inline, seuil 44 px sur largeur **et** hauteur) sont",
    "> plus strictes que celles de `baseline-320.json` : un écart positif peut",
    "> refléter un durcissement de la mesure autant qu'une régression réelle.",
    "> De même, `baseline-axe.json` et `baseline-320.json` sont des instantanés :",
    "> s'ils ont été régénérés après le début de la refonte, l'« avant » ne",
    "> représente plus l'état d'origine et les deltas restent indicatifs.",
    "",
    "## 6. Gate de non-régression",
    "",
  );
  if (rapport.regressions.length === 0) {
    lignes.push(
      "Aucune régression détectée sur les routes P1 mesurées.",
      "",
      "(Un « avant » à `—` signifie que la mesure correspondante n'a pas été",
      "produite : le gate reste ouvert sur cette route.)",
    );
  } else {
    lignes.push("| Route | Règle | Détail |", "|---|---|---|");
    for (const regression of rapport.regressions) {
      lignes.push(
        `| ${regression.route} | ${regression.regle} | ${regression.detail} |`,
      );
    }
    lignes.push(
      "",
      `Verdict \`--verifier\` : **échec** (${rapport.regressions.length} régression(s), code de sortie 1).`,
    );
  }

  lignes.push(
    "",
    "## 7. Commandes",
    "",
    "```bash",
    "cd v2",
    "npm run audit:a11y:verifier            # axe → apres-axe.json + gate P1",
    "npm run audit:cibles                   # cibles 44 px → cibles.json",
    "npm run audit:ergonomie:public         # 320 px → apres-320-public.json + gate",
    "npm run audit:ergonomie:ecrire         # ce rapport",
    "npm run audit:ergonomie:verifier       # gate de non-régression",
    "npx vitest run tests/ergonomie/        # contrastes et garde-fous",
    "```",
    "",
    "> Les alias `audit:*` de `package.json` sont de simples raccourcis vers",
    "> `node scripts/...` : ils ne chargent aucun code dans l'application et",
    "> n'affectent donc pas le budget JS.",
    "",
  );

  return lignes.join("\n");
}

// --- 6. Exécution -----------------------------------------------------------

const sourcesGlobales = await chargerSources();
const comparaisons = comparer();
const regressions = evaluerRegressions(comparaisons);
const lighthouse = detecterLighthouse();

const rapport = {
  tache: "T032/T093",
  base,
  seuilPx,
  routesP1: ROUTES_P1,
  genereLe: new Date().toISOString(),
  lighthouse: { ...lighthouse, commande: COMMANDE_LIGHTHOUSE },
  sources: FICHIERS_ATTENDUS.map((fichier) => ({
    fichier,
    etat: sourceAbsente(sourcesGlobales, fichier) ? "absent (ignoré)" : "lu",
  })),
  sourcesSupplementaires: sourcesGlobales
    .map((source) => source.nom)
    .filter((nom) => !FICHIERS_ATTENDUS.includes(nom)),
  synthese: [
    {
      metrique: "Violations axe bloquantes+courantes (nœuds)",
      avant: comparaisons.reduce(
        (total, entree) => total + (entree.axe.avant ?? 0),
        0,
      ),
      apres: comparaisons.reduce(
        (total, entree) => total + (entree.axe.apres ?? 0),
        0,
      ),
      cible: "0",
    },
    {
      metrique: "Routes en débordement horizontal à 320 px",
      avant: comparaisons.filter((entree) => (entree.overflow.avant ?? 0) > 0).length,
      apres: comparaisons.filter((entree) => (entree.overflow.apres ?? 0) > 0).length,
      cible: "0 route",
    },
    {
      metrique: `Cibles tactiles < ${seuilPx} px (total)`,
      avant: comparaisons.reduce((total, entree) => total + (entree.cibles.avant ?? 0), 0),
      apres: comparaisons.reduce((total, entree) => total + (entree.cibles.apres ?? 0), 0),
      cible: "0 cible",
    },
    {
      metrique: "Budget JS mesuré (Ko gzip cumulés)",
      avant: budgetJs(sourcesGlobales, "avant"),
      apres: budgetJs(sourcesGlobales, "apres"),
      cible: "voyageur < 50, staff < 200",
    },
    {
      metrique: "Échecs de contraste (six thèmes)",
      avant: null,
      apres: echecsContraste(sourcesGlobales),
      cible: "0",
    },
  ],
  routes: comparaisons,
  regressions,
  verdict: regressions.length === 0 ? "ok" : "echec",
};

const markdown = rendreMarkdown(rapport);

if (lighthouse.etat === "absent") {
  console.warn(
    "Lighthouse : absent (paquet non installé). Aucune mesure de performance produite.",
  );
  console.warn(`Commande à lancer plus tard : ${COMMANDE_LIGHTHOUSE}`);
}

if (ecrire) {
  await mkdir(outDir, { recursive: true });
  await writeFile(rapportJson, `${JSON.stringify(rapport, null, 2)}\n`, "utf8");
  await writeFile(rapportMd, markdown, "utf8");
  await mkdir(path.dirname(rapportSpec), { recursive: true });
  await writeFile(rapportSpec, markdown, "utf8");
  console.log(`Rapport JSON : ${rapportJson}`);
  console.log(`Rapport MD   : ${rapportMd}`);
  console.log(`Rapport plan : ${rapportSpec}`);
} else {
  console.log("\n--- Rapport agrégé (aperçu, utiliser --ecrire) ---\n");
  console.log(markdown);
}

if (verifier) {
  if (regressions.length === 0) {
    console.log("\nGate ergonomie : OK (aucune régression sur les routes P1).");
  } else {
    console.error("\nGate ergonomie : ÉCHEC");
    for (const regression of regressions) {
      console.error(
        `  - ${regression.route} [${regression.regle}] ${regression.detail}`,
      );
    }
    process.exitCode = 1;
  }
}
