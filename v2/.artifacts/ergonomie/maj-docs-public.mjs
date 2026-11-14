/**
 * Documentation de la passe « routes publiques » du 2026-11-13 et de la
 * friction R-10. Contenu dans `.artifacts/ergonomie/docs/`, ancres vérifiées.
 */
import { readFile, writeFile } from "node:fs/promises";

const docs = ".artifacts/ergonomie/docs";
const resultats = "../specs/004-ergonomie-experience-client/resultats.md";
const baselineMd = "../specs/004-ergonomie-experience-client/baseline/baseline-2026-11-13.md";
const changelog = "../docs/registres/changelog.md";
const etatReel = "../docs/registres/etat-reel.md";
const frictions = ".artifacts/ergonomie/frictions.md";
const tests = "TESTS-A-FAIRE.md";

const lire = (nom) => readFile(`${docs}/${nom}`, "utf8");
const erreurs = [];

async function insererAvant(fichier, ancre, contenu, marqueur) {
  const texte = await readFile(fichier, "utf8");
  if (marqueur && texte.includes(marqueur)) {
    console.log(`déjà présent : ${fichier}`);
    return;
  }
  if (!texte.includes(ancre)) {
    erreurs.push(`${fichier} : ancre absente « ${ancre.slice(0, 50)} »`);
    return;
  }
  await writeFile(fichier, texte.replace(ancre, `${contenu}\n${ancre}`), "utf8");
  console.log(`inséré dans ${fichier}`);
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

/* 1. resultats.md : § 2.4 avant « ## 3 », décisions A25/A26 en fin de tableau. */
await insererAvant(
  resultats,
  "## 3. Décisions prises pendant l'implémentation (T112)",
  await lire("resultats-2-4.md"),
  "### 2.4 Passe hors staff",
);
await insererAvant(
  resultats,
  "## 4. Écarts et reports assumés",
  await lire("resultats-decisions-2.md"),
  "| A25 |",
);

/* 2. baseline md : note de traçabilité sur le relevé reconstitué. */
const noteBaseline = `
## Note de traçabilité (2026-11-13)

Le relevé JSON \`v2/.artifacts/ergonomie/baseline-320.json\` a été écrasé par une
passe de mesure (variable de sortie mal nommée, friction R-10) puis
**reconstitué** à partir des valeurs de ce document et de
\`v2/.artifacts/ergonomie/rapport-ergonomie.json\` ; il porte désormais
\`reconstruit: true\`. Les valeurs agrégées ci-dessus restent la référence : le
détail par cible (tag, classe, dimensions) du relevé d'origine n'est pas
récupérable. Le script refuse depuis lors d'écraser un fichier \`baseline*\`
sans \`AUDIT_ECRASER=1\`.
`;
await ajouterEnFin(baselineMd, noteBaseline, "Note de traçabilité (2026-11-13)");

/* 3. Registres et frictions. */
await ajouterEnFin(changelog, await lire("changelog-public.txt"), "ergonomie-public-320-2026-11-13");
await ajouterEnFin(etatReel, await lire("etat-reel-public.txt"), "ROUTES PUBLIQUES 2026-11-13");
await ajouterEnFin(frictions, await lire("frictions-r10.md"), "R-10 — Une variable d'environnement");

/* 4. TESTS-A-FAIRE : commandes automatisées + point public. */
const texteTests = await readFile(tests, "utf8");
const ancienListe = "`npm run audit:cibles`,\n`npm run audit:ergonomie:ecrire`, `npm run audit:ergonomie:verifier`,\n`npm run audit:ergonomie:staff`, `npx vitest run tests/ergonomie/`.";
const nouveauListe = "`npm run audit:a11y:public`, `npm run audit:cibles`,\n`npm run audit:ergonomie:ecrire`, `npm run audit:ergonomie:verifier`,\n`npm run audit:ergonomie:staff`, `npm run audit:ergonomie:public`,\n`npx vitest run tests/ergonomie/`.";
if (texteTests.includes(ancienListe)) {
  await writeFile(tests, texteTests.replace(ancienListe, nouveauListe), "utf8");
  console.log("liste des commandes mise à jour dans TESTS-A-FAIRE.md");
} else if (texteTests.includes("audit:ergonomie:public")) {
  console.log("liste déjà à jour dans TESTS-A-FAIRE.md");
} else {
  erreurs.push("TESTS-A-FAIRE.md : liste des commandes introuvable");
}

const pointPublic = `- [x] **Les 21 routes publiques au même contrat 320 px et axe** — **fait le
  2026-11-13** : \`npm run audit:ergonomie:public\` et \`npm run audit:a11y:public\`
  dérivent les routes hors staff du disque et donnent **0 cible sous 44 px,
  0 débordement, 0 champ sans étiquette, 0 violation axe** (premier relevé :
  \`/journal\` 188 cibles, \`/tarifs\` 2, \`/mot-de-passe-oublie\` 1). \`/login\` et
  \`/two-factor\` sont exclues avec motif (session ou 2FA en cours) ; test négatif
  au seuil 60 px : 216 cibles, sortie 1. Relevé :
  \`v2/.artifacts/ergonomie/apres-320-public.json\`.
`;
await insererAvant(
  tests,
  "- [ ] **Lighthouse rejoué après tout changement d'images, de police ou de CSS** :",
  pointPublic,
  "Les 21 routes publiques au même contrat",
);

if (erreurs.length > 0) {
  console.error(`\n${erreurs.length} problème(s) :`);
  for (const erreur of erreurs) console.error(`  - ${erreur}`);
  process.exit(1);
}
console.log("\nDocumentation mise à jour.");