import { describe, expect, it } from "vitest";
import {
  compterParType,
  COUT_ENTRETIEN_MAX_CENTIMES,
  refEntretienValide,
  TITRE_ENTRETIEN_MAX,
  totalEntretiens,
  typeEntretienValide,
  validerEntretien,
  type Entretien,
} from "@/domain/entretien";
import { ErreurMetier } from "@/domain/erreurs";

function entretien(over: Partial<Entretien> = {}): Entretien {
  return {
    id: over.id ?? "e1",
    tenantId: "t1",
    logementId: "l1",
    ref: over.ref ?? "ent-1",
    date: over.date ?? "2026-10-25",
    type: over.type ?? "entretien",
    titre: over.titre ?? "Vérification",
    description: "",
    prestataire: null,
    coutCentimes: over.coutCentimes ?? 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("domaine entretien", () => {
  it("valide la référence et le type", () => {
    expect(refEntretienValide("ent-1234")).toBe(true);
    expect(refEntretienValide("ab")).toBe(false);
    expect(refEntretienValide("ent 1234")).toBe(false);
    expect(typeEntretienValide("entretien")).toBe(true);
    expect(typeEntretienValide("reparation")).toBe(true);
    expect(typeEntretienValide("controle")).toBe(true);
    expect(typeEntretienValide("menage")).toBe(false);
  });

  it("normalise les champs texte", () => {
    const valide = validerEntretien({
      type: "reparation",
      date: "2026-10-25",
      titre: "  Mitigeur  ",
      description: "  Fuite  ",
      prestataire: "  Plombier  ",
      coutCentimes: 12_000,
    });
    expect(valide.titre).toBe("Mitigeur");
    expect(valide.description).toBe("Fuite");
    expect(valide.prestataire).toBe("Plombier");
    expect(valide.coutCentimes).toBe(12_000);
  });

  it("vide le prestataire quand il est blanc", () => {
    const valide = validerEntretien({
      type: "controle",
      date: "2026-10-25",
      titre: "Contrôle",
      prestataire: "   ",
      coutCentimes: 0,
    });
    expect(valide.prestataire).toBeNull();
  });

  it("refuse les champs hors bornes", () => {
    const base = {
      type: "entretien",
      date: "2026-10-25",
      titre: "OK",
      coutCentimes: 0,
    };
    expect(() => validerEntretien({ ...base, titre: "a" })).toThrow(
      ErreurMetier,
    );
    expect(() =>
      validerEntretien({ ...base, titre: "a".repeat(TITRE_ENTRETIEN_MAX + 1) }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntretien({ ...base, date: "25/10/2026" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntretien({ ...base, type: "menage" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntretien({ ...base, coutCentimes: -1 }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntretien({ ...base, coutCentimes: 10.5 }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEntretien({
        ...base,
        coutCentimes: COUT_ENTRETIEN_MAX_CENTIMES + 1,
      }),
    ).toThrow(ErreurMetier);
  });

  it("totalise et compte par type", () => {
    const items = [
      entretien({ type: "entretien", coutCentimes: 1000 }),
      entretien({ type: "reparation", coutCentimes: 2500 }),
      entretien({ type: "reparation", coutCentimes: 500 }),
      entretien({ type: "controle", coutCentimes: 0 }),
    ];
    expect(totalEntretiens(items)).toBe(4000);
    expect(compterParType(items)).toEqual({
      entretien: 1,
      reparation: 2,
      controle: 1,
    });
  });
});
