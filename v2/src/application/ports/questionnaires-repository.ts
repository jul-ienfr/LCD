import type {
  NotesQuestionnaire,
  Questionnaire,
} from "@/domain/questionnaire";

export interface CreerQuestionnaireData {
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  notes: NotesQuestionnaire;
  commentaire: string;
}

export interface QuestionnairesRepository {
  creer(data: CreerQuestionnaireData): Promise<Questionnaire>;
  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Questionnaire | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Questionnaire[]>;
}
