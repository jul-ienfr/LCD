import { authentifierApi } from "@/lib/server/api-auth";
import { erreurInterne, reponseListe } from "@/lib/server/api-v1";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "logements:lire");
  if (!auth.ok) return auth.reponse;

  try {
    const logements = await new DrizzleLogementRepository().listerParTenant(
      auth.cle.tenantId,
    );
    return reponseListe(
      url,
      logements.map((logement) => ({
        id: logement.id,
        code: logement.code,
        nom: logement.nom,
        adresse: logement.adresse ?? null,
        statut: logement.statut,
        publication: logement.publication,
        coproVerifiee: logement.coproVerifiee,
        strategiePrix: logement.strategiePrix,
        updatedAt: logement.updatedAt.toISOString(),
      })),
      auth.requestId,
      auth.headers,
    );
  } catch {
    return erreurInterne(auth.requestId, auth.headers);
  }
};
