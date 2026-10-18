// 404 brandée : guide vers les sections utiles au lieu du _not-found nu.
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center">
      <p className="text-6xl font-black tracking-tight text-(--accent-fonce)">404</p>
      <h1 className="text-2xl font-extrabold tracking-tight">
        Cette page n&apos;existe pas (ou plus)
      </h1>
      <p className="max-w-md text-sm text-(--encre-douce)">
        Les liens du SaaS : pilotage, planning, prix, compta, prestataire,
        onboarding, propriétaire, commercial, voyageur — l&apos;accès direct
        suffit, pas de redirection silencieuse (§6bis : jamais d&apos;écriture
        cachée, même de navigation).
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {[
          ["/hote", "Pilotage"],
          ["/planning", "Planning"],
          ["/prix", "Grille de prix"],
          ["/compta", "Compta"],
          ["/onboarding", "Nouveau logement"],
          ["/voyageur", "Voyageur"],
          ["/proprio", "Propriétaire"],
          ["/commercial", "Commercial"],
        ].map(([href, label]) => (
          <Link key={href} href={href} className="bouton bouton-secondaire px-3 py-1.5 text-sm">
            {label}
          </Link>
        ))}
      </div>
      <Link href="/" className="bouton bouton-principal px-5 py-2.5">
        ← Accueil
      </Link>
    </div>
  );
}
