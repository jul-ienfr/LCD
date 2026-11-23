import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LANGUES } from "@/lib/i18n";
import { AIDE } from "@/lib/i18n/public/aide";

/**
 * La promesse publique de l'aide doit coïncider avec ce qui est livré
 * (spec 006, FR-037).
 *
 * L'aide est la vitrine de la plateforme : chaque espace annoncé doit être une
 * page réelle, et les rôles annoncés doivent être exactement ceux que la garde
 * serveur de cette page exige. Ce test confronte le texte publié au code des
 * routes ; il échoue dès qu'une page change de garde ou disparaît sans que
 * l'aide suive.
 */

const RACINE_ROUTES = join(process.cwd(), "src", "routes");

/**
 * Table volontairement dupliquée : elle vient des `requireRole(event, [...])`
 * (ou `requireSuperAdmin`) de chaque route promise. `null` = aucune garde
 * serveur, la page est publique. Le test la vérifie ensuite contre le code.
 */
const GARDES: Record<string, readonly string[] | null> = {
  "/hote": ["admin", "hote", "comptable"],
  "/hote/logements": ["admin", "hote"],
  "/hote/planning": ["admin", "hote"],
  "/hote/menage": ["admin", "hote"],
  "/presta": ["presta", "admin", "hote"],
  "/proprio": ["proprietaire", "admin", "hote"],
  "/reserver": null,
  "/voyageur": null,
  "/supervision/apparence": ["super_admin"],
};

/**
 * Libellés de rôle de l'aide (français, minuscules) → identifiants de rôle du
 * code. Les libellés sont comparés sans tenir compte de la casse : le tableau
 * des rôles écrit « Hôte », celui des espaces « hôte ».
 */
const ROLES_PAR_LIBELLE: Record<string, string> = {
  "super-administrateur": "super_admin",
  administrateur: "admin",
  hôte: "hote",
  comptable: "comptable",
  prestataire: "presta",
  propriétaire: "proprietaire",
  commercial: "commercial",
};

function identifiantRole(libelle: string): string | undefined {
  return ROLES_PAR_LIBELLE[libelle.trim().toLowerCase()];
}

/**
 * Mentions d'accès qui ne sont pas des rôles de compte : elles ne valent que
 * pour une route sans garde serveur.
 */
const PSEUDO_ROLES = new Set(["Public", "Voyageur (lien signé)"]);

/** Fichiers de page possibles pour un chemin. */
function pageExiste(chemin: string): boolean {
  const dossier = join(RACINE_ROUTES, ...chemin.split("/").filter(Boolean));
  return ["+page.svelte", "+page.server.ts", "+page.ts", "+layout.svelte"].some(
    (nom) => existsSync(join(dossier, nom)),
  );
}

/** Rôles exigés par le code de la route (garde de `+page.server.ts`). */
function rolesExigesParLeCode(chemin: string): readonly string[] | null {
  const fichier = join(
    RACINE_ROUTES,
    ...chemin.split("/").filter(Boolean),
    "+page.server.ts",
  );
  if (!existsSync(fichier)) return null;
  const source = readFileSync(fichier, "utf8");
  if (/requireSuperAdmin\(\s*event\s*\)/.test(source)) return ["super_admin"];

  const listes = [
    ...source.matchAll(/requireRole\(\s*event,\s*\[([^\]]*)\]/g),
  ].map((correspondance) =>
    (correspondance[1] ?? "")
      .split(",")
      .map((role) => role.trim().replace(/^"|"$/g, ""))
      .filter((role) => role !== ""),
  );
  if (listes.length === 0) return null;

  const premiere = listes[0] ?? [];
  for (const liste of listes) {
    expect(liste, `${chemin} : gardes divergentes dans le fichier`).toEqual(
      premiere,
    );
  }
  return premiere;
}

describe("promesse publique de l'aide (FR-037)", () => {
  it("annonce les sept rôles, avec un identifiant de code pour chacun", () => {
    expect(AIDE.fr.roles).toHaveLength(7);
    expect(Object.keys(ROLES_PAR_LIBELLE)).toHaveLength(7);
    const libelles = AIDE.fr.roles.map((ligne) => ligne.role);
    expect(new Set(libelles).size).toBe(libelles.length);
    for (const ligne of AIDE.fr.roles) {
      expect(identifiantRole(ligne.role), ligne.role).toBeDefined();
    }
    for (const langue of LANGUES) {
      // Le titre dit un nombre : il doit dire le bon.
      const annonce = AIDE[langue].rolesTitre.match(/\d+/)?.[0];
      expect(Number(annonce), `${langue}.rolesTitre`).toBe(
        AIDE[langue].roles.length,
      );
    }
  });

  it("ne promet que des espaces réellement servis", () => {
    for (const ligne of AIDE.fr.espaces) {
      expect(pageExiste(ligne.chemin), ligne.chemin).toBe(true);
      expect(GARDES[ligne.chemin], ligne.chemin).toBeDefined();
    }
    expect(Object.keys(GARDES).sort()).toEqual(
      AIDE.fr.espaces.map((ligne) => ligne.chemin).sort(),
    );
  });

  it("les cinq langues promettent exactement les mêmes espaces", () => {
    const reference = AIDE.fr.espaces.map((ligne) => ligne.chemin);
    expect(reference).toContain("/presta");
    expect(reference).toContain("/proprio");
    for (const langue of LANGUES) {
      expect(
        AIDE[langue].espaces.map((ligne) => ligne.chemin),
        langue,
      ).toEqual(reference);
      for (const ligne of AIDE[langue].espaces) {
        expect(ligne.roles.trim(), `${langue} ${ligne.chemin}`).not.toBe("");
        expect(ligne.contenu.trim(), `${langue} ${ligne.chemin}`).not.toBe("");
      }
    }
  });

  it("annonce pour chaque espace les rôles exacts de sa route", () => {
    for (const ligne of AIDE.fr.espaces) {
      const gardes = GARDES[ligne.chemin] ?? null;
      const annonces = ligne.roles.split(", ").map((r) => r.trim());
      if (gardes === null) {
        expect(annonces, ligne.chemin).toHaveLength(1);
        expect(PSEUDO_ROLES.has(annonces[0] ?? ""), ligne.chemin).toBe(true);
        continue;
      }
      const identifiants = annonces.map((libelle) => {
        const identifiant = identifiantRole(libelle);
        expect(identifiant, `${ligne.chemin} : « ${libelle} »`).toBeDefined();
        return identifiant;
      });
      expect([...identifiants].sort(), ligne.chemin).toEqual(
        [...gardes].sort(),
      );
    }
  });

  it("la table des gardes dit la vérité du code des routes", () => {
    for (const [chemin, gardes] of Object.entries(GARDES)) {
      expect(rolesExigesParLeCode(chemin), chemin).toEqual(gardes);
    }
  });

  it("livre la page de preuves promise au propriétaire", () => {
    const fichier = join(RACINE_ROUTES, "proprio", "preuves", "+page.server.ts");
    expect(existsSync(fichier)).toBe(true);
    const source = readFileSync(fichier, "utf8");
    expect(source).toContain('requireRole(event, ["proprietaire"])');
  });
});
