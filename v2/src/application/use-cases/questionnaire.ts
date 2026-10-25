import {
  refQuestionnaireValide,
  validerQuestionnaire,
  type CritereQuestionnaire,
  type Questionnaire,
} from "@/domain/questionnaire";
import { ErreurMetier } from "@/domain/erreurs";
import type { QuestionnairesRepository } from "../ports/questionnaires-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface DeposerQuestionnaireInput {
  tenantId: string;
  reservationId: string;
  ref: string;
  notes: Partial<Record<CritereQuestionnaire, number>>;
  commentaire?: string;
}

export class DeposerQuestionnaire {
  constructor(
    private readonly questionnaires: QuestionnairesRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: DeposerQuestionnaireInput): Promise<Questionnaire> {
    if (!refQuestionnaireValide(input.ref)) {
      throw new ErreurMetier(
        "QUESTIONNAIRE_INVALIDE",
        "La référence est invalide.",
      );
    }

    const existant = await this.questionnaires.trouverParReservation(
      input.tenantId,
      input.reservationId,
    );
    if (existant) return existant;

    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier(
        "QUESTIONNAIRE_INVALIDE",
        "Séjour introuvable.",
      );
    }

    const valide = validerQuestionnaire({
      notes: input.notes,
      commentaire: input.commentaire,
    });

    return this.questionnaires.creer({
      tenantId: input.tenantId,
      logementId: reservation.logementId,
      reservationId: reservation.id,
      ref: input.ref,
      ...valide,
    });
  }
}
