/**
 * Applique les mises à jour de documentation de la passe d'accessibilité staff
 * du 2026-11-13. Le contenu vit dans `.artifacts/ergonomie/docs/*.md|txt`
 * (écrit sans échappement) ; ce script ne fait que l'insérer et vérifie chaque
 * ancre avant d'écrire.
 */
import { readFile, writeFile } from "node:fs/promises";

const docs = ".artifacts/ergonomie/docs";
const resultats = "../specs/004-ergonomie-experience-client/resultats.md";
const changelog = "../docs/registres/changelog.md";
const etatReel = "../docs/registres/etat-reel.md";
const frictions = ".artifacts/ergonomie/frictions.md";
const tests = "TESTS-A-FAIRE.md";

const erreurs = [];
const lire = (nom) => readFile(`${docs}/${nom}`, "utf8");

/** Insère `contenu` juste avant `ancre`. */
async function insererAvant(fichier, ancre, contenu, marqueur) {
  const texte = await readFile(fichier, "utf8");
  if (marqueur && texte.includes(marqueur)) {
    console.log(`déjà présent : ${fichier}`);
    return;
  }
  if (!texte.includes(ancre)) {
    erreurs.push(`${fichier} : ancre absente « ${ancre.slice(0, 60)} »`);
    return;
  }
  await writeFile(
    fichier,
    texte.replace(ancre, `${contenu}\n${ancre}`),
    "utf8",
  );
  console.log(`inséré avant « ${ancre.slice(0, 40)} » dans ${fichier}`);
}

/** Remplace la section du point « routes staff » de TESTS-A-FAIRE. */
async function remplacerPointTests() {
  const texte = await readFile(tests, "utf8");
  const ancien = texte.indexOf("- [x] **Les 68 routes staff");
  if (ancien < 0) {
    if (texte.includes("Les 70 routes staff au même contrat")) {
      console.log("déjà présent : TESTS-A-FAIRE.md");
      return;
    }
    erreurs.push(`${tests} : point « Les 68 routes staff » introuvable`);
    return;
  }
  const fin = texte.indexOf("- [ ] **Lighthouse rejoué", ancien);
  if (fin < 0) {
    erreurs.push(`${tests} : point suivant introuvable`);
    return;
  }
  const nouveau = (await lire("tests-nouveau.md")).replace(/\s*$/, "\n");
  await writeFile(
    tests,
    `${texte.slice(0, ancien)}${nouveau}${texte.slice(fin)}`,
    "utf8",
  );
  console.log("point « routes staff » remplacé dans TESTS-A-FAIRE.md");
}

async function ajouterEnFin(fichier, contenu, marqueur) {
  const texte = await readFile(fichier, "utf8");
  if (texte.includes(marqueur)) {
    console.log(`déjà présent : ${fichier}`);
    return;
  }
  await writeFile(
    fichier,
    `${texte.replace(/\s*$/, "\n")}${contenu.replace(/\s*$/, "\n")}\n`,
    "utf8",
  );
  console.log(`ajouté en fin de ${fichier}`);
}

await insererAvant(
  resultats,
  "## 3. Décisions prises pendant l'implémentation (T112)",
  await lire("resultats-2-3.md"),
  "### 2.3 Passe d'accessibilité staff",
);
await insererAvant(
  resultats,
  "## 4. Écarts et reports assumés",
  await lire("resultats-decisions.md"),
  "| A22 |",
);
await remplacerPointTests();
await ajouterEnFin(changelog, await lire("changelog.txt"), "a11y-staff-2026-11-13");
await ajouterEnFin(etatReel, await lire("etat-reel.txt"), "ACCESSIBILITÉ STAFF 2026-11-13");
await ajouterEnFin(frictions, await lire("frictions-r09.md"), "R-09 — Un remplacement de masse");

if (erreurs.length > 0) {
  console.error(`\n${erreurs.length} problème(s) :`);
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exit(1);
}
console.log("\nDocumentation mise à jour.");