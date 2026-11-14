/**
 * Enregistre la décision A27 au registre des décisions du plan 004 : le
 * nettoyage des fixtures de démonstration est une opération de déploiement,
 * jouée après le déploiement.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "../specs/004-ergonomie-experience-client/resultats.md";
let texte = await readFile(fichier, "utf8");

if (texte.includes("| A27 |")) {
  console.error("A27 déjà présente.");
  process.exit(1);
}

const ancre = `| A26 |`;
const index = texte.indexOf(ancre);
if (index === -1) {
  console.error("Ancre A26 introuvable.");
  process.exit(1);
}
const finLigne = texte.indexOf("\n", index);
const ligne = `| A27 | Le nettoyage des fixtures du tenant de démonstration est une opération de **déploiement**, jouée après celui-ci, jamais un préalable à une passe de recette | 617 logements dont 64 publiés, 3 seulement non-fixtures avec tarif : l'accueil n'affiche que 3 cartes, donc deux tests du tunnel échouent de façon data-dépendante ; nettoyer avant chaque recette ferait de la donnée de démonstration une dépendance de la recette, et un agent pourrait effacer les fixtures d'une autre session en cours | \`.artifacts/ergonomie/frictions.md\` § R-11, \`v2/TESTS-A-FAIRE.md\` § 7.2 ; échecs connus et acceptés jusque-là |`;

texte = `${texte.slice(0, finLigne)}\n${ligne}${texte.slice(finLigne)}`;
await writeFile(fichier, texte, "utf8");
console.log("Décision A27 enregistrée.");