/**
 * Ajoute au guide de déploiement la section de nettoyage des données de recette,
 * avec l'inventaire mesuré. La procédure est **documentée, pas exécutée** : les
 * faux comptes et faux logements restent en place tant qu'on teste.
 */
import { readFile, writeFile } from "node:fs/promises";

const fichier = "DEPLOIEMENT.md";
const texte = await readFile(fichier, "utf8");
if (texte.includes("## 8. Nettoyage des données de recette")) {
  console.error("Section déjà présente.");
  process.exit(1);
}

const section = `## 8. Nettoyage des données de recette (après déploiement)

**Quand :** après le déploiement, jamais avant. Les faux comptes et les faux
logements sont **nécessaires pour tester** : recettes e2e, parcours voyageur,
démonstration commerciale. On les supprime quand la recette n'a plus besoin de la
base de démonstration, pas avant.

**Quoi.** Inventaire mesuré le 2026-11-13 sur \`lcd_demo\` (tenant \`lcd\`,
rôle de migration, donc hors RLS) — lecture seule, rien n'a été supprimé :

| Donnée de recette | Volume | Marqueur |
| --- | --- | --- |
| Comptes | **120**, tous en \`@lcd.test\` | domaine \`lcd.test\` |
| Logements | **617**, dont 3 seulement de vitrine | tout sauf Villa Santa Severa, Le Mas des Oliviers, Le Loft du Port |
| Fixtures e2e nommées | 473 « …E2E… » + 13 « Onboarding <horodatage> » | préfixes \`E2E\`, \`Onboarding\` |
| Autres fixtures | « Logement plan/dérivé/Archive/Recherche », « Relevé », « Import », « Proprio A/B », « Diag… » | nom + horodatage |
| Dépendances | 444 réservations, 549 tarifs, 65 factures, 41 paiements, 36 restrictions, 57 incidents, 22 avis, 20 extras, 13 blocages | rattachées aux logements et comptes ci-dessus |

Un seul tenant existe dans cette base : \`lcd\`. Rien n'est à nettoyer dans une
base de production neuve — ce nettoyage concerne les bases de démonstration et de
recette.

**Procédure** (à jouer après le déploiement, en une transaction, après sauvegarde) :

1. Sauvegarder la base avant toute suppression (\`v2/BACKUPS.md\`).
2. Conserver la vitrine : les 3 logements de démonstration et le compte
   super-admin de recette ; supprimer les comptes \`email like '%@lcd.test'\`
   autres, puis les logements hors vitrine et leurs dépendances
   (tarifs, restrictions, avis, réservations, factures, paiements, incidents,
   extras, blocages).
3. Vérifier après coup : \`select count(*) from users\` (comptes réels),
   \`select count(*) from logements\` (3), et une passe de recette qui doit rester
   verte sur ces trois logements.

**Effet de bord connu et accepté d'ici là.** Tant que les fixtures sont là,
l'accueil public n'affiche que trois cartes de logement tirées d'un vivier de 64
publiés, majoritairement des fixtures sans tarif, et deux tests e2e du tunnel de
réservation peuvent échouer (\`confiance.spec.ts\`,
\`ergonomie-reservation.spec.ts\`). Échec data-dépendant, diagnostiqué et tracé :
friction **R-11** (\`.artifacts/ergonomie/frictions.md\`), décision **A27**.

`;

const ancre = "## 7. Vérification locale avant déploiement";
if (!texte.includes(ancre)) {
  await writeFile(fichier, `${texte}\n${section}`, "utf8");
} else {
  // La section 8 se place après la section 7 : on l'ajoute en fin de document,
  // la section 7 étant la dernière du guide.
  await writeFile(fichier, `${texte}${section}`, "utf8");
}
console.log("Section « Nettoyage des données de recette (après déploiement) » ajoutée.");