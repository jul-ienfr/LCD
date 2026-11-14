/**
 * Précise la couverture de `/two-factor` dans `resultats.md` : la page est
 * parcourue par `e2e/deux-facteurs.spec.ts` (et non `auth.spec.ts`), et ses
 * champs réutilisent les classes mesurées de `/login`.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "../specs/004-ergonomie-experience-client/resultats.md";
let texte = await readFile(fichier, "utf8");

const avant =
  "atteignable seulement en cours de vérification 2FA, couverte\npar `e2e/auth.spec.ts`)";
const apres =
  "atteignable seulement en cours de vérification 2FA : parcourue par\n`e2e/deux-facteurs.spec.ts`, et ses champs reprennent les classes `ui-champ` /\n`ui-bouton` de `/login`, mesurée)";

if (texte.includes(apres)) {
  console.log("déjà précisé");
} else if (texte.includes(avant)) {
  await writeFile(fichier, texte.replace(avant, apres), "utf8");
  console.log("précision /two-factor appliquée");
} else {
  const i = texte.indexOf("/two-factor");
  console.error("Ancre absente. Contexte :");
  console.error(JSON.stringify(texte.slice(Math.max(0, i - 120), i + 260)));
  process.exit(1);
}