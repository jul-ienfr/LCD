/**
 * Réparation : `baseline-320.json` a été écrasé par une passe de mesure
 * publique (l'option de sortie attendue est `AUDIT_FICHIER`, pas
 * `AUDIT_OUT_NAME`, donc la passe a écrit dans le fichier de référence).
 *
 * 1. Déplace le relevé public vers `public-320-sonde.json`.
 * 2. Reconstitue `baseline-320.json` à partir des seules valeurs d'origine
 *    encore documentées (`rapport-ergonomie.json`, généré avant l'écrasement,
 *    et `specs/004-ergonomie-experience-client/baseline/baseline-2026-11-13.md`).
 *    Le détail par cible n'est pas récupérable : le champ `reconstruit` le dit.
 */
import { access, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const dossier = ".artifacts/ergonomie";
const baseline = path.join(dossier, "baseline-320.json");
const sauvegarde = path.join(dossier, "public-320-sonde.json");

/* 1. Conserver le relevé public sous son vrai nom. */
try {
  await access(sauvegarde);
  console.log(`${sauvegarde} existe déjà : rien déplacé.`);
} catch {
  await rename(baseline, sauvegarde);
  console.log(`relevé public conservé : ${sauvegarde}`);
}

/* 2. Valeurs d'origine, telles que documentées avant l'écrasement. */
const rapport = JSON.parse(
  await readFile(path.join(dossier, "rapport-ergonomie.json"), "utf8"),
);
const avant = rapport.routes.filter((route) => route.cibles.avant !== null);
if (avant.length === 0) {
  console.error("Aucune valeur d'origine dans rapport-ergonomie.json : arrêt.");
  process.exit(1);
}

const results = avant.map((entree) => ({
  route: entree.route,
  status: 200,
  overflowPx: entree.overflow.avant,
  smallTargets: Array.from({ length: entree.cibles.avant }, (_, index) => ({
    tag: "reconstruit",
    type: "reconstruit",
    name: null,
    classe: null,
    libelleHtml: `cible ${index + 1} (détail non récupérable)`,
    text: null,
    width: null,
    height: null,
  })),
  h1Count: entree.h1.avant,
  lang: entree.lang.avant,
  skipLink: entree.skipLink.avant,
  violationsAxe: entree.axe.avant,
}));

const reconstitue = {
  base: rapport.base,
  routes: results.map((r) => r.route),
  reconstruit: true,
  source:
    "reconstruit le 2026-11-13 après écrasement accidentel du relevé d'origine ; valeurs avant reprises de rapport-ergonomie.json (généré le " +
    `${rapport.genereLe} à partir du JSON d'origine) et de specs/004-ergonomie-experience-client/baseline/baseline-2026-11-13.md ; ` +
    "le détail par cible (tag, classe, dimensions) n'est pas récupérable",
  results,
};

await writeFile(baseline, `${JSON.stringify(reconstitue, null, 2)}\n`, "utf8");
console.log(
  `baseline-320.json reconstruit : ${results.length} routes, ${results.reduce((n, r) => n + r.smallTargets.length, 0)} cible(s).`,
);