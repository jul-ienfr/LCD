import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aide",
  description:
    "Rôles, espaces, fonctionnement hors ligne et limites connues de la plateforme LCD.",
};

const ROLES: { role: string; acces: string }[] = [
  {
    role: "Administrateur",
    acces:
      "Paramétrage de l’établissement, utilisateurs, sécurité, intégrations, facturation et pilotage complet.",
  },
  {
    role: "Hôte",
    acces:
      "Logements, planning, prix, ménage, messages, avis, états des lieux et opérations du quotidien.",
  },
  {
    role: "Comptable",
    acces:
      "Factures, paiements, exports comptables et paramètres fiscaux, sans accès aux autres modules.",
  },
  {
    role: "Prestataire",
    acces:
      "Missions assignées, pointage, photos avant/après et clôture des interventions.",
  },
  {
    role: "Propriétaire",
    acces:
      "Relevés de son ou ses logements, charges, commissions et documents, en lecture seule.",
  },
  {
    role: "Commercial",
    acces:
      "Prospects, pipeline, simulateur de rentabilité et offres, sans accès à l’exploitation.",
  },
];

const ESPACES: { chemin: string; role: string; contenu: string }[] = [
  {
    chemin: "/hote",
    role: "Administrateur, hôte",
    contenu:
      "Tableau de bord : indicateurs, arrivées et départs, tâches du jour, raccourcis.",
  },
  {
    chemin: "/hote/logements",
    role: "Administrateur, hôte",
    contenu:
      "Fiches logements, équipements, accès, propriétaires et conformité des annonces.",
  },
  {
    chemin: "/hote/planning",
    role: "Administrateur, hôte",
    contenu:
      "Calendrier des séjours, blocages, imports ICS et résolution des conflits.",
  },
  {
    chemin: "/hote/prix",
    role: "Administrateur, hôte",
    contenu:
      "Grille de prix par nuit, règles saisonnières, taxes et application des recommandations.",
  },
  {
    chemin: "/hote/menage",
    role: "Administrateur, hôte, prestataire",
    contenu:
      "Ménages à faire, checklists, preuves photo, temps pointé et clôture.",
  },
  {
    chemin: "/hote/factures",
    role: "Administrateur, comptable",
    contenu:
      "Factures, avoirs, statuts de paiement, relances et documents PDF.",
  },
  {
    chemin: "/hote/compta",
    role: "Administrateur, comptable",
    contenu:
      "Exports comptables, TVA, taxe de séjour, rapprochements et clôtures.",
  },
  {
    chemin: "/hote/securite",
    role: "Administrateur",
    contenu:
      "Mot de passe, double authentification et sessions actives révocables.",
  },
  {
    chemin: "/presta",
    role: "Prestataire",
    contenu:
      "Missions du jour, détail des tâches, pointage et preuves d’intervention.",
  },
  {
    chemin: "/proprio",
    role: "Propriétaire",
    contenu:
      "Relevé par logement : revenus, charges, commission, net et documents.",
  },
  {
    chemin: "/commercial",
    role: "Commercial",
    contenu:
      "Prospects, pipeline, simulateur de rentabilité et génération d’offres.",
  },
  {
    chemin: "/voyageur",
    role: "Voyageur (lien signé)",
    contenu:
      "Guide du séjour, accès, messages, incidents et questionnaire de départ, sans compte.",
  },
];

export default function PageAide() {
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
          Centre d’aide
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          Comment fonctionne la plateforme
        </h1>
        <p className="max-w-2xl text-encre-douce">
          Un seul système pour l’hôte, le voyageur, le propriétaire et le
          prestataire. Les pages publiques et l’espace voyageur restent
          consultables sans JavaScript ; les formulaires sont de vrais
          formulaires HTML.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Les 6 rôles</h2>
        <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure text-encre-faine">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Rôle
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Accès
                </th>
              </tr>
            </thead>
            <tbody>
              {ROLES.map((item) => (
                <tr key={item.role} className="border-b border-bordure last:border-0">
                  <td className="px-4 py-3 font-medium">{item.role}</td>
                  <td className="px-4 py-3 text-encre-douce">{item.acces}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-encre-douce">
          Un utilisateur peut cumuler plusieurs rôles. Les droits sont
          revérifiés à chaque action côté serveur, pas seulement à l’affichage.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Les espaces</h2>
        <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-bordure text-encre-faine">
              <tr>
                <th scope="col" className="px-4 py-3 font-medium">
                  Adresse
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Rôles
                </th>
                <th scope="col" className="px-4 py-3 font-medium">
                  Contenu
                </th>
              </tr>
            </thead>
            <tbody>
              {ESPACES.map((item) => (
                <tr key={item.chemin} className="border-b border-bordure last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{item.chemin}</td>
                  <td className="px-4 py-3 text-encre-douce">{item.role}</td>
                  <td className="px-4 py-3 text-encre-douce">{item.contenu}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Hors ligne et vieux téléphones</h2>
        <p className="text-sm text-encre-douce">
          L’espace voyageur et les pages publiques sont rendus côté serveur :
          ils s’affichent sans JavaScript et sans installation. Une fois la
          page ouverte, le contenu déjà chargé reste consultable si le réseau
          tombe ; les écritures rejouables sont mises en file avec une référence
          stable pour éviter les doublons au retour du réseau.
        </p>
        <p className="text-sm text-encre-douce">
          Les documents sensibles (contrats, factures, liens voyageur) reposent
          sur des liens signés à durée limitée : ne les transférez pas à des
          tiers.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Ce qui est réel — et les limites</h2>
        <ul className="list-disc space-y-1 pl-5 text-sm text-encre-douce">
          <li>
            Les réservations, contrats, factures, paiements, ménages et
            incidents sont enregistrés en base et tracés dans le journal
            d’audit.
          </li>
          <li>
            Aucune écriture n’est envoyée automatiquement aux plateformes de
            réservation : les calendriers ICS sont importés en lecture seule et
            les conflits sont signalés.
          </li>
          <li>
            Aucun encaissement de carte bancaire n’est réalisé par la
            plateforme : les cautions et paiements sont suivis, pas débités.
          </li>
          <li>
            L’envoi d’e-mails dépend de la configuration de l’établissement ;
            sur l’édition beta, il peut être désactivé.
          </li>
          <li>
            L’instance beta est mono-établissement et n’utilise pas encore de
            canal de synchronisation bidirectionnel avec les OTA.
          </li>
        </ul>
      </section>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-bordure pt-4 text-sm text-encre-faine">
        <div className="flex flex-wrap gap-4">
          <Link className="underline" href="/legales">
            Mentions légales &amp; CGV
          </Link>
          <Link className="underline" href="/reserver">
            Réserver un séjour
          </Link>
        </div>
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </footer>
    </main>
  );
}
