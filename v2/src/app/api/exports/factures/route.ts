import { connection } from "next/server";
import {
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { getSession, tenantIdDeSession } from "@/lib/session";

function cellule(valeur: unknown): string {
  return `"${String(valeur ?? "").replace(/"/g, '""')}"`;
}

function euros(centimes: number): string {
  return (centimes / 100).toFixed(2).replace(".", ",");
}

export async function GET(request: Request) {
  await connection();

  const session = await getSession();
  if (!session) {
    return new Response("Non autorisé", { status: 401 });
  }

  const url = new URL(request.url);
  const moisParam = url.searchParams.get("mois");
  const mois =
    moisParam && moisValide(moisParam) ? moisParam : moisCourant();
  const jours = joursDuMois(mois);
  const premier = jours[0];
  const dernier = jours[jours.length - 1];
  if (!premier || !dernier) {
    return new Response("Mois invalide", { status: 400 });
  }

  const tenantId = tenantIdDeSession(session);
  const factures = await new DrizzleFactureRepository().listerParMois(
    tenantId,
    premier,
    dernier,
  );

  const lignes = [
    [
      "numero",
      "date_emission",
      "client",
      "email",
      "ht_eur",
      "tva_eur",
      "taxe_sejour_eur",
      "ttc_eur",
      "statut",
    ],
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

  const csv = `\uFEFF${lignes.map((l) => l.map(cellule).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="factures-${mois}.csv"`,
      "cache-control": "no-store",
    },
  });
}
