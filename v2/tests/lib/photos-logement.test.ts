import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  LARGEUR_PHOTO,
  LARGEURS_VARIANTES,
  photoLogement,
  srcsetLogement,
} from "@/lib/photos-logement";

describe("photoLogement", () => {
  it("sert la photo dédiée d'un logement connu", () => {
    expect(photoLogement("villa-santa-severa")).toBe("/photos/piscine.webp");
    expect(photoLogement("mas-des-oliviers")).toBe("/photos/maison.webp");
    expect(photoLogement("loft-du-port")).toBe("/photos/salon.webp");
  });

  it("retombe sur la série par défaut, en boucle, pour un code inconnu", () => {
    expect(photoLogement("inconnu", 0)).toBe("/photos/maison.webp");
    expect(photoLogement("inconnu", 4)).toBe("/photos/terrasse.webp");
    expect(photoLogement("inconnu", 5)).toBe(photoLogement("inconnu", 0));
    expect(photoLogement("inconnu", 3)).toBe(photoLogement("inconnu", 8));
  });
});

describe("srcsetLogement", () => {
  it("déclare les variantes légères puis la source, avec leurs largeurs", () => {
    expect(srcsetLogement("/photos/piscine.webp")).toBe(
      "/photos/piscine-640.webp 640w, /photos/piscine-768.webp 768w, /photos/piscine.webp 1000w",
    );
  });

  it("couvre le mobile (92 vw à DPR 1,75 ≈ 663 px) sans retomber sur la source", () => {
    // 412 px de large (viewport Lighthouse mobile) : 92 vw × 1,75 = 663 px, donc
    // la variante 768 doit exister pour éviter les 1000 px.
    const largeurs = srcsetLogement("/photos/piscine.webp")
      .split(", ")
      .map((candidat) => Number.parseInt(candidat.split(" ")[1] ?? "0", 10));
    expect(largeurs.some((largeur) => largeur >= Math.ceil(412 * 0.92 * 1.75))).toBe(true);
  });

  it("ne renomme pas un chemin sans extension .webp", () => {
    expect(srcsetLogement("/photos/photo.jpg")).toBe(
      "/photos/photo.jpg 640w, /photos/photo.jpg 768w, /photos/photo.jpg 1000w",
    );
  });

  it("pointe des variantes réellement présentes dans static/photos", () => {
    // Garde-fou : un `srcset` qui annonce un fichier absent ne casserait rien
    // visiblement (le navigateur retombe sur `src`) mais ferait perdre le
    // bénéfice des variantes légères — donc les 648 Kio que la mesure a
    // identifiés sur `/reserver`.
    for (let index = 0; index < 5; index += 1) {
      const photo = photoLogement("inconnu", index);
      for (const largeur of LARGEURS_VARIANTES) {
        const variante = `static${photo.replace(/\.webp$/, `-${largeur}.webp`)}`;
        expect(existsSync(variante), `variante absente : ${variante}`).toBe(true);
      }
      expect(existsSync(`static${photo}`), `source absente : static${photo}`).toBe(true);
    }
  });
});
