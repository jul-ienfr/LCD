/**
 * Aligne la documentation générée (rapport agrégé) sur les nouveaux modes :
 * `npm run audit:a11y:verifier` (mesure + gate P1, écrit `apres-axe.json`) et
 * les périmètres `:staff` / `:public`.
 *
 * Avant toute régénération, `rapport-ergonomie.json` est archivé : il contient
 * les seules valeurs « avant » encore disponibles (friction R-10).
 */
import { copyFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dossier = ".artifacts/ergonomie";
for (const nom of ["rapport-ergonomie.json", "rapport-ergonomie.md"]) {
  await copyFile(
    path.join(dossier, nom),
    path.join(dossier, nom.replace(/\.(json|md)$/, "-archive-2026-11-13.$1")),
  );
}
console.log("rapport-ergonomie.* archivé avant régénération.");

const fichier = "scripts/audit-ergonomie.mjs";
let texte = await readFile(fichier, "utf8");
const remplacements = [
  [
    "    \"npm run audit:a11y                     # axe → baseline-axe.json\",",
    "    \"npm run audit:a11y:verifier            # axe → apres-axe.json + gate P1\",",
  ],
  [
    "    \"npm run audit:ergonomie                # 320 px → baseline-320.json\",",
    "    \"npm run audit:ergonomie:public         # 320 px → apres-320-public.json + gate\",",
  ],
];

for (const [avant, apres] of remplacements) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(`Remplacement non unique (${occurrences}) : ${avant.slice(0, 60)}`);
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
}
await writeFile(fichier, texte, "utf8");
console.log("Textes du rapport agrégé mis à jour.");