import { connection } from "next/server";
import {
  ajouterJours,
  joursDuMois,
  moisCourant,
  moisValide,
} from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
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
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const parId = new Map(logements.map((l) => [l.id, l]));
  const reservations = await new DrizzleReservationRepository().listerParMois(
    tenantId,
    premier,
    ajouterJours(dernier, 1),
  );

  const lignes = [
    [
      "ref",
      "logement",
      "debut",
      "fin",
      "nuits",
      "client",
      "voyageurs",
      "montant_eur",
      "statut",
    ],
    ...reservations.map((r) => {
      const nuits = Math.round(
        (Date.parse(`${r.fin}T00:00:00Z`) -
          Date.parse(`${r.debut}T00:00:00Z`)) /
          86_400_000,
      );
      return [
        r.ref,
        parId.get(r.logementId)?.nom ?? r.logementId,
        r.debut,
        r.fin,
        String(nuits),
        r.clientNom ?? "",
        String(r.voyageurs),
        euros(r.montantCentimes),
        r.statut,
      ];
    }),
  ];

  const csv = `\uFEFF${lignes.map((l) => l.map(cellule).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="reservations-${mois}.csv"`,
      "cache-control": "no-store",
    },
  });
}
