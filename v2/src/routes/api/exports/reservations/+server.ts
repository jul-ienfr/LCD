import { ajouterJours, joursDuMois, moisCourant, moisValide } from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { celluleCsv } from "@/lib/csv";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

function euros(centimes: number): string {
  return (centimes / 100).toFixed(2).replace(".", ",");
}

export const GET: RequestHandler = async ({ locals, url }) => {
  const session = locals.session;
  const refus = verifierAccesApi(session, ["admin", "hote", "comptable"]);
  if (refus) return refus;

  const moisParam = url.searchParams.get("mois");
  const mois = moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) {
    return new Response("Mois invalide", { status: 400 });
  }

  const tenantId = tenantIdDeSession(session!);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const parId = new Map(logements.map((logement) => [logement.id, logement]));
  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    ajouterJours(dernier, 1),
  );

  const lignes = [
    ["ref", "logement", "debut", "fin", "nuits", "client", "voyageurs", "montant_eur", "statut"],
    ...reservations.map((reservation) => {
      const nuits = Math.round(
        (Date.parse(`${reservation.fin}T00:00:00Z`) - Date.parse(`${reservation.debut}T00:00:00Z`)) /
          86_400_000,
      );
      return [
        reservation.ref,
        parId.get(reservation.logementId)?.nom ?? reservation.logementId,
        reservation.debut,
        reservation.fin,
        String(nuits),
        reservation.clientNom ?? "",
        String(reservation.voyageurs),
        euros(reservation.montantCentimes),
        reservation.statut,
      ];
    }),
  ];

  const csv = `\uFEFF${lignes.map((ligne) => ligne.map(celluleCsv).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="reservations-${mois}.csv"`,
      "cache-control": "private, no-store",
    },
  });
};
