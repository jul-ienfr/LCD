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

export function photoLogement(code: string, index = 0): string {
  return (
    PHOTOS[code] ??
    PAR_DEFAUT[index % PAR_DEFAUT.length] ??
    "/photos/maison.webp"
  );
}
