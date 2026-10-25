import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "./globals.css";
import { DesignSite } from "./design-site";
import { PwaRegister } from "./pwa-register";

export const metadata: Metadata = {
  title: "LCD Parc",
  description:
    "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
  applicationName: "LCD Parc",
  appleWebApp: {
    capable: true,
    title: "LCD Parc",
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
