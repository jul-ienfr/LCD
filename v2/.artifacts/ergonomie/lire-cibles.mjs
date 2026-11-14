/**
 * Lit un relevé 320 px et affiche, route par route, les cibles sous 44 px
 * (type, classe, libellé) groupées par signature, pour trier les causes sans
 * ouvrir chaque fichier.
 *
 * Usage : node <ce fichier> public-320-sonde.json
 */
import { readFile } from "node:fs/promises";

const fichier = process.argv[2] ?? "apres-320-staff.json";
const rapport = JSON.parse(
  await readFile(`.artifacts/ergonomie/${fichier}`, "utf8"),
);
const routes = rapport.results ?? rapport.pages ?? rapport;
const liste = Array.isArray(routes) ? routes : Object.values(routes);

for (const route of liste) {
  const cibles = route.smallTargets ?? [];
  if (cibles.length === 0) continue;
  const groupes = new Map();
  for (const cible of cibles) {
    const cle = `${cible.type ?? cible.tag ?? "?"}|${cible.classe ?? ""}|${cible.libelleHtml ?? cible.libelle ?? ""}`
      .replace(/\s+/g, " ")
      .slice(0, 160);
    groupes.set(cle, (groupes.get(cle) ?? 0) + 1);
  }
  console.log(
    `\n=== ${route.route ?? route.url} : ${cibles.length} cible(s), ${groupes.size} signature(s)`,
  );
  for (const [cle, nombre] of [...groupes.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    console.log(`  ${String(nombre).padStart(3)} × ${cle}`);
  }
}