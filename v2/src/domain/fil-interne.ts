import { ErreurMetier } from "./erreurs";

export type CanalFilInterne = "proprietaire" | "prestataire" | "voyageur";
export type StatutFilInterne = "ouvert" | "ferme";

export const CANAUX_FIL_INTERNE: readonly CanalFilInterne[] = [
  "proprietaire",
  "prestataire",
  "voyageur",
];

export const LIBELLES_CANAL_FIL: Record<CanalFilInterne, string> = {
  proprietaire: "Propriétaire",
  prestataire: "Prestataire",
  voyageur: "Voyageur",
};

export const SUJET_FIL_MAX = 120;
export const MESSAGE_FIL_MAX = 4000;

export function canalFilValide(valeur: string): valeur is CanalFilInterne {
  return (CANAUX_FIL_INTERNE as readonly string[]).includes(valeur);
}

export function statutFilValide(valeur: string): valeur is StatutFilInterne {
  return valeur === "ouvert" || valeur === "ferme";
}

export function validerSujetFil(sujet: string): string {
  const propre = sujet.trim();
  if (propre.length < 3) {
    throw new ErreurMetier(
      "FIL_INTERNE_INVALIDE",
      "Le sujet doit contenir au moins 3 caractères.",
    );
  }
  if (propre.length > SUJET_FIL_MAX) {
    throw new ErreurMetier(
      "FIL_INTERNE_INVALIDE",
      `Le sujet est limité à ${SUJET_FIL_MAX} caractères.`,
    );
  }
  return propre;
}

export function validerMessageFil(corps: string): string {
  const propre = corps.trim();
  if (!propre) {
    throw new ErreurMetier(
      "FIL_INTERNE_INVALIDE",
      "Le message ne peut pas être vide.",
    );
  }
  if (propre.length > MESSAGE_FIL_MAX) {
    throw new ErreurMetier(
      "FIL_INTERNE_INVALIDE",
      `Le message est limité à ${MESSAGE_FIL_MAX} caractères.`,
    );
  }
  return propre;
}
