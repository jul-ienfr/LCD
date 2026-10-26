import { ErreurMetier } from "./erreurs";

export const MENAGE_FREQUENCE_MAX = 30;
export const CONSIGNES_SEJOUR_MAX = 500;

export interface PreferencesSejour {
  id: string;
  tenantId: string;
  reservationId: string;
  menageFrequenceJ: number;
  lingeInclus: boolean;
  heureArrivee: string | null;
  consignes: string;
  updatedAt: Date;
}

export function heureValide(heure: string): boolean {
  return heure === "" || /^([01]\d|2[0-3]):[0-5]\d$/.test(heure);
}

export function validerPreferences(input: {
  menageFrequenceJ: number;
  lingeInclus: boolean;
  heureArrivee: string;
  consignes: string;
}): {
  menageFrequenceJ: number;
  lingeInclus: boolean;
  heureArrivee: string | null;
  consignes: string;
} {
  if (
    !Number.isInteger(input.menageFrequenceJ) ||
    input.menageFrequenceJ < 0 ||
    input.menageFrequenceJ > MENAGE_FREQUENCE_MAX
  ) {
    throw new ErreurMetier(
      "PREFERENCES_INVALIDES",
      `La fréquence de ménage doit être comprise entre 0 et ${MENAGE_FREQUENCE_MAX} jours.`,
    );
  }
  if (!heureValide(input.heureArrivee)) {
    throw new ErreurMetier(
      "PREFERENCES_INVALIDES",
      "L’heure d’arrivée doit être au format HH:MM.",
    );
  }
  const consignes = input.consignes.trim();
  if (consignes.length > CONSIGNES_SEJOUR_MAX) {
    throw new ErreurMetier(
      "PREFERENCES_INVALIDES",
      `Les consignes sont limitées à ${CONSIGNES_SEJOUR_MAX} caractères.`,
    );
  }
  return {
    menageFrequenceJ: input.menageFrequenceJ,
    lingeInclus: input.lingeInclus,
    heureArrivee: input.heureArrivee || null,
    consignes,
  };
}

export function libelleFrequenceMenage(jours: number): string {
  if (jours === 0) return "Aucun ménage pendant le séjour";
  if (jours === 1) return "Ménage tous les jours";
  return `Ménage tous les ${jours} jours`;
}
