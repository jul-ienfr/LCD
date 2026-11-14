import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { authentifierApi } from "@/lib/server/api-auth";
import { erreurInterne, reponseListe } from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "proprietaires:lire");
  if (!auth.ok) return auth.reponse;

  try {
    const [proprietaires, assignations] = await Promise.all([
      new DrizzleUserRepository().listerParRole(
        auth.cle.tenantId,
        "proprietaire",
      ),
      new DrizzleLogementProprietaireRepository().listerAssignations(
        auth.cle.tenantId,
      ),
    ]);

    const logementsParProprietaire = new Map<string, string[]>();
    for (const assignation of assignations) {
      const liste = logementsParProprietaire.get(assignation.userId) ?? [];
      liste.push(assignation.logementId);
      logementsParProprietaire.set(assignation.userId, liste);
    }

    return reponseListe(
      url,
      proprietaires.map((proprietaire) => ({
        id: proprietaire.id,
        nom: proprietaire.name,
        email: proprietaire.email,
        logementIds: logementsParProprietaire.get(proprietaire.id) ?? [],
      })),
      auth.requestId,
      auth.headers,
    );
  } catch {
    return erreurInterne(auth.requestId, auth.headers);
  }
};
