/**
 * Tracé de la friction R-11 dans les deux registres, dans le style existant.
 */
import { readFile, writeFile } from "node:fs/promises";

// 1. Changelog : une entrée datée.
const changelog = "../docs/registres/changelog.md";
let texteChangelog = await readFile(changelog, "utf8");
if (texteChangelog.includes("e2e-fixtures-r11-2026-11-13")) {
  console.error("Entrée déjà présente au changelog.");
  process.exit(1);
}
const entree = `- e2e-fixtures-r11-2026-11-13 : PLAN 004 — LES DEUX ÉCHECS E2E DE FIN DE JOURNÉE SONT ENVIRONNEMENTAUX, DIAGNOSTIQUÉS ET TRACÉS (friction R-11). (1) Constat : la passe complète donne 251 réussites / 2 échecs (\`e2e/confiance.spec.ts:91\`, \`e2e/ergonomie-reservation.spec.ts:81\`), tous deux levés par \`e2e/support/reservation-demo.ts\` — « le tunnel de réservation n'a abouti sur aucune des six tentatives » — sans toucher aucune route corrigée. (2) Mesures (rôle de migration, hors RLS) : \`demandes_sejour\` = 0 ligne (l'hypothèse « créneaux déjà pris » est fausse) ; \`logements\` = 617 tous actifs, dont 64 publiés (48 fixtures E2E, 13 « Onboarding ») ; seuls 29 ont un tarif et 3 seulement ne sont pas des fixtures ; l'accueil public n'affiche que 3 cartes, qui sont le vivier du tirage. (3) Correctif essayé puis rétabli : élargir le vivier aux 64 liens du sélecteur et abandonner une tentative dès l'affichage d'un refus a fait passer la passe de 2 à 5 échecs (61 candidats sur 64 sans tarif) — le support a été remis à l'identique et les deux tests reproduisent les mêmes échecs en isolation (2 / 1 / 11 en 5,6 min). (4) Parade : nettoyer les fixtures du tenant de démonstration avant une passe complète ; correctif de fond : que les specs nettoient les logements qu'elles créent. Détail : \`.artifacts/ergonomie/frictions.md\` § R-11 et \`specs/004-ergonomie-experience-client/resultats.md\` § 2.5.

`;
const finChangelog = texteChangelog.endsWith("\n") ? texteChangelog : `${texteChangelog}\n`;
await writeFile(changelog, `${finChangelog}${entree}`, "utf8");

// 2. État réel : un paragraphe dans la section des réserves.
const etatReel = "../docs/registres/etat-reel.md";
let texteEtat = await readFile(etatReel, "utf8");
if (texteEtat.includes("SUITE E2E : DEUX ÉCHECS ENVIRONNEMENTAUX")) {
  console.error("Paragraphe déjà présent dans l'état réel.");
  process.exit(1);
}
const paragraphe = `- **SUITE E2E : DEUX ÉCHECS ENVIRONNEMENTAUX 2026-11-13** : la passe
  complète donne 251 réussites / 2 échecs, tous deux dans le tunnel de
  réservation, parce que le tenant de démonstration accumule les fixtures des
  passes précédentes (617 logements, 64 publiés, 3 seulement non-fixtures avec
  tarif) et que l'accueil n'affiche que 3 cartes. Aucune route corrigée n'est en
  cause : les deux tests reproduisent les mêmes échecs en isolation avec le
  support d'origine. Nettoyer les fixtures (\`nom ilike '%E2E%' or nom ilike
  'Onboarding %'\`) avant une passe complète — friction R-11.
`;
const finEtat = texteEtat.endsWith("\n") ? texteEtat : `${texteEtat}\n`;
await writeFile(etatReel, `${finEtat}${paragraphe}`, "utf8");
console.log("Changelog et état réel complétés.");