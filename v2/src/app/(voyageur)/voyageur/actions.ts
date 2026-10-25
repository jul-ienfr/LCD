"use server";

import { redirect } from "next/navigation";
import { ErreurMetier } from "@/domain/erreurs";
import { CommanderExtra } from "@/application/use-cases/commander-extra";
import { DeclarerIncident } from "@/application/use-cases/declarer-incident";
import { DrizzleCommandeExtraRepository } from "@/infrastructure/db/repositories/commande-extra-repository";
import { DrizzleExtraRepository } from "@/infrastructure/db/repositories/extra-repository";
import { DrizzleIncidentRepository } from "@/infrastructure/db/repositories/incident-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { langueDepuisParam } from "@/lib/i18n";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function declarerIncidentAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const message = String(formData.get("message") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?incident=erreur&lang=${langue}`);
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
      `/voyageur?t=${encodeURIComponent(token)}&incident=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&incident=ok&lang=${langue}`,
  );
}

export async function commanderExtraAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const extraId = String(formData.get("extraId") ?? "");
  const quantite = Number(formData.get("quantite") ?? 1);
  const ref = String(formData.get("ref") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));

  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect(`/voyageur?extras=erreur&lang=${langue}`);
  }

  try {
    const resultat = await new CommanderExtra(
      new DrizzleCommandeExtraRepository(),
      new DrizzleExtraRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
      extraId,
      quantite,
      ref,
    });

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action: "commande_extra.creer",
        cible: resultat.commande.id,
        ref: resultat.commande.ref,
        payload: { extraId, quantite, totalCentimes: resultat.commande.totalCentimes },
      }),
    );
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("commanderExtraAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(
      `/voyageur?t=${encodeURIComponent(token)}&extras=erreur&lang=${langue}`,
    );
  }

  redirect(
    `/voyageur?t=${encodeURIComponent(token)}&extras=ok&lang=${langue}`,
  );
}
