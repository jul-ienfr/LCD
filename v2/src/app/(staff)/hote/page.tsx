import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  joursDuMois,
} from "@/domain/calendrier";
import { nuitsSejour } from "@/domain/planning";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";

// Route staff bloquante : session + DB avant rendu.
export const instant = false;

function nomLogement(
  logements: { id: string; nom: string }[],
  id: string,
): string {
  return logements.find((l) => l.id === id)?.nom ?? id;
}

export default async function PageHote() {
  await connection();
  const session = await requireRole(["admin", "hote", "comptable"]);

  const logements = await new DrizzleLogementRepository().listerParTenant(
    session.user.tenantId ?? "",
  );
  const today = new Date().toISOString().slice(0, 10);
  const mois = today.slice(0, 7);
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois courant invalide.");
  const finMois = ajouterJours(dernier, 1);

  const reservations = await new DrizzleReservationRepository().listerParMois(
    session.user.tenantId ?? "",
    premier,
    finMois,
  );

  const caMois = reservations
    .filter((r) => r.statut !== "annulee")
    .reduce((total, r) => total + r.montantCentimes, 0);

  const dans7Jours = ajouterJours(today, 7);
  const arrivees = reservations
    .filter((r) => r.debut >= today && r.debut <= dans7Jours)
    .sort((a, b) => a.debut.localeCompare(b.debut));
  const departs = reservations
    .filter((r) => r.fin >= today && r.fin <= dans7Jours)
    .sort((a, b) => a.fin.localeCompare(b.fin));

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Bonjour {session.user.name}
          </h1>
          <p className="text-encre-douce">
            Rôle : <span className="font-medium">{session.user.role}</span> ·
            Tenant : <span className="font-mono text-xs">{session.user.tenantId}</span>
          </p>
        </div>
        <BoutonDeconnexion />
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Logements</p>
          <p className="mt-1 text-3xl font-semibold">{logements.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Réservations du mois</p>
          <p className="mt-1 text-3xl font-semibold">{reservations.length}</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">CA du mois</p>
          <p className="mt-1 text-3xl font-semibold">
            {formaterEuros(caMois)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Arrivées 7 jours</p>
          <p className="mt-1 text-3xl font-semibold">{arrivees.length}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Accès rapides</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            className="rounded-full bg-encre px-5 py-3 text-sm font-medium text-fond"
            href="/hote/logements"
          >
            Logements
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/planning"
          >
            Planning
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/prix"
          >
            Prix
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/missions"
          >
            Missions
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/dispatch"
          >
            Dispatch
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/messages"
          >
            Messages voyageurs
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/cautions"
          >
            Cautions
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/sinistres"
          >
            Sinistres
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/extras"
          >
            Extras
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/stocks"
          >
            Stocks
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/inventaire"
          >
            Inventaire
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/etats-des-lieux"
          >
            États des lieux
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/entretien"
          >
            Entretien
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/menage"
          >
            Ménage
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/questionnaires"
          >
            Questionnaires
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/phrases"
          >
            Phrases types
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/formation"
          >
            Formation
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/objets-trouves"
          >
            Objets trouvés
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/tranquillite"
          >
            Tranquillité
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/annonce"
          >
            Annonce
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/rgpd"
          >
            Registre RGPD
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/tourisme"
          >
            Tourisme
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/avis"
          >
            Avis
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/integrations"
          >
            Intégrations
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/proprietaires"
          >
            Propriétaires
          </Link>
          {session.user.role === "admin" ? (
            <Link
              className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
              href="/hote/utilisateurs"
            >
              Utilisateurs
            </Link>
          ) : null}
          {session.user.role === "admin" ? (
            <Link
              className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
              href="/hote/entite"
            >
              Entité juridique
            </Link>
          ) : null}
          {session.user.role === "admin" ? (
            <Link
              className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
              href="/hote/audit"
            >
              Audit
            </Link>
          ) : null}
          {session.user.role === "admin" ? (
            <Link
              className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
              href="/hote/design"
            >
              Design
            </Link>
          ) : null}
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/support"
          >
            Support
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/commercial"
          >
            Commercial
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/compta"
          >
            Compta
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/factures"
          >
            Factures
          </Link>
          <Link
            className="rounded-full border border-bordure px-5 py-3 text-sm font-medium"
            href="/hote/securite"
          >
            Sécurité / 2FA
          </Link>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prochaines arrivées</h2>
          {arrivees.length === 0 ? (
            <p className="mt-3 text-sm text-encre-douce">
              Aucune arrivée dans les 7 jours.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-bordure">
              {arrivees.map((r) => (
                <li className="py-3" key={r.id}>
                  <p className="font-medium">
                    {r.debut} — {r.ref}
                  </p>
                  <p className="text-sm text-encre-douce">
                    {nomLogement(logements, r.logementId)}
                    {r.clientNom ? ` · ${r.clientNom}` : ""} ·{" "}
                    {nuitsSejour(r.debut, r.fin)} nuit
                    {nuitsSejour(r.debut, r.fin) > 1 ? "s" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-bordure bg-surface p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Prochains départs</h2>
          {departs.length === 0 ? (
            <p className="mt-3 text-sm text-encre-douce">
              Aucun départ dans les 7 jours.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-bordure">
              {departs.map((r) => (
                <li className="py-3" key={r.id}>
                  <p className="font-medium">
                    {r.fin} — {r.ref}
                  </p>
                  <p className="text-sm text-encre-douce">
                    {nomLogement(logements, r.logementId)}
                    {r.clientNom ? ` · ${r.clientNom}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <Link className="text-sm underline" href="/">
        Retour à l’accueil
      </Link>
    </main>
  );
}
