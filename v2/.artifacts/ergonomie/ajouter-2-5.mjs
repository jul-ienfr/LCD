/**
 * Ajoute à `resultats.md` la section « 2.5 État de la suite e2e » : deux échecs
 * environnementaux, diagnostiqués et tracés (friction R-11).
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "../specs/004-ergonomie-experience-client/resultats.md";
let texte = await readFile(fichier, "utf8");

const ancre = `## 3. Décisions prises pendant l'implémentation (T112)`;
if (!texte.includes(ancre)) {
  console.error("Ancre de la section 3 introuvable.");
  process.exit(1);
}
if (texte.includes("### 2.5 État de la suite e2e")) {
  console.error("Section 2.5 déjà présente.");
  process.exit(1);
}

const section = `### 2.5 État de la suite e2e (2026-11-13)

La passe e2e complète de fin de journée donne **251 réussites, 2 échecs,
3 instables (repassés au second essai), 4 ignorés** en 26,2 min. Les deux échecs
(\`e2e/confiance.spec.ts:91\`, \`e2e/ergonomie-reservation.spec.ts:81\`) sont levés
par \`e2e/support/reservation-demo.ts\` — « le tunnel de réservation n'a abouti sur
aucune des six tentatives » — et **ne touchent aucune des routes corrigées**.
Ils ont été diagnostiqués jusqu'à la donnée (friction **R-11**,
\`.artifacts/ergonomie/frictions.md\`) :

| Fait mesuré | Valeur |
| --- | --- |
| \`demandes_sejour\` | 0 ligne (l'hypothèse « créneaux déjà pris » est fausse) |
| \`logements\` dans le tenant de démonstration | 617, tous actifs, dont **64 publiés** (48 fixtures E2E, 13 « Onboarding ») |
| publiés ayant un tarif | 29, dont seulement **3** non-fixtures |
| cartes de logement sur l'accueil public | 3 — c'est le vivier du tirage e2e |

Les trois cartes visibles peuvent donc être des fixtures sans tarif : le bloc de
prix ne s'affiche pour aucune des six tentatives, quel que soit l'état du code
produit. Élargir le vivier aux 64 logements du sélecteur a été **essayé, mesuré
et rétabli** : la passe est passée de 2 à **5 échecs** (61 des 64 candidats sont
des fixtures sans tarif). Le support a été remis à l'identique et les deux tests
reproduisent exactement les mêmes échecs en isolation (2 échecs / 1 instable /
11 réussites, 5,6 min) — preuve qu'ils ne dépendent pas des correctifs
d'ergonomie.

Parade retenue, à jouer avant une passe complète : nettoyer le tenant de
démonstration de ses fixtures (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`)
quand aucune autre session ne joue la suite ; correctif de fond : que les specs
qui créent un logement le suppriment en fin de test.

`;

texte = texte.replace(ancre, `${section}${ancre}`);
await writeFile(fichier, texte, "utf8");
console.log("Section 2.5 ajoutée à resultats.md.");