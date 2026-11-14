/**
 * Intègre le durcissement des trois commandes de mesure dans la documentation :
 * § 2.4 de `resultats.md`, décision A26, friction R-10, registres.
 */
import { readFile, writeFile } from "node:fs/promises";

const docs = ".artifacts/ergonomie/docs";
const resultats = "../specs/004-ergonomie-experience-client/resultats.md";
const frictions = ".artifacts/ergonomie/frictions.md";
const changelog = "../docs/registres/changelog.md";
const etatReel = "../docs/registres/etat-reel.md";
const tests = "TESTS-A-FAIRE.md";

let echecs = 0;

/* 1. resultats.md : bloc « trois commandes durcies » avant la section 3. */
{
  const texte = await readFile(resultats, "utf8");
  const ancre = "## 3. Décisions prises pendant l'implémentation (T112)";
  const bloc = await readFile(`${docs}/resultats-durcissement.md`, "utf8");
  if (texte.includes("### Trois commandes durcies par la même leçon")) {
    console.log("resultats.md : bloc déjà présent");
  } else if (!texte.includes(ancre)) {
    console.error("resultats.md : ancre de section 3 introuvable");
    echecs++;
  } else {
    await writeFile(
      resultats,
      texte.replace(ancre, `${bloc.trimEnd()}\n\n${ancre}`),
      "utf8",
    );
    console.log("resultats.md : bloc « commandes durcies » inséré");
  }
}

/* 2. resultats.md : décision A26 étendue (garde-fou sur les deux scripts). */
{
  const texte = await readFile(resultats, "utf8");
  const ancien =
    "| `scripts/audit-ergonomie.mjs` (garde-fou, sortie 2), friction R-10 |";
  const nouveau =
    "| `scripts/audit-ergonomie.mjs` et `scripts/audit-a11y.mjs` (garde-fou, sortie 2 ; `npm run audit:a11y:verifier` pour mesurer sans risque), friction R-10 |";
  if (texte.includes(nouveau)) {
    console.log("resultats.md : A26 déjà étendue");
  } else if (!texte.includes(ancien)) {
    console.error("resultats.md : cellule A26 introuvable");
    echecs++;
  } else {
    await writeFile(resultats, texte.replace(ancien, nouveau), "utf8");
    console.log("resultats.md : A26 étendue");
  }
}

/* 3. friction R-10 : section « trois commandes durcies ». */
{
  const texte = await readFile(frictions, "utf8");
  const section = `
**Trois commandes durcies après coup.** Le même piège dormait dans deux autres
commandes documentées : \`npm run audit:a11y\` écrivait dans \`baseline-axe.json\`
(les valeurs « avant » du rapport agrégé redevenaient 0), et
\`npm run audit:ergonomie:ecrire\` mesurait avant d'agréger — donc écrivait dans
\`baseline-320.json\`. Désormais : garde-fou sur les deux scripts,
\`npm run audit:a11y:verifier\` pour mesurer et prouver les 4 routes P1
(\`apres-axe.json\`), et \`--ecrire\` n'exécute plus de mesure (il implique
\`--sans-audit\`). Règle générale : une commande *documentée* ne doit jamais
écrire dans un fichier de référence.
`;
  if (texte.includes("Trois commandes durcies après coup")) {
    console.log("frictions.md : section déjà présente");
  } else {
    await writeFile(frictions, `${texte.trimEnd()}\n${section}`, "utf8");
    console.log("frictions.md : section ajoutée");
  }
}

/* 4. Registres : complément au bullet existant. */
{
  const texte = await readFile(changelog, "utf8");
  const marqueur = "ergonomie-public-320-2026-11-13 (durcissement)";
  if (texte.includes(marqueur)) {
    console.log("changelog.md : complément déjà présent");
  } else {
    const ligne = `- ${marqueur} : même leçon appliquée à trois commandes de mesure — \`npm run audit:a11y\` n'écrase plus \`baseline-axe.json\` (garde-fou, code 2), nouvel alias \`npm run audit:a11y:verifier\` (mesure les 4 routes P1, écrit \`apres-axe.json\`, gate axe P1 : 4 routes, 0 violation, code 0), et \`npm run audit:ergonomie:ecrire\` n'exécute plus de mesure (il implique \`--sans-audit\`) : le rapport agrégé a été régénéré avec les mêmes valeurs « avant » (/reserver 1 → 0, /voyageur 1 → 0), preuve que le relevé reconstitué est cohérent ; copie de l'ancien rapport conservée (\`rapport-ergonomie-archive-2026-11-13.*\`).`;
    await writeFile(changelog, `${texte.trimEnd()}\n${ligne}\n`, "utf8");
    console.log("changelog.md : complément ajouté");
  }
}
{
  const texte = await readFile(etatReel, "utf8");
  const marqueur = "COMMANDES DE MESURE DURCIES";
  if (texte.includes(marqueur)) {
    console.log("etat-reel.md : complément déjà présent");
  } else {
    const bloc = `- **COMMANDES DE MESURE DURCIES 2026-11-13** : \`npm run audit:a11y\`
  refuse désormais d'écraser \`baseline-axe.json\` (garde-fou, code 2) ;
  \`npm run audit:a11y:verifier\` mesure les 4 routes P1 et applique le gate
  (0 violation, code 0) ; \`npm run audit:ergonomie:ecrire\` n'exécute plus de
  mesure. Rapport agrégé régénéré sans perte des valeurs « avant ».`;
    await writeFile(etatReel, `${texte.trimEnd()}\n${bloc}\n`, "utf8");
    console.log("etat-reel.md : complément ajouté");
  }
}

/* 5. TESTS-A-FAIRE : mention du mode vérification axe P1. */
{
  const texte = await readFile(tests, "utf8");
  const ancien =
    "  \`v2/.artifacts/ergonomie/apres-320-public.json\`.\n";
  const nouveau = `${ancien}- [x] **Gate axe P1 rejouable** — \`npm run audit:a11y:verifier\`
  mesure \`/\`, \`/reserver\`, \`/login\`, \`/voyageur\` et sort en code 1 en cas de
  violation : **4 routes, 0 violation** (2026-11-13). Le relevé de référence
  axe n'est plus écrasable par cette commande.\n`;
  if (texte.includes("Gate axe P1 rejouable")) {
    console.log("TESTS-A-FAIRE.md : point déjà présent");
  } else if (!texte.includes(ancien)) {
    console.error("TESTS-A-FAIRE.md : ancre du point public introuvable");
    echecs++;
  } else {
    await writeFile(tests, texte.replace(ancien, nouveau), "utf8");
    console.log("TESTS-A-FAIRE.md : point « gate axe P1 » ajouté");
  }
}

if (echecs > 0) process.exit(1);
console.log("\nDocumentation du durcissement appliquée.");