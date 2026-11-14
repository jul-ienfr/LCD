/**
 * Restaure un fichier source depuis le sourcemap du build serveur
 * (`build/server/entries/pages/**\/*.svelte.js.map` → `sourcesContent`).
 * Les sourcemaps embarquent la source d'origine : c'est la récupération
 * exacte, utilisée le 2026-11-13 après un effacement accidentel.
 *
 * Usage : node .artifacts/ergonomie/restaurer-source.mjs <chemin-source-relatif>
 *         node .artifacts/ergonomie/restaurer-source.mjs --tous
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const racineBuild = "build/server";
const cible = process.argv[2];

if (!cible) {
  console.error("usage : node restaurer-source.mjs <chemin|--tous>");
  process.exit(2);
}

/** Liste récursivement les fichiers correspondant à un motif de nom. */
async function lister(dossier, suffixe) {
  const entrees = await readdir(dossier, { withFileTypes: true });
  const sortie = [];
  for (const entree of entrees) {
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) sortie.push(...(await lister(chemin, suffixe)));
    else if (entree.name.endsWith(suffixe)) sortie.push(chemin);
  }
  return sortie;
}

const maps = await lister(racineBuild, ".js.map");
const index = new Map();
for (const map of maps) {
  let contenu;
  try {
    contenu = JSON.parse(await readFile(map, "utf8"));
  } catch {
    continue;
  }
  if (!contenu.sources || !contenu.sourcesContent) continue;
  contenu.sources.forEach((source, i) => {
    const absolu = path.resolve(path.dirname(map), source);
    const relatif = path.relative(process.cwd(), absolu).replaceAll("\\", "/");
    if (contenu.sourcesContent[i]) index.set(relatif, contenu.sourcesContent[i]);
  });
}

if (cible === "--tous") {
  console.log(`sources disponibles : ${index.size}`);
  process.exit(0);
}

const normalise = cible.replaceAll("\\", "/").replace(/^\.\//, "");
const source = index.get(normalise);
if (!source) {
  console.error(`source absente des sourcemaps : ${normalise}`);
  process.exit(1);
}
const existe = await stat(normalise).then(
  (s) => s.size,
  () => null,
);
if (existe !== null && existe > 0) {
  console.error(`refus d'écraser ${normalise} (${existe} octets déjà présents)`);
  process.exit(1);
}
await writeFile(normalise, source, "utf8");
console.log(`restauré : ${normalise} (${source.length} o)`);