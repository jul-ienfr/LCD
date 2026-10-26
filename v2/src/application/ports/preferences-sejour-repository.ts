import type { PreferencesSejour } from "@/domain/preference-sejour";

export interface EnregistrerPreferencesData {
  tenantId: string;
  reservationId: string;
  menageFrequenceJ: number;
  lingeInclus: boolean;
  heureArrivee: string | null;
  consignes: string;
}

export interface PreferencesSejourRepository {
  trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<PreferencesSejour | null>;
  enregistrer(data: EnregistrerPreferencesData): Promise<PreferencesSejour>;
}
