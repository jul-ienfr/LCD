import { dateIsoValide, nuitsEntre } from "@/domain/calendrier";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import {
  dateRequise,
  erreurInterne,
  parametreRequis,
  reponseListe,
} from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "prix:lire");
  if (!auth.ok) return auth.reponse;

  const logementId = parametreRequis(
    url,
    "logementId",
    auth.requestId,
    auth.headers,
    100,
  );
  if (logementId instanceof Response) return logementId;
  const debut = dateRequise(
    url,
    "debut",
    auth.requestId,
    auth.headers,
    dateIsoValide,
  );
  if (debut instanceof Response) return debut;
  const fin = dateRequise(url, "fin", auth.requestId, auth.headers, dateIsoValide);
  if (fin instanceof Response) return fin;
  if (nuitsEntre(debut, fin) <= 0) {
    return erreurApi(
      400,
      "parametre_invalide",
      "La date de fin doit être postérieure à la date de début.",
      auth.requestId,
      auth.headers,
    );
  }

  try {
    const tarifs = await new DrizzleTarifRepository().listerParMois(
      auth.cle.tenantId,
      logementId,
      debut,
      fin,
      url.searchParams.get("planTarifaireId")?.trim() || undefined,
    );
    return reponseListe(
      url,
      tarifs.map((tarif) => ({
        date: tarif.date,
        logementId: tarif.logementId,
        prixCentimes: tarif.prixCentimes,
        prixParPersonneCentimes: tarif.prixParPersonneCentimes,
        personnesIncluses: tarif.personnesIncluses,
        source: tarif.source,
      })),
      auth.requestId,
      auth.headers,
    );
  } catch {
    return erreurInterne(auth.requestId, auth.headers);
  }
};
