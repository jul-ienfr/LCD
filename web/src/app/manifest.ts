import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { marque, marqueCourte } from "@/lib/branding";

// PWA voyageur (Passerelle v2 §16.3, `sejour.<domaine>`) : installable,
// français par défaut, icônes SVG légères (pas de binaire versionné).
// Sans JS : le manifest ne change rien (formulaires natifs conservés).
//
// Marque §S3.4.3 : nom d'écran d'accueil lu À LA REQUÊTE. SANS ce
// `connection()`, Next traite manifest.ts comme un route handler « caché
// par défaut » (doc manifest.md) : le build l'a PRERENDU — vérifié dans
// .next/prerender-manifest.json → « name » gelé à la marque du build, et
// le téléphone du client suivant gardait le nom du client d'avant. Le
// `connection()` stoppe le prerender ici, donc `process.env` se lit au
// runtime (doc version-16.md « read at runtime (not bundled) ») et un
// simple changement d'env + redémarrage re-thème l'icône d'accueil.
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();
  return {
    name: `${marque()} — Séjour voyageur`,
    short_name: marqueCourte(),
    description:
      "Contrat, état des lieux et guide du séjour. Fonctionne sans JavaScript.",
    start_url: "/voyageur",
    scope: "/voyageur",
    display: "standalone",
    orientation: "portrait",
    lang: "fr",
    dir: "ltr",
    background_color: "#fafafa",
    theme_color: "#18181b",
    categories: ["travel", "utilities"],
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-mask.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
