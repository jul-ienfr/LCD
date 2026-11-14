/**
 * Génère les variantes responsives des photos de logement (T003 / SC-004).
 *
 * Les sources de `static/photos` font 1000 px de large pour ~100 à 250 Ko :
 * servies telles quelles dans une carte de ~360 px (mobile) ou ~640 px
 * (desktop), elles coûtent 648 Kio de trop d'après `image-delivery-insight`
 * (Lighthouse 13, `/reserver` en mobile). Les variantes 640 px sont celles que
 * le navigateur choisit à DPR 1,75 dans une carte, via le `srcset` produit par
 * `srcsetLogement()` (`src/lib/photos-logement.ts`).
 *
 * Usage :
 *   node scripts/generer-variantes-photos.mjs            # génère les manquantes
 *   node scripts/generer-variantes-photos.mjs --verifier # ne écrit rien, sort 1 si absente
 *
 * `sharp` vient de `@sveltejs/enhanced-img` : s'il est absent, le script avertit
 * et échoue sans rien installer.
 */
import { existsSync, statSync } from "node:fs";
import { join } from "node:path";

const DOSSIER = "static/photos";
/** Photos de logement servies par `photoLogement()`. */
const SOURCES = ["maison", "piscine", "chambre", "terrasse", "salon"];
/**
 * Largeurs générées : 640 px pour une carte de 46 vw à DPR 1 (desktop),
 * 768 px pour la même carte pleine largeur à DPR 1,75 (mobile, 92 vw × 1,75
 * ≈ 663 px). Les deux restent sous les 1000 px de la source.
 */
const LARGEURS = [640, 768];
const QUALITE = 72;

const verifier = process.argv.includes("--verifier");

const sharp = await import("sharp")
  .then((m) => m.default)
  .catch(() => null);
if (!sharp) {
  console.error(
    "sharp introuvable (il vient de @sveltejs/enhanced-img) : variantes non générées.",
  );
  process.exit(1);
}

const kio = (chemin) => Math.round(statSync(chemin).size / 1024);
let manquantes = 0;

for (const source of SOURCES) {
  const cheminSource = join(DOSSIER, `${source}.webp`);
  if (!existsSync(cheminSource)) {
    console.error(`source absente : ${cheminSource}`);
    process.exit(1);
  }
  for (const largeur of LARGEURS) {
    const sortie = join(DOSSIER, `${source}-${largeur}.webp`);
    if (existsSync(sortie)) {
      console.log(`${sortie} déjà présent (${kio(sortie)} Kio)`);
      continue;
    }
    manquantes += 1;
    if (verifier) {
      console.error(`variante absente : ${sortie}`);
      continue;
    }
    await sharp(cheminSource)
      .resize({ width: largeur, withoutEnlargement: true })
      .webp({ quality: QUALITE, effort: 5 })
      .toFile(sortie);
    console.log(`${sortie} généré (${kio(sortie)} Kio ← ${kio(cheminSource)} Kio)`);
  }
}

if (verifier && manquantes > 0) {
  console.error(`${manquantes} variante(s) absente(s) : lancer npm run assets:photos`);
  process.exit(1);
}
console.log(manquantes === 0 ? "variantes complètes." : `${manquantes} variante(s) générée(s).`);
