/**
 * Ajoute à `audit-a11y.mjs` :
 *   1. le mode `--verifier` (écrit `apres-axe.json` et applique le gate P1) ;
 *   2. le garde-fou du relevé de référence (fichier `baseline*` protégé),
 *      symétrique de celui d'`audit-ergonomie.mjs` (friction R-10) ;
 *   3. le gate étendu au périmètre `--verifier`.
 */
import { access, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const fichier = "scripts/audit-a11y.mjs";
let texte = await readFile(fichier, "utf8");
const erreurs = [];
function remplacer(avant, apres, obligatoire = true) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    erreurs.push(
      `remplacement non unique (${occurrences}) : ${avant.slice(0, 60)}`,
    );
    return;
  }
  texte = texte.replace(avant, apres);
}

/* 1. Lecture des options. */
remplacer(
  `const modePublic = process.argv.slice(2).includes("--public");`,
  `const modePublic = process.argv.slice(2).includes("--public");
const modeVerifier = process.argv.slice(2).includes("--verifier");`,
);

/* 2. Nom de sortie par défaut selon le mode. */
remplacer(
  `const outName = process.env.AUDIT_OUT_NAME ?? "baseline-axe.json";`,
  `const outName =
  process.env.AUDIT_OUT_NAME ??
  (modeVerifier ? "apres-axe.json" : "baseline-axe.json");`,
);

/* 3. Garde-fou : ne jamais écraser le relevé de référence. */
remplacer(
  `await browser.close();
const target = path.join(outDir, outName);`,
  `await browser.close();
const target = path.join(outDir, outName);
/**
 * Garde-fou (friction R-10) : le relevé de référence axe n'est jamais écrasé
 * par une passe de mesure. Écraser volontairement :
 *   AUDIT_ECRASER=1 AUDIT_OUT_NAME=baseline-axe.json npm run audit:a11y
 * Pour mesurer sans risque : \`npm run audit:a11y:verifier\` (écrit apres-axe.json).
 */
if (/baseline/i.test(outName) && process.env.AUDIT_ECRASER !== "1") {
  const existe = await access(target).then(
    () => true,
    () => false,
  );
  if (existe) {
    console.error(
      \`Refus d'écraser le relevé de référence \${outName} (déjà présent).\`,
    );
    console.error(
      "  Mesurer sans risque : npm run audit:a11y:verifier (écrit apres-axe.json).",
    );
    console.error(
      "  Écraser volontairement : AUDIT_ECRASER=1 AUDIT_OUT_NAME=baseline-axe.json.",
    );
    process.exit(2);
  }
}`,
);

/* 4. Gate étendu au mode vérification P1. */
remplacer(
  `if (modeStaff || modePublic) {
  const perimetre = modePublic ? "public" : "staff";`,
  `if (modeStaff || modePublic || modeVerifier) {
  const perimetre = modeStaff ? "staff" : modePublic ? "public" : "P1";`,
);

await writeFile(fichier, texte, "utf8");
if (erreurs.length > 0) {
  console.error("Échecs :");
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exit(1);
}
console.log("Mode --verifier et garde-fou du baseline axe ajoutés.");