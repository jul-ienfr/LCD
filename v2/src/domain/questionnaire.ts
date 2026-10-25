import { ErreurMetier } from "./erreurs";

export const CRITERES_QUESTIONNAIRE = [
  "accueil",
  "proprete",
  "equipement",
  "literie",
  "communication",
] as const;

export type CritereQuestionnaire = (typeof CRITERES_QUESTIONNAIRE)[number];

export const LIBELLES_CRITERE: Record<CritereQuestionnaire, string> = {
  accueil: "Accueil",
  proprete: "Propreté",
  equipement: "Équipement",
  literie: "Literie",
  communication: "Communication",
};

export const COMMENTAIRE_QUESTIONNAIRE_MAX = 1000;

export type NotesQuestionnaire = Record<CritereQuestionnaire, number>;

export interface Questionnaire {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  notes: NotesQuestionnaire;
  commentaire: string;
  createdAt: Date;
  updatedAt: Date;
}

export function refQuestionnaireValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function noteValide(note: number): boolean {
  return Number.isInteger(note) && note >= 1 && note <= 5;
}

export function validerQuestionnaire(input: {
  notes: Partial<Record<CritereQuestionnaire, number>>;
  commentaire?: string;
}): { notes: NotesQuestionnaire; commentaire: string } {
  const notes = {} as NotesQuestionnaire;
  for (const critere of CRITERES_QUESTIONNAIRE) {
    const note = input.notes[critere];
    if (note === undefined || !noteValide(note)) {
      throw new ErreurMetier(
        "QUESTIONNAIRE_INVALIDE",
        `La note « ${LIBELLES_CRITERE[critere]} » doit être comprise entre 1 et 5.`,
      );
    }
    notes[critere] = note;
  }
  const commentaire = (input.commentaire ?? "").trim();
  if (commentaire.length > COMMENTAIRE_QUESTIONNAIRE_MAX) {
    throw new ErreurMetier(
      "QUESTIONNAIRE_INVALIDE",
      `Le commentaire est limité à ${COMMENTAIRE_QUESTIONNAIRE_MAX} caractères.`,
    );
  }
  return { notes, commentaire };
}

export function moyenneNotes(notes: NotesQuestionnaire): number {
  const valeurs = CRITERES_QUESTIONNAIRE.map((critere) => notes[critere]);
  return valeurs.reduce((total, note) => total + note, 0) / valeurs.length;
}

export function moyenneQuestionnaire(questionnaire: Questionnaire): number {
  return moyenneNotes(questionnaire.notes);
}

export function moyenneGlobale(
  questionnaires: readonly Questionnaire[],
): number | null {
  if (questionnaires.length === 0) return null;
  const total = questionnaires.reduce(
    (somme, questionnaire) => somme + moyenneQuestionnaire(questionnaire),
    0,
  );
  return total / questionnaires.length;
}

export function moyennesParCritere(
  questionnaires: readonly Questionnaire[],
): Record<CritereQuestionnaire, number | null> {
  const resultat = {} as Record<CritereQuestionnaire, number | null>;
  for (const critere of CRITERES_QUESTIONNAIRE) {
    if (questionnaires.length === 0) {
      resultat[critere] = null;
      continue;
    }
    const total = questionnaires.reduce(
      (somme, questionnaire) => somme + questionnaire.notes[critere],
      0,
    );
    resultat[critere] = total / questionnaires.length;
  }
  return resultat;
}
