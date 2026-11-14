/**
 * Ajoute le périmètre public au script d'audit axe, en symétrie du mode staff :
 * `--public` dérive les routes hors staff du disque et applique le même gate.
 * Remplacements littéraux vérifiés un par un.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "scripts/audit-a11y.mjs";
let texte = await readFile(fichier, "utf8");

const remplacements = [
  // 1. Options et dérivation des routes publiques.
  [
    `const modeStaff = process.argv.slice(2).includes("--staff");`,
    `const modeStaff = process.argv.slice(2).includes("--staff");
const modePublic = process.argv.slice(2).includes("--public");

if (modeStaff && modePublic) {
  console.error("Choisir un seul périmètre : --staff ou --public.");
  process.exit(2);
}`,
  ],
  [
    `const routes = modeStaff
  ? await routesStaff()
  : (process.env.AUDIT_PAGES ?? "/,/reserver,/login,/voyageur")`,
    `/**
 * Routes hors staff du dépôt, dérivées du disque. \`/login\` (redirige vers
 * \`/hote\` avec une session) et \`/two-factor\` (atteignable seulement en cours
 * de 2FA) sont écartées, comme dans \`scripts/audit-ergonomie.mjs --public\`.
 */
const ROUTES_PUBLIQUES_EXCLUES = ["login", "two-factor"];

async function routesPubliques() {
  const racine = path.join(process.cwd(), "src", "routes");
  const trouvees = [];
  async function parcourir(dossier, segments) {
    const entrees = await readdir(dossier, { withFileTypes: true });
    if (entrees.some((entree) => entree.isFile() && entree.name === "+page.svelte")) {
      trouvees.push(segments.length === 0 ? "/" : \`/\${segments.join("/")}\`);
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
    : (process.env.AUDIT_PAGES ?? "/,/reserver,/login,/voyageur")`,
  ],
];

for (const [avant, apres] of remplacements) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(
      `Remplacement non unique (${occurrences}) pour : ${avant.slice(0, 70)}`,
    );
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
}

/* 2. Le mode public exige une session (comme le mode staff) et écrit son
 *    propre fichier par défaut. Bloc de contrôle après la définition des
 *    routes : on l'insère avant la lecture de `AUDIT_OUT_NAME`. */
const ancreSortie = `const outName = process.env.AUDIT_OUT_NAME ?? "baseline-axe.json";`;
if (!texte.includes(ancreSortie)) {
  console.error("Ancre de sortie introuvable.");
  process.exit(1);
}
texte = texte.replace(
  ancreSortie,
  `if (modePublic) {
  process.env.AUDIT_OUT_NAME ??= "apres-axe-public.json";
  console.log(
    \`Mode public : \${routes.length} routes hors staff dérivées de src/routes (\${ROUTES_PUBLIQUES_EXCLUES.join(", ")} exclues).\`,
  );
}

${ancreSortie}`,
);

/* 3. Gate commun aux deux périmètres. */
const ancienGate = `/**
 * Gate staff : aucune violation \`serious\`/\`critical\` sur les routes staff
 * (WCAG 2.0/2.1 A+AA, viewport 320 px). Sortie 1 si le contrat casse, pour
 * être rejouable en vérification.
 */
if (modeStaff) {`;
const nouveauGate = `/**
 * Gate axe : aucune violation \`serious\`/\`critical\` sur les routes du périmètre
 * (WCAG 2.0/2.1 A+AA, viewport 320 px). Sortie 1 si le contrat casse, pour être
 * rejouable en vérification :
 *   - \`npm run audit:a11y:staff\`  → surfaces /hote, /supervision, …
 *   - \`npm run audit:a11y:public\` → tout le reste du dépôt
 */
if (modeStaff || modePublic) {
  const perimetre = modePublic ? "public" : "staff";`;
if (!texte.includes(ancienGate)) {
  console.error("Bloc de gate introuvable.");
  process.exit(1);
}
texte = texte.replace(ancienGate, nouveauGate);
texte = texte.replace(
  "`\\nBilan a11y staff : ",
  "`\\nBilan a11y ${perimetre} : ",
);
texte = texte.replace(
  `console.error("Gate a11y staff : ÉCHEC (code de sortie 1).");`,
  "console.error(`Gate a11y ${perimetre} : ÉCHEC (code de sortie 1).`);",
);
texte = texte.replace(
  `console.log("Gate a11y staff : OK (0 violation serious/critical, 0 erreur).");`,
  "console.log(\n    `Gate a11y ${perimetre} : OK (0 violation serious/critical, 0 erreur).`,\n  );",
);

await writeFile(fichier, texte, "utf8");
console.log("Périmètre public ajouté à l'audit axe.");