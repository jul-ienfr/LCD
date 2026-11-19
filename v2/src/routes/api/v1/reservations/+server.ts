import { dateIsoValide } from "@/domain/calendrier";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import { erreurInterne, reponseListe } from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "reservations:lire");
  if (!auth.ok) return auth.reponse;

  const debut = url.searchParams.get("debut")?.trim() || null;
  const fin = url.searchParams.get("fin")?.trim() || null;
  if (debut && !dateIsoValide(debut)) {
    return erreurApi(
      400,
      "parametre_invalide",
      "Paramètre « debut » au format AAAA-MM-JJ requis.",
      auth.requestId,
      auth.headers,
    );
  }
  if (fin && !dateIsoValide(fin)) {
    return erreurApi(
      400,
      "parametre_invalide",
      "Paramètre « fin » au format AAAA-MM-JJ requis.",
      auth.requestId,
      auth.headers,
    );
  }
  if (debut && fin && fin <= debut) {
    return erreurApi(
      400,
      "parametre_invalide",
      "La date de fin doit être postérieure à la date de début.",
      auth.requestId,
      auth.headers,
    );
  }

  try {
    const reservations =
      await new DrizzleReservationRepository().listerTous(auth.cle.tenantId);
    const logementId = url.searchParams.get("logementId")?.trim() || null;
    const filtrees = reservations.filter(
      (reservation) =>
        (!logementId || reservation.logementId === logementId) &&
        (!debut || reservation.fin > debut) &&
        (!fin || reservation.debut < fin),
    );

    return reponseListe(
      url,
      filtrees.map((reservation) => ({
        id: reservation.id,
        ref: reservation.ref,
        logementId: reservation.logementId,
        clientNom: reservation.clientNom,
        debut: reservation.debut,
        fin: reservation.fin,
        statut: reservation.statut,
        montantCentimes: reservation.montantCentimes,
        source: reservation.source,
        updatedAt: reservation.updatedAt.toISOString(),
      })),
      auth.requestId,
      auth.headers,
    );
  } catch (erreur) {
    return erreurInterne(auth.requestId, auth.headers, erreur);
  }
};
