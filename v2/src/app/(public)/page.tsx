import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { marque } from "@/lib/branding";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `${marque()} — la conciergerie courte durée pilotée en 1-tap`,
    description:
      "Prix bornés, ménages traçables, cautions justes, messages rédigés par l’IA et validés par vous — réservation directe sans commission plateforme.",
  };
}

const FEATURES: { icone: string; titre: string; texte: string }[] = [
  {
    icone: "📈",
    titre: "Pricing automatique borné",
    texte:
      "Grille 7 jours recalculée chaque nuit, bornes inviolables (plancher/plafond), saisonnalité, événements, dernier-minute — l’IA propose, l’humain valide en 1-tap.",
  },
  {
    icone: "⚡",
    titre: "Vente directe < 60 s",
    texte:
      "Devis → contrat signé → calendrier bloqué en moins d’une minute, sans commission plateforme. Zéro double réservation (conflit refusé dès la 2ᵉ requête).",
  },
  {
    icone: "🧹",
    titre: "Ménage traçable photo",
    texte:
      "Checklist 7 cases, templates marqués à l’heure, photos avant/après obligatoires, clôture bloquante sans preuves. Temps facturé = temps pointé.",
  },
  {
    icone: "🛡️",
    titre: "Caution juste",
    texte:
      "Pré-autorisation Stripe, aucun débit sans justificatifs (photos état des lieux + facture), restitution 7-14 j annoncée 48 h avant.",
  },
  {
    icone: "🤖",
    titre: "IA locale rédigée",
    texte:
      "Messages J-2/J-1, avis, résumés — écrits par l’IA, envoyés par un humain. IBAN/PIN masqués avant prompt, quotas, kill-switch, 5 langues.",
  },
  {
    icone: "🔌",
    titre: "Hors ligne sans page blanche",
    texte:
      "Voyageur et prestataire gardent leur espace en cache : les actions sont mises en queue et rejouées au retour du réseau. Jamais de surbooking.",
  },
];

const FORFAITS = [
  {
    nom: "Kit",
    prix: "149",
    base: "€/logement/mois · plancher",
    cible: "Le propriétaire bricoleur qui veut la boîte à outils.",
    points: [
      "Moteurs installés",
      "Vente directe",
      "Support communautaire",
      "Sans reversement",
    ],
    enavant: false,
  },
  {
    nom: "Pilotage",
    prix: "190",
    base: "€/logement/mois",
    cible: "Le propriétaire absent qui veut déléguer l’exploitation.",
    points: [
      "Tout le Kit",
      "Réunions ménage/dispatch pilotées",
      "Relevé mensuel propriétaire",
      "Sans reversement",
    ],
    enavant: true,
  },
  {
    nom: "Full service",
    prix: "290",
    base: "€/logement/mois",
    cible: "Gestion complète de A à Z, clé en main.",
    points: [
      "Tout le Pilotage",
      "Conciergerie + urgents + sinistres",
      "Compta + expert-comptable",
      "Reversement J+5 garanti",
    ],
    enavant: false,
  },
];

export default async function PagePublique() {
  await connection();
  const nomMarque = marque();

  return (
    <main className="mx-auto flex min-h-dvh max-w-6xl flex-col gap-10 px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <Link className="text-lg font-black tracking-tight" href="/">
          {nomMarque}
        </Link>
        <nav
          className="flex flex-wrap items-center gap-4 text-sm"
          aria-label="Navigation principale"
        >
          <Link className="underline decoration-dotted" href="/aide">
            Aide
          </Link>
          <Link className="underline decoration-dotted" href="/legales">
            Mentions légales
          </Link>
          <Link className="underline decoration-dotted" href="/voyageur">
            Espace voyageur
          </Link>
          <Link
            className="rounded-full bg-encre px-4 py-2 font-medium text-fond"
            href="/login"
          >
            Espace hôte
          </Link>
        </nav>
      </header>

      <section className="relative overflow-hidden rounded-3xl bg-encre px-6 py-12 text-fond md:px-12 md:py-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <span className="w-fit rounded-full bg-fond/15 px-3 py-1 text-xs font-semibold">
            ● Réservation directe · HTML-first · 0 commission plateforme
          </span>
          <h1 className="text-4xl font-black leading-tight tracking-tight md:text-6xl">
            La conciergerie courte durée qui tourne{" "}
            <span className="whitespace-nowrap text-accent">toute seule</span>.
          </h1>
          <p className="max-w-2xl text-lg opacity-85 md:text-xl">
            Prix bornés, ménages traçables, cautions justes, messages rédigés
            par l’IA et validés par vous — depuis un seul écran, même quand le
            réseau tombe.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              className="rounded-full bg-accent px-6 py-3 text-base font-bold text-fond shadow-lg shadow-black/20"
              href="/login"
            >
              Ouvrir le SAS 1-tap →
            </Link>
            <Link
              className="rounded-full bg-fond px-6 py-3 text-base font-bold text-encre shadow-lg shadow-black/10"
              href="/reserver?tenant=lcd"
            >
              Voir les logements
            </Link>
          </div>
          <dl className="mt-4 grid max-w-xl grid-cols-3 gap-3 text-center">
            {[
              ["5", "langues natives"],
              ["14", "actions 1-tap"],
              ["0 €", "com. plateforme"],
            ].map(([valeur, libelle]) => (
              <div
                className="rounded-2xl bg-fond/10 px-2 py-3"
                key={libelle}
              >
                <dt className="text-2xl font-extrabold">{valeur}</dt>
                <dd className="text-xs opacity-85">{libelle}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section aria-labelledby="tit-capacites">
        <h2
          className="text-2xl font-extrabold tracking-tight md:text-3xl"
          id="tit-capacites"
        >
          Tout ce que font les grands groupes, sans les abonnements cachés.
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <article
              className="flex flex-col gap-2 rounded-2xl border border-bordure bg-surface p-5 shadow-sm"
              key={feature.titre}
            >
              <span aria-hidden className="text-2xl">
                {feature.icone}
              </span>
              <h3 className="font-bold tracking-tight">{feature.titre}</h3>
              <p className="text-sm text-encre-douce">{feature.texte}</p>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="tit-tarifs">
        <h2
          className="text-2xl font-extrabold tracking-tight md:text-3xl"
          id="tit-tarifs"
        >
          Sans surprise : un prix par logement, pas une commission sur vos
          loyers.
        </h2>
        <p className="mt-2 text-sm text-encre-douce">
          Indicatif — le devis final dépend du nombre de logements et du niveau
          de service.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {FORFAITS.map((forfait) => (
            <article
              className={`flex flex-col gap-3 rounded-2xl border bg-surface p-6 shadow-sm ${
                forfait.enavant
                  ? "border-2 border-accent shadow-lg"
                  : "border-bordure"
              }`}
              key={forfait.nom}
            >
              {forfait.enavant ? (
                <span className="w-fit rounded-full bg-accent-douce px-3 py-1 text-xs font-semibold text-accent">
                  Le plus choisi
                </span>
              ) : null}
              <h3 className="text-lg font-extrabold">{forfait.nom}</h3>
              <p className="text-4xl font-black tabular-nums">
                {forfait.prix}{" "}
                <span className="text-sm font-semibold text-encre-faine">
                  {forfait.base}
                </span>
              </p>
              <p className="text-sm text-encre-douce">{forfait.cible}</p>
              <ul className="flex flex-col gap-1.5 text-sm" role="list">
                {forfait.points.map((point) => (
                  <li className="flex items-start gap-2" key={point}>
                    <span aria-hidden className="mt-0.5 text-accent">
                      ✓
                    </span>{" "}
                    {point}
                  </li>
                ))}
              </ul>
              <Link
                className="mt-auto rounded-full border border-bordure px-5 py-3 text-center text-sm font-medium"
                href="/login"
              >
                Demander une offre
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-center gap-4 rounded-2xl border border-bordure bg-surface p-8 text-center shadow-sm md:p-12">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Votre parc marche même pendant la panne.
        </h2>
        <p className="max-w-xl text-encre-douce">
          La V2 est en beta : réservation directe, planning, prix, compta,
          facturation et espace voyageur sans JavaScript. Aucun canal externe
          n’est connecté en écriture — Booking, Airbnb et banque restent des
          dépendances déclarées. Connectez-vous et pilotez en 1-tap.
        </p>
        <Link
          className="rounded-full bg-encre px-6 py-3 text-base font-semibold text-fond"
          href="/login"
        >
          Ouvrir le SAS →
        </Link>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            className="text-sm underline decoration-dotted underline-offset-4"
            href="/legales"
          >
            Mentions légales &amp; CGV (LCEN art. 6 III)
          </Link>
          <Link
            className="text-sm underline decoration-dotted underline-offset-4"
            href="/aide"
          >
            Aide — qui utilise quoi, ce qui est réel
          </Link>
        </div>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-4 text-sm text-encre-faine">
        <p>{nomMarque} · Architecture HTML-first, JS islands, PostgreSQL.</p>
        <nav className="flex flex-wrap gap-4" aria-label="Informations">
          <Link className="underline" href="/aide">
            Aide
          </Link>
          <Link className="underline" href="/legales">
            Mentions légales
          </Link>
          <Link className="underline" href="/reserver?tenant=lcd">
            Réserver
          </Link>
        </nav>
      </footer>
    </main>
  );
}
