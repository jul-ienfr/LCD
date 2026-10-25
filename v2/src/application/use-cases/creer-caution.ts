import { ErreurMetier } from "@/domain/erreurs";
import { montantCautionValide } from "@/domain/caution";
import type { CautionRepository } from "../ports/caution-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export class CreerCaution {
  constructor(
    private readonly cautions: CautionRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: {
    tenantId: string;
    reservationId: string;
    montantCentimes: number;
    notes?: string | null;
  }) {
    if (!montantCautionValide(input.montantCentimes)) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Le montant de la caution doit être un entier positif (max 100 000 €).",
      );
    }
    const notes = input.notes?.trim() || null;
    if (notes && notes.length > 1_000) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Les notes sont limitées à 1 000 caractères.",
      );
    }

    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier("CAUTION_INVALIDE", "Réservation introuvable.");
    }

    const existante = await this.cautions.trouverParReservation(
      input.tenantId,
      input.reservationId,
    );
    if (existante) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Une caution existe déjà pour cette réservation.",
      );
    }

    return this.cautions.creer({
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      montantCentimes: input.montantCentimes,
      notes,
    });
  }
}
