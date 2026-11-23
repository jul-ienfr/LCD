import { describe, expect, it } from "vitest";
import type { RoleUtilisateur } from "@/domain/utilisateur";
import { destinationRole } from "@/lib/server/session";
import { traductionsNavigation } from "@/lib/i18n-nav";
import { filArianeStaff } from "@/lib/navigation/fil-ariane";
import {
  filtrerNavigation,
  lienActif,
  lienVisiblePour,
  MAX_ENTREES_PRINCIPALES,
  normaliserChemin,
  ROLES_STAFF,
  tousLesLiens,
  validerNavigation,
} from "@/lib/navigation/modele";
import { NAVIGATION_STAFF } from "@/lib/navigation/navigation-staff";

const tNav = traductionsNavigation("fr");

/**
 * Préfixes réservés : role → préfixes que ce rôle est le seul (ou l'un des
 * seuls) à pouvoir atteindre. Toute entrée de navigation hors liste blanche
 * est un défaut d'exposition (tâche T067).
 */
const PREFIXES_RESERVES: Record<string, readonly string[]> = {
  supervision: ["/supervision"],
  utilisateurs: ["/hote/utilisateurs"],
};

describe("navigation staff", () => {
  it("respecte les invariants du contrat", () => {
    expect(validerNavigation(NAVIGATION_STAFF)).toEqual([]);
    expect(NAVIGATION_STAFF.principal.length).toBeLessThanOrEqual(
      MAX_ENTREES_PRINCIPALES,
    );
  });

  it("ne contient aucun doublon de href", () => {
    const hrefs = tousLesLiens(NAVIGATION_STAFF).map((lien) =>
      normaliserChemin(lien.href),
    );
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it("réserve la supervision au super-admin", () => {
    const superAdmin = filtrerNavigation(NAVIGATION_STAFF, "super_admin");
    const hote = filtrerNavigation(NAVIGATION_STAFF, "hote");
    const supervision = (navigation: typeof NAVIGATION_STAFF) =>
      navigation.domaines.some((domaine) => domaine.id === "supervision");
    expect(supervision(superAdmin)).toBe(true);
    expect(supervision(hote)).toBe(false);
  });

  it("masque les entrées sensibles aux rôles non autorisés", () => {
    const presta = filtrerNavigation(NAVIGATION_STAFF, "presta");
    const hrefs = tousLesLiens(presta).map((lien) => lien.href);
    expect(hrefs).not.toContain("/hote/utilisateurs");
    expect(hrefs).not.toContain("/hote/factures");
  });

  it("dérive un fil d'Ariane cliquable jusqu'à la page courante", () => {
    const fil = filArianeStaff("/hote/factures/FAC-2026-0001", tNav);
    expect(fil.length).toBeGreaterThanOrEqual(2);
    expect(fil[0]?.href).toBe("/hote");
    expect(fil.at(-1)?.href).toBeUndefined();
  });

  it("n'active qu'une entrée à la fois", () => {
    expect(lienActif("/hote/planning/canaux", "/hote/planning")).toBe(true);
    expect(lienActif("/hote/planning", "/hote")).toBe(false);
    expect(lienActif("/hote", "/hote")).toBe(true);
  });
});

/**
 * T067 — filtrage par rôle : aucune fuite hors périmètre.
 * Chaque rôle staff est vérifié sur les mêmes invariants, puis la liste des
 * liens visibles est comparée à une liste blanche de préfixes autorisés.
 */
describe("T067 — filtrage par rôle sans fuite", () => {
  const PREFIXES_AUTORISES = ["/hote", "/supervision"] as const;

  it.each(ROLES_STAFF)("%s : aucun lien hors /hote ou /supervision", (role) => {
    const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
    for (const lien of tousLesLiens(navigation)) {
      expect(
        PREFIXES_AUTORISES.some((prefixe) =>
          normaliserChemin(lien.href).startsWith(prefixe),
        ),
        `${role} → ${lien.href}`,
      ).toBe(true);
    }
  });

  it.each(ROLES_STAFF)("%s : au plus 7 entrées principales", (role) => {
    const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
    expect(navigation.principal.length).toBeLessThanOrEqual(
      MAX_ENTREES_PRINCIPALES,
    );
  });

  it.each(ROLES_STAFF)(
    "%s : aucune supervision hors super_admin",
    (role) => {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      const supervision = tousLesLiens(navigation).filter((lien) =>
        normaliserChemin(lien.href).startsWith("/supervision"),
      );
      if (role === "super_admin") {
        expect(supervision.length).toBeGreaterThan(0);
      } else {
        expect(supervision).toEqual([]);
      }
    },
  );

  it.each(ROLES_STAFF.filter((role) => role !== "super_admin"))(
    "%s : aucune entrée de supervision dans les domaines",
    (role) => {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      expect(
        navigation.domaines.some((domaine) => domaine.id === "supervision"),
      ).toBe(false);
    },
  );

  it.each(["hote", "operateur", "comptable", "presta", "proprietaire", "commercial"])(
    "%s : aucun lien /hote/utilisateurs",
    (role) => {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      const hrefs = tousLesLiens(navigation).map((lien) =>
        normaliserChemin(lien.href),
      );
      for (const prefixe of PREFIXES_RESERVES.utilisateurs ?? []) {
        expect(hrefs.some((href) => href.startsWith(prefixe))).toBe(false);
      }
    },
  );

  it.each(["super_admin", "admin"])(
    "%s : les entrées réservées restent visibles",
    (role) => {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      const hrefs = tousLesLiens(navigation).map((lien) => lien.href);
      expect(hrefs).toContain("/hote/acces");
      expect(hrefs).toContain("/hote/securite");
    },
  );

  it.each(["hote", "operateur", "comptable", "presta", "proprietaire", "commercial"])(
    "%s : aucune entrée d'administration réservée",
    (role) => {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      const hrefs = tousLesLiens(navigation).map((lien) => lien.href);
      expect(hrefs).not.toContain("/hote/acces");
      expect(hrefs).not.toContain("/hote/securite");
      expect(hrefs).not.toContain("/hote/entite");
      expect(hrefs).not.toContain("/hote/integrations");
    },
  );

  it("distingue un rôle inconnu ou absent : aucun lien à rôle restreint", () => {
    const liens = tousLesLiens(NAVIGATION_STAFF);
    for (const lien of liens) {
      if (!lien.roles || lien.roles.length === 0) continue;
      expect(lienVisiblePour(lien, null), `${lien.href} avec rôle null`).toBe(
        false,
      );
      expect(
        lienVisiblePour(lien, "role-inexistant"),
        `${lien.href} avec rôle inconnu`,
      ).toBe(false);
    }
  });

  it("le super-admin voit tous les liens à rôle restreint", () => {
    const superAdmin = filtrerNavigation(NAVIGATION_STAFF, "super_admin");
    const hrefsSuperAdmin = new Set(
      tousLesLiens(superAdmin).map((lien) => normaliserChemin(lien.href)),
    );
    for (const lien of tousLesLiens(NAVIGATION_STAFF)) {
      if (!lien.roles || lien.roles.length === 0) continue;
      expect(hrefsSuperAdmin.has(normaliserChemin(lien.href))).toBe(true);
    }
  });

  it("chaque rôle servi par /hote obtient au moins une entrée principale", () => {
    // `hote/+layout.server.ts` ne vérifie que la session : la navigation staff
    // est rendue sous /hote. Les rôles `presta`, `proprietaire` et
    // `commercial` ont leur propre surface (`/presta`, `/proprio`,
    // `/commercial`, cf. `destinationRole`) et ne peuvent ouvrir aucune route
    // /hote : leur navigation principale doit donc rester vide plutôt que
    // d'afficher des liens refusés.
    for (const role of roleServisParHote()) {
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      expect(navigation.principal.length, role).toBeGreaterThan(0);
    }
  });

  it("les rôles hors /hote n'ont aucun lien principal et ont leur propre accueil", () => {
    for (const role of ROLES_STAFF) {
      if (roleServisParHote().includes(role)) continue;
      const navigation = filtrerNavigation(NAVIGATION_STAFF, role);
      expect(navigation.principal, role).toHaveLength(0);
      expect(destinationRole(role), role).not.toBe("/hote");
    }
  });

  it("aucun lien affiché n'est refusé par les gardes serveur", () => {
    // Table de correspondance volontairement dupliquée : elle vient des
    // `requireRole(event, [...])` de chaque route, et ce test échoue si un
    // nouveau lien pointe vers une route plus restrictive que le modèle.
    const GARDES: Record<string, readonly string[]> = {
      "/hote": ["admin", "hote", "comptable"],
      "/hote/acces": ["admin"],
      "/hote/utilisateurs": ["admin"],
      "/hote/missions": ["admin", "hote", "operateur"],
      "/hote/intervenants": ["admin", "hote", "operateur"],
      "/hote/messages/fils": ["admin", "hote", "operateur"],
      "/hote/compta": ["admin", "hote", "comptable"],
      "/hote/factures": ["admin", "hote", "comptable"],
      "/hote/rapports": ["admin", "hote", "comptable"],
      "/hote/cautions": ["admin", "hote", "comptable"],
      "/hote/recherche": ["admin", "hote", "comptable", "operateur"],
    };
    for (const [href, roles] of Object.entries(GARDES)) {
      const lien = tousLesLiens(NAVIGATION_STAFF).find(
        (candidat) => normaliserChemin(candidat.href) === href,
      );
      if (!lien?.roles) continue;
      for (const role of ROLES_STAFF) {
        if (role === "super_admin") continue;
        const autorise =
          roles.includes(role) || (role === "operateur" && roles.includes("hote"));
        if (lien.roles.includes(role)) {
          expect(autorise, `${href} visible pour ${role}`).toBe(true);
        }
      }
    }
  });
});

/** Rôles réellement servis par la navigation `/hote`. */
function roleServisParHote(): readonly RoleUtilisateur[] {
  return ["super_admin", "admin", "hote", "operateur", "comptable"];
}
