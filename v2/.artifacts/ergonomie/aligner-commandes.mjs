/**
 * Aligne les commandes citées dans la documentation sur les nouveaux modes :
 * `audit:a11y:verifier` remplace `audit:a11y` partout où la commande servait à
 * mesurer et à prouver (l'ancienne écrit dans le relevé de référence, désormais
 * protégé par un garde-fou — friction R-10).
 */
import { readFile, writeFile } from "node:fs/promises";

const cibles = [
  {
    fichier: "TESTS-A-FAIRE.md",
    remplacements: [
      [
        "Automatisé et déjà rejouable localement : `npm run audit:a11y`,",
        "Automatisé et déjà rejouable localement : `npm run audit:a11y:verifier`,",
      ],
    ],
  },
  {
    fichier: "../specs/004-ergonomie-experience-client/quickstart.md",
    remplacements: [["npm run audit:a11y\n", "npm run audit:a11y:verifier\n"]],
  },
  {
    fichier: "../specs/004-ergonomie-experience-client/resultats.md",
    remplacements: [
      [
        "| `npm run audit:a11y` | **0 violation** sur `/`, `/reserver`, `/login`, `/voyageur` | 2026-11-13 |",
        "| `npm run audit:a11y:verifier` | **0 violation** sur `/`, `/reserver`, `/login`, `/voyageur` | 2026-11-13 |",
      ],
      [
        "| `npm run audit:a11y` / `audit:cibles` / `audit:ergonomie` | `apres-axe*.json`, `apres-320*.json` | 2026-11-13 |",
        "| `npm run audit:a11y:verifier` / `audit:cibles` / `audit:ergonomie:public` | `apres-axe*.json`, `apres-320*.json` | 2026-11-13 |",
      ],
    ],
  },
];

let echecs = 0;
for (const { fichier, remplacements } of cibles) {
  let texte;
  try {
    texte = await readFile(fichier, "utf8");
  } catch {
    console.log(`absent (ignoré) : ${fichier}`);
    continue;
  }
  let appliques = 0;
  for (const [avant, apres] of remplacements) {
    if (texte.includes(apres)) continue;
    if (!texte.includes(avant)) {
      console.log(`ancre absente dans ${fichier} : ${avant.slice(0, 50)}`);
      echecs++;
      continue;
    }
    texte = texte.replace(avant, apres);
    appliques++;
  }
  if (appliques > 0) {
    await writeFile(fichier, texte, "utf8");
    console.log(`${fichier} : ${appliques} remplacement(s)`);
  } else {
    console.log(`${fichier} : déjà à jour`);
  }
}

if (echecs > 0) process.exit(1);
console.log("Commandes documentées alignées.");