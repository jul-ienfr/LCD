import { writeFileSync } from "node:fs";

import { ROLES_UTILISATEUR } from "../../src/domain/utilisateur";
import { filtrerNavigation, tousLesLiens } from "../../src/lib/navigation/modele";
import { NAVIGATION_STAFF } from "../../src/lib/navigation/navigation-staff";

const lignes = [];
for (const role of ROLES_UTILISATEUR) {
  const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
  const principal = navigation.principal.map((lien) => lien.href);
  const secondaires = navigation.domaines.flatMap((domaine) =>
    domaine.groupes.flatMap((groupe) => groupe.liens.map((lien) => lien.href)),
  );
  const ligne = {
    role,
    principal: principal.length,
    secondaires: secondaires.length,
    principalHrefs: principal,
    horsPerimetre: [...principal, ...secondaires].filter(
      (href) => !href.startsWith("/hote") && !href.startsWith("/supervision"),
    ),
  };
  lignes.push(ligne);
  console.log(JSON.stringify(ligne));
}
const total = tousLesLiens(NAVIGATION_STAFF).length;
console.log("liens total (super_admin)", total);
writeFileSync(
  ".artifacts/ergonomie/navigation-roles.json",
  `${JSON.stringify({ roles: lignes, liensTotal: total }, null, 2)}\n`,
);
