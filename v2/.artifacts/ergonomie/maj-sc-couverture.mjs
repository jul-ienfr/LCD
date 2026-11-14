/**
 * Met à jour les critères de succès (SC-005, SC-006) sur la couverture finale
 * et consigne dans § 2.4 la réécriture de `apres-axe.json` par le mode P1.
 */
import { readFile, writeFile } from "node:fs/promises";

const resultats = "../specs/004-ergonomie-experience-client/resultats.md";
let texte = await readFile(resultats, "utf8");
let echecs = 0;

function remplacer(avant, apres) {
  if (texte.includes(apres)) {
    console.log("déjà à jour");
    return;
  }
  if (!texte.includes(avant)) {
    console.error(`ancre absente : ${avant.slice(0, 60)}`);
    echecs++;
    return;
  }
  texte = texte.replace(avant, apres);
  console.log(`remplacé : ${avant.slice(0, 50)}…`);
}

remplacer(
  "| **SC-005** — 0 axe sérieuse/critique, clavier et lecteur d'écran | **partiel** | **0 violation** sur 18 routes (`apres-axe.json`, `apres-axe-staff.json`)",
  "| **SC-005** — 0 axe sérieuse/critique, clavier et lecteur d'écran | **partiel** | **0 violation** sur **95 routes** (`apres-axe.json` 4 routes P1, `apres-axe-public.json` 21 routes publiques, `apres-axe-staff.json` 70 routes staff)",
);
remplacer(
  "| **SC-006** — 320 px sans défilement horizontal | **vérifié** | `apres-320.json` + `apres-320-staff.json` : `overflowPx = 0` et `smallTargets = 0` sur 9 routes publiques + 9 routes staff |",
  "| **SC-006** — 320 px sans défilement horizontal | **vérifié** | `apres-320.json` (P1), `apres-320-public.json` (21 routes publiques) et `apres-320-staff.json` (70 routes staff) : `overflowPx = 0`, `smallTargets = 0` et `unlabeledFields = 0` sur **95 routes** |",
);

/* Note de traçabilité sur la réécriture d'`apres-axe.json`. */
const ancreNote = "**Incident de la passe.**";
const note =
  "**Fichiers de mesure réécrits.** Les modes P1 et publics écrivent dans\n" +
  "`apres-axe.json` et `apres-320.json` : ces fichiers ne sont pas des relevés de\n" +
  "référence, ils sont réécrits à chaque mesure (c'est leur rôle). Les chiffres\n" +
  "citrés en § 2.1 (« 9 routes publiques ») restent exacts et sont désormais\n" +
  "couverts par `apres-axe-public.json` (21 routes, qui les incluent) ; l'état\n" +
  "antérieur du rapport agrégé est conservé dans\n" +
  "`.artifacts/ergonomie/rapport-ergonomie-archive-2026-11-13.json`.\n\n";
if (texte.includes("**Fichiers de mesure réécrits.**")) {
  console.log("note déjà présente");
} else if (!texte.includes(ancreNote)) {
  console.error("ancre de note introuvable");
  echecs++;
} else {
  texte = texte.replace(ancreNote, `${note}${ancreNote}`);
  console.log("note ajoutée");
}

/* Coquille à corriger au passage. */
texte = texte.replace("citrés", "cités");

await writeFile(resultats, texte, "utf8");
if (echecs > 0) process.exit(1);
console.log("Critères de succès mis à jour.");