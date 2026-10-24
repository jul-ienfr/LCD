import { describe, expect, it } from "vitest";
import {
  LIBELLES_MODE_PAIEMENT,
  modePaiementValide,
  montantPaiementValide,
  refPaiementValide,
  resteAPayer,
  totalPaiements,
} from "@/domain/paiement";

describe("paiement", () => {
  it("valide les montants, modes et références", () => {
    expect(montantPaiementValide(1)).toBe(true);
    expect(montantPaiementValide(0)).toBe(false);
    expect(montantPaiementValide(1.5)).toBe(false);
    expect(modePaiementValide("virement")).toBe(true);
    expect(modePaiementValide("crypto")).toBe(false);
    expect(refPaiementValide("pay-12345678")).toBe(true);
    expect(refPaiementValide("court")).toBe(false);
  });

  it("cumule les paiements et calcule le reste", () => {
    const paiements = [
      { montantCentimes: 20_000 },
      { montantCentimes: 15_000 },
    ];
    expect(totalPaiements(paiements)).toBe(35_000);
    expect(resteAPayer(94_150, paiements)).toBe(59_150);
    expect(resteAPayer(10_000, [{ montantCentimes: 10_000 }])).toBe(0);
    expect(resteAPayer(10_000, [{ montantCentimes: 12_000 }])).toBe(0);
  });

  it("expose un libellé pour chaque mode", () => {
    expect(LIBELLES_MODE_PAIEMENT.virement).toBe("Virement");
    expect(LIBELLES_MODE_PAIEMENT.cb).toBe("Carte bancaire");
  });
});
