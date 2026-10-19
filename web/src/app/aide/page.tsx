// Centre d'aide (démo) : qui fait quoi, comment se connecter, ce qui est
// RÉEL vs simulé. Honnêteté factuelle, pas de marketing : cette page est
// le contrat de lecture du produit de démonstration.
export const instant = false;
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Aide" };

const RÔLES: [string, string, string, string][] = [
  ["Claire — super_admin 👑", "personne_01",
    "Tout : pilotage, planning, prix, compta, confirmer copro (jamais auto), onboarding.",
    "/hote"],
  ["Alex — admin 🛠", "personne_02",
    "Pilotage et onboarding réels : peut créer les logements (201, borne héritée).",
    "/hote"],
  ["Sam — opérateur 🧰", "personne_03",
    "Pilotage 1-tap au quotidien : prix, menus menage, incidents, extrats, chatterbox non.",
    "/hote"],
  ["Ruth — comptable 📊", "personne_04",
    "Espace compta : factures par SIREN, valider facture/pillout/clôture humain.",
    "/compta"],
  ["Marc — proprio 🏡", "personne_05",
    "Relevé de SON logement : brut/charges/ménage/commission/net, période libre.",
    "/proprio?logement=log1"],
  ["Inès — commercial 🤝", "commercial_01",
    "Pipeline (8 stades), simulateur, génération d'offre marque blanche.",
    "/commercial"],
];

const RÉEL: [string, string][] = [
  ["Registros (logement, entités, mandats, annonces)", "réel — YAML versionné, snapshots"],
  ["Gestes 1-tap (14 actions)", "réel — tracé qui/quoi/ref, RBAC re-vérifié via gw"],
  ["Onboarding → création logement", "réel — POST /parc/logements, bornes héritées"],
  ["Relevé de période (proprio)", "réel — /finances compta questionnée par période"],
  ["Export CSV (compta Chorus/PDP, planning, prix)", "réel — lecture stricte de la passerelle, jamais recalculé ici"],
  ["Conflit split-brain → trancher", "réel — motif obligatoire, ref TRANCHE-*"],
  ["Communautés données (lab)", "simulé volontairement — boîte de lab, data yt"],
  ["Comptes de connexion", "pré-configurés (demo) — pas de mot de passe : RBAC gw garde la vérité"],
  ["Paiements, matériel, cloud pub", "absent — checklist P0/panier chiffré"],
];

export default function AidePage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-(--encre-faine)">
          Aide · démo LCD Parc
        </p>
        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
          Qui utilise quoi — et ce qui est réel
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-(--encre-douce)">
          Ce SAS tourne en continu (3 logements, 2 boxes simulées). Fonctionne
          sans JavaScript : chaque bouton est un formulaire natif, la passerelle
          revérifie les droits à chaque écriture. Aucune action n&apos;écrit en
          silence — le résultat s&apos;affiche, ou pas.
        </p>
      </div>

      <section className="carte p-5 md:p-7" aria-label="Rôles">
        <h2 className="text-xl font-extrabold">Les 6 rôles</h2>
        <div className="table-defilante mt-3">
          <table>
            <thead>
              <tr>
                <th scope="col" className="text-left font-bold">Profil</th>
                <th scope="col" className="text-left font-bold">Peut</th>
              </tr>
            </thead>
            <tbody>
              {RÔLES.map(([nom, code, peut, lien]) => (
                <tr key={code}>
                  <td className="whitespace-nowrap font-semibold">{nom}</td>
                  <td>
                    <span className="font-mono text-xs text-(--encre-faine)">{code}</span>
                    <br />
                    {peut}
                    <br />
                    <Link href={lien} className="underline decoration-dotted underline-offset-2 text-xs">
                      ouvrir →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-(--encre-faine)">
          « Voir comme » (en-tête) change simplement la session naviguée ;
          une écriture hors-rôle reste REFUSÉE par la passerelle (403).
        </p>
      </section>

      <section className="carte p-5 md:p-7" aria-label="Réel vs simulé">
        <h2 className="text-xl font-extrabold">Réel ou simulé ?</h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm" role="list">
          {RÉEL.map(([quoi, etat]) => (
            <li key={quoi} className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{quoi}</span>
              <span className="rounded-xl bg-(--surface-2) px-2 py-0.5 text-xs">{etat}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="carte p-5 md:p-7" aria-label="Ecrans">
        <h2 className="text-xl font-extrabold">Les 9 écrans</h2>
        <ul className="mt-3 grid gap-2 pl-5 list-disc text-sm" role="list">
          <li><Link href="/hote" className="underline">Pilotage</Link> — KPIs, 14 actions 1-tap, journal</li>
          <li><Link href="/planning" className="underline">Planning</Link> — grille 7-30 j, navigation par fenêtre, export CSV, conflits ∧, vitrine</li>
          <li><Link href="/prix" className="underline">Grille de prix</Link> — édition 7 jours en ligne, navigation semaine, export CSV</li>
          <li><Link href="/compta" className="underline">Compta</Link> — 1 plan par SIREN, CSV Chorus</li>
          <li><Link href="/presta" className="underline">Prestataire</Link> — missions à faire, clôture</li>
          <li><Link href="/onboarding" className="underline">Onboarding</Link> — 7 étapes §L3, gates</li>
          <li><Link href="/proprio" className="underline">Propriétaire</Link> — relevé de période</li>
          <li><Link href="/commercial" className="underline">Commercial</Link> — pipeline + offre</li>
          <li><Link href="/voyageur" className="underline">Voyageur</Link> — guide du séjour + extras + incident</li>
        </ul>
      </section>

      <p className="text-xs text-(--encre-faine)">
        Conformité RG staffée en FR métier (onboarding/compta) : les pages
        internes ne sont pas auto-traduites — CC P10-juridique. Voyages :
        guide ×5 langues.
      </p>
      <p>
        <Link href="/" className="bouton bouton-secondaire px-4 py-2">← Accueil</Link>
      </p>
    </div>
  );
}
