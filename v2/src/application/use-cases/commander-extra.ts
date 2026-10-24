import { ErreurMetier } from "@/domain/erreurs";
import {
  quantiteExtraValide,
  refCommandeExtraValide,
} from "@/domain/extra";
import type {
  CommandeExtraRepository,
  ExtraRepository,
} from "../ports/extra-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface CommanderExtraInput {
  tenantId: string;
  reservationId: string;
  extraId: string;
  quantite: number;
  ref: string;
}

export class CommanderExtra {
  constructor(
    private readonly commandes: CommandeExtraRepository,
    private readonly extras: ExtraRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: CommanderExtraInput) {
    const ref = input.ref.trim();
    if (!refCommandeExtraValide(ref)) {
      throw new ErreurMetier("EXTRA_INVALIDE", "Référence invalide.");
    }
    if (!quantiteExtraValide(input.quantite)) {
      throw new ErreurMetier(
        "EXTRA_INVALIDE",
        "La quantité doit être entre 1 et 20.",
      );
    }

    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier("RESERVATION_INTROUVABLE", "Réservation introuvable.");
    }

    const extra = await this.extras.trouverParId(input.tenantId, input.extraId);
    if (!extra || !extra.actif) {
      throw new ErreurMetier("EXTRA_INVALIDE", "Extra indisponible.");
    }
    if (extra.logementId && extra.logementId !== reservation.logementId) {
      throw new ErreurMetier(
        "EXTRA_INVALIDE",
        "Cet extra n'est pas disponible pour ce logement.",
      );
    }

    return this.commandes.creer({
      tenantId: input.tenantId,
      reservationId: reservation.id,
      extraId: extra.id,
      quantite: input.quantite,
      prixUnitaireCentimes: extra.prixCentimes,
      totalCentimes: extra.prixCentimes * input.quantite,
      ref,
    });
  }
}
