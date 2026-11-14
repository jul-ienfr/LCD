/**
 * Ajoute la friction R-11 au registre des frictions (fichier écrit en UTF-8).
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = ".artifacts/ergonomie/frictions.md";
const texte = await readFile(fichier, "utf8");

const section = `
## R-11 — La suite e2e s'empoisonne avec ses propres fixtures

**Symptôme.** La passe e2e complète du 2026-11-13 se termine sur **2 échecs**
(\`e2e/confiance.spec.ts:91\` et \`e2e/ergonomie-reservation.spec.ts:81\`), tous
deux levés par \`e2e/support/reservation-demo.ts:207\` : « le tunnel de réservation
n'a abouti sur aucune des six tentatives ». La **même** passe, plus tôt dans la
journée, était verte (251 réussites, 0 échec). Aucun des deux tests ne touche
les pages modifiées par les correctifs d'ergonomie du jour.

**Ce que montre la trace.** L'instantané d'échec de Playwright
(\`test-results-local/…/error-context.md\`) capture l'étape 1 de \`/reserver\` sur
« Villa Santa Severa », du 2027-02-03 au 2027-02-06, avec l'alerte : « Ce séjour
ne respecte pas les règles de l'hôte : choisissez d'autres dates. » Le prix ne
s'affiche donc jamais.

**Mesures (rôle de migration, donc hors RLS).**

| Mesure | Valeur |
| --- | --- |
| \`demandes_sejour\` | **0** ligne — l'hypothèse « créneaux déjà pris » du support est fausse |
| \`logements\` | **617**, tous \`statut = actif\` |
| \`logements\` publiés | **64** : 48 fixtures « …E2E… », 13 « Onboarding <horodatage> », 3 logements de démonstration |
| publiés ayant au moins un tarif | **29**, dont seulement **3** non-fixtures |
| tarifs des 3 logements de démonstration | 120 jours chacun, 2026-11-12 → 2027-03-11 |
| cartes de logement sur \`/\` (relevé curl) | **3** |
| liens de logement sur \`/reserver?tenant=lcd\` | **64** |

Le support tire ses six tentatives parmi les **3 cartes de l'accueil**. Quand ces
trois cartes sont des fixtures sans tarif (ou à règles restrictives), le bloc de
prix n'apparaît pour aucune tentative : l'échec est **indépendant du code
produit**, il dépend de l'ordre de publication des fixtures.

**Cause.** Chaque passe e2e publie des logements dans le **même tenant** que la
démonstration et ne les supprime jamais. Le vivier de l'accueil grandit donc avec
le nombre d'exécutions, jusqu'à ce que les trois cartes visibles ne soient plus
des logements tarifés.

**Correctif tenté, mesuré, puis rétabli.** Élargir le vivier aux 64 liens du
sélecteur, abandonner une tentative dès l'affichage d'un refus et monter à 12
tentatives a **dégradé** la situation : 2 échecs → **5 échecs**
(5 échecs / 3 instables / 6 réussites en 16,8 min contre 2 / 2 / 10 auparavant),
parce que 61 des 64 candidats sont des fixtures sans tarif — un tirage au sort
n'y tombe presque jamais sur un logement tarifé. La sonde
(\`.artifacts/ergonomie/sonder-tunnel.mjs\`) confirme que les **trois premiers**
candidats du sélecteur, c'est-à-dire les trois vrais logements, affichent bien le
prix (\`prix=OUI\` pour 2026-12-13, 2026-12-30 et 2027-01-16). Le support a été
rétabli à l'identique (les cinq remplacements ont été inversés un à un ; le
fichier n'est pas suivi par Git, il n'existe donc aucune version de référence à
restaurer).

**Parades.**

1. **Nettoyer le tenant de démonstration avant une passe complète** : dépublier
   ou supprimer les logements \`nom ilike '%E2E%' or nom ilike 'Onboarding %'\`.
   C'est un geste sur des données de démonstration, à faire quand aucune autre
   session ne joue la suite.
2. Les specs qui créent un logement doivent le nettoyer en fin de test ou
   travailler dans un tenant dédié — c'est le vrai correctif de fond.
3. Ne **pas** élargir le vivier du tunnel au sélecteur : le remède est dans les
   données, pas dans le tirage (mesuré ci-dessus).
4. Ne pas imputer ces deux échecs aux correctifs d'ergonomie : ils se
   reproduisent à l'identique avec le support d'origine.

**Récupération.** Aucun artefact de référence n'est en jeu ; les correctifs du
jour sont intacts. La passe complète reste à rejouer après nettoyage pour
repasser au vert.
`;

if (texte.includes("## R-11")) {
  console.error("R-11 déjà présent.");
  process.exit(1);
}
const fin = texte.endsWith("\n") ? texte : `${texte}\n`;
await writeFile(fichier, `${fin}${section}`, "utf8");
console.log("Friction R-11 ajoutée.");