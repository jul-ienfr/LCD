// Barrette d'onglets façon app : onglet courant marqué aria-current.
// Le layout racine reste 100 % statique ; chaque page dynamique affiche
// sa nav dans sa langue. `ici` = chemin courant (sans query).
import { t, type Langue } from "@/lib/i18n";

export function Onglets({ lang, ici }: { lang: Langue; ici: string }) {
  const liens: [string, string][] = [
    ["/hote", t("pilotage", lang)],
    ["/planning", "Planning"],
    ["/compta", t("compta", lang)],
    ["/presta", t("prestataire", lang)],
    ["/onboarding", "Nouveau logement"],
    ["/voyageur", t("voyageur", lang)],
    ["/proprio", t("proprio", lang)],
    ["/commercial", t("commercial", lang)],
  ];
  return (
    <nav className="barre-onglets" aria-label="Sections">
      {liens.map(([href, lib]) => (
        <a
          key={href}
          href={`${href}?lang=${lang}`}
          className="onglet"
          aria-current={href === ici ? "page" : undefined}
        >
          {lib}
        </a>
      ))}
    </nav>
  );
}
