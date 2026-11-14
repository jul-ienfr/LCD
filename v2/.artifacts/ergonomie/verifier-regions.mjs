/**
 * Contrôle statique de la passe « zones défilantes accessibles » : chaque
 * élément `overflow-x-auto` doit porter `tabindex` (une seule fois), et le
 * `svelte-ignore` qui évite l'avertissement Svelte. Aucun doublon toléré.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

async function fichiersSvelte(dossier) {
  const sortie = [];
  for (const entree of await readdir(dossier, { withFileTypes: true })) {
    const chemin = path.join(dossier, entree.name);
    if (entree.isDirectory()) sortie.push(...(await fichiersSvelte(chemin)));
    else if (entree.name.endsWith(".svelte")) sortie.push(chemin);
  }
  return sortie;
}

const fichiers = await fichiersSvelte("src/routes");
let zones = 0;
let focusables = 0;
let sansNom = [];
let doublons = [];
let ignores = 0;

for (const fichier of fichiers) {
  const texte = await readFile(fichier, "utf8");
  ignores += (texte.match(/svelte-ignore a11y_no_noninteractive_tabindex/g) ?? []).length;
  const lignes = texte.split("\n");
  for (let i = 0; i < lignes.length; i++) {
    if (!/class="[^"]*overflow-x-auto/.test(lignes[i])) continue;
    zones++;
    const ouverture = lignes.slice(i, i + 8).join("\n");
    const finBalise = ouverture.indexOf(">");
    const balise = ouverture.slice(0, finBalise + 1);
    const nbTabindex = (balise.match(/tabindex="0"/g) ?? []).length;
    if (nbTabindex > 1) doublons.push(`${fichier}:${i + 1}`);
    if (nbTabindex === 1) {
      focusables++;
      if (!/aria-label|aria-labelledby/.test(balise)) sansNom.push(`${fichier}:${i + 1}`);
    }
  }
}

console.log(`zones à défilement horizontal : ${zones}`);
console.log(`dont focusables : ${focusables}`);
console.log(`sans nom accessible : ${sansNom.length}${sansNom.length ? ` (${sansNom.join(", ")})` : ""}`);
console.log(`doublons de tabindex : ${doublons.length}${doublons.length ? ` (${doublons.join(", ")})` : ""}`);
console.log(`commentaires svelte-ignore : ${ignores}`);

if (sansNom.length + doublons.length > 0) process.exit(1);