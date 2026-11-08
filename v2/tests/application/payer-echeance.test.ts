import { describe, expect, it, vi } from "vitest";
import type {
  EcheancePaiement,
  EcheancesPaiementRepository,
} from "@/application/ports/echeances-paiement-repository";
import type { PaiementRepository } from "@/application/ports/paiement-repository";
import { PayerEcheance } from "@/application/use-cases/payer-echeance";
import type { Paiement } from "@/domain/paiement";

const ECHEANCE: EcheancePaiement = {
  id: "e1",
  tenantId: "t1",
  reservationId: "r1",
  type: "acompte",
  montantCentimes: 30_000,
  exigibleLe: "2026-11-06",
  statut: "a_payer",
  paiementId: null,
};

const PAIEMENT: Paiement = {
  id: "p1",
  tenantId: "t1",
  factureId: null,
  reservationId: "r1",
  echeanceId: "e1",
  externalId: null,
  ref: "ECH-ACOMPTE-1",
  montantCentimes: 30_000,
  mode: "cb",
  datePaiement: "2026-11-06",
  reference: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function creerCas(echeance: EcheancePaiement | null = ECHEANCE) {
  const echeances = {
    trouverParId: vi.fn().mockResolvedValue(echeance),
    marquerPaye: vi.fn().mockResolvedValue(undefined),
    creerPlusieurs: vi.fn(),
    listerParReservation: vi.fn(),
  } as unknown as EcheancesPaiementRepository;
  const paiements = {
    creer: vi.fn().mockResolvedValue({ paiement: PAIEMENT, cree: true }),
    trouverParRef: vi.fn(),
    listerParFacture: vi.fn(),
    listerParMois: vi.fn(),
  } as unknown as PaiementRepository;
  return { cas: new PayerEcheance(echeances, paiements), echeances, paiements };
}

const BASE = {
  tenantId: "t1",
  echeanceId: "e1",
  ref: "ECH-ACOMPTE-1",
  datePaiement: "2026-11-06",
};

describe("PayerEcheance", () => {
  it("crée le paiement et marque l'échéance payée", async () => {
    const { cas, echeances, paiements } = creerCas();
    const resultat = await cas.executer(BASE);

    expect(resultat.dejaPaye).toBe(false);
    expect(resultat.echeance.statut).toBe("paye");
    expect(paiements.creer).toHaveBeenCalledWith(
      expect.objectContaining({
        factureId: null,
        reservationId: "r1",
        echeanceId: "e1",
        montantCentimes: 30_000,
      }),
    );
    expect(echeances.marquerPaye).toHaveBeenCalledWith("t1", "e1", "p1");
  });

  it("est idempotent sur une échéance déjà payée", async () => {
    const { cas, paiements } = creerCas({
      ...ECHEANCE,
      statut: "paye",
      paiementId: "p1",
    });
    const resultat = await cas.executer(BASE);
    expect(resultat.dejaPaye).toBe(true);
    expect(paiements.creer).not.toHaveBeenCalled();
  });

  it("refuse un montant différent de l'échéance", async () => {
    const { cas } = creerCas();
    await expect(
      cas.executer({ ...BASE, montantCentimes: 29_999 }),
    ).rejects.toThrow("montant");
  });

  it("refuse une échéance annulée", async () => {
    const { cas } = creerCas({ ...ECHEANCE, statut: "annule" });
    await expect(cas.executer(BASE)).rejects.toThrow("ne peut plus");
  });

  it("refuse une échéance inconnue", async () => {
    const { cas } = creerCas(null);
    await expect(cas.executer(BASE)).rejects.toThrow("n'existe pas");
  });
});
