import { describe, expect, it } from "vitest";
import {
  CRITERES_QUESTIONNAIRE,
  COMMENTAIRE_QUESTIONNAIRE_MAX,
  LIBELLES_CRITERE,
  moyenneGlobale,
  moyenneNotes,
  moyenneQuestionnaire,
  moyennesParCritere,
  noteValide,
  refQuestionnaireValide,
  validerQuestionnaire,
  type Questionnaire,
} from "@/domain/questionnaire";
import { ErreurMetier } from "@/domain/erreurs";

function questionnaire(over: Partial<Questionnaire> = {}): Questionnaire {
  return {
    id: over.id ?? "q1",
    tenantId: "t1",
    logementId: "l1",
    reservationId: over.reservationId ?? "r1",
    ref: over.ref ?? "q-1",
    notes: over.notes ?? {
      accueil: 5,
      proprete: 5,
      equipement: 5,
      literie: 5,
      communication: 5,
    },
    commentaire: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("domaine questionnaire", () => {
  it("expose les cinq critères et leurs libellés", () => {
    expect(CRITERES_QUESTIONNAIRE).toHaveLength(5);
    expect(Object.keys(LIBELLES_CRITERE)).toHaveLength(5);
    expect(refQuestionnaireValide("q-1234")).toBe(true);
    expect(refQuestionnaireValide("ab")).toBe(false);
  });

  it("valide les notes de 1 à 5", () => {
    expect(noteValide(1)).toBe(true);
    expect(noteValide(5)).toBe(true);
    expect(noteValide(0)).toBe(false);
    expect(noteValide(6)).toBe(false);
    expect(noteValide(4.5)).toBe(false);
  });

  it("exige toutes les notes et un commentaire borné", () => {
    const valide = validerQuestionnaire({
      notes: {
        accueil: 4,
        proprete: 5,
        equipement: 4,
        literie: 5,
        communication: 3,
      },
      commentaire: "  Très bon séjour  ",
    });
    expect(valide.commentaire).toBe("Très bon séjour");
    expect(valide.notes.accueil).toBe(4);
    expect(() =>
      validerQuestionnaire({
        notes: { accueil: 4, proprete: 5, equipement: 4, literie: 5 },
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerQuestionnaire({
        notes: {
          accueil: 9,
          proprete: 5,
          equipement: 4,
          literie: 5,
          communication: 3,
        },
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerQuestionnaire({
        notes: {
          accueil: 5,
          proprete: 5,
          equipement: 5,
          literie: 5,
          communication: 5,
        },
        commentaire: "a".repeat(COMMENTAIRE_QUESTIONNAIRE_MAX + 1),
      }),
    ).toThrow(ErreurMetier);
  });

  it("calcule les moyennes", () => {
    const notes = {
      accueil: 5,
      proprete: 4,
      equipement: 3,
      literie: 5,
      communication: 3,
    };
    expect(moyenneNotes(notes)).toBe(4);
    expect(moyenneQuestionnaire(questionnaire({ notes }))).toBe(4);

    const items = [
      questionnaire({ id: "q1", notes }),
      questionnaire({
        id: "q2",
        notes: {
          accueil: 3,
          proprete: 4,
          equipement: 3,
          literie: 4,
          communication: 3,
        },
      }),
    ];
    expect(moyenneGlobale(items)).toBe(3.7);
    expect(moyenneGlobale([])).toBeNull();
    expect(moyennesParCritere(items)).toEqual({
      accueil: 4,
      proprete: 4,
      equipement: 3,
      literie: 4.5,
      communication: 3,
    });
    expect(moyennesParCritere([]).accueil).toBeNull();
  });
});
