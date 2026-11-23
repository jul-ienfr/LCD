import { describe, expect, it } from "vitest";
import {
  aplatirPieces,
  avancementMenage,
  avancementPieces,
  checklistDepuisReferentiel,
  LIBELLE_PIECE_MAX,
  piecesDepuisTaches,
  PIECES_MENAGE_MAX,
  refMenageValide,
  referentielParDefaut,
  statistiquesMenage,
  statutMenageValide,
  tachesParDefaut,
  TACHES_MENAGE_DEFAUT,
  validerEvaluationMenage,
  validerMenage,
  validerReferentiel,
  validerTaches,
  type Menage,
  type TacheMenage,
} from "@/domain/menage";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine ménage", () => {
  it("valide la référence et le statut", () => {
    expect(refMenageValide("men-1234")).toBe(true);
    expect(refMenageValide("ab")).toBe(false);
    expect(refMenageValide("men 1234")).toBe(false);
    expect(statutMenageValide("planifie")).toBe(true);
    expect(statutMenageValide("fait")).toBe(true);
    expect(statutMenageValide("en cours")).toBe(false);
  });

  it("fournit une checklist par défaut non cochée", () => {
    const taches = tachesParDefaut();
    expect(taches).toHaveLength(TACHES_MENAGE_DEFAUT.length);
    expect(taches.every((t) => t.fait === false)).toBe(true);
    expect(taches.every((t) => t.piece.length > 0)).toBe(true);
  });

  it("normalise et valide les tâches", () => {
    expect(
      validerTaches([
        { piece: "  Cuisine  ", libelle: "  Sols  " },
        { piece: "Cuisine", libelle: "Vitres", fait: true },
      ]),
    ).toEqual([
      { piece: "Cuisine", libelle: "Sols", fait: false },
      { piece: "Cuisine", libelle: "Vitres", fait: true },
    ]);
    expect(validerTaches([{ libelle: "Sols" }])).toEqual([
      { piece: "", libelle: "Sols", fait: false },
    ]);
    expect(() => validerTaches([])).toThrow(ErreurMetier);
    expect(() => validerTaches([{ libelle: "a" }])).toThrow(ErreurMetier);
    expect(() =>
      validerTaches([{ piece: "a".repeat(LIBELLE_PIECE_MAX + 1), libelle: "Sols" }]),
    ).toThrow(ErreurMetier);
  });

  it("valide la date et les notes", () => {
    const valide = validerMenage({
      date: "2026-10-25",
      notes: "  Draps propres  ",
    });
    expect(valide.notes).toBe("Draps propres");
    expect(valide.taches).toHaveLength(TACHES_MENAGE_DEFAUT.length);
    expect(() => validerMenage({ date: "25/10/2026" })).toThrow(ErreurMetier);
    expect(() =>
      validerMenage({ date: "2026-10-25", notes: "a".repeat(2001) }),
    ).toThrow(ErreurMetier);
  });

  it("calcule l’avancement", () => {
    const taches = validerTaches([
      { libelle: "Sols", fait: true },
      { libelle: "Vitres", fait: true },
      { libelle: "Cuisine", fait: false },
    ]);
    expect(avancementMenage(taches)).toEqual({
      faites: 2,
      total: 3,
      pourcentage: 67,
    });
    expect(avancementMenage([])).toEqual({
      faites: 0,
      total: 0,
      pourcentage: 0,
    });
  });

  it("valide un référentiel par pièce et refuse les doublons", () => {
    const pieces = validerReferentiel([
      { piece: "  Cuisine  ", taches: ["  Sols  ", "Poubelles"] },
      { piece: "Sanitaires", taches: ["WC"] },
    ]);
    expect(pieces).toEqual([
      { piece: "Cuisine", taches: ["Sols", "Poubelles"] },
      { piece: "Sanitaires", taches: ["WC"] },
    ]);
    expect(() => validerReferentiel([])).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel([{ piece: "Cuisine", taches: [] }]),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel([{ piece: "", taches: ["Sols"] }]),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel([
        { piece: "Cuisine", taches: ["Sols"] },
        { piece: "cuisine", taches: ["Four"] },
      ]),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel([{ piece: "Cuisine", taches: ["Sols", "sols"] }]),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel([{ piece: "Cuisine", taches: ["a"] }]),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerReferentiel(
        Array.from({ length: PIECES_MENAGE_MAX + 1 }, (_, index) => ({
          piece: `Pièce ${index}`,
          taches: ["Sols"],
        })),
      ),
    ).toThrow(ErreurMetier);
  });

  it("construit, regroupe et aplatit la checklist par pièce", () => {
    const checklist = checklistDepuisReferentiel([
      { piece: "Cuisine", taches: ["Sols", "Poubelles"] },
      { piece: "Sanitaires", taches: ["WC"] },
    ]);
    expect(checklist[0]?.taches[1]).toEqual({
      piece: "Cuisine",
      libelle: "Poubelles",
      fait: false,
    });
    const aplatie = aplatirPieces(checklist);
    expect(aplatie.map((t) => t.libelle)).toEqual(["Sols", "Poubelles", "WC"]);
    expect(aplatie[2]?.piece).toBe("Sanitaires");

    // Une liste plate se regroupe par pièce, les lignes héritées en dernier.
    const legacy: TacheMenage[] = [
      { piece: "Cuisine", libelle: "Sols", fait: true },
      { piece: "", libelle: "Sans pièce", fait: false },
      { piece: "Cuisine", libelle: "Four", fait: false },
    ];
    const groupees = piecesDepuisTaches(legacy);
    expect(groupees.map((p) => p.piece)).toEqual(["Cuisine", ""]);
    expect(groupees[0]?.taches.map((t) => t.libelle)).toEqual(["Sols", "Four"]);
    expect(piecesDepuisTaches([])).toEqual([]);
  });

  it("compte les pièces complètes", () => {
    const pieces = piecesDepuisTaches(
      validerTaches([
        { piece: "Cuisine", libelle: "Sols", fait: true },
        { piece: "Cuisine", libelle: "Four", fait: true },
        { piece: "Sanitaires", libelle: "WC", fait: false },
      ]),
    );
    const avancement = avancementPieces(pieces);
    expect(avancement.faites).toBe(2);
    expect(avancement.total).toBe(3);
    expect(avancement.pourcentage).toBe(67);
    expect(avancement.pieces).toEqual([
      { piece: "Cuisine", faites: 2, total: 2, pourcentage: 100, complete: true },
      { piece: "Sanitaires", faites: 0, total: 1, pourcentage: 0, complete: false },
    ]);
    expect(avancementPieces([])).toEqual({
      faites: 0,
      total: 0,
      pourcentage: 0,
      pieces: [],
    });
  });

  it("expose un modèle par défaut copiable", () => {
    const modele = referentielParDefaut();
    expect(modele.length).toBeGreaterThan(1);
    expect(modele[0]?.taches.length).toBeGreaterThan(0);
    modele[0]?.taches.push("Modifiée");
    expect(referentielParDefaut()[0]?.taches).not.toContain("Modifiée");
  });

  it("valide l’évaluation de rotation", () => {
    expect(
      validerEvaluationMenage({
        score: 4,
        coutCentimes: 4500,
        dureeMinutes: 90,
      }),
    ).toEqual({ score: 4, coutCentimes: 4500, dureeMinutes: 90 });
    expect(
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: 45,
      }),
    ).toEqual({ score: null, coutCentimes: null, dureeMinutes: 45 });
    expect(() =>
      validerEvaluationMenage({
        score: 6,
        coutCentimes: null,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: 3,
        coutCentimes: -1,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: 0,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerEvaluationMenage({
        score: null,
        coutCentimes: null,
        dureeMinutes: null,
      }),
    ).toThrow(ErreurMetier);
  });

  it("agrège score, coût et durée avec alerte qualité", () => {
    function menageAvec(
      score: number | null,
      coutCentimes: number | null,
      dureeMinutes: number | null,
    ): Menage {
      const maintenant = new Date();
      return {
        id: crypto.randomUUID(),
        tenantId: "t1",
        logementId: "l1",
        reservationId: null,
        ref: "men-1",
        date: "2026-10-25",
        statut: "fait",
        notes: "",
        score,
        coutCentimes,
        dureeMinutes,
        taches: [],
        createdAt: maintenant,
        updatedAt: maintenant,
      };
    }

    const stats = statistiquesMenage([
      menageAvec(4, 4000, 80),
      menageAvec(2, 6000, 100),
    ]);
    expect(stats.scoreMoyen).toBe(3);
    expect(stats.coutMoyenCentimes).toBe(5000);
    expect(stats.dureeMoyenneMinutes).toBe(90);
    expect(stats.alerteQualite).toBe(true);

    expect(statistiquesMenage([menageAvec(5, null, null)])).toEqual({
      scoreMoyen: 5,
      coutMoyenCentimes: null,
      dureeMoyenneMinutes: null,
      alerteQualite: false,
    });
    expect(statistiquesMenage([])).toEqual({
      scoreMoyen: null,
      coutMoyenCentimes: null,
      dureeMoyenneMinutes: null,
      alerteQualite: false,
    });
  });
});
