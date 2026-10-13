import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "LCD Parc — Conciergerie",
    template: "%s — LCD Parc",
  },
  description:
    "Pilotage conciergerie : hôte, voyageur, propriétaire, commercial. Fonctionne sans JavaScript.",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0e7c6b" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e14" },
  ],
  width: "device-width",
  initialScale: 1,
};

const NAV: [string, string, string][] = [
  ["/", "Pilotage", "Tableau de bord opérateur"],
  ["/voyageur", "Séjour", "Espace voyageur"],
  ["/proprio", "Relevé", "Espace propriétaire"],
  ["/commercial", "Prospects", "Espace commercial"],
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout 100 % statique (prerender OK) : la langue se règle par ?lang=
  // dans chaque page. Aucune donnée gateway ici.
  return (
    <html lang="fr" className="h-full">
      <body className="flex min-h-full flex-col">
        <a
          href="#contenu"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-[var(--encre)] focus:px-4 focus:py-2 focus:text-sm focus:text-[var(--fond)]"
        >
          Aller au contenu
        </a>
        <header className="sticky top-0 z-20 border-b border-[var(--bordure)] bg-[var(--surface)]/90 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
            <Link
              href="/"
              className="flex items-center gap-2 text-lg font-extrabold tracking-tight"
              aria-label="LCD Parc — accueil pilotage"
            >
              <span
                aria-hidden
                className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-white"
                style={{
                  background:
                    "linear-gradient(135deg, #0e7c6b, #10a37f 60%, #34d399)",
                }}
              >
                ⌂
              </span>
              LCD&nbsp;Parc
            </Link>
            <nav
              className="hidden items-center gap-1 text-sm md:flex"
              aria-label="Sections"
            >
              {NAV.map(([href, lib, title]) => (
                <Link
                  key={href}
                  href={href}
                  title={title}
                  className="rounded-full px-3 py-1.5 font-medium text-[var(--encre-douce)] hover:bg-[var(--surface-2)] hover:text-[var(--encre)]"
                >
                  {lib}
                </Link>
              ))}
            </nav>
            <form
              method="get"
              action="/"
              className="ml-auto flex items-center gap-2 text-sm"
            >
              <label htmlFor="lang" className="sr-only">
                Langue / Language
              </label>
              <select
                id="lang"
                name="lang"
                defaultValue="fr"
                className="champ w-auto rounded-full py-1.5"
                aria-label="Langue"
              >
                <option value="fr">FR</option>
                <option value="en">EN</option>
                <option value="es">ES</option>
                <option value="it">IT</option>
                <option value="de">DE</option>
              </select>
              <noscript>
                <button type="submit" className="bouton bouton-secondaire px-3 py-1.5">
                  OK
                </button>
              </noscript>
            </form>
          </div>
          <nav
            className="mx-auto w-full max-w-6xl px-4 pb-2 md:hidden"
            aria-label="Sections mobile"
          >
            <div className="flex gap-1 overflow-x-auto text-sm">
              {NAV.map(([href, lib]) => (
                <Link
                  key={href}
                  href={href}
                  className="flex-1 whitespace-nowrap rounded-full bg-[var(--surface-2)] px-3 py-1.5 text-center font-medium text-[var(--encre-douce)]"
                >
                  {lib}
                </Link>
              ))}
            </div>
          </nav>
        </header>
        <main id="contenu" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
          {children}
        </main>
        <footer className="border-t border-[var(--bordure)] px-4 py-5">
          <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-2 text-xs text-[var(--encre-faine)]">
            <span className="font-semibold text-[var(--encre-douce)]">
              LCD Parc — conciergerie
            </span>
            <span aria-hidden>·</span>
            <span>Fonctionne sans JavaScript — formulaires natifs.</span>
            <span className="ml-auto">Données : passerelle locale · lecture seule par défaut</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
