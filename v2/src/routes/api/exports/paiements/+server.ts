import { joursDuMois, moisCourant, moisValide } from "@/domain/calendrier";
import { LIBELLES_MODE_PAIEMENT } from "@/domain/paiement";
import type { Facture } from "@/domain/facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
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
  const paiements = await new DrizzlePaiementRepository().listerParMois(tenantId, premier, dernier);
  const factures = new Map(
    (
      await Promise.all(
        [...new Set(paiements.map((paiement) => paiement.factureId))]
          .filter((id): id is string => id !== null)
          .map((id) => new DrizzleFactureRepository().trouver(tenantId, id)),
      )
    )
      .filter((facture): facture is Facture => facture !== null)
      .map((facture) => [facture.id, facture]),
  );

  const lignes = [
    ["date_paiement", "facture", "client", "mode", "reference", "montant_eur"],
    ...paiements.map((paiement) => {
      const facture = factures.get(paiement.factureId ?? "");
      return [
        paiement.datePaiement,
        facture?.numero ?? paiement.factureId,
        facture?.clientNom ?? "",
        LIBELLES_MODE_PAIEMENT[paiement.mode],
        paiement.reference ?? paiement.ref,
        euros(paiement.montantCentimes),
      ];
    }),
  ];

  const csv = `\uFEFF${lignes.map((ligne) => ligne.map(celluleCsv).join(";")).join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="paiements-${mois}.csv"`,
      "cache-control": "private, no-store",
    },
  });
};
