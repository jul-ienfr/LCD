import type { MetadataRoute } from "next";

// PWA voyageur (Passerelle v2 §16.3, `sejour.<domaine>`) : installable,
// français par défaut, icônes SVG légères (pas de binaire versionné).
// Sans JS : le manifest ne change rien (formulaires natifs conservés).
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LCD — Séjour voyageur",
    short_name: "LCD Séjour",
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
