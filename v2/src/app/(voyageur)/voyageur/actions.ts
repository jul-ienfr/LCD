"use server";

import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function declarerIncidentAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const message = String(formData.get("message") ?? "");

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect("/voyageur?incident=erreur");
  }

  try {
    await new DeclarerIncident(
      new DrizzleIncidentRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      logementId: payload.logementId,
      reservationId: payload.reservationId,
      ref,
      message,
    });
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("declarerIncidentAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&incident=erreur`,
    );
  }

  redirect(`/voyageur?t=${encodeURIComponent(token)}&incident=ok`);
}
