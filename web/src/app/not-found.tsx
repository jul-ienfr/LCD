// 404 brandée xLangue : guide vers les sections utiles du SaaS.
// Sans JS : la langue vient de ?lang= comme partout (soumis dans l'URL).
import Link from "next/link";
import { t, type Langue } from "@/lib/i18n";

export default async function NotFound({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | undefined>>;
}) {
  const sp = (await searchParams) || {};
  const lang = (["fr", "en", "es", "it", "de"].find((l) => l === sp.lang) ||
    "fr") as Langue;
  const liens: [string, string][] = [
    ["/hote", "Pilotage"],
    ["/planning", "Planning"],
    ["/prix", "Grille de prix"],
    ["/compta", "Compta"],
    ["/onboarding", "Onboarding"],
    ["/voyageur", "Voyageur"],
    ["/proprio", "Propriétaire"],
    ["/commercial", "Commercial"],
  ];
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center">
      <p className="text-6xl font-black tracking-tight text-(--accent-fonce)">404</p>
      <h1 className="text-2xl font-extrabold tracking-tight">{t("nf_h1", lang)}</h1>
      <p className="max-w-md text-sm text-(--encre-douce)">
        Pas de redirection silencieuse (&sect;6bis : jamais, m&ecirc;me de
        navigation) &mdash; on affiche d&apos;o&ugrave; repartir :
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {liens.map(([href, label]) => (
          <Link key={href} href={href} className="bouton bouton-secondaire px-3 py-1.5 text-sm">
            {label}
          </Link>
        ))}
      </div>
      <Link href="/" className="bouton bouton-principal px-5 py-2.5">
        {t("nf_accueil", lang)}
      </Link>
    </div>
  );
}
