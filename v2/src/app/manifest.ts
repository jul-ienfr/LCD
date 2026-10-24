import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "LCD Parc — conciergerie",
    short_name: "LCD Parc",
    description:
      "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: "#1c1917",
    categories: ["travel", "business", "productivity"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      {
        name: "Espace voyageur",
        short_name: "Voyageur",
        url: "/voyageur",
      },
      {
        name: "Espace hôte",
        short_name: "Hôte",
        url: "/hote",
      },
    ],
  };
}
