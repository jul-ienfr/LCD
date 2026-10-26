import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import { connection } from "next/server";
import { LireIdentiteSite } from "@/application/use-cases/identite-site";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { marque } from "@/lib/branding";
import "./globals.css";
import { DesignSite } from "./design-site";
import { PwaRegister } from "./pwa-register";

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  let nom = marque();
  try {
    nom = (
      await new LireIdentiteSite(
        new DrizzleParametresSiteRepository(),
      ).executer()
    ).nom;
  } catch {
    nom = marque();
  }
  return {
    title: nom,
    description:
      "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
    applicationName: nom,
    appleWebApp: {
      capable: true,
      title: nom,
      statusBarStyle: "default",
    },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#1c1917",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-fond text-encre antialiased">
        <Suspense fallback={null}>
          <DesignSite />
        </Suspense>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
