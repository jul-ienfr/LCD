import { ErreurMetier } from "@/domain/erreurs";
import { validerPreferences } from "@/domain/preference-sejour";
import type { PreferencesSejourRepository } from "../ports/preferences-sejour-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface EnregistrerPreferencesInput {
  tenantId: string;
  reservationId: string;
  menageFrequenceJ: number;
  lingeInclus: boolean;
  heureArrivee: string;
  consignes: string;
}

export class EnregistrerPreferencesSejour {
  constructor(
    private readonly preferences: PreferencesSejourRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: EnregistrerPreferencesInput) {
    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier(
        "PREFERENCES_INVALIDES",
        "La réservation est introuvable.",
      );
    }
    const valeurs = validerPreferences(input);
    return this.preferences.enregistrer({
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      ...valeurs,
    });
  }
}
