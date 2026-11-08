export type EtatSanteSync =
  | "ok"
  | "partiel"
  | "retard"
  | "erreur"
  | "jamais";

export interface SanteSync {
  etat: EtatSanteSync;
  ageMinutes: number | null;
  seuilMinutes: number;
}

export function evaluerSanteSync(input: {
  derniereSync: Date | null;
  dernierStatut: string | null;
  intervalleMinutes: number;
  maintenant?: Date;
}): SanteSync {
  const seuilMinutes = Math.max(5, input.intervalleMinutes * 2);
  if (!input.derniereSync) {
    return { etat: "jamais", ageMinutes: null, seuilMinutes };
  }
  const maintenant = input.maintenant ?? new Date();
  const ageMinutes = Math.max(
    0,
    Math.floor(
      (maintenant.getTime() - input.derniereSync.getTime()) / 60_000,
    ),
  );
  if (input.dernierStatut === "erreur") {
    return { etat: "erreur", ageMinutes, seuilMinutes };
  }
  if (ageMinutes > seuilMinutes) {
    return { etat: "retard", ageMinutes, seuilMinutes };
  }
  if (
    input.dernierStatut === "partiel" ||
    input.dernierStatut === "configuration_incomplete" ||
    input.dernierStatut === "lecture_seule"
  ) {
    return { etat: "partiel", ageMinutes, seuilMinutes };
  }
  return { etat: "ok", ageMinutes, seuilMinutes };
}
