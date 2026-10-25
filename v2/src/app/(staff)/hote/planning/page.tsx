import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  decalerMois,
  grilleMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import { nuitsSejour } from "@/domain/planning";
import { DrizzleBlocageRepository } from "@/infrastructure/db/repositories/blocage-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import {
  creerTokenVoyageur,
  tokenVoyageurExpireDansJours,
} from "@/lib/voyageur-token";
import { FormulaireReservation } from "./formulaire";

export const instant = false;

const JOURS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

export default async function PagePlanning({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string; logement?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;

  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );

  if (logements.length === 0) {
    return (
      <main className="mx-auto max-w-2xl space-y-4 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">Planning</h1>
        <p className="text-stone-600">
          Créez d’abord un logement pour planifier des séjours.
        </p>
        <Link className="underline" href="/hote/logements">
          Gérer les logements
        </Link>
      </main>
    );
  }

  const logement =
    logements.find((l) => l.id === params.logement) ?? logements[0];
  if (!logement) throw new Error("Aucun logement disponible.");

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois vide.");

  const toutes = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const reservations = toutes.filter((r) => r.logementId === logement.id);
  const tousBlocages = await new DrizzleBlocageRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const blocages = tousBlocages.filter((b) => b.logementId === logement.id);

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const debutDefaut =
    mois === aujourdHui.slice(0, 7) ? aujourdHui : premier;
  const finDefaut = ajouterJours(debutDefaut, 2);

  const lienMois = (m: string) =>
    `/hote/planning?mois=${m}&logement=${logement.id}`;

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-stone-500">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Planning — {moisEnFrancais(mois)}
          </h1>
          <p className="text-stone-600">
            {logement.nom} ({logement.code}) · {reservations.length}{" "}
            réservation{reservations.length > 1 ? "s" : ""} ·{" "}
            {blocages.length} blocage{blocages.length > 1 ? "s" : ""}
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          href={lienMois(decalerMois(mois, -1))}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          href={`/hote/planning?mois=${moisCourant()}&logement=${logement.id}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          href={lienMois(decalerMois(mois, 1))}
        >
          Mois suivant →
        </Link>
        <Link
          className="rounded-full border border-stone-300 px-4 py-2 text-sm"
          href={`/hote/planning/import?logement=${logement.id}`}
        >
          Importer un calendrier OTA
        </Link>

        <form className="ml-auto flex items-center gap-2" method="get">
          <input name="mois" type="hidden" value={mois} />
          <label className="text-sm" htmlFor="logement">
            Logement
          </label>
          <select
            className="rounded-xl border border-stone-300 p-2 text-sm"
            defaultValue={logement.id}
            id="logement"
            name="logement"
          >
            {logements.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nom}
              </option>
            ))}
          </select>
          <button className="rounded-full border border-stone-300 px-3 py-2 text-sm" type="submit">
            Afficher
          </button>
        </form>
      </div>

      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold">Créer une réservation</h2>
        <p className="mt-1 text-sm text-stone-600">
          Le chevauchement avec une réservation existante est refusé.
        </p>
        <div className="mt-5">
          <FormulaireReservation
            debutDefaut={debutDefaut}
            finDefaut={finDefaut}
            logementId={logement.id}
            logements={logements}
          />
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50">
              {JOURS.map((jour) => (
                <th className="p-2 text-left font-medium" key={jour}>
                  {jour}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grilleMois(mois).map((semaine, index) => (
              <tr className="border-b border-stone-100" key={index}>
                {semaine.map((date, i) => {
                  if (!date) {
                    return <td className="p-2" key={`vide-${index}-${i}`} />;
                  }
                  const duJour = reservations.filter(
                    (r) => r.debut <= date && date < r.fin,
                  );
                  const blocageJour = blocages.filter(
                    (b) => b.debut <= date && date < b.fin,
                  );
                  return (
                    <td className="p-2 align-top" key={date}>
                      <div className="min-h-20 rounded-lg border border-stone-100 p-2">
                        <span className="block text-xs text-stone-500">
                          {date.slice(8)}
                        </span>
                        <ul className="mt-1 space-y-1">
                          {blocageJour.length > 0 ? (
                            <li className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900">
                              Bloqué
                            </li>
                          ) : null}
                          {duJour.slice(0, 2).map((r) => (
                            <li
                              className="rounded bg-stone-100 px-2 py-1 text-xs"
                              key={r.id}
                            >
                              {r.ref}
                            </li>
                          ))}
                          {duJour.length > 2 ? (
                            <li className="text-xs text-stone-500">
                              +{duJour.length - 2}
                            </li>
                          ) : null}
                        </ul>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Réservations du mois</h2>
        {reservations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
            Aucune réservation sur ce mois pour ce logement.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {reservations.map((reservation) => {
              const token = creerTokenVoyageur({
                tenantId,
                logementId: reservation.logementId,
                reservationId: reservation.id,
                exp: tokenVoyageurExpireDansJours(reservation.fin),
              });
              const lienVoyageur = `/voyageur?t=${encodeURIComponent(token)}`;

              return (
                <li className="p-4" key={reservation.id}>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium">
                      {reservation.ref}
                      {reservation.clientNom
                        ? ` — ${reservation.clientNom}`
                        : ""}
                    </p>
                    <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
                      {reservation.statut}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-stone-600">
                    {reservation.debut} → {reservation.fin} ·{" "}
                    {nuitsSejour(reservation.debut, reservation.fin)} nuit
                    {nuitsSejour(reservation.debut, reservation.fin) > 1
                      ? "s"
                      : ""}{" "}
                    · {reservation.voyageurs} voyageur
                    {reservation.voyageurs > 1 ? "s" : ""} ·{" "}
                    {formaterEuros(reservation.montantCentimes)}
                  </p>
                  <Link
                    className="mt-2 inline-block text-sm underline"
                    href={lienVoyageur}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Lien voyageur
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Blocages OTA du mois</h2>
        {blocages.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-stone-300 p-6 text-stone-600">
            Aucun blocage sur ce mois pour ce logement.
          </p>
        ) : (
          <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
            {blocages.map((blocage) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 p-4"
                key={blocage.id}
              >
                <div>
                  <p className="font-medium">
                    {blocage.motif ?? "Indisponibilité OTA"}
                  </p>
                  <p className="text-sm text-stone-600">
                    {blocage.debut} → {blocage.fin}
                  </p>
                </div>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900">
                  bloqué
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/prix">
          Prix
        </Link>
        <Link className="underline" href="/hote/logements">
          Logements
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
