import { describe, expect, it } from "vitest";
import { CreerFacture } from "@/application/use-cases/creer-facture";
import { FactureRepositoryMemoire } from "../helpers/facture-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";
const logementId = "22222222-2222-4222-8222-222222222222";

const base = {
  tenantId,
  logementId,
  numero: "fac-2026-0001",
  clientNom: "Client Facture",
  dateEmission: "2026-11-20",
  tvaCentimes: 8_750,
  taxeSejourCentimes: 1_400,
  lignes: [
    {
      designation: "Séjour 7 nuits",
      quantite: 7,
      prixUnitaireCentimes: 12_000,
    },
  ],
};

describe("CreerFacture", () => {
  it("crée une facture, normalise le numéro et calcule les totaux", async () => {
    const facture = await new CreerFacture(
      new FactureRepositoryMemoire(),
    ).executer(base);

    expect(facture.numero).toBe("FAC-2026-0001");
    expect(facture.montantHtCentimes).toBe(84_000);
    expect(facture.montantTtcCentimes).toBe(94_150);
    expect(facture.lignes).toHaveLength(1);
    expect(facture.lignes[0]?.totalCentimes).toBe(84_000);
  });

  it("refuse un numéro invalide", async () => {
    await expect(
      new CreerFacture(new FactureRepositoryMemoire()).executer({
        ...base,
        numero: "fac 1",
      }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
  });

  it("refuse une facture sans ligne", async () => {
    await expect(
      new CreerFacture(new FactureRepositoryMemoire()).executer({
        ...base,
        lignes: [],
      }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
  });

  it("refuse une échéance antérieure à l'émission", async () => {
    await expect(
      new CreerFacture(new FactureRepositoryMemoire()).executer({
        ...base,
        echeance: "2026-11-01",
      }),
    ).rejects.toMatchObject({ code: "FACTURE_INVALIDE" });
  });
});
