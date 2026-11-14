import { describe, expect, it } from "vitest";
import {
  codeAutomatisationValide,
  conditionsRemplies,
  dateDeclenchement,
  normaliserCodeAutomatisation,
  rendreModele,
  validerAutomatisation,
  type Automatisation,
} from "@/domain/automatisation-message";
import { AUTOMATISATIONS_PAR_DEFAUT } from "@/domain/automatisations-defaut";
import { ErreurMetier } from "@/domain/erreurs";

function automatisation(partiel: Partial<Automatisation> = {}): Automatisation {
  return {
    id: "auto-1",
    tenantId: "tenant-1",
    code: "veille-arrivee",
    libelle: "Instructions d'arrivée (J-1)",
    declencheur: "j-1",
    canal: "email",
    sujet: "Votre arrivée demain",
    modele: "Bonjour {{voyageur}}, arrivée le {{arrivee}}.",
    conditions: {},
    actif: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...partiel,
  };
}

describe("domaine des automatisations de message", () => {
  it("normalise et valide les codes", () => {
    expect(normaliserCodeAutomatisation("Préparation Séjour !")).toBe(
      "preparation-sejour",
    );
    expect(codeAutomatisationValide("preparation-sejour")).toBe(true);
    expect(codeAutomatisationValide("Preparation")).toBe(false);
    expect(codeAutomatisationValide("a")).toBe(false);
  });

  it("calcule la date de déclenchement de chaque jalon", () => {
    expect(dateDeclenchement("j-7", "2027-06-10", "2027-06-17")).toBe("2027-06-03");
    expect(dateDeclenchement("j-1", "2027-06-10", "2027-06-17")).toBe("2027-06-09");
    expect(dateDeclenchement("arrivee", "2027-06-10", "2027-06-17")).toBe(
      "2027-06-10",
    );
    expect(dateDeclenchement("depart", "2027-06-10", "2027-06-17")).toBe(
      "2027-06-17",
    );
    expect(dateDeclenchement("j+1", "2027-06-10", "2027-06-17")).toBe("2027-06-18");
    expect(dateDeclenchement("reservation_creee", "2027-06-10", "2027-06-17")).toBe(
      null,
    );
    expect(dateDeclenchement("j-7", "2027-01-03", "2027-01-10")).toBe("2026-12-27");
  });

  it("filtre par logement, nuits, canal et statut", () => {
    const base = {
      logementId: "logement-1",
      nuits: 7,
      canal: "email" as const,
      statutReservation: "confirmee",
    };
    expect(conditionsRemplies({}, base)).toBe(true);
    expect(conditionsRemplies({ logementIds: ["logement-2"] }, base)).toBe(false);
    expect(conditionsRemplies({ logementIds: ["logement-1"] }, base)).toBe(true);
    expect(conditionsRemplies({ nuitsMin: 7 }, base)).toBe(true);
    expect(conditionsRemplies({ nuitsMin: 8 }, base)).toBe(false);
    expect(conditionsRemplies({ nuitsMax: 3 }, base)).toBe(false);
    expect(conditionsRemplies({ canaux: ["sms"] }, base)).toBe(false);
    expect(conditionsRemplies({ canaux: ["email", "sms"] }, base)).toBe(true);
    expect(conditionsRemplies({ reservationStatuts: ["en_sejour"] }, base)).toBe(
      false,
    );
  });

  it("rend un modèle et signale les variables manquantes", () => {
    const rendu = rendreModele("Bonjour {{voyageur}}, séjour au {{logement}}.", {
      voyageur: "Camille",
    });
    expect(rendu.texte).toBe("Bonjour Camille, séjour au {{logement}}.");
    expect(rendu.variablesManquantes).toEqual(["logement"]);

    const vide = rendreModele("Aucune variable.", {});
    expect(vide.texte).toBe("Aucune variable.");
    expect(vide.variablesManquantes).toEqual([]);
  });

  it("refuse une automatisation mal formée", () => {
    const valide = {
      code: "veille-arrivee",
      libelle: "Instructions d'arrivée",
      declencheur: "j-1",
      canal: "email",
      modele: "Bonjour {{voyageur}}, votre séjour approche.",
    };
    expect(() => validerAutomatisation(valide)).not.toThrow();
    expect(() => validerAutomatisation({ ...valide, code: "!" })).toThrowError(
      ErreurMetier,
    );
    expect(() => validerAutomatisation({ ...valide, libelle: "" })).toThrowError(
      /libellé/i,
    );
    expect(() =>
      validerAutomatisation({ ...valide, declencheur: "jamais" }),
    ).toThrowError(/déclencheur/i);
    expect(() => validerAutomatisation({ ...valide, canal: "fax" })).toThrowError(
      /canal/i,
    );
    expect(() => validerAutomatisation({ ...valide, modele: "court" })).toThrowError(
      /modèle/i,
    );
    expect(() =>
      validerAutomatisation({
        ...valide,
        conditions: { nuitsMin: 5, nuitsMax: 2 },
      }),
    ).toThrowError(/maximum/i);
  });

  it("propose des modèles par défaut tous valides et rendables", () => {
    expect(AUTOMATISATIONS_PAR_DEFAUT).toHaveLength(5);
    const variables = {
      voyageur: "Camille",
      logement: "Villa Test",
      arrivee: "2027-06-10",
      depart: "2027-06-17",
      nuits: "7",
      reference: "DIR-0001",
      guide: "https://lcd.test/guide/abc123",
      avis: "https://lcd.test/avis/abc123",
    };
    for (const modele of AUTOMATISATIONS_PAR_DEFAUT) {
      expect(() => validerAutomatisation(modele)).not.toThrow();
      const rendu = rendreModele(modele.modele, variables);
      expect(rendu.variablesManquantes).toEqual([]);
      expect(rendu.texte).toContain("Camille");
    }
  });

  it("refuse une automatisation désactivée ou au canal inconnu", () => {
    expect(() =>
      validerAutomatisation({
        code: "x1",
        libelle: "Test",
        declencheur: "j-1",
        canal: "email",
        modele: "Bonjour {{voyageur}} et à bientôt.",
        conditions: { canaux: ["fax" as never] },
      }),
    ).toThrowError(/canal/i);
    expect(automatisation({ actif: false }).actif).toBe(false);
  });
});
