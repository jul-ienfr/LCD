import type { RequestHandler } from "./$types";
import { themeResolu } from "@/lib/apparence";
import { lireApparencePubliee } from "@/lib/server/apparence";

export const GET: RequestHandler = async () => {
  const apparence = await lireApparencePubliee();
  const theme = themeResolu(apparence);
  const identite = apparence.identite;

  const manifest = {
    id: "/",
    name: `${identite.nom} — conciergerie`,
    short_name: identite.nom.slice(0, 12) || "LCD Parc",
    description:
      "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: theme.clair.fond,
    theme_color: theme.clair.accent,
    categories: ["travel", "business", "productivity"],
    icons: [
      ...(identite.logoUrl
        ? [{ src: identite.logoUrl, sizes: "any", type: "image/svg+xml" }]
        : []),
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    shortcuts: [
      { name: "Réserver un séjour", short_name: "Réserver", url: "/reserver" },
      { name: "Espace voyageur", short_name: "Voyageur", url: "/voyageur" },
      { name: "Espace hôte", short_name: "Hôte", url: "/hote" },
    ],
  };

  return new Response(JSON.stringify(manifest), {
    headers: {
      "content-type": "application/manifest+json; charset=utf-8",
      "cache-control": "public, max-age=300",
    },
  });
};
