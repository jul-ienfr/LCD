import { describe, expect, it } from "vitest";
import {
  agregerPayouts,
  calculerEcartPayout,
  estRapproche,
  statutApresPaiement,
  statutPayoutValide,
  modePayoutValide,
  montantPayoutValide,
  refPayoutValide,
  payoutCoherent,
  TOLERANCE_RAPPROCHEMENT_BP,
  type PayoutProprietaire,
} from "@/domain/paiement-proprietaire";

function payout(overrides: Partial<PayoutProprietaire> = {}): PayoutProprietaire {
  return {
    id: "payout-1",
    tenantId: "tenant-1",
    proprietaireId: "user-1",
    releveId: "releve-1",
    ref: "payout-2026-0001",
    montantAttenduCentimes: 100_000,
    montantPayeCentimes: null,
    mode: "virement",
    statut: "en_attente",
    datePaiement: null,
    note: null,
    ...overrides,
  };
}

describe("paiement-proprietaire — calculerEcartPayout (T515)", () => {
  it("calcule un écart nul pour un paiement exact", () => {
    const ecart = calculerEcartPayout(100_000, 100_000);
    expect(ecart.ecartCentimes).toBe(0);
    expect(ecart.ecartBp).toBe(0);
  });

  it("calcule un écart relatif en bp", () => {
    // 1 % d'écart = 100 bp
    const ecart = calculerEcartPayout(100_000, 99_000);
    expect(ecart.ecartCentimes).toBe(-1_000);
    expect(ecart.ecartBp).toBe(100);
  });

  it("calcule un écart positif pour un trop-payé", () => {
    const ecart = calculerEcartPayout(100_000, 102_500);
    expect(ecart.ecartCentimes).toBe(2_500);
    expect(ecart.ecartBp).toBe(250);
  });

  it("considère un paiement nul comme un montant payé de 0", () => {
    const ecart = calculerEcartPayout(100_000, null);
    expect(ecart.ecartCentimes).toBe(-100_000);
    expect(ecart.ecartBp).toBe(10_000); // 100 % d'écart
  });

  it("gère un montant attendu nul", () => {
    expect(calculerEcartPayout(0, 0)).toEqual({
      ecartCentimes: 0,
      ecartBp: 0,
    });
    const avecPaiement = calculerEcartPayout(0, 1_000);
    expect(avecPaiement.ecartCentimes).toBe(1_000);
    expect(avecPaiement.ecartBp).toBe(Number.MAX_SAFE_INTEGER);
  });
});

describe("paiement-proprietaire — estRapproche (T515)", () => {
  it("un payout non payé n'est jamais rapproché", () => {
    expect(estRapproche(100_000, null)).toBe(false);
  });

  it("un paiement exact est rapproché", () => {
    expect(estRapproche(100_000, 100_000)).toBe(true);
  });

  it("un écart dans la tolérance est rapproché", () => {
    // 1 % d'écart = 100 bp, sous le seuil de 200 bp
    expect(estRapproche(100_000, 99_000)).toBe(true);
    // Exactement à la tolérance
    expect(estRapproche(100_000, 98_000)).toBe(true);
  });

  it("un écart au-delà de la tolérance n'est pas rapproché", () => {
    // 2,5 % d'écart = 250 bp, au-dessus de 200 bp
    expect(estRapproche(100_000, 97_500)).toBe(false);
  });

  it("respecte une tolérance personnalisée", () => {
    expect(estRapproche(100_000, 99_000, 50)).toBe(false);
    expect(estRapproche(100_000, 99_000, 150)).toBe(true);
  });
});

describe("paiement-proprietaire — statutApresPaiement (T515)", () => {
  it("retourne rapproche pour un paiement dans la tolérance", () => {
    expect(statutApresPaiement(100_000, 100_000)).toBe("rapproche");
    expect(statutApresPaiement(100_000, 99_000)).toBe("rapproche");
  });

  it("retourne paye pour un paiement hors tolérance", () => {
    expect(statutApresPaiement(100_000, 90_000)).toBe("paye");
  });
});

describe("paiement-proprietaire — validations (T515)", () => {
  it("statutPayoutValide accepte les statuts connus", () => {
    expect(statutPayoutValide("en_attente")).toBe(true);
    expect(statutPayoutValide("valide")).toBe(true);
    expect(statutPayoutValide("paye")).toBe(true);
    expect(statutPayoutValide("rapproche")).toBe(true);
    expect(statutPayoutValide("inconnu")).toBe(false);
  });

  it("modePayoutValide accepte les modes connus", () => {
    expect(modePayoutValide("virement")).toBe(true);
    expect(modePayoutValide("cheque")).toBe(true);
    expect(modePayoutValide("especes")).toBe(true);
    expect(modePayoutValide("autre")).toBe(true);
    expect(modePayoutValide("carte")).toBe(false);
  });

  it("montantPayoutValide accepte les entiers positifs ou nuls", () => {
    expect(montantPayoutValide(0)).toBe(true);
    expect(montantPayoutValide(100_000)).toBe(true);
    expect(montantPayoutValide(-1)).toBe(false);
    expect(montantPayoutValide(10.5)).toBe(false);
  });

  it("refPayoutValide valide le format de référence", () => {
    expect(refPayoutValide("payout-2026-0001")).toBe(true);
    expect(refPayoutValide("abc123XYZ-99")).toBe(true);
    expect(refPayoutValide("court")).toBe(false);
    expect(refPayoutValide("avec espace ici")).toBe(false);
  });
});

describe("paiement-proprietaire — payoutCoherent (T515)", () => {
  it("un payout en_attente sans paiement est cohérent", () => {
    expect(payoutCoherent(payout())).toBe(true);
  });

  it("un payout paye avec montant et date est cohérent", () => {
    expect(
      payoutCoherent(
        payout({
          statut: "paye",
          montantPayeCentimes: 100_000,
          datePaiement: "2026-04-01",
        }),
      ),
    ).toBe(true);
  });

  it("un payout rapproche avec montant et date est cohérent", () => {
    expect(
      payoutCoherent(
        payout({
          statut: "rapproche",
          montantPayeCentimes: 100_000,
          datePaiement: "2026-04-01",
        }),
      ),
    ).toBe(true);
  });

  it("un payout paye sans montant est incohérent", () => {
    expect(
      payoutCoherent(payout({ statut: "paye", datePaiement: "2026-04-01" })),
    ).toBe(false);
  });

  it("un payout en_attente avec un montant payé est incohérent", () => {
    expect(
      payoutCoherent(payout({ montantPayeCentimes: 100_000 })),
    ).toBe(false);
  });

  it("un montant attendu négatif est incohérent", () => {
    expect(payoutCoherent(payout({ montantAttenduCentimes: -100 }))).toBe(false);
  });
});

describe("paiement-proprietaire — agregerPayouts (T515)", () => {
  it("agrège une liste vide", () => {
    const suivi = agregerPayouts([]);
    expect(suivi.total).toBe(0);
    expect(suivi.totalAttenduCentimes).toBe(0);
    expect(suivi.totalPayeCentimes).toBe(0);
    expect(suivi.enEcart).toBe(0);
  });

  it("compte les statuts et les totaux", () => {
    const payouts = [
      payout({ id: "1", statut: "en_attente", montantAttenduCentimes: 100_000 }),
      payout({ id: "2", statut: "valide", montantAttenduCentimes: 50_000 }),
      payout({
        id: "3",
        statut: "paye",
        montantAttenduCentimes: 80_000,
        montantPayeCentimes: 80_000,
        datePaiement: "2026-04-01",
      }),
      payout({
        id: "4",
        statut: "rapproche",
        montantAttenduCentimes: 60_000,
        montantPayeCentimes: 59_500,
        datePaiement: "2026-04-02",
      }),
    ];
    const suivi = agregerPayouts(payouts);
    expect(suivi.total).toBe(4);
    expect(suivi.enAttente).toBe(1);
    expect(suivi.valide).toBe(1);
    expect(suivi.paye).toBe(1);
    expect(suivi.rapproche).toBe(1);
    expect(suivi.totalAttenduCentimes).toBe(290_000);
    expect(suivi.totalPayeCentimes).toBe(139_500);
  });

  it("détecte les payouts payés en écart au-delà de la tolérance", () => {
    const payouts = [
      // Payé exact : pas d'écart
      payout({
        id: "1",
        statut: "paye",
        montantAttenduCentimes: 100_000,
        montantPayeCentimes: 100_000,
        datePaiement: "2026-04-01",
      }),
      // Payé avec 10 % d'écart : en écart
      payout({
        id: "2",
        statut: "paye",
        montantAttenduCentimes: 100_000,
        montantPayeCentimes: 90_000,
        datePaiement: "2026-04-01",
      }),
      // Non payé : pas compté en écart
      payout({ id: "3", statut: "en_attente", montantAttenduCentimes: 100_000 }),
    ];
    const suivi = agregerPayouts(payouts);
    expect(suivi.enEcart).toBe(1);
  });
});
