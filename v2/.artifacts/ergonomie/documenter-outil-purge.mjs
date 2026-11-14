/**
 * Ajoute la commande de purge des données de recette :
 * - un script npm `db:nettoyer-recette` ;
 * - DEPLOIEMENT.md § 8 : la procédure devient une commande vérifiable ;
 * - TESTS-A-FAIRE.md § 7.2 : même référence ;
 * - une entrée au changelog.
 */
import { readFile, writeFile } from "node:fs/promises";

// 1. package.json : la commande, à côté des autres scripts db:*.
const pkgFichier = "package.json";
const pkg = JSON.parse(await readFile(pkgFichier, "utf8"));
if (pkg.scripts["db:nettoyer-recette"]) {
  console.error("Script npm déjà présent.");
  process.exit(1);
}
const apres = {};
for (const [cle, valeur] of Object.entries(pkg.scripts)) {
  apres[cle] = valeur;
  if (cle === "db:seed-demo") apres["db:nettoyer-recette"] = "node scripts/nettoyer-donnees-recette.mjs";
}
if (!apres["db:nettoyer-recette"]) {
  console.error("Ancre db:seed-demo absente de package.json.");
  process.exit(1);
}
pkg.scripts = apres;
await writeFile(pkgFichier, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
console.log("package.json : db:nettoyer-recette ajouté.");

// 2. DEPLOIEMENT.md : la procédure numérotée remplacée par la commande.
const deploiement = "DEPLOIEMENT.md";
let texteDeploiement = await readFile(deploiement, "utf8");
const procedureAvant = `**Procédure** (à jouer après le déploiement, en une transaction, après sauvegarde) :

1. Sauvegarder la base avant toute suppression (\`v2/BACKUPS.md\`).
2. Conserver la vitrine : les 3 logements de démonstration et le compte
   super-admin de recette ; supprimer les comptes \`email like '%@lcd.test'\`
   autres, puis les logements hors vitrine et leurs dépendances
   (tarifs, restrictions, avis, réservations, factures, paiements, incidents,
   extras, blocages).
3. Vérifier après coup : \`select count(*) from users\` (comptes réels),
   \`select count(*) from logements\` (3), et une passe de recette qui doit rester
   verte sur ces trois logements.`;
const procedureApres = `**Procédure** — outil dédié, **en lecture seule par défaut** :

\`\`\`bash
cd v2
# 1. Voir le plan (aucune écriture) : volumes par table et éléments conservés
MIGRATION_DATABASE_URL=… npm run db:nettoyer-recette

# 2. Sauvegarder la base (v2/BACKUPS.md), puis exécuter
NETTOYAGE_CONFIRME=1 MIGRATION_DATABASE_URL=… npm run db:nettoyer-recette -- --appliquer
\`\`\`

Trois verrous avant toute écriture : le drapeau \`--appliquer\`, la variable
\`NETTOYAGE_CONFIRME=1\`, et un nom de base qui ressemble à une base de recette
(\`demo\`, \`test\`, \`recette\`…) — sinon il faut \`NETTOYAGE_FORCER=1\`. La purge
passe par des rôles qui voient toutes les lignes (\`MIGRATION_DATABASE_URL\`), se
fait en une transaction, et conserve les 3 logements de vitrine ainsi qu'un
compte administrateur (\`NETTOYAGE_CONSERVER_EMAIL\`, \`super@lcd.test\` par défaut).
Les règles de reconnaissance des données de recette vivent dans
\`scripts/lib/donnees-recette.mjs\` et sont testées
(\`tests/nettoyage-donnees-recette.test.ts\`).

**Plan mesuré le 2026-11-13** (lecture seule, rien n'a été supprimé) :
41 paiements, 65 factures, 444 réservations, 13 dispatchs, 26 missions,
119 comptes, 614 logements. Après purge : 3 logements, 1 compte.`;
if (!texteDeploiement.includes(procedureAvant)) {
  console.error("Procédure de DEPLOIEMENT.md introuvable (déjà remplacée ?).");
  process.exit(1);
}
texteDeploiement = texteDeploiement.replace(procedureAvant, procedureApres);
await writeFile(deploiement, texteDeploiement, "utf8");
console.log("DEPLOIEMENT.md § 8 : procédure remplacée par l'outil.");

// 3. TESTS-A-FAIRE.md § 7.2 : renvoi vers la commande.
const tests = "TESTS-A-FAIRE.md";
let texteTests = await readFile(tests, "utf8");
const ancreTests = `  on ne les supprime pas maintenant. Procédure complète : \`DEPLOIEMENT.md\` § 8.`;
if (!texteTests.includes(ancreTests)) {
  console.error("Ancre de TESTS-A-FAIRE.md introuvable.");
  process.exit(1);
}
texteTests = texteTests.replace(
  ancreTests,
  `  on ne les supprime pas maintenant. Procédure complète et outil dédié (lecture
  seule par défaut, trois verrous avant écriture) : \`DEPLOIEMENT.md\` § 8 et
  \`npm run db:nettoyer-recette\`.`,
);
await writeFile(tests, texteTests, "utf8");
console.log("TESTS-A-FAIRE.md : renvoi vers db:nettoyer-recette.");

// 4. Changelog.
const changelog = "../docs/registres/changelog.md";
let texteChangelog = await readFile(changelog, "utf8");
if (texteChangelog.includes("outil-purge-recette-2026-11-13")) {
  console.error("Entrée de changelog déjà présente.");
  process.exit(1);
}
const entree = `- outil-purge-recette-2026-11-13 : PLAN 004 — LE NETTOYAGE POST-DÉPLOIEMENT DEVIENT UN OUTIL VÉRIFIABLE (\`npm run db:nettoyer-recette\`). (1) Constat de départ : la suppression des faux comptes et faux logements se faisait « à la main » dans la procédure, sans plan ni garde-fou. (2) Outil : \`scripts/nettoyer-donnees-recette.mjs\`, **lecture seule par défaut** (affiche le plan et les volumes), avec trois verrous avant écriture — \`--appliquer\`, \`NETTOYAGE_CONFIRME=1\`, nom de base qui ressemble à une base de recette (sinon \`NETTOYAGE_FORCER=1\`) — une transaction, et conservation des 3 logements de vitrine plus un compte administrateur. (3) Règles partagées et testées : \`scripts/lib/donnees-recette.mjs\` (+ \`.d.mts\`) et \`tests/nettoyage-donnees-recette.test.ts\` (14 tests : vitrine, domaines de test, noms de base, ordre de purge — les tables RESTRICT \`factures\`/\`reservations\` avant \`logements\`, \`dispatches\`/\`missions\` avant \`users\`). (4) Plan mesuré en lecture seule sur \`lcd_demo\` : 41 paiements, 65 factures, 444 réservations, 13 dispatchs, 26 missions, 119 comptes, 614 logements — après purge, 3 logements et 1 compte. Rien n'a été supprimé : ces données servent à tester. (5) Les trois refus ont été prouvés (sortie 2, message explicite). Documenté dans \`v2/DEPLOIEMENT.md\` § 8.

`;
const fin = texteChangelog.endsWith("\n") ? texteChangelog : `${texteChangelog}\n`;
await writeFile(changelog, `${fin}${entree}`, "utf8");
console.log("Changelog : entrée outil-purge-recette ajoutée.");