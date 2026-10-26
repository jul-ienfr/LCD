import { describe, expect, it } from "vitest";
import {
  BUDGET_ASSISTANT_MENSUEL_CENTIMES,
  budgetAssistantAutorise,
  compterMots,
  construireInvite,
  debutMois,
  QUOTA_ASSISTANT_MENSUEL,
  refBrouillon,
  routerModele,
  typeMessageDepuisIntention,
  verifierBrouillon,
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

  it("mappe les intentions et produit une référence stable", () => {
    expect(typeMessageDepuisIntention("arrivee")).toBe("arrivee");
    expect(typeMessageDepuisIntention("depart")).toBe("depart");
    expect(typeMessageDepuisIntention("retard")).toBe("autre");
    expect(typeMessageDepuisIntention("menage")).toBe("autre");
    expect(typeMessageDepuisIntention("avis")).toBe("autre");

    const signature = {
      logementId: "l1",
      intention: "arrivee" as const,
      ton: "neutre" as const,
      canal: "email",
      voyageur: "Camille",
      details: "",
      texte: "Bonjour Camille.",
    };
    const reference = refBrouillon(signature);
    expect(reference).toMatch(/^assist-arrivee-[0-9a-f]{8}$/);
    expect(refBrouillon(signature)).toBe(reference);
    expect(refBrouillon({ ...signature, canal: "sms" })).not.toBe(reference);
    expect(refBrouillon({ ...signature, texte: "Bonjour." })).not.toBe(
      reference,
    );
  });

  it("contrôle la longueur et les promesses du brouillon", () => {
    expect(compterMots("  Bonjour   Camille.  ")).toBe(2);
    expect(compterMots("   ")).toBe(0);
    expect(verifierBrouillon("Bonjour Camille, à bientôt.")).toEqual([]);
    expect(verifierBrouillon("   ")).toEqual(["Le brouillon est vide."]);
    expect(verifierBrouillon("mot ".repeat(81))).toEqual([
      "Le brouillon dépasse 80 mots (81).",
    ]);
    expect(verifierBrouillon("Le code d’accès est 4821.")).toContain(
      "Le brouillon contient un code d’accès (PIN).",
    );
    expect(
      verifierBrouillon("Séjour garanti, remboursement assuré."),
    ).toContain(
      "Le brouillon contient une promesse commerciale (garantie, remboursement).",
    );
  });

  it("applique le quota et le budget mensuels", () => {
    expect(
      budgetAssistantAutorise({ nombre: 0, coutCentimes: 0 }, 2),
    ).toEqual({ autorise: true, raison: "" });
    expect(
      budgetAssistantAutorise(
        { nombre: QUOTA_ASSISTANT_MENSUEL, coutCentimes: 0 },
        0,
      ).autorise,
    ).toBe(false);
    expect(
      budgetAssistantAutorise(
        { nombre: 10, coutCentimes: BUDGET_ASSISTANT_MENSUEL_CENTIMES },
        2,
      ),
    ).toEqual({
      autorise: false,
      raison: "Budget mensuel de 10,00 € atteint.",
    });

    const maintenant = new Date("2026-10-25T12:00:00.000Z");
    expect(debutMois(maintenant).getDate()).toBe(1);
    expect(debutMois(maintenant).getMonth()).toBe(9);
  });
});
