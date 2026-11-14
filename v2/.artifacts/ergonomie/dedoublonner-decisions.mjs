/**
 * Supprime les deux lignes de décision dupliquées (A15, A16) qui précédaient
 * A9 dans `resultats.md` : les versions conservées (après A14, dans l'ordre)
 * sont les versions affinées.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "../specs/004-ergonomie-experience-client/resultats.md";
const lignes = (await readFile(fichier, "utf8")).split(/\r?\n/);

const index = lignes.findIndex(
  (ligne, i) =>
    ligne.startsWith("| A15 |") && lignes[i + 1]?.startsWith("| A16 |"),
);
if (index === -1) {
  console.error("Paire A15/A16 dupliquée introuvable.");
  process.exit(1);
}
const doublons = lignes.filter((ligne) => ligne.startsWith("| A15 |"));
if (doublons.length !== 2) {
  console.error(`Attendu 2 lignes A15, trouvé ${doublons.length}.`);
  process.exit(1);
}

lignes.splice(index, 2);
await writeFile(fichier, lignes.join("\n"), "utf8");
console.log(`Lignes ${index + 1} et ${index + 2} supprimées (doublons A15/A16).`);