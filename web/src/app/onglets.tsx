// Onglets traduits par page (le layout racine reste 100 % statique pour
// le prerender ; chaque page dynamique affiche sa nav dans sa langue).
import { t, type Langue } from "@/lib/i18n";

export function Onglets({ lang }: { lang: Langue }) {
  const liens: [string, string][] = [
    ["/", t("pilotage", lang)],
    ["/voyageur", t("voyageur", lang)],
    ["/proprio", t("proprio", lang)],
    ["/commercial", t("commercial", lang)],
  ];
  return (
    <nav className="flex flex-wrap gap-1 text-sm" aria-label="Sections">
      {liens.map(([href, lib]) => (
        <a
          key={href}
          href={`${href}?lang=${lang}`}
          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800"
        >
          {lib}
        </a>
      ))}
    </nav>
  );
}
