/**
 * Ajoute la contre-vérification sur le build de production aux preuves de la
 * passe publique (§ 2.4 de `resultats.md` et point correspondant de
 * `TESTS-A-FAIRE.md`).
 */
import { readFile, writeFile } from "node:fs/promises";

const resultats = "../specs/004-ergonomie-experience-client/resultats.md";
const tests = "TESTS-A-FAIRE.md";

const ligneResultats =
  "| Contre-vérification sur le **build de production** (`node build`, port 4180) : `/journal`, `/tarifs`, `/mot-de-passe-oublie` | **0 cible, 0 débordement** — les trois défauts ne se reproduisent pas dans le build servi | 2026-11-13 |\n";

{
  const texte = await readFile(resultats, "utf8");
  const ancre =
    "| Test négatif du gate public (seuil 60 px, 3 routes) |";
  if (texte.includes("Contre-vérification sur le **build de production**")) {
    console.log("resultats.md : ligne déjà présente");
  } else if (!texte.includes(ancre)) {
    console.error("resultats.md : ancre du test négatif introuvable");
    process.exit(1);
  } else {
    await writeFile(
      resultats,
      texte.replace(ancre, `${ligneResultats}${ancre}`),
      "utf8",
    );
    console.log("resultats.md : contre-vérification ajoutée");
  }
}

{
  const texte = await readFile(tests, "utf8");
  const ancien =
    "  au seuil 60 px : 216 cibles, sortie 1. Relevé :\n  `v2/.artifacts/ergonomie/apres-320-public.json`.\n";
  const nouveau =
    "  au seuil 60 px : 216 cibles, sortie 1. Les trois défauts ont aussi été\n  contre-vérifiés sur le **build de production** (`node build`, port 4180) :\n  0 cible, 0 débordement. Relevé :\n  `v2/.artifacts/ergonomie/apres-320-public.json`.\n";
  if (texte.includes("contre-vérifiés sur le **build de production**")) {
    console.log("TESTS-A-FAIRE.md : mention déjà présente");
  } else if (!texte.includes(ancien)) {
    console.error("TESTS-A-FAIRE.md : ancre du point public introuvable");
    process.exit(1);
  } else {
    await writeFile(tests, texte.replace(ancien, nouveau), "utf8");
    console.log("TESTS-A-FAIRE.md : contre-vérification ajoutée");
  }
}