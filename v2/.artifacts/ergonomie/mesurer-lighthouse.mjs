/**
 * Mesure Lighthouse (T003 / T081) sur le serveur de démonstration.
 *
 * Outil externe, jamais installé dans le dépôt : Lighthouse 13 est récupéré par
 * `npx --yes lighthouse@13` puis exécuté depuis le cache npx
 * (`cli/index.js` appelé par `node`), ce qui évite le problème Windows de
 * `spawnSync("npx")` — `npx` n'y est qu'un `.ps1`/`.cmd`. Chrome est celui de
 * Playwright, désigné par `CHROME_PATH`, pour ne dépendre d'aucune installation
 * système.
 *
 * Usage :  node .artifacts/ergonomie/mesurer-lighthouse.mjs [mobile|desktop|les-deux]
 * Sortie : .artifacts/ergonomie/lighthouse/<preset>-<route>.json
 *          .artifacts/ergonomie/lighthouse-resume.{json,md}
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const BASE = process.env.BASE ?? "http://127.0.0.1:4173";
const CHROME =
  process.env.CHROME_PATH ??
  `${process.env.USERPROFILE}\\AppData\\Local\\ms-playwright\\chromium-1248\\chrome-win64\\chrome.exe`;
const DOSSIER = ".artifacts/ergonomie/lighthouse";
/** Profil Chrome préparé par `preparer-profil-hote.mjs` (session hôte). */
const PROFIL = process.env.PROFIL ?? ".artifacts/profil-chrome-hote";
/**
 * Le build `adapter-node` est servi en http derrière un proxy : il attend le
 * protocole et l'hôte dans ces en-têtes (`PROTOCOL_HEADER`/`HOST_HEADER`), sans
 * quoi il suppose `https` et rejette les POST de formulaire en cross-site.
 */
const ENTETES = JSON.stringify({
  "x-forwarded-proto": "http",
  "x-forwarded-host": new URL(BASE).host,
});

/** Chemin du `cli/index.js` de Lighthouse dans le cache npx. */
function cliLighthouse() {
  const cache = join(process.env.LOCALAPPDATA ?? "", "npm-cache", "_npx");
  if (!existsSync(cache)) return null;
  for (const dossier of readdirSync(cache)) {
    const cli = join(cache, dossier, "node_modules", "lighthouse", "cli", "index.js");
    if (existsSync(cli)) return cli;
  }
  return null;
}

// Routes publiques : mesurables sans session.
// `/voyageur` (état « sans lien signé », la seule état atteignable sans lien
// valide) et `/hote` (session hôte préparée dans un profil Chrome persistant)
// complètent le parcours mesuré.
const ROUTES = [
  { chemin: "/", nom: "accueil" },
  { chemin: "/reserver", nom: "reserver" },
  { chemin: "/voyageur", nom: "voyageur" },
  { chemin: "/login", nom: "login" },
  { chemin: "/aide", nom: "aide" },
  { chemin: "/hote", nom: "hote", session: true },
];

const profilPret = () =>
  existsSync(PROFIL) &&
  (existsSync(join(PROFIL, "Default", "Cookies")) || existsSync(join(PROFIL, "Default", "Network", "Cookies")));

const PRESETS = (() => {
  const choix = process.argv[2] ?? "mobile";
  if (choix === "les-deux") return ["mobile", "desktop"];
  if (choix === "desktop") return ["desktop"];
  return ["mobile"];
})();

mkdirSync(DOSSIER, { recursive: true });

const CLI = cliLighthouse();
if (!CLI) {
  console.error(
    "Lighthouse introuvable dans le cache npx : lancer d'abord\n" +
      "  npx --yes lighthouse@13 --version",
  );
  process.exit(1);
}
console.log(`Lighthouse : ${CLI}`);
console.log(`Chrome     : ${CHROME}\n`);

for (const preset of PRESETS) {
  for (const route of ROUTES) {
    if (route.session && !profilPret()) {
      console.log(`lighthouse ${preset} ${route.chemin} ... ignoré (profil hôte absent)`);
      continue;
    }
    const sortie = `${DOSSIER}/${preset}-${route.nom}.json`;
    const drapeaux = ["--headless=new", "--no-sandbox", "--disable-dev-shm-usage"];
    if (route.session) drapeaux.push(`--user-data-dir=${join(process.cwd(), PROFIL)}`);
    const args = [
      CLI,
      `${BASE}${route.chemin}`,
      "--quiet",
      "--output=json",
      `--output-path=${sortie}`,
      "--only-categories=performance,accessibility,best-practices,seo",
      `--extra-headers=${ENTETES}`,
      `--chrome-flags=${drapeaux.join(" ")}`,
    ];
    if (preset === "desktop") args.splice(1, 0, "--preset=desktop");
    process.stdout.write(`lighthouse ${preset} ${route.chemin} … `);
    const execution = spawnSync(process.execPath, args, {
      stdio: "inherit",
      env: { ...process.env, CHROME_PATH: CHROME },
    });
    process.stdout.write(
      execution.status === 0 ? "ok\n" : `échec (${execution.status ?? execution.error?.message})\n`,
    );
  }
}

/** @param {any} rapport */
function resume(rapport) {
  const categorie = (id) => {
    const note = rapport.categories?.[id]?.score;
    return typeof note === "number" ? Math.round(note * 100) : null;
  };
  const audit = (id) => {
    const valeur = rapport.audits?.[id]?.numericValue;
    return typeof valeur === "number" ? Math.round(valeur * 100) / 100 : null;
  };
  return {
    url: rapport.finalDisplayedUrl ?? rapport.requestedUrl,
    performance: categorie("performance"),
    accessibilite: categorie("accessibility"),
    bonnesPratiques: categorie("best-practices"),
    seo: categorie("seo"),
    lcpMs: audit("largest-contentful-paint"),
    cls: audit("cumulative-layout-shift"),
    tbtMs: audit("total-blocking-time"),
    fcpMs: audit("first-contentful-paint"),
  };
}

const lignes = [];
for (const preset of ["mobile", "desktop"]) {
  for (const route of ROUTES) {
    const chemin = `${DOSSIER}/${preset}-${route.nom}.json`;
    if (!existsSync(chemin)) continue;
    const rapport = JSON.parse(readFileSync(chemin, "utf8"));
    lignes.push({ preset, route: route.chemin, ...resume(rapport) });
  }
}

writeFileSync(
  ".artifacts/ergonomie/lighthouse-resume.json",
  JSON.stringify({ genereLe: new Date().toISOString(), base: BASE, mesures: lignes }, null, 2),
  "utf8",
);

const entete =
  "| Appareil | Route | Perf | A11y | BP | SEO | LCP (ms) | CLS | TBT (ms) | FCP (ms) |\n" +
  "| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |\n";
const corps = lignes
  .map((l) =>
    `| ${l.preset} | \`${l.route}\` | ${l.performance} | ${l.accessibilite} | ${l.bonnesPratiques} | ${l.seo} | ${l.lcpMs} | ${l.cls} | ${l.tbtMs} | ${l.fcpMs} |`,
  )
  .join("\n");
writeFileSync(
  ".artifacts/ergonomie/lighthouse-resume.md",
  `# Lighthouse — ${new Date().toISOString().slice(0, 10)}\n\n${entete}${corps}\n`,
  "utf8",
);

console.log(`\n${lignes.length} mesures → .artifacts/ergonomie/lighthouse-resume.md`);
