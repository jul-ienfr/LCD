import { describe, expect, it } from "vitest";
import {
  avancerStatut,
  montantAttendu,
  resumeSinistres,
  statutSuivant,
  validerDeclaration,
  type Sinistre,
} from "@/domain/sinistre";
import { ErreurMetier } from "@/domain/erreurs";

function sinistre(over: Partial<Sinistre>): Sinistre {
  return {
    id: over.id ?? crypto.randomUUID(),
    tenantId: "t1",
    logementId: "l1",
    ref: over.ref ?? "sinistre-1000",
    type: over.type ?? "degat_eaux",
    date: over.date ?? "2026-10-20",
    description: over.description ?? "Fuite sous l’évier constatée.",
    montantEstimeCentimes: over.montantEstimeCentimes ?? 120_000,
    franchiseCentimes: over.franchiseCentimes ?? 15_000,
    statut: over.statut ?? "declare",
    montantIndemniseCentimes: over.montantIndemniseCentimes ?? null,
    numeroDeclaration: over.numeroDeclaration ?? null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("domaine sinistres", () => {
  it("valide une déclaration", () => {
    const declaration = validerDeclaration({
      type: "degat_eaux",
      date: "2026-10-20",
      description: "  Fuite sous l’évier, constatée au départ.  ",
      montantEstimeCentimes: 120_000,
      franchiseCentimes: 15_000,
      numeroDeclaration: " SIN-2026-0042 ",
    });
    expect(declaration).toMatchObject({
      type: "degat_eaux",
      description: "Fuite sous l’évier, constatée au départ.",
      montantEstimeCentimes: 120_000,
      franchiseCentimes: 15_000,
      montantIndemniseCentimes: null,
      numeroDeclaration: "SIN-2026-0042",
    });
    expect(() =>
      validerDeclaration({
        type: "vol",
        date: "2999-01-01",
        description: "Vol de matériel dans le logement.",
        montantEstimeCentimes: 1000,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerDeclaration({
        type: "vol",
        date: "2026-10-20",
        description: "court",
        montantEstimeCentimes: 1000,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerDeclaration({
        type: "vol",
        date: "2026-10-20",
        description: "Vol de matériel dans le logement.",
        montantEstimeCentimes: 1000,
        franchiseCentimes: 2000,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerDeclaration({
        type: "inconnu",
        date: "2026-10-20",
        description: "Vol de matériel dans le logement.",
        montantEstimeCentimes: 1000,
      }),
    ).toThrow(ErreurMetier);
  });

  it("suit la machine à états", () => {
    expect(statutSuivant("declare")).toBe("expertise");
    expect(statutSuivant("expertise")).toBe("indemnise");
    expect(statutSuivant("indemnise")).toBe("clos");
    expect(statutSuivant("clos")).toBeNull();

    expect(avancerStatut({ statut: "declare" })).toEqual({
      statut: "expertise",
      montantIndemniseCentimes: null,
    });
    expect(avancerStatut({ statut: "indemnise" })).toEqual({
      statut: "clos",
      montantIndemniseCentimes: null,
    });
    expect(() => avancerStatut({ statut: "expertise" })).toThrow(ErreurMetier);
    expect(
      avancerStatut({
        statut: "expertise",
        montantIndemniseCentimes: 90_000,
      }),
    ).toEqual({ statut: "indemnise", montantIndemniseCentimes: 90_000 });
    expect(() => avancerStatut({ statut: "clos" })).toThrow(ErreurMetier);
  });

  it("calcule les montants attendus", () => {
    expect(montantAttendu(sinistre({}))).toBe(105_000);
    expect(
      montantAttendu(
        sinistre({ montantIndemniseCentimes: 90_000 }),
      ),
    ).toBe(90_000);
    expect(
      montantAttendu(
        sinistre({ montantEstimeCentimes: 10_000, franchiseCentimes: 15_000 }),
      ),
    ).toBe(0);
  });

  it("résume les dossiers", () => {
    const resume = resumeSinistres([
      sinistre({}),
      sinistre({
        id: "b",
        ref: "sinistre-2000",
        statut: "indemnise",
        montantIndemniseCentimes: 90_000,
        montantEstimeCentimes: 100_000,
        franchiseCentimes: 10_000,
      }),
      sinistre({ id: "c", ref: "sinistre-3000", statut: "clos" }),
    ]);
    expect(resume).toMatchObject({
      total: 3,
      ouverts: 2,
      declares: 1,
      indemnises: 1,
      clos: 1,
      totalEstimeCentimes: 340_000,
      totalIndemniseCentimes: 90_000,
      resteAttenduCentimes: 90_000 + 105_000,
    });
  });
});
