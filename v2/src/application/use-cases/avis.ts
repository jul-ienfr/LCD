import { validerAvis } from "@/domain/avis";
import { ErreurMetier } from "@/domain/erreurs";
import type { AvisRepository } from "../ports/avis-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface DeposerAvisInput {
  tenantId: string;
  reservationId: string;
  ref: string;
  nom: string;
  note: number;
  commentaire?: string;
}

export class DeposerAvis {
  constructor(
    private readonly avis: AvisRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: DeposerAvisInput) {
    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier(
        "RESERVATION_INTROUVABLE",
        "Séjour introuvable.",
      );
    }
    const existant = await this.avis.trouverParReservation(
      input.tenantId,
      input.reservationId,
    );
    if (existant) return existant;

    const valide = validerAvis({
      note: input.note,
      commentaire: input.commentaire,
      nom: input.nom,
    });

    return this.avis.creer({
      tenantId: input.tenantId,
      logementId: reservation.logementId,
      reservationId: reservation.id,
      ref: input.ref,
      ...valide,
    });
  }
}
