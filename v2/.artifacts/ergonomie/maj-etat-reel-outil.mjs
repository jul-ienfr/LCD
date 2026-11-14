/**
 * État réel : l'outil de purge des données de recette existe désormais.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "../docs/registres/etat-reel.md";
const texte = await readFile(fichier, "utf8");
const ancre = `  Procédure : \`v2/DEPLOIEMENT.md\` § 8 — friction R-11.`;
if (!texte.includes(ancre)) {
  console.error("Ancre introuvable dans l'état réel.");
  process.exit(1);
}
if (texte.includes("OUTIL DE PURGE")) {
  console.error("Mention déjà présente.");
  process.exit(1);
}
const remplacement = `${ancre}
- **OUTIL DE PURGE DES DONNÉES DE RECETTE 2026-11-13** : \`npm run
  db:nettoyer-recette\` (\`scripts/nettoyer-donnees-recette.mjs\`) affiche le plan
  et ne supprime rien par défaut ; l'écriture exige \`--appliquer\`,
  \`NETTOYAGE_CONFIRME=1\` et un nom de base de recette. Plan mesuré : 41
  paiements, 65 factures, 444 réservations, 13 dispatchs, 26 missions, 119
  comptes, 614 logements → après purge, 3 logements de vitrine et 1 compte.
  Règles testées : \`tests/nettoyage-donnees-recette.test.ts\`.`;
await writeFile(fichier, texte.replace(ancre, remplacement), "utf8");
console.log("État réel : outil de purge mentionné.");