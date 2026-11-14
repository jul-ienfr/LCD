/**
 * Contrôle d'intégrité UTF-8 des fichiers touchés : détecte le mojibake
 * (double encodage), les caractères de remplacement et l'absence d'accents
 * là où il devrait y en avoir. Sortie 1 si un fichier est douteux.
 */
import { readFile } from "node:fs/promises";

const fichiers = [
  "TESTS-A-FAIRE.md",
  "../specs/004-ergonomie-experience-client/resultats.md",
  "../docs/registres/changelog.md",
  "../docs/registres/etat-reel.md",
  ".artifacts/ergonomie/frictions.md",
  "package.json",
  "src/routes/supervision/apparence/+page.svelte",
  "src/routes/hote/rgpd/+page.svelte",
  "src/routes/hote/etats-des-lieux/+page.svelte",
  "src/routes/hote/etats-des-lieux/[id]/+page.svelte",
];

let suspects = 0;
for (const fichier of fichiers) {
  const texte = await readFile(fichier, "utf8");
  const mojibake = (texte.match(/Ã|Â|â€/g) ?? []).length;
  const remplacement = (texte.match(/\uFFFD/g) ?? []).length;
  const accentsAttendus = /\.(md|svelte)$/.test(fichier);
  const accents = /[éèàçûô]/.test(texte);
  const douteux = mojibake > 0 || remplacement > 0 || (accentsAttendus && !accents);
  if (douteux) suspects++;
  console.log(
    `${douteux ? "SUSPECT" : "ok     "} ${fichier} : mojibake=${mojibake} U+FFFD=${remplacement} accents=${accents}`,
  );
}

if (suspects > 0) {
  console.error(`\n${suspects} fichier(s) douteux.`);
  process.exit(1);
}
console.log("\nEncodage UTF-8 conforme.");