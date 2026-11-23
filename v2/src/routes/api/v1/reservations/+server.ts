import type { FiltreReservations } from "@/application/ports/reservation-repository";
import { dateIsoValide } from "@/domain/calendrier";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { authentifierApi, erreurApi } from "@/lib/server/api-auth";
import {
  erreurInterne,
  parametresPagination,
  reponseListePaginee,
} from "@/lib/server/api-v1";
import type { RequestHandler } from "./$types";

/**
 * API v1 — liste des réservations (portée tenant).
 *
 * Filtres (compatibilité historique) :
 *   - `logementId` (optionnel)
 *   - `debut` et/ou `fin` (AAAA-MM-JJ) : séjours chevauchant la plage
 *
 * FR-026 : filtre, tri, `limit` et `offset` sont appliqués en SQL ; le total
 * vient d'un compteur SQL, jamais d'un chargement complet suivi d'un filtre
 * en mémoire.
 */
export const GET: RequestHandler = async ({ request, url, locals }) => {
  const auth = await authentifierApi({ request, url, locals }, "reservations:lire");
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
    const { page, limite } = parametresPagination(url);
    const logementId = url.searchParams.get("logementId")?.trim() || null;
    const filtre: FiltreReservations = {};
    if (logementId) filtre.logementId = logementId;
    if (debut || fin) {
      filtre.periode = {
        debut: debut ?? "0000-01-01",
        fin: fin ?? "9999-12-31",
      };
    }

    const repo = new DrizzleReservationRepository();
    const [reservations, total] = await Promise.all([
      repo.listerPage(auth.cle.tenantId, {
        ...filtre,
        limite,
        decalage: (page - 1) * limite,
        ordre: "debut-asc",
      }),
      repo.compter(auth.cle.tenantId, filtre),
    ]);

    return reponseListePaginee(
      url,
      reservations.map((reservation) => ({
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
      total,
      auth.requestId,
      auth.headers,
    );
  } catch (erreur) {
    return erreurInterne(auth.requestId, auth.headers, erreur);
  }
};
