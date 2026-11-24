import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { traductionsStatuts } from "@/lib/i18n-statuts";

/**
 * Libellés techniques et accessibilité (spec 006, FR-044).
 *
 * Verrouille :
 * - la traduction des codes techniques (statuts, priorités, sévérités) dans les
 *   cinq langues, sans code brut affiché ;
 * - les rôles ARIA des alertes (danger → alert, succès → status) ;
 * - les zones à défilement focusables et nommées.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const CODES_REQUIS = [
  "planifiee",
  "en_cours",
  "terminee",
  "annulee",
  "brouillon",
  "payee",
  "actif",
  "archive",
  "nouveau",
  "gagne",
  "perdu",
  "acceptee",
  "refusee",
  "ouvert",
  "ferme",
  "confirmee",
  "rapproche",
  "proposee",
  "envoye",
  "recu",
  "publie",
  "basse",
  "haute",
  "urgente",
] as const;

const FICHIERS_SVELTE = [
  "src/routes/hote/missions/+page.svelte",
  "src/routes/hote/factures/+page.svelte",
  "src/routes/hote/factures/[id]/+page.svelte",
  "src/routes/hote/logements/+page.svelte",
  "src/routes/hote/planning/+page.svelte",
  "src/routes/hote/prix/recommandations/+page.svelte",
  "src/routes/hote/compta/rapprochement/+page.svelte",
  "src/routes/hote/onboarding/reservation-test/+page.svelte",
  "src/routes/hote/logements/[id]/serrure/+page.svelte",
  "src/routes/hote/messages/fils/[id]/+page.svelte",
  "src/routes/commercial/prospects/[id]/+page.svelte",
  "src/routes/support/+page.svelte",
  "src/routes/support/[id]/+page.svelte",
  "src/routes/supervision/+page.svelte",
  "src/routes/supervision/apparence/+page.svelte",
  "src/routes/supervision/espaces/+page.svelte",
] as const;

/** Balise ouvrante qui contient la position donnée. */
function baliseEnglobante(texte: string, position: number): string {
  const debut = texte.lastIndexOf("<", position);
  if (debut === -1) return "";
  const fin = texte.indexOf(">", position);
  if (fin === -1) return "";
  return texte.slice(debut, fin + 1);
}

describe("FR-044 — codes techniques traduits", () => {
  it("couvre les statuts usuels dans les cinq langues", () => {
    for (const langue of LANGUES) {
      const statuts = traductionsStatuts(langue);
      for (const code of CODES_REQUIS) {
        expect(statuts[code], `${langue} : ${code}`).toBeTruthy();
        expect(statuts[code]).not.toBe(code);
      }
    }
  });

  it("nomme les colonnes défilantes sans libellé codé en dur", () => {
    for (const langue of LANGUES) {
      expect(traductionsNavigation(langue).tableauDefilant).toBeTruthy();
    }
    for (const fichier of FICHIERS_SVELTE) {
      const texte = lire(...fichier.split("/"));
      expect(texte, fichier).not.toContain('aria-label="Tableau défilant"');
    }
  });

  it("n'affiche plus de statut brut dans les écrans câblés", () => {
    const motif = />\{(?!t\.|tNav\.)[a-zA-Z_.]+\.statut\}/;
    for (const fichier of FICHIERS_SVELTE) {
      const texte = lire(...fichier.split("/"));
      for (const ligne of texte.split("\n")) {
        const brut = ligne.match(motif)?.[0] ?? "";
        if (!brut) continue;
        // `statuts[…]` traduit le code ; `t.statut` est un entête de colonne.
        expect(brut, `${fichier} : ${ligne.trim()}`).toMatch(/statuts\[|statutsMission|statutsDispatch/);
      }
    }
  });
});

describe("FR-044 — rôles ARIA des alertes", () => {
  it("donne role=alert aux alertes de danger et role=status aux succès", () => {
    for (const fichier of FICHIERS_SVELTE) {
      const texte = lire(...fichier.split("/"));
      for (const motif of ["ui-alerte--danger", "ui-alerte--succes", "ui-alerte--ok"]) {
        let position = texte.indexOf(motif);
        while (position !== -1) {
          const balise = baliseEnglobante(texte, position);
          const voulu = motif === "ui-alerte--danger" ? "alert" : "status";
          if (balise.includes("role={")) {
            // Message dont la classe bascule danger/succès : le rôle doit basculer aussi.
            expect(balise, `${fichier} : ${balise.slice(0, 120)}`).toContain(`"${voulu}"`);
          } else {
            expect(balise, `${fichier} : ${balise.slice(0, 120)}`).toContain(`role="${voulu}"`);
          }
          position = texte.indexOf(motif, position + 1);
        }
      }
    }
  });
});

describe("FR-044 — zones à défilement focusables et nommées", () => {
  it("nomme et rend focusables les conteneurs défilants", () => {
    const fichiers = [
      ...FICHIERS_SVELTE,
      "src/routes/aide/+page.svelte",
      "src/routes/design/+page.svelte",
      "src/routes/hote/intervenants/+page.svelte",
      "src/routes/hote/menage/referentiel/+page.svelte",
      "src/routes/hote/rapports/+page.svelte",
      "src/routes/supervision/journaux/+page.svelte",
      "src/routes/hote/import/+page.svelte",
    ];
    for (const fichier of fichiers) {
      const texte = lire(...fichier.split("/"));
      for (const motif of ["overflow-x-auto", "overflow-y-auto", "overflow-auto"]) {
        let position = texte.indexOf(motif);
        while (position !== -1) {
          const balise = baliseEnglobante(texte, position);
          expect(balise, `${fichier} : ${balise.slice(0, 120)}`).toContain("tabindex");
          expect(balise, `${fichier} : ${balise.slice(0, 120)}`).toContain("aria-label");
          position = texte.indexOf(motif, position + 1);
        }
      }
    }
  });
});
