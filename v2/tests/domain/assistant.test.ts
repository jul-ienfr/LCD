import { describe, expect, it } from "vitest";
import {
  construireInvite,
  routerModele,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine assistant", () => {
  it("route selon l’intention et le ton", () => {
    expect(routerModele("arrivee", "neutre").niveau).toBe("local");
    expect(routerModele("menage", "concis").niveau).toBe("local");
    expect(routerModele("retard", "neutre").niveau).toBe("standard");
    expect(routerModele("arrivee", "chaleureux").niveau).toBe("standard");
    expect(routerModele("avis", "chaleureux").niveau).toBe("premium");
    expect(routerModele("avis", "chaleureux").coutEstimeCentimes).toBe(8);
    expect(routerModele("menage", "concis").coutEstimeCentimes).toBe(0);
  });

  it("construit un prompt borné et sans code sensible", () => {
    const invite = construireInvite({
      intention: "arrivee",
      ton: "neutre",
      logement: "Loft Bastille",
      voyageur: "Camille",
      details: "Arrivée dès 14 h.",
    });
    expect(invite).toContain("Loft Bastille");
    expect(invite).toContain("Camille");
    expect(invite).toContain("80 mots maximum");
    expect(invite).toContain("aucun code d’accès");

    expect(() =>
      construireInvite({
        intention: "arrivee",
        ton: "neutre",
        logement: "Loft Bastille",
        voyageur: "",
        details: "Le code d’accès est 4821.",
      }),
    ).toThrow(/PIN/);
    expect(() =>
      construireInvite({
        intention: "arrivee",
        ton: "neutre",
        logement: "",
        voyageur: "",
        details: "",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      construireInvite({
        intention: "arrivee",
        ton: "neutre",
        logement: "Loft",
        voyageur: "a".repeat(81),
        details: "",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      construireInvite({
        intention: "arrivee",
        ton: "neutre",
        logement: "Loft",
        voyageur: "",
        details: "a".repeat(401),
      }),
    ).toThrow(ErreurMetier);
  });
});
