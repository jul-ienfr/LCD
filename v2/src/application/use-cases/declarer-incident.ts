import { ErreurMetier } from "@/domain/erreurs";
import {
  messageIncidentValide,
  refIncidentValide,
} from "@/domain/incident";
import type { IncidentRepository } from "../ports/incident-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface DeclarerIncidentInput {
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  message: string;
}

export class DeclarerIncident {
  constructor(
    private readonly incidents: IncidentRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: DeclarerIncidentInput) {
    const ref = input.ref.trim();
    const message = input.message.trim();

    if (!refIncidentValide(ref)) {
      throw new ErreurMetier(
        "INCIDENT_INVALIDE",
        "Référence d'incident invalide.",
      );
    }
    if (!messageIncidentValide(message)) {
      throw new ErreurMetier(
        "INCIDENT_INVALIDE",
        "Le message doit faire 5 à 2000 caractères.",
      );
    }

    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (
      !reservation ||
      reservation.logementId !== input.logementId
    ) {
      throw new ErreurMetier(
        "RESERVATION_INTROUVABLE",
        "Réservation introuvable pour ce lien.",
      );
    }

    const resultat = await this.incidents.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId,
      ref,
      message,
    });

    return resultat;
  }
}
