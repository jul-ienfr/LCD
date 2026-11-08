import { ErreurMetier } from "./erreurs";
import { dateIsoValide } from "./calendrier";
import { sejourValide } from "./planning";

export type StatutDemandeSejour =
  | "nouvelle"
  | "qualifiee"
  | "convertie"
  | "refusee";

export interface DemandeSejour {
  id: string;
  tenantId: string;
  ref: string;
  logementId: string | null;
  nom: string;
  email: string;
  telephone: string | null;
  arrivee: string | null;
  depart: string | null;
  voyageurs: number;
  message: string | null;
  statut: StatutDemandeSejour;
  motifRefus: string | null;
  reservationId: string | null;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSITIONS_DEMANDE: Record<
  StatutDemandeSejour,
  StatutDemandeSejour[]
> = {
  nouvelle: ["qualifiee", "refusee", "convertie"],
  qualifiee: ["convertie", "refusee"],
  convertie: [],
  refusee: [],
};

export function transitionDemandeAutorisee(
  de: StatutDemandeSejour,
  vers: StatutDemandeSejour,
): boolean {
  return TRANSITIONS_DEMANDE[de].includes(vers);
}

export function messageDemandeValide(message?: string | null): boolean {
  return !message || message.trim().length <= 4000;
}

/**
 * Une demande arrive d'un formulaire public : elle est donc traitée comme
 * non fiable. Seules des valeurs bornées sont acceptées, et les dates sont
 * facultatives (une demande peut être une simple question).
 */
export function validerDemandeSejour(input: {
  nom: string;
  email: string;
  telephone?: string | null;
  arrivee?: string | null;
  depart?: string | null;
  voyageurs?: number;
  message?: string | null;
}): void {
  const nom = input.nom.trim();
  if (nom.length < 2 || nom.length > 120) {
    throw new ErreurMetier(
      "SITE_INVALIDE",
      "Le nom doit contenir entre 2 et 120 caractères.",
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    throw new ErreurMetier("SITE_INVALIDE", "Adresse email invalide.");
  }
  const telephone = input.telephone?.trim() ?? "";
  if (telephone.length > 40) {
    throw new ErreurMetier("SITE_INVALIDE", "Numéro de téléphone trop long.");
  }
  const voyageurs = input.voyageurs ?? 1;
  if (!Number.isInteger(voyageurs) || voyageurs < 1 || voyageurs > 20) {
    throw new ErreurMetier(
      "SITE_INVALIDE",
      "Le nombre de voyageurs doit être entre 1 et 20.",
    );
  }
  if (!messageDemandeValide(input.message)) {
    throw new ErreurMetier("SITE_INVALIDE", "Message trop long (4000 max).");
  }
  const arrivee = input.arrivee?.trim() || null;
  const depart = input.depart?.trim() || null;
  if ((arrivee === null) !== (depart === null)) {
    throw new ErreurMetier(
      "SITE_INVALIDE",
      "Indiquez les deux dates, ou aucune.",
    );
  }
  if (arrivee && depart) {
    if (!dateIsoValide(arrivee) || !dateIsoValide(depart)) {
      throw new ErreurMetier("SITE_INVALIDE", "Dates invalides.");
    }
    if (!sejourValide(arrivee, depart)) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "Le départ doit suivre l'arrivée.",
      );
    }
  }
}
