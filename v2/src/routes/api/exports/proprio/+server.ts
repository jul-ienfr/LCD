import { ajouterJours, joursDuMois, moisCourant, moisValide } from "@/domain/calendrier";
import { montantCommission } from "@/domain/commission";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

function nombre(centimes: number): string {
  return (centimes / 100).toFixed(2).replace(".", ",");
}

function champ(valeur: string): string {
  return `"${valeur.replace(/"/g, '""')}"`;
}

export const GET: RequestHandler = async (event) => {
  const session = requireRole(event, ["proprietaire", "admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const demande = event.url.searchParams.get("mois");
  const mois = demande && moisValide(demande) ? demande : moisCourant();
  const estProprietaire = session.user.role === "proprietaire";

  const logements = estProprietaire
    ? await new DrizzleLogementProprietaireRepository().listerLogements(
        tenantId,
        session.user.id,
      )
    : await new DrizzleLogementRepository().listerParTenant(tenantId);
  const ids = new Set(logements.map((logement) => logement.id));
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
  const chargesParLogement = new Map(
    assignations.map((assignation) => [
      assignation.logementId,
      assignation.chargesMensuellesCentimes,
    ]),
  );

  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) {
    return new Response("Mois invalide", { status: 400 });
  }

  const reservations = (
    await new DrizzleReservationRepository().listerParMois(
      tenantId,
      premier,
      ajouterJours(dernier, 1),
    )
  ).filter((reservation) => ids.has(reservation.logementId));

  let totalCaCentimes = 0;
  let totalCommissionCentimes = 0;
  let totalChargesCentimes = 0;
  let totalNetCentimes = 0;
  const lignes = logements.map((logement) => {
    const resas = reservations.filter(
      (reservation) => reservation.logementId === logement.id,
    );
    const caCentimes = resas
      .filter((reservation) => reservation.statut !== "annulee")
      .reduce((total, reservation) => total + reservation.montantCentimes, 0);
    const commissionBp = estProprietaire
      ? (commissionParLogement.get(logement.id) ?? 0)
      : 0;
    const commissionCentimes = montantCommission(caCentimes, commissionBp);
    const chargesCentimes = estProprietaire
      ? (chargesParLogement.get(logement.id) ?? 0)
      : 0;
    const netCentimes = caCentimes - commissionCentimes - chargesCentimes;
    totalCaCentimes += caCentimes;
    totalCommissionCentimes += commissionCentimes;
    totalChargesCentimes += chargesCentimes;
    totalNetCentimes += netCentimes;
    return [
      champ(logement.nom),
      String(resas.length),
      nombre(caCentimes),
      nombre(commissionCentimes),
      nombre(chargesCentimes),
      nombre(netCentimes),
    ].join(";");
  });

  const contenu = [
    "Logement;Séjours;CA;Commission;Charges;Net",
    ...lignes,
    [
      champ("TOTAL"),
      String(reservations.length),
      nombre(totalCaCentimes),
      nombre(totalCommissionCentimes),
      nombre(totalChargesCentimes),
      nombre(totalNetCentimes),
    ].join(";"),
  ].join("\r\n");

  return new Response(`\uFEFF${contenu}\r\n`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="releve-${mois}.csv"`,
      "cache-control": "private, no-store",
    },
  });
};
