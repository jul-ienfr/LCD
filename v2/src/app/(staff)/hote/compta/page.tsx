import Link from "next/link";
import { connection } from "next/server";
import {
  ajouterJours,
  decalerMois,
  joursDuMois,
  moisCourant,
  moisEnFrancais,
  moisValide,
} from "@/domain/calendrier";
import {
  LIBELLES_MODE_PAIEMENT,
  totalPaiements,
} from "@/domain/paiement";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export const instant = false;

export default async function PageCompta({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");
  const finMois = ajouterJours(dernier, 1);

  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    finMois,
  );
  const factures = await new DrizzleFactureRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );
  const paiements = await new DrizzlePaiementRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );

  const caReservations = reservations
    .filter((r) => r.statut !== "annulee")
    .reduce((total, r) => total + r.montantCentimes, 0);
  const htFacture = factures.reduce((t, f) => t + f.montantHtCentimes, 0);
  const tva = factures.reduce((t, f) => t + f.tvaCentimes, 0);
  const taxe = factures.reduce((t, f) => t + f.taxeSejourCentimes, 0);
  const ttc = factures.reduce((t, f) => t + f.montantTtcCentimes, 0);
  const encaisse = totalPaiements(paiements);

  const parFacture = new Map(factures.map((f) => [f.id, f]));

  const parLogement = logements.map((logement) => {
    const resas = reservations.filter((r) => r.logementId === logement.id);
    const facts = factures.filter((f) => f.logementId === logement.id);
    return {
      logement,
      reservations: resas.length,
      ca: resas
        .filter((r) => r.statut !== "annulee")
        .reduce((t, r) => t + r.montantCentimes, 0),
      factures: facts.length,
      ttc: facts.reduce((t, f) => t + f.montantTtcCentimes, 0),
    };
  });

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace hôte
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Comptabilité — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            Réservations, factures, TVA et taxe de séjour.
          </p>
        </div>
        <Link className="text-sm underline" href="/hote">
          Retour au tableau de bord
        </Link>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/compta?mois=${decalerMois(mois, -1)}`}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/compta?mois=${moisCourant()}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/hote/compta?mois=${decalerMois(mois, 1)}`}
        >
          Mois suivant →
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/api/exports/reservations?mois=${mois}`}
        >
          Export CSV réservations
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/api/exports/factures?mois=${mois}`}
        >
          Export CSV factures
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/api/exports/paiements?mois=${mois}`}
        >
          Export CSV paiements
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href="/hote/compta/parametres"
        >
          Paramètres fiscaux
        </Link>
        <Link className="text-sm underline" href="/hote/factures">
          Factures
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">CA réservations</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(caReservations)}
          </p>
          <p className="text-xs text-encre-faine">{reservations.length} séjours</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">HT facturé</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(htFacture)}
          </p>
          <p className="text-xs text-encre-faine">{factures.length} factures</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">TVA + taxe de séjour</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(tva + taxe)}
          </p>
          <p className="text-xs text-encre-faine">
            TVA {formaterEuros(tva)} · taxe {formaterEuros(taxe)}
          </p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">TTC facturé</p>
          <p className="mt-1 text-2xl font-semibold">{formaterEuros(ttc)}</p>
          <p className="text-xs text-encre-faine">hors CA réservations</p>
        </div>
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">Encaissé</p>
          <p className="mt-1 text-2xl font-semibold">
            {formaterEuros(encaisse)}
          </p>
          <p className="text-xs text-encre-faine">
            {paiements.length} paiement{paiements.length > 1 ? "s" : ""}
          </p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-bordure bg-fond text-left">
              <th className="p-3 font-medium">Logement</th>
              <th className="p-3 text-right font-medium">Séjours</th>
              <th className="p-3 text-right font-medium">CA réservations</th>
              <th className="p-3 text-right font-medium">Factures</th>
              <th className="p-3 text-right font-medium">TTC facturé</th>
            </tr>
          </thead>
          <tbody>
            {parLogement.map((ligne) => (
              <tr className="border-b border-bordure" key={ligne.logement.id}>
                <td className="p-3">
                  {ligne.logement.nom}
                  <span className="ml-2 text-xs text-encre-faine">
                    {ligne.logement.code}
                  </span>
                </td>
                <td className="p-3 text-right">{ligne.reservations}</td>
                <td className="p-3 text-right">
                  {formaterEuros(ligne.ca)}
                </td>
                <td className="p-3 text-right">{ligne.factures}</td>
                <td className="p-3 text-right">
                  {formaterEuros(ligne.ttc)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Paiements du mois</h2>
        {paiements.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun paiement encaissé sur ce mois.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-bordure bg-fond text-left">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Facture</th>
                  <th className="p-3 font-medium">Mode</th>
                  <th className="p-3 font-medium">Référence</th>
                  <th className="p-3 text-right font-medium">Montant</th>
                </tr>
              </thead>
              <tbody>
                {paiements.map((paiement) => {
                  const facture = parFacture.get(paiement.factureId);
                  return (
                    <tr
                      className="border-b border-bordure"
                      key={paiement.id}
                    >
                      <td className="p-3">{paiement.datePaiement}</td>
                      <td className="p-3">
                        {facture ? (
                          <Link
                            className="underline"
                            href={`/hote/factures/${facture.id}`}
                          >
                            {facture.numero}
                          </Link>
                        ) : (
                          paiement.factureId
                        )}
                      </td>
                      <td className="p-3">
                        {LIBELLES_MODE_PAIEMENT[paiement.mode]}
                      </td>
                      <td className="p-3">
                        {paiement.reference ?? paiement.ref}
                      </td>
                      <td className="p-3 text-right">
                        {formaterEuros(paiement.montantCentimes)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/hote/factures">
          Factures
        </Link>
        <Link className="underline" href="/hote/compta/parametres">
          Paramètres fiscaux
        </Link>
        <Link className="underline" href="/hote/planning">
          Planning
        </Link>
        <Link className="underline" href="/hote">
          Tableau de bord
        </Link>
      </nav>
    </main>
  );
}
