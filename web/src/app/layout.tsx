import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { LANGUES } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "LCD — Parc",
  description:
    "Pilotage parc : hote, voyageur, proprietaire, commercial. Fonctionne sans JavaScript.",
  manifest: "/manifest.webmanifest",
  themeColor: "#18181b",
  appleWebApp: { capable: true, statusBarStyle: "black-translucent" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Layout 100 % statique (prerender OK) : la langue se règle par ?lang=
  // dans chaque page + cookie lcd_lang (lu côté page, pas ici). Aucune
  // donnée gateway ici — les pages chargent en SSR à la requête.
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full bg-zinc-50 text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/90 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">LCD — Parc</Link>
            <nav className="flex flex-wrap gap-1 text-sm" aria-label="Sections">
              <Link className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" href="/">Pilotage · Hôte</Link>
              <Link className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" href="/voyageur">Séjour · Voyageur</Link>
              <Link className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" href="/proprio">Relevé · Propriétaire</Link>
              <Link className="rounded-full px-3 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800" href="/commercial">Prospects · Commercial</Link>
            </nav>
            <form method="get" action="/" className="ml-auto flex items-center gap-1 text-sm">
              <label htmlFor="lang" className="sr-only">Langue</label>
              <select id="lang" name="lang" defaultValue="fr" className="rounded-full border border-zinc-300 bg-white px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900">
                {LANGUES.map((l) => (
                  <option key={l} value={l}>{l.toUpperCase()}</option>
                ))}
              </select>
              <noscript>
                <button type="submit" className="rounded-full border border-zinc-300 px-2 py-1.5">OK</button>
              </noscript>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <footer className="border-t border-zinc-200 px-4 py-4 text-center text-xs text-zinc-500 dark:border-zinc-800">
          Fonctionne sans JavaScript — formulaires natifs.
        </footer>
      </body>
    </html>
  );
}
