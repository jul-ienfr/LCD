const PHOTOS: Record<string, string> = {
  "villa-santa-severa": "/photos/piscine.webp",
  "mas-des-oliviers": "/photos/maison.webp",
  "loft-du-port": "/photos/salon.webp",
};

const PAR_DEFAUT = [
  "/photos/maison.webp",
  "/photos/salon.webp",
  "/photos/piscine.webp",
  "/photos/chambre.webp",
  "/photos/terrasse.webp",
];

/** Largeur des photos sources de `static/photos`. */
export const LARGEUR_PHOTO = 1000;

/**
 * Largeurs des variantes légères, générées par `npm run assets:photos`.
 *
 * 640 px : une carte de 46 vw à DPR 1 (desktop, ~620 px).
 * 768 px : la même carte pleine largeur à DPR 1,75 (mobile, 92 vw × 1,75
 * ≈ 663 px) — sans elle, le navigateur retombe sur la source de 1000 px.
 */
export const LARGEURS_VARIANTES = [640, 768] as const;

/** Largeur de la plus petite variante (celle qui sert de référence aux tests). */
export const LARGEUR_VARIANTE_LEGERE = LARGEURS_VARIANTES[0];

export function photoLogement(code: string, index = 0): string {
  return (
    PHOTOS[code] ??
    PAR_DEFAUT[index % PAR_DEFAUT.length] ??
    "/photos/maison.webp"
  );
}

/**
 * `srcset` d'une photo de logement : variantes légères puis source.
 *
 * Fonction pure : elle ne vérifie pas l'existence des fichiers (le test
 * `tests/lib/photos-logement.test.ts` s'en charge sur le disque).
 */
export function srcsetLogement(photo: string): string {
  const variantes = LARGEURS_VARIANTES.map(
    (largeur) => `${photo.replace(/\.webp$/, `-${largeur}.webp`)} ${largeur}w`,
  );
  return [...variantes, `${photo} ${LARGEUR_PHOTO}w`].join(", ");
}
