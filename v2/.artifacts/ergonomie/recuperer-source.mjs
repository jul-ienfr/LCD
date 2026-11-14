/**
 * Récupère le balisage d'une page depuis son chunk client compilé
 * (`build/client/_app/immutable/nodes/*.js`) : Svelte y conserve le HTML
 * statique sous forme de chaîne, ce qui permet de reconstruire une source
 * perdue. Utilisé le 2026-11-13 après un effacement accidentel.
 *
 * Usage : node .artifacts/ergonomie/recuperer-source.mjs <chunk.js> <sortie.html>
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const [, , entree, sortie] = process.argv;
if (!entree || !sortie) {
  console.error("usage : node recuperer-source.mjs <chunk.js> <sortie.html>");
  process.exit(2);
}

const code = await readFile(entree, "utf8");

/** Extrait toutes les chaînes littérales passées à r(...) / o(...) / x(...). */
const fragments = [];
const motif = /\bo\(`([\s\S]*?)`\)|\br\(`([\s\S]*?)`\)/g;
for (const m of code.matchAll(motif)) {
  fragments.push(m[1] ?? m[2]);
}

const entites = {
  "&#123;": "{",
  "&#125;": "}",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
};

const balisage = fragments
  .map((f) =>
    f
      .replace(/&#\d+;|&amp;|&lt;|&gt;|&quot;|&#39;/g, (e) => entites[e] ?? e)
      .replace(/>\s+</g, ">\n<"),
  )
  .join("\n\n<!-- ===== fragment ===== -->\n\n");

await mkdir(path.dirname(sortie), { recursive: true });
await writeFile(sortie, balisage, "utf8");

const titres = [...code.matchAll(/title\s*=\s*`([^`]+)`/g)].map((m) => m[1]);
console.log(`fragments : ${fragments.length}`);
console.log(`titre(s) : ${titres.join(" | ") || "(aucun)"}`);
console.log(`sortie : ${sortie} (${balisage.length} o)`);