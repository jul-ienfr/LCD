import { describe, expect, it } from "vitest";
import {
  analyserEtatDesLieux,
  COMMENTAIRE_EDL_MAX,
  NOTES_EDL_MAX,
  refEtatDesLieuxValide,
  typeEtatDesLieuxValide,
  validerConstat,
  validerEtatDesLieux,
  type LigneEtatDesLieux,
} from "@/domain/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";

function ligne(over: Partial<LigneEtatDesLieux> = {}): LigneEtatDesLieux {
  return {
    bienId: over.bienId ?? "b1",
    qr: over.qr ?? "drap-1",
    libelle: over.libelle ?? "Drap 160",
    etatReference: over.etatReference ?? 5,
    prixReferenceCentimes:
      over.prixReferenceCentimes === undefined
        ? 3000
        : over.prixReferenceCentimes,
    etatConstate: over.etatConstate ?? 5,
    manquant: over.manquant ?? false,
    commentaire: over.commentaire ?? "",
  };
}

describe("domaine état des lieux", () => {
  it("valide la référence et le type", () => {
    expect(refEtatDesLieuxValide("edl-1234")).toBe(true);
    expect(refEtatDesLieuxValide("ab")).toBe(false);
    expect(refEtatDesLieuxValide("edl 1234")).toBe(false);
    expect(typeEtatDesLieuxValide("sortie")).toBe(true);
    expect(typeEtatDesLieuxValide("entree")).toBe(true);
    expect(typeEtatDesLieuxValide("menage")).toBe(false);
  });

  it("valide la date et les notes", () => {
    const valide = validerEtatDesLieux({
      type: "sortie",
      date: "2026-10-25",
      notes: "  RàS  ",
    });
    expect(valide.notes).toBe("RàS");
    expect(() =>
      validerEtatDesLieux({ type: "sortie", date: "25/10/2026" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEtatDesLieux({ type: "autre", date: "2026-10-25" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEtatDesLieux({
        type: "sortie",
        date: "2026-10-25",
        notes: "a".repeat(NOTES_EDL_MAX + 1),
      }),
    ).toThrow(ErreurMetier);
  });

  it("exige un état constaté sauf si le bien est manquant", () => {
    expect(
      validerConstat({ etatReference: 5, etatConstate: 4, manquant: false }),
    ).toEqual({ etatConstate: 4, manquant: false, commentaire: "" });
    expect(
      validerConstat({ etatReference: 5, etatConstate: 4, manquant: true }),
    ).toEqual({ etatConstate: null, manquant: true, commentaire: "" });
    expect(() =>
      validerConstat({ etatReference: 5, etatConstate: null, manquant: false }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerConstat({ etatReference: 5, etatConstate: 9, manquant: false }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerConstat({
        etatReference: 5,
        etatConstate: 4,
        manquant: false,
        commentaire: "a".repeat(COMMENTAIRE_EDL_MAX + 1),
      }),
    ).toThrow(ErreurMetier);
  });

  it("calcule manquants, dégradés et coût de remplacement", () => {
    const lignes = [
      ligne({ qr: "a", etatReference: 5, etatConstate: 5 }),
      ligne({ qr: "b", etatReference: 5, etatConstate: 3 }),
      ligne({
        qr: "c",
        etatReference: 4,
        etatConstate: null,
        manquant: true,
        prixReferenceCentimes: 2500,
      }),
      ligne({
        qr: "d",
        etatReference: 4,
        etatConstate: null,
        manquant: true,
        prixReferenceCentimes: null,
      }),
      ligne({ qr: "e", etatReference: 2, etatConstate: 4 }),
    ];
    const analyse = analyserEtatDesLieux(lignes);
    expect(analyse.manquants.map((l) => l.qr)).toEqual(["c", "d"]);
    expect(analyse.degrades.map((l) => l.qr)).toEqual(["b"]);
    expect(analyse.coutRemplacementCentimes).toBe(2500);
  });
});
