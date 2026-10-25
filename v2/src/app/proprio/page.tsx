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
  formaterCommissionBp,
  montantCommission,
} from "@/domain/commission";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { nuitsSejour } from "@/domain/planning";
import { formaterEuros } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/bouton-deconnexion";

export const instant = false;

export default async function PageProprietaire({
  searchParams,
}: {
  searchParams: Promise<{ mois?: string }>;
}) {
  await connection();

  const session = await requireRole(["proprietaire", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = await searchParams;
  const mois =
    params.mois && moisValide(params.mois) ? params.mois : moisCourant();

  const logements =
    session.user.role === "proprietaire"
      ? await new DrizzleLogementProprietaireRepository().listerLogements(
          tenantId,
          session.user.id,
        )
      : await new DrizzleLogementRepository().listerParTenant(tenantId);

  if (logements.length === 0) {
    return (
      <main className="mx-auto max-w-2xl space-y-6 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace propriétaire
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Relevé de mandat
          </h1>
          <p className="rounded-xl border border-alerte bg-alerte-douce p-4 text-alerte">
            Aucun logement n’est encore rattaché à votre compte. Contactez
            votre gestionnaire.
          </p>
        </header>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm underline" href="/hote/securite">
            Sécurité / 2FA
          </Link>
          <BoutonDeconnexion />
        </div>
      </main>
    );
  }

  const ids = new Set(logements.map((l) => l.id));
  const estProprietaire = session.user.role === "proprietaire";
  const assignations = estProprietaire
    ? (
        await new DrizzleLogementProprietaireRepository().listerAssignations(
          tenantId,
        )
      ).filter((assignation) => assignation.userId === session.user.id)
    : [];
  const commissionParLogement = new Map(
    assignations.map((assignation) => [
      assignation.logementId,
      assignation.commissionBp,
    ]),
  );

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) throw new Error("Mois invalide.");

  const reservations = (
    await new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    )
  ).filter((r) => ids.has(r.logementId));

  const factures = (
    await new DrizzleFactureRepository().listerParMois(
      tenantId,
      premier,
      dernier,
    )
  ).filter((f) => ids.has(f.logementId));

  const ca = reservations
    .filter((r) => r.statut !== "annulee")
    .reduce((total, r) => total + r.montantCentimes, 0);
  const ht = factures.reduce((total, f) => total + f.montantHtCentimes, 0);
  const ttc = factures.reduce((total, f) => total + f.montantTtcCentimes, 0);

  const lignes = logements.map((logement) => {
    const resas = reservations.filter((r) => r.logementId === logement.id);
    const facts = factures.filter((f) => f.logementId === logement.id);
    const caLogement = resas
      .filter((r) => r.statut !== "annulee")
      .reduce((t, r) => t + r.montantCentimes, 0);
    const commissionBp = estProprietaire
      ? (commissionParLogement.get(logement.id) ?? 0)
      : null;
    const commission =
      commissionBp === null ? 0 : montantCommission(caLogement, commissionBp);
    return {
      logement,
      resas,
      facts,
      ca: caLogement,
      ht: facts.reduce((t, f) => t + f.montantHtCentimes, 0),
      ttc: facts.reduce((t, f) => t + f.montantTtcCentimes, 0),
      commissionBp,
      commission,
      net: caLogement - commission,
    };
  });
  const commissionTotale = lignes.reduce((t, l) => t + l.commission, 0);
  const netTotal = lignes.reduce((t, l) => t + l.net, 0);

  return (
    <main className="mx-auto max-w-4xl space-y-8 px-6 py-12">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-widest text-encre-faine">
            Espace propriétaire
          </p>
          <h1 className="text-3xl font-semibold tracking-tight">
            Relevé de mandat — {moisEnFrancais(mois)}
          </h1>
          <p className="text-encre-douce">
            {logements.length} logement{logements.length > 1 ? "s" : ""} ·{" "}
            {session.user.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link className="text-sm underline" href="/hote/securite">
            Sécurité / 2FA
          </Link>
          <BoutonDeconnexion />
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/proprio?mois=${decalerMois(mois, -1)}`}
        >
          ← Mois précédent
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/proprio?mois=${moisCourant()}`}
        >
          Mois courant
        </Link>
        <Link
          className="rounded-full border border-bordure px-4 py-2 text-sm"
          href={`/proprio?mois=${decalerMois(mois, 1)}`}
        >
          Mois suivant →
        </Link>
      </div>

      <section
        className={
          estProprietaire
            ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
            : "grid gap-4 sm:grid-cols-3"
        }
      >
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">CA réservations</p>
          <p className="mt-1 text-2xl font-semibold">{formaterEuros(ca)}</p>
          <p className="text-xs text-encre-faine">
            {reservations.length} séjour{reservations.length > 1 ? "s" : ""}
          </p>
        </div>
        {estProprietaire ? (
          <>
            <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
              <p className="text-sm text-encre-faine">Commission de mandat</p>
              <p className="mt-1 text-2xl font-semibold">
                {formaterEuros(commissionTotale)}
              </p>
              <p className="text-xs text-encre-faine">
                taux du mandat par logement
              </p>
            </div>
            <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
              <p className="text-sm text-encre-faine">Net propriétaire</p>
              <p className="mt-1 text-2xl font-semibold">
                {formaterEuros(netTotal)}
              </p>
              <p className="text-xs text-encre-faine">CA − commission</p>
            </div>
          </>
        ) : (
          <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
            <p className="text-sm text-encre-faine">HT facturé</p>
            <p className="mt-1 text-2xl font-semibold">
              {formaterEuros(ht)}
            </p>
            <p className="text-xs text-encre-faine">
              {factures.length} facture{factures.length > 1 ? "s" : ""}
            </p>
          </div>
        )}
        <div className="rounded-2xl border border-bordure bg-surface p-5 shadow-sm">
          <p className="text-sm text-encre-faine">TTC facturé</p>
          <p className="mt-1 text-2xl font-semibold">{formaterEuros(ttc)}</p>
          <p className="text-xs text-encre-faine">taxe de séjour incluse</p>
        </div>
      </section>

      <section className="overflow-x-auto rounded-2xl border border-bordure bg-surface">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-bordure bg-fond text-left">
              <th className="p-3 font-medium">Logement</th>
              <th className="p-3 text-right font-medium">Séjours</th>
              <th className="p-3 text-right font-medium">CA</th>
              <th className="p-3 text-right font-medium">Commission</th>
              <th className="p-3 text-right font-medium">Net</th>
              <th className="p-3 text-right font-medium">TTC</th>
            </tr>
          </thead>
          <tbody>
            {lignes.map((ligne) => (
              <tr
                className="border-b border-bordure"
                key={ligne.logement.id}
              >
                <td className="p-3">
                  {ligne.logement.nom}
                  <span className="ml-2 text-xs text-encre-faine">
                    {ligne.logement.code}
                  </span>
                </td>
                <td className="p-3 text-right">{ligne.resas.length}</td>
                <td className="p-3 text-right">{formaterEuros(ligne.ca)}</td>
                <td className="p-3 text-right">
                  {ligne.commissionBp !== null ? (
                    <>
                      {formaterEuros(ligne.commission)}
                      <span className="block text-xs text-encre-faine">
                        {formaterCommissionBp(ligne.commissionBp)}
                      </span>
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3 text-right">
                  {ligne.commissionBp !== null
                    ? formaterEuros(ligne.net)
                    : "—"}
                </td>
                <td className="p-3 text-right">{formaterEuros(ligne.ttc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Séjours du mois</h2>
        {reservations.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-bordure p-6 text-encre-douce">
            Aucun séjour sur ce mois.
          </p>
        ) : (
          <ul className="divide-y divide-bordure rounded-2xl border border-bordure bg-surface">
            {reservations.map((reservation) => (
              <li className="p-4" key={reservation.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium">{reservation.ref}</p>
                  <span className="rounded-full bg-surface-2 px-3 py-1 text-xs text-encre-douce">
                    {reservation.statut}
                  </span>
                </div>
                <p className="mt-1 text-sm text-encre-douce">
                  {logements.find((l) => l.id === reservation.logementId)?.nom ??
                    reservation.logementId}{" "}
                  · {reservation.debut} → {reservation.fin} ·{" "}
                  {nuitsSejour(reservation.debut, reservation.fin)} nuit
                  {nuitsSejour(reservation.debut, reservation.fin) > 1
                    ? "s"
                    : ""}{" "}
                  · {formaterEuros(reservation.montantCentimes)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="text-xs text-encre-faine">
        {estProprietaire
          ? "Commission calculée sur le CA réservations (hors taxe de séjour), selon le taux du mandat. Net propriétaire = CA − commission."
          : "Vue administrateur : la commission et le net sont calculés pour un compte propriétaire."}{" "}
        La taxe de séjour est suivie séparément du chiffre d’affaires.
      </p>

      <div className="flex flex-wrap gap-4 text-sm">
        <Link className="underline" href="/support">
          Support
        </Link>
        <Link className="underline" href="/">
          Retour à l’accueil
        </Link>
      </div>
    </main>
  );
}
