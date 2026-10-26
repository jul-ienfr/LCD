import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { DesignSite } from "./design-site";
import { PwaRegister } from "./pwa-register";
import { marque, marqueCourte } from "@/lib/branding";

export const metadata: Metadata = {
  title: marque(),
  description:
    "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
  applicationName: marque(),
  appleWebApp: {
    capable: true,
    title: marqueCourte(),
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
};

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
