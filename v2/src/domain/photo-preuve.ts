import { ErreurMetier } from "./erreurs";

export type PhasePhoto = "avant" | "apres";

export const PHASES_PHOTO: readonly PhasePhoto[] = ["avant", "apres"];

export const LIBELLES_PHASE_PHOTO: Record<PhasePhoto, string> = {
  avant: "Avant ménage",
  apres: "Après ménage",
};

export const PHOTO_TAILLE_MAX_OCTETS = 10 * 1024 * 1024;
export const QUOTA_PHOTOS_LOGEMENT_OCTETS = 5 * 1024 * 1024 * 1024;
export const TYPES_PHOTO_ACCEPTES: readonly string[] = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

export function phasePhotoValide(phase: string): phase is PhasePhoto {
  return (PHASES_PHOTO as readonly string[]).includes(phase);
}

export function extensionPhoto(contentType: string): string {
  switch (contentType) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "jpg";
  }
}

export function validerPhoto(input: {
  contentType: string;
  taille: number;
}): { contentType: string; extension: string } {
  if (!TYPES_PHOTO_ACCEPTES.includes(input.contentType)) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      "Format accepté : JPEG, PNG ou WebP.",
    );
  }
  if (!Number.isInteger(input.taille) || input.taille <= 0) {
    throw new ErreurMetier("PHOTO_INVALIDE", "Le fichier est vide.");
  }
  if (input.taille > PHOTO_TAILLE_MAX_OCTETS) {
    throw new ErreurMetier(
      "PHOTO_INVALIDE",
      "La photo dépasse la limite de 10 Mo.",
    );
  }
  return {
    contentType: input.contentType,
    extension: extensionPhoto(input.contentType),
  };
}

export function quotaPhotosDepasse(
  utiliseOctets: number,
  ajoutOctets: number,
  quota = QUOTA_PHOTOS_LOGEMENT_OCTETS,
): boolean {
  return utiliseOctets + ajoutOctets > quota;
}

/**
 * Éviction oldest-first : renvoie les identifiants à supprimer, du plus ancien
 * au plus récent, jusqu'à repasser sous le quota.
 */
export function photosAEvincer(
  photos: readonly { id: string; tailleOctets: number }[],
  ajoutOctets: number,
  quota = QUOTA_PHOTOS_LOGEMENT_OCTETS,
): string[] {
  let total = photos.reduce((somme, photo) => somme + photo.tailleOctets, 0);
  const evinces: string[] = [];
  for (const photo of photos) {
    if (total + ajoutOctets <= quota) break;
    total -= photo.tailleOctets;
    evinces.push(photo.id);
  }
  return evinces;
}
