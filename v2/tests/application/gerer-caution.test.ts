import { describe, expect, it, vi } from "vitest";
import type { Paiement } from "@/application/ports/paiement";
import { GererCaution } from "@/application/use-cases/gerer-caution";
import { CautionRepositoryMemoire } from "../helpers/caution-repository-memoire";

function creerPaiement() {
  const creerEmpreinte = vi.fn().mockResolvedValue({
    id: "pi_caution_1",
    clientSecret: "secret",
    statut: "requires_capture",
  });
  const capturerEmpreinte = vi.fn().mockResolvedValue({
    id: "pi_caution_1",
    montantCentimes: 12_000,
    statut: "capture",
  });
  const annulerEmpreinte = vi.fn().mockResolvedValue({ statut: "canceled" });
  return {
    creerEmpreinte,
    capturerEmpreinte,
    annulerEmpreinte,
  } as unknown as Paiement & {
    creerEmpreinte: typeof creerEmpreinte;
    capturerEmpreinte: typeof capturerEmpreinte;
    annulerEmpreinte: typeof annulerEmpreinte;
  };
}

const BASE = {
  tenantId: "t1",
  reservationId: "r1",
  montantCentimes: 50_000,
};

describe("GererCaution", () => {
  it("prend une empreinte puis la marque reçue", async () => {
    const cautions = new CautionRepositoryMemoire();
    const paiement = creerPaiement();
    const cas = new GererCaution(cautions, paiement);

    const caution = await cas.prendreEmpreinte(BASE);

    expect(caution.statut).toBe("recue");
    expect(caution.mode).toBe("empreinte");
    expect(caution.empreinteId).toBe("pi_caution_1");
    expect(paiement.creerEmpreinte).toHaveBeenCalledWith(
      expect.objectContaining({ montantCentimes: 50_000, devise: "EUR" }),
    );
  });

  it("est idempotent sur une caution déjà autorisée", async () => {
    const cautions = new CautionRepositoryMemoire();
    const paiement = creerPaiement();
    const cas = new GererCaution(cautions, paiement);
    await cas.prendreEmpreinte(BASE);
    await cas.prendreEmpreinte(BASE);
    expect(paiement.creerEmpreinte).toHaveBeenCalledTimes(1);
  });

  it("capture le montant retenu", async () => {
    const cautions = new CautionRepositoryMemoire();
    const paiement = creerPaiement();
    const cas = new GererCaution(cautions, paiement);
    const caution = await cas.prendreEmpreinte(BASE);

    const apres = await cas.capturer({
      tenantId: "t1",
      cautionId: caution.id,
      montantRetenuCentimes: 12_000,
      motif: "Vitre cassée",
    });

    expect(apres.statut).toBe("retenue");
    expect(apres.montantRetenuCentimes).toBe(12_000);
    expect(apres.montantCaptureCentimes).toBe(12_000);
    expect(paiement.capturerEmpreinte).toHaveBeenCalledWith(
      "pi_caution_1",
      12_000,
    );
  });

  it("refuse une retenue supérieure à la caution", async () => {
    const cautions = new CautionRepositoryMemoire();
    const cas = new GererCaution(cautions, creerPaiement());
    const caution = await cas.prendreEmpreinte(BASE);
    await expect(
      cas.capturer({
        tenantId: "t1",
        cautionId: caution.id,
        montantRetenuCentimes: 50_001,
      }),
    ).rejects.toThrow("dépasse");
  });

  it("libère l'empreinte sans débit", async () => {
    const cautions = new CautionRepositoryMemoire();
    const paiement = creerPaiement();
    const cas = new GererCaution(cautions, paiement);
    const caution = await cas.prendreEmpreinte(BASE);

    const apres = await cas.liberer("t1", caution.id);

    expect(apres.statut).toBe("restituee");
    expect(paiement.annulerEmpreinte).toHaveBeenCalledWith("pi_caution_1");
  });

  it("refuse une caution sans empreinte active", async () => {
    const cautions = new CautionRepositoryMemoire();
    const cas = new GererCaution(cautions, creerPaiement());
    await expect(cas.liberer("t1", "inconnue")).rejects.toThrow("n'existe pas");
  });
});
