import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LCD Parc",
  description:
    "Conciergerie locative saisonnière : hôte, voyageur, propriétaire, prestataire.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr">
      <body className="min-h-dvh bg-stone-50 text-stone-900 antialiased">
        {children}
      </body>
    </html>
  );
}
