/**
 * Généralise le gate 320 px aux deux périmètres (`--staff`, `--public`) :
 * un seul bloc de vérification, un libellé et un fichier de relevé par
 * périmètre. Remplacements littéraux vérifiés un par un.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "scripts/audit-ergonomie.mjs";
let texte = await readFile(fichier, "utf8");
const remplacements = [
  [
    `/**
 * Gate staff : les routes mesurées doivent répondre, ne pas déborder, ne
 * contenir aucune cible sous le seuil et aucun champ sans étiquette. Sert de
 * contrat rejouable (\`npm run audit:ergonomie:staff\`) après toute retouche
 * d'interface.
 */
if (staff && !ecrire && !verifier) {
  const fichier = path.join(outDir, process.env.AUDIT_FICHIER ?? "apres-320-staff.json");`,
    `/**
 * Gate 320 px : les routes mesurées doivent répondre, ne pas déborder, ne
 * contenir aucune cible sous le seuil et aucun champ sans étiquette. Sert de
 * contrat rejouable après toute retouche d'interface :
 *   - \`npm run audit:ergonomie:staff\`  → surfaces /hote, /supervision, …
 *   - \`npm run audit:ergonomie:public\` → tout le reste du dépôt
 */
if ((staff || public_) && !ecrire && !verifier) {
  const perimetre = public_ ? "public" : "staff";
  const fichier = path.join(
    outDir,
    process.env.AUDIT_FICHIER ?? \`apres-320-\${perimetre}.json\`,
  );`,
  ],
  ["`\\nBilan staff 320 px : ", "`\\nBilan ${perimetre} 320 px : "],
  [
    `console.error("Gate staff : ÉCHEC (code de sortie 1).");`,
    "console.error(`Gate ${perimetre} : ÉCHEC (code de sortie 1).`);",
  ],
  [
    `console.log("Gate staff : OK (0 cible, 0 débordement, 0 erreur, 0 champ sans étiquette).");`,
    "console.log(\n    `Gate ${perimetre} : OK (0 cible, 0 débordement, 0 erreur, 0 champ sans étiquette).`,\n  );",
  ],
];

for (const [avant, apres] of remplacements) {
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(
      `Remplacement non unique (${occurrences}) pour : ${avant.slice(0, 70)}`,
    );
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
}

await writeFile(fichier, texte, "utf8");
console.log("Gate généralisé aux périmètres staff et public.");