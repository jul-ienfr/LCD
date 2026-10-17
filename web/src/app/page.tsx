// Landing publique : c'est la vitrine marketing du SaaS (ce qu'un prospect
// voit AVANT de créer un compte). 100 % statique, zéro appel gateway,
// fonctionne sans JavaScript. Chiffres = forfaits §S1 (plancher 149 €/mois,
// PILOTAGE 190 €, FULL 290 €) — jamais de promesse hors doc.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LCD — la conciergerie courte durée pilotée en 1-tap",
};

const FEATURES: { icone: string; titre: string; texte: string }[] = [
  {
    icone: "📈",
    titre: "Pricing automatique borné",
    texte:
      "Grille 7 jours recalculée chaque nuit, bornes inviolables (plancher/plafond), saisonalité, événements, dernier-minute — l'IA propose, l'humain valide en 1-tap.",
  },
  {
    icone: "⚡",
    titre: "Vente directe < 60 s",
    texte:
      "Devis → contrat signé → calendrier bloqué en moins d'une minute, sans commission plateforme. Zéro double réservation (conflit refusé dès la 2ᵉ requête).",
  },
  {
    icone: "🧹",
    titre: "Ménage traçable photo",
    texte:
      "Checklist 7 cases, templates marqués à l'heure, photos avant/après obligatoires, clôture bloquante sans preuves. Temps facturé = temps pointé.",
  },
  {
    icone: "🛡️",
    titre: "Caution juste",
    texte:
      "Pré-autorisation Swikly/Stripe, aucun débit sans justificatifs (photos état des lieux + facture), restitution 7-14 j annoncée 48 h avant.",
  },
  {
    icone: "🤖",
    titre: "IA locale rédigée",
    texte:
      "Messages J-2/J-1, avis, résumés — écrits par l'IA, envoyés par un humain. IBAN/PIN masqués avant prompt, quotas, kill-switch, 5 langues.",
  },
  {
    icone: "🔌",
    titre: "Offline-first",
    texte:
      "Électricité ou Internet coupé ? La box continue : serrure, chauffage, remontées en queue rejouées au retour. Jamais de page blanche, jamais de surbooking.",
  },
];

const FORFAITS = [
  {
    nom: "Kit",
    prix: "149",
    base: "€/logement/mois · plancher",
    cible: "Le propriétaire bricoleur qui veut la boîte à outils.",
    points: ["Moteurs + box installés", "Vente directe", "Support communautaire", "Sans reversement"],
    enavant: false,
  },
  {
    nom: "Pilotage",
    prix: "190",
    base: "€/logement/mois",
    cible: "Le propriétaire absent qui veut déléguer l'exploitation.",
    points: [
      "Tout le Kit",
      "Réunions ménage/dispatch pilotées",
      "Relevé mensuel owner portal",
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

export default function Landing() {
  return (
    <div className="flex flex-col gap-10">
      {/* HERO */}
      <section className="hero relative overflow-hidden rounded-3xl px-6 py-12 md:px-12 md:py-16">
        <div className="flex max-w-3xl flex-col gap-5">
          <span className="w-fit badge" style={{ background: "rgb(255 255 255 / .18)", color: "#fff" }}>
            <span aria-hidden>●</span> Offline-first · box résidentielle · 0 downtime
          </span>
          <h1 className="text-4xl font-black leading-tight tracking-tight text-white md:text-6xl">
            La conciergerie courte durée qui tourne{" "}
            <span className="whitespace-nowrap" style={{ color: "#6ee7c7" }}>toute seule</span>.
          </h1>
          <p className="max-w-2xl text-lg text-white/85 md:text-xl">
            Prix bornés, ménages traçables, cautions justes, messages rédigés par l&apos;IA et
            validés par vous — depuis un seul écran, même quand Internet tombe.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/login"
              className="bouton bouton-principal px-6 py-3 text-base shadow-lg shadow-black/20"
            >
              Ouvrir la démo 1-tap →
            </Link>
            <Link
              href="/voyageur"
              className="inline-flex items-center rounded-xl px-6 py-3 text-base font-bold text-(--encre) shadow-lg shadow-black/10"
              style={{ background: "rgb(255 255 255 / .92)" }}
            >
              Voir l&apos;espace voyageur
            </Link>
          </div>
          <dl className="mt-4 grid max-w-xl grid-cols-3 gap-3 text-center text-white">
            {[
              ["5", "langues natives"],
              ["14", "actions 1-tap"],
              ["0 €", "com. plateforme"],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl px-2 py-3" style={{ background: "rgb(255 255 255 / .12)" }}>
                <dt className="text-2xl font-extrabold">{v}</dt>
                <dd className="text-xs opacity-85">{l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* FEATURES */}
      <section aria-labelledby="tit-capacites">
        <h2 id="tit-capacites" className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Tout ce que font les grands groupes, sans les abonnements cachés.
        </h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <article key={f.titre} className="carte flex flex-col gap-2 p-5">
              <span aria-hidden className="text-2xl">{f.icone}</span>
              <h3 className="font-bold tracking-tight">{f.titre}</h3>
              <p className="text-sm text-[var(--encre-douce)]">{f.texte}</p>
            </article>
          ))}
        </div>
      </section>

      {/* TARIFS */}
      <section aria-labelledby="tit-tarifs">
        <h2 id="tit-tarifs" className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Sans surprise : un prix par logement, pas une commission sur vos loyers.
        </h2>
        <p className="mt-2 text-sm text-[var(--encre-douce)]">
          Indicatif — le devis final dépend du nombre de logements et du niveau de service.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {FORFAITS.map((f) => (
            <article
              key={f.nom}
              className={`carte flex flex-col gap-3 p-6 ${f.enavant ? "border-2 border-(--accent) shadow-lg shadow-(--accent-douce)" : ""}`}
            >
              {f.enavant && (
                <span className="w-fit badge badge-accent">Le plus choisi</span>
              )}
              <h3 className="text-lg font-extrabold">{f.nom}</h3>
              <p className="text-4xl font-black tabular-nums">
                {f.prix} <span className="text-sm font-semibold text-[var(--encre-faine)]">{f.base}</span>
              </p>
              <p className="text-sm text-[var(--encre-douce)]">{f.cible}</p>
              <ul className="flex flex-col gap-1.5 text-sm" role="list">
                {f.points.map((p) => (
                  <li key={p} className="flex items-start gap-2">
                    <span aria-hidden className="mt-0.5 text-(--ok)">✓</span> {p}
                  </li>
                ))}
              </ul>
              <Link
                href="/commercial"
                className="bouton bouton-secondaire mt-auto justify-center text-center"
              >
                Demander une offre
              </Link>
            </article>
          ))}
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="carte flex flex-col items-center gap-4 p-8 text-center md:p-12">
        <h2 className="text-2xl font-extrabold tracking-tight md:text-3xl">
          Votre parc marche même pendant la panne.
        </h2>
        <p className="max-w-xl text-[var(--encre-douce)]">
          La démo interactive tourne en ce moment sur un parc témoin : 3 logements,
          3 boxes, réservations réelles simulées. Connectez-vous et pilotez en 1-tap.
        </p>
        <Link href="/login" className="bouton bouton-principal px-6 py-3 text-base">
          Ouvrir la démo →
        </Link>
        <Link
          href="/legales"
          className="text-sm underline decoration-dotted underline-offset-4"
        >
          Mentions légales & CGV (LCEN art. 6 III)
        </Link>
      </section>
    </div>
  );
}
