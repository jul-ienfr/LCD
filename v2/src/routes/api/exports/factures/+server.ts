import { joursDuMois, moisCourant, moisValide } from "@/domain/calendrier";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
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
  const factures = await new DrizzleFactureRepository().listerParMois(tenantId, premier, dernier);
  const lignes = [
    ["numero", "date_emission", "client", "email", "ht_eur", "tva_eur", "taxe_sejour_eur", "ttc_eur", "statut"],
    ...factures.map((f) => [
      f.numero,
      f.dateEmission,
      f.clientNom,
      f.clientEmail ?? "",
      euros(f.montantHtCentimes),
      euros(f.tvaCentimes),
      euros(f.taxeSejourCentimes),
      euros(f.montantTtcCentimes),
      f.statut,
    ]),
  ];

  const csv = `\uFEFF${lignes.map((ligne) => ligne.map(celluleCsv).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="factures-${mois}.csv"`,
      "cache-control": "private, no-store",
    },
  });
};
