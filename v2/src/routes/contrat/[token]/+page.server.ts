import { construireContrat } from "@/domain/contrat";
import { DrizzleCautionRepository } from "@/infrastructure/db/repositories/caution-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params }) => {
  const payload = verifierTokenVoyageur(params.token);
  if (!payload) return { indisponible: "invalide" as const };

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return { indisponible: "reservation" as const };
  }

  const [logement, tenant, caution] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      reservation.logementId,
    ),
    new DrizzleTenantRepository().trouver(payload.tenantId),
    new DrizzleCautionRepository().trouverParReservation(
      payload.tenantId,
      reservation.id,
    ),
  ]);
  if (!logement || !tenant) return { indisponible: "logement" as const };

  const contrat = construireContrat({
    refReservation: reservation.ref,
    hoteNom: tenant.nom,
    hoteAdresse: tenant.adresse,
    voyageurNom: reservation.clientNom,
    voyageurEmail: reservation.clientEmail,
    logementNom: logement.nom,
    logementAdresse: logement.adresse,
    debut: reservation.debut,
    fin: reservation.fin,
    voyageurs: reservation.voyageurs,
    montantCentimes: reservation.montantCentimes,
    cautionCentimes: caution?.montantCentimes ?? null,
  });

  return { indisponible: null, contrat };
};
