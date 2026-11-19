import { ajouterJours, dateIsoValide, nuitsEntre } from "@/domain/calendrier";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import {
  dateRequise,
  erreurInterne,
  parametreRequis,
  reponseObjet,
} from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

const FENETRE_MAX_JOURS = 366;

export const GET: RequestHandler = async ({ request, url }) => {
  const auth = await authentifierApi({ request, url }, "disponibilites:lire");
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

  const nuits = nuitsEntre(debut, fin);
  if (nuits <= 0 || nuits > FENETRE_MAX_JOURS) {
    return erreurApi(
      400,
      "parametre_invalide",
      `La fenêtre doit couvrir de 1 à ${FENETRE_MAX_JOURS} nuits.`,
      auth.requestId,
      auth.headers,
    );
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      auth.cle.tenantId,
      logementId,
    );
    if (!logement) {
      return erreurApi(
        404,
        "introuvable",
        "Logement introuvable.",
        auth.requestId,
        auth.headers,
      );
    }

    const reservations =
      await new DrizzleReservationRepository().listerTous(auth.cle.tenantId);
    const occupants = reservations.filter(
      (reservation) =>
        reservation.logementId === logementId &&
        reservation.statut !== "annulee" &&
        reservation.fin > debut &&
        reservation.debut < fin,
    );

    const jours: { date: string; disponible: boolean }[] = [];
    for (let date = debut; date < fin; date = ajouterJours(date, 1)) {
      const occupe = occupants.some(
        (reservation) =>
          reservation.debut <= date && date < reservation.fin,
      );
      jours.push({ date, disponible: !occupe });
    }

    return reponseObjet(
      { logementId, debut, fin, jours },
      auth.requestId,
      auth.headers,
    );
  } catch (erreur) {
    return erreurInterne(auth.requestId, auth.headers, erreur);
  }
};
