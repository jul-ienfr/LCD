/**
 * Documente la parade de la friction R-11 dans `v2/TESTS-A-FAIRE.md` : comment
 * rejouer la suite e2e sans que les fixtures des passes précédentes la fassent
 * échouer.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "TESTS-A-FAIRE.md";
const texte = await readFile(fichier, "utf8");
if (texte.includes("### 7.2 Rejouer la suite e2e sans pollution")) {
  console.error("Sous-section déjà présente.");
  process.exit(1);
}

const ancre = `## 8. Conformité et facturation`;
if (!texte.includes(ancre)) {
  console.error("Ancre de la section 8 introuvable.");
  process.exit(1);
}

const section = `### 7.2 Rejouer la suite e2e sans pollution

La base de démonstration \`lcd_demo\` **accumule les fixtures** des passes
précédentes : au 2026-11-13 elle contient 617 logements (dont 64 publiés : 48
fixtures « …E2E… », 13 « Onboarding <horodatage> », 3 vrais logements de
démonstration) et seuls 3 logements publiés non-fixtures ont des tarifs.
L'accueil public n'affichant que **trois** cartes, le tunnel de réservation peut
tomber sur trois fixtures sans tarif et échouer six fois de suite : c'est la
friction **R-11** (\`.artifacts/ergonomie/frictions.md\`), pas un défaut produit.

- [ ] Avant une passe complète, dépublier ou supprimer les fixtures du tenant de
  démonstration (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`), quand aucune
  autre session ne joue la suite. Sans ce nettoyage, deux tests au moins
  (\`confiance.spec.ts\`, \`ergonomie-reservation.spec.ts\`) peuvent échouer sur
  « le tunnel de réservation n'a abouti sur aucune des six tentatives ».
- [ ] Correctif de fond à instruire : que chaque spec qui crée un logement le
  supprime en fin de test (ou travaille dans un tenant dédié). Élargir le vivier
  du tunnel au sélecteur des 64 logements a été mesuré **contre-productif**
  (2 → 5 échecs) : 61 candidats sur 64 n'ont pas de tarif.

`;

await writeFile(fichier, texte.replace(ancre, `${section}${ancre}`), "utf8");
console.log("Parade R-11 documentée dans TESTS-A-FAIRE.md (§ 7.2).");