/**
 * Décision du 2026-11-13 : le nettoyage des fixtures du tenant de démonstration
 * n'est PAS une étape de recette — il est réservé **au déploiement**, après
 * celui-ci. Les cinq passages qui le présentaient comme un préalable à une passe
 * e2e sont réalignés, sans quoi la prochaine session le rejouerait avant la
 * suite.
 */
import { readFile, writeFile } from "node:fs/promises";

const remplacements = [
  // 1. Frictions R-11, parade 1.
  [
    ".artifacts/ergonomie/frictions.md",
    `1. **Nettoyer le tenant de démonstration avant une passe complète** : dépublier
   ou supprimer les logements \`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`.
   C'est un geste sur des données de démonstration, à faire quand aucune autre
   session ne joue la suite.`,
    `1. **Le nettoyage est réservé au déploiement, après le déploiement** (décision
   du 2026-11-13) : dépublier ou supprimer les logements
   \`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`. Ce n'est **pas** un préalable
   à une passe de recette : en attendant, les deux échecs du tunnel sont connus,
   acceptés et tracés.`,
  ],
  // 2. Frictions R-11, récupération.
  [
    ".artifacts/ergonomie/frictions.md",
    `jour sont intacts. La passe complète reste à rejouer après nettoyage pour
repasser au vert.`,
    `jour sont intacts. La passe complète repassera au vert **au déploiement**,
quand le nettoyage des fixtures sera joué — pas avant.`,
  ],
  // 3. resultats.md § 2.5.
  [
    "../specs/004-ergonomie-experience-client/resultats.md",
    `Parade retenue, à jouer avant une passe complète : nettoyer le tenant de
démonstration de ses fixtures (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`)
quand aucune autre session ne joue la suite ; correctif de fond : que les specs
qui créent un logement le suppriment en fin de test.`,
    `Parade retenue, **réservée au déploiement et jouée après celui-ci** (décision
du 2026-11-13) : nettoyer le tenant de démonstration de ses fixtures
(\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`). Ce n'est pas une étape de
recette : en attendant, les deux échecs sont connus et acceptés. Correctif de
fond à instruire : que les specs qui créent un logement le suppriment en fin de
test.`,
  ],
  // 4. TESTS-A-FAIRE § 7.2, première case.
  [
    "TESTS-A-FAIRE.md",
    `- [ ] Avant une passe complète, dépublier ou supprimer les fixtures du tenant de
  démonstration (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`), quand aucune
  autre session ne joue la suite. Sans ce nettoyage, deux tests au moins
  (\`confiance.spec.ts\`, \`ergonomie-reservation.spec.ts\`) peuvent échouer sur
  « le tunnel de réservation n'a abouti sur aucune des six tentatives ».`,
    `- [ ] **Au déploiement, après le déploiement** (décision du 2026-11-13) :
  dépublier ou supprimer les fixtures du tenant de démonstration
  (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`). Ce n'est pas un préalable à
  une passe de recette. Tant que ce n'est pas fait, deux tests au moins
  (\`confiance.spec.ts\`, \`ergonomie-reservation.spec.ts\`) peuvent échouer sur
  « le tunnel de réservation n'a abouti sur aucune des six tentatives » : échec
  connu, accepté et tracé (friction R-11).`,
  ],
  // 5. État réel.
  [
    "../docs/registres/etat-reel.md",
    `support d'origine. Nettoyer les fixtures (\`nom ilike '%E2E%' or nom ilike
  'Onboarding %'\`) avant une passe complète — friction R-11.`,
    `support d'origine. Le nettoyage des fixtures (\`nom ilike '%E2E%' or nom
  ilike 'Onboarding %'\`) est **réservé au déploiement, après le déploiement**
  (décision du 2026-11-13) et non joué avant une recette — friction R-11.`,
  ],
  // 6. Changelog, point (4) de l'entrée.
  [
    "../docs/registres/changelog.md",
    `(4) Parade : nettoyer les fixtures du tenant de démonstration avant une passe complète ; correctif de fond : que les specs nettoient les logements qu'elles créent.`,
    `(4) Décision : le nettoyage des fixtures du tenant de démonstration est réservé au déploiement et joué après celui-ci, pas avant une recette ; correctif de fond à instruire : que les specs nettoient les logements qu'elles créent.`,
  ],
];

for (const [fichier, avant, apres] of remplacements) {
  let texte = await readFile(fichier, "utf8");
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(`${fichier} : ancre non unique (${occurrences}).`);
    process.exit(1);
  }
  texte = texte.replace(avant, apres);
  await writeFile(fichier, texte, "utf8");
  console.log(`réaligné : ${fichier}`);
}
console.log("Le nettoyage est désormais documenté comme une étape de déploiement.");