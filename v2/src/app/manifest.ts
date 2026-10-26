import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { marqueCourte } from "@/lib/branding";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  await connection();
  const identite = await new LireIdentiteSite(
    new DrizzleParametresSiteRepository(),
  ).executer();
  return {
    id: "/",
    name: `${identite.nom} — conciergerie`,
    short_name: identite.nom.slice(0, 12) || marqueCourte(),
    description:
      "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
    lang: "fr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#fafaf9",
    theme_color: identite.accent ?? "#1c1917",
    categories: ["travel", "business", "productivity"],
    icons: [
      ...(identite.logoUrl
        ? [{ src: identite.logoUrl, sizes: "any" }]
        : []),
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
