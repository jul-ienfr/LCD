/**
 * Complète l'en-tête de `audit-a11y.mjs` avec les deux périmètres dérivés du
 * disque. Remplacement littéral vérifié (les éditions multilignes passent par
 * Node, cf. friction R-09).
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "scripts/audit-a11y.mjs";
const texte = await readFile(fichier, "utf8");
const ancre = " *   node scripts/audit-a11y.mjs\n *\n * Variables :";

if (!texte.includes(ancre)) {
  console.error("Ancre introuvable dans l'en-tête du script.");
  process.exit(1);
}
if (texte.includes("--public   → tout le reste")) {
  console.log("En-tête déjà à jour.");
  process.exit(0);
}

const remplacement = ` *   node scripts/audit-a11y.mjs
 *
 * Périmètres dérivés du disque, avec gate (sortie 1 en cas d'échec) :
 *   node scripts/audit-a11y.mjs --staff    → /hote, /supervision, /support, /presta
 *   node scripts/audit-a11y.mjs --public   → tout le reste (hors /login et
 *                                            /two-factor, écartées avec motif)
 *   Ces deux modes exigent une session (AUDIT_EMAIL/AUDIT_MOT_DE_PASSE ou
 *   AUDIT_STORAGE) et écrivent respectivement \`apres-axe-staff.json\` et
 *   \`apres-axe-public.json\`.
 *
 * Variables :`;

await writeFile(fichier, texte.replace(ancre, remplacement), "utf8");
console.log("En-tête mis à jour dans scripts/audit-a11y.mjs.");