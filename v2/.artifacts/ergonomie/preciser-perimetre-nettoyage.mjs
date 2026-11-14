/**
 * Précise le périmètre du nettoyage dans les cinq passages : il ne s'agit pas
 * seulement des fixtures « E2E » mais de **tous les faux comptes et faux
 * logements** créés pour tester, et il renvoie à la procédure complète
 * (`v2/DEPLOIEMENT.md` § 8).
 */
import { readFile, writeFile } from "node:fs/promises";

const remplacements = [
  // 1. Frictions R-11, parade 1.
  [
    ".artifacts/ergonomie/frictions.md",
    `1. **Le nettoyage est réservé au déploiement, après le déploiement** (décision
   du 2026-11-13) : dépublier ou supprimer les logements
   \`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`. Ce n'est **pas** un préalable
   à une passe de recette : en attendant, les deux échecs du tunnel sont connus,
   acceptés et tracés.`,
    `1. **Le nettoyage est réservé au déploiement, après le déploiement** (décision
   du 2026-11-13). Il ne porte pas seulement sur les fixtures nommées « E2E » :
   ce sont **tous les faux comptes et faux logements créés pour tester** — 120
   comptes \`@lcd.test\` et 614 logements sur 617, plus leurs dépendances (444
   réservations, 549 tarifs, 65 factures, 41 paiements, 57 incidents, 36
   restrictions, 22 avis, 20 extras, 13 blocages). Ces données sont nécessaires
   pour tester : on n'y touche pas maintenant. Procédure complète :
   \`v2/DEPLOIEMENT.md\` § 8. En attendant, les deux échecs du tunnel sont connus,
   acceptés et tracés.`,
  ],
  // 2. resultats.md § 2.5.
  [
    "../specs/004-ergonomie-experience-client/resultats.md",
    `Parade retenue, **réservée au déploiement et jouée après celui-ci** (décision
du 2026-11-13) : nettoyer le tenant de démonstration de ses fixtures
(\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`). Ce n'est pas une étape de
recette : en attendant, les deux échecs sont connus et acceptés. Correctif de
fond à instruire : que les specs qui créent un logement le suppriment en fin de
test.`,
    `Parade retenue, **réservée au déploiement et jouée après celui-ci** (décision
du 2026-11-13) : supprimer les **faux comptes et faux logements créés pour
tester** — 120 comptes \`@lcd.test\` et 614 logements sur 617, avec leurs
dépendances — en gardant les trois logements de vitrine. Ces données sont
nécessaires pour tester : le nettoyage ne se fait pas maintenant. Procédure
complète : \`v2/DEPLOIEMENT.md\` § 8. En attendant, les deux échecs sont connus et
acceptés. Correctif de fond à instruire : que les specs qui créent un logement le
suppriment en fin de test.`,
  ],
  // 3. TESTS-A-FAIRE § 7.2, première case.
  [
    "TESTS-A-FAIRE.md",
    `- [ ] **Au déploiement, après le déploiement** (décision du 2026-11-13) :
  dépublier ou supprimer les fixtures du tenant de démonstration
  (\`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`). Ce n'est pas un préalable à
  une passe de recette. Tant que ce n'est pas fait, deux tests au moins
  (\`confiance.spec.ts\`, \`ergonomie-reservation.spec.ts\`) peuvent échouer sur
  « le tunnel de réservation n'a abouti sur aucune des six tentatives » : échec
  connu, accepté et tracé (friction R-11).`,
    `- [ ] **Au déploiement, après le déploiement** (décision du 2026-11-13) :
  supprimer les **faux comptes et faux logements créés pour tester** — 120 comptes
  \`@lcd.test\`, 614 logements sur 617 (fixtures \`E2E…\`, \`Onboarding…\`,
  \`Logement plan/dérivé/Archive/Recherche…\`, \`Relevé…\`, \`Import…\`,
  \`Proprio A/B…\`, \`Diag…\`) et leurs dépendances — en gardant Villa Santa Severa,
  Le Mas des Oliviers, Le Loft du Port. Ces données sont nécessaires pour tester :
  on ne les supprime pas maintenant. Procédure complète : \`DEPLOIEMENT.md\` § 8.
  Tant que ce n'est pas fait, deux tests au moins (\`confiance.spec.ts\`,
  \`ergonomie-reservation.spec.ts\`) peuvent échouer sur « le tunnel de réservation
  n'a abouti sur aucune des six tentatives » : échec connu, accepté et tracé
  (friction R-11).`,
  ],
  // 4. État réel.
  [
    "../docs/registres/etat-reel.md",
    `support d'origine. Le nettoyage des fixtures (\`nom ilike '%E2E%' or nom
  ilike 'Onboarding %'\`) est **réservé au déploiement, après le déploiement**
  (décision du 2026-11-13) et non joué avant une recette — friction R-11.`,
    `support d'origine. Le nettoyage — **tous les faux comptes et faux logements
  créés pour tester** (120 comptes \`@lcd.test\`, 614 logements sur 617, et leurs
  dépendances) — est **réservé au déploiement, après le déploiement** (décision du
  2026-11-13) et non joué avant une recette : ces données servent à tester.
  Procédure : \`v2/DEPLOIEMENT.md\` § 8 — friction R-11.`,
  ],
  // 5. Décision A27.
  [
    "../specs/004-ergonomie-experience-client/resultats.md",
    `| A27 | Le nettoyage des fixtures du tenant de démonstration est une opération de **déploiement**, jouée après celui-ci, jamais un préalable à une passe de recette |`,
    `| A27 | Le nettoyage des **faux comptes et faux logements créés pour tester** (120 comptes \`@lcd.test\`, 614 logements sur 617, leurs dépendances) est une opération de **déploiement**, jouée après celui-ci, jamais un préalable à une passe de recette : ces données sont nécessaires pour tester |`,
  ],
  // 6. Changelog, point (4).
  [
    "../docs/registres/changelog.md",
    `(4) Décision : le nettoyage des fixtures du tenant de démonstration est réservé au déploiement et joué après celui-ci, pas avant une recette ; correctif de fond à instruire : que les specs nettoient les logements qu'elles créent.`,
    `(4) Décision : le nettoyage — **faux comptes et faux logements créés pour tester** (120 comptes \`@lcd.test\`, 614 logements sur 617, leurs dépendances) — est réservé au déploiement et joué après celui-ci, pas avant une recette, car ces données servent à tester ; procédure complète dans \`v2/DEPLOIEMENT.md\` § 8 ; correctif de fond à instruire : que les specs nettoient les logements qu'elles créent.`,
  ],
];

for (const [fichier, avant, apres] of remplacements) {
  const texte = await readFile(fichier, "utf8");
  const occurrences = texte.split(avant).length - 1;
  if (occurrences !== 1) {
    console.error(`${fichier} : ancre non unique (${occurrences}).`);
    process.exit(1);
  }
  await writeFile(fichier, texte.replace(avant, apres), "utf8");
  console.log(`précisé : ${fichier}`);
}
console.log("Périmètre du nettoyage précisé partout (faux comptes + faux logements).");