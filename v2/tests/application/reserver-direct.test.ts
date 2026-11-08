import { describe, expect, it, vi } from "vitest";
import type {
  CreerEcheancePaiementData,
  EcheancesPaiementRepository,
} from "@/application/ports/echeances-paiement-repository";
import type { ParametresFiscauxRepository } from "@/application/ports/parametres-fiscaux-repository";
import type { PromotionsRepository } from "@/application/ports/promotions-repository";
import type { DemanderReservationDirecte } from "@/application/use-cases/reservation-directe";
import { ReserverDirect } from "@/application/use-cases/reserver-direct";
import type { Reservation } from "@/domain/reservation";

const DEVIS = {
  nuits: 3,
  totalCentimes: 100_000,
  lignes: [
    { date: "2026-12-01", prixCentimes: 30_000 },
    { date: "2026-12-02", prixCentimes: 35_000 },
    { date: "2026-12-03", prixCentimes: 35_000 },
  ],
};

const RESERVATION: Reservation = {
  id: "r1",
  tenantId: "t1",
  logementId: "l1",
  ref: "DIR-TEST123456",
  clientNom: "Camille Martin",
  clientEmail: "camille@example.test",
  voyageurs: 2,
  debut: "2026-12-01",
  fin: "2026-12-04",
  statut: "brouillon",
  montantCentimes: 90_540,
  source: "direct",
  fluxIcsId: null,
  departConfirmeLe: null,
  departNote: null,
  createdAt: new Date("2026-11-06T10:00:00Z"),
  updatedAt: new Date("2026-11-06T10:00:00Z"),
};

function creerCas(options: { promo?: boolean; code?: string } = {}) {
  const preparer = vi.fn().mockResolvedValue(DEVIS);
  const executer = vi.fn().mockResolvedValue({
    reservation: RESERVATION,
    devis: DEVIS,
  });
  const demander = { preparer, executer } as unknown as DemanderReservationDirecte;

  const fiscal = {
    trouver: vi.fn().mockResolvedValue({
      tenantId: "t1",
      tauxTvaBp: 1_000,
      taxeSejourNuitPersonneCentimes: 100,
      taxeSejourPlafondCentimes: null,
      prefixeFacture: "FAC",
      mentionsLegales: null,
    }),
  } as unknown as ParametresFiscauxRepository;

  const promotions = {
    trouverParCode: vi.fn().mockResolvedValue(
      options.promo === false
        ? null
        : {
            id: "p1",
            code: "MER-10",
            type: "pourcentage" as const,
            valeur: 10,
            conditions: {},
            actif: true,
            debutAt: null,
            finAt: null,
          },
    ),
  } as unknown as PromotionsRepository;

  const echeances = {
    creerPlusieurs: vi
      .fn()
      .mockImplementation(async (entrees: CreerEcheancePaiementData[]) =>
        entrees.map((entree, index) => ({
          id: `e${index}`,
          ...entree,
          statut: entree.statut ?? "a_payer",
          paiementId: null,
        })),
      ),
  } as unknown as EcheancesPaiementRepository;

  const cas = new ReserverDirect(demander, fiscal, promotions, echeances);
  return { cas, preparer, executer, promotions, echeances };
}

const BASE = {
  tenantId: "t1",
  logementId: "l1",
  ref: "DIR-TEST123456",
  clientNom: "Camille Martin",
  clientEmail: "camille@example.test",
  voyageurs: 2,
  debut: "2026-12-01",
  fin: "2026-12-04",
  maintenant: new Date("2026-11-06T10:00:00Z"),
};

describe("ReserverDirect", () => {
  it("ajoute la taxe, applique la remise et crée l'échéancier", async () => {
    const { cas, executer, echeances } = creerCas();
    const resultat = await cas.executer({ ...BASE, codePromo: "mer-10" });

    expect(resultat.taxeCentimes).toBe(600);
    expect(resultat.remiseCentimes).toBe(10_060);
    expect(resultat.totalCentimes).toBe(90_540);
    expect(resultat.echeancier.acompte.montantCentimes).toBe(27_162);
    expect(resultat.echeancier.solde.montantCentimes).toBe(63_378);
    expect(executer).toHaveBeenCalledWith(
      expect.objectContaining({ totalCentimes: 90_540 }),
    );
    expect(echeances.creerPlusieurs).toHaveBeenCalledTimes(1);
    expect(resultat.echeances).toHaveLength(2);
  });

  it("ne consulte pas les promotions sans code", async () => {
    const { cas, promotions } = creerCas();
    const resultat = await cas.executer(BASE);
    expect(resultat.remiseCentimes).toBe(0);
    expect(resultat.totalCentimes).toBe(100_600);
    expect(promotions.trouverParCode).not.toHaveBeenCalled();
  });

  it("refuse un code inconnu", async () => {
    const { cas } = creerCas({ promo: false });
    await expect(
      cas.executer({ ...BASE, codePromo: "INCONNU" }),
    ).rejects.toThrow("n'existe pas");
  });

  it("ajoute la caution quand elle est demandée", async () => {
    const { cas } = creerCas();
    const resultat = await cas.executer({
      ...BASE,
      cautionCentimes: 50_000,
    });
    expect(resultat.echeancier.caution?.montantCentimes).toBe(50_000);
    expect(resultat.echeances).toHaveLength(3);
  });
});
