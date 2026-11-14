/**
 * T512 — Export comptable stable.
 *
 * Journal comptable en partie double (ventes + trésorerie) sur un mois,
 * au format CSV versionné. Le schéma de colonnes est figé dans le domaine
 * (`export-comptable.ts`) : toute rupture passe par une nouvelle version.
 *
 * Accès : rôles staff `admin`, `hote`, `comptable` (+ exigence 2FA commune
 * aux exports). Le tenant vient toujours de la session, jamais du client.
 */
import { joursDuMois, moisCourant, moisValide } from "@/domain/calendrier";
import {
  COLONNES_EXPORT_COMPTABLE,
  VERSION_EXPORT_COMPTABLE,
  construireJournalComptable,
  versCellulesLigne,
} from "@/domain/export-comptable";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { celluleCsv } from "@/lib/csv";
import { tenantIdDeSession, verifierAccesApi } from "@/lib/server/session";
import type { RequestHandler } from "./$types";

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

  const journal = construireJournalComptable({
    factures,
    paiements: paiements.map((paiement) => ({
      ref: paiement.ref,
      datePaiement: paiement.datePaiement,
      montantCentimes: paiement.montantCentimes,
      mode: paiement.mode,
      libelle: paiement.reference ?? null,
    })),
  });

  const lignes = [
    [...COLONNES_EXPORT_COMPTABLE],
    ...journal.map((ligne) => versCellulesLigne(ligne).map(String)),
  ];
  const csv = `\uFEFF${lignes
    .map((ligne) => ligne.map(celluleCsv).join(";"))
    .join("\r\n")}`;
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="comptable-v${VERSION_EXPORT_COMPTABLE}-${mois}.csv"`,
      "cache-control": "private, no-store",
    },
  });
};
