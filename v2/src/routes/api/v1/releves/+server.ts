import { moisValide } from "@/domain/calendrier";
import { DrizzleRelevesProprietairesRepository } from "@/infrastructure/db/repositories/releves-repository";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import { erreurInterne, reponseListe } from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "releves:lire");
  if (!auth.ok) return auth.reponse;

  const moisDebut = url.searchParams.get("moisDebut")?.trim() || undefined;
  const moisFin = url.searchParams.get("moisFin")?.trim() || undefined;
  if (moisDebut && !moisValide(moisDebut)) {
    return erreurApi(
      400,
      "parametre_invalide",
      "Paramètre « moisDebut » au format AAAA-MM requis.",
      auth.requestId,
      auth.headers,
    );
  }
  if (moisFin && !moisValide(moisFin)) {
    return erreurApi(
      400,
      "parametre_invalide",
      "Paramètre « moisFin » au format AAAA-MM requis.",
      auth.requestId,
      auth.headers,
    );
  }

  try {
    const releves =
      await new DrizzleRelevesProprietairesRepository().listerParTenant(
        auth.cle.tenantId,
        { moisDebut, moisFin },
      );
    return reponseListe(
      url,
      releves.map((releve) => ({
        id: releve.id,
        proprietaireId: releve.proprietaireId,
        proprietaireNom: releve.proprietaireNom,
        moisDebut: releve.moisDebut,
        moisFin: releve.moisFin,
        periode: releve.periode,
        totalCaCentimes: releve.totalCaCentimes,
        totalCommissionCentimes: releve.totalCommissionCentimes,
        totalChargesCentimes: releve.totalChargesCentimes,
        totalNetCentimes: releve.totalNetCentimes,
        genereAt: releve.genereAt,
      })),
      auth.requestId,
      auth.headers,
    );
  } catch (erreur) {
    return erreurInterne(auth.requestId, auth.headers, erreur);
  }
};
