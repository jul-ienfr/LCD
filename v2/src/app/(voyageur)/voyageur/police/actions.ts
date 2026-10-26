"use server";

import { redirect } from "next/navigation";
import { EnregistrerFichePolice } from "@/application/use-cases/enregistrer-fiche-police";
import { ErreurMetier } from "@/domain/erreurs";
import { fichesRestantes } from "@/domain/fiche-police";
import { DrizzleFichesPoliceRepository } from "@/infrastructure/db/repositories/fiches-police-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { langueDepuisParam } from "@/lib/i18n";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function enregistrerFichePoliceAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const langue = langueDepuisParam(String(formData.get("langue") ?? "fr"));
  const payload = verifierTokenVoyageur(token);
  if (!payload) {
    redirect("/voyageur?police=erreur");
  }

  const base = `/voyageur/police?t=${encodeURIComponent(token)}&lang=${langue}`;
  const reservations = new DrizzleReservationRepository();
  const fiches = new DrizzleFichesPoliceRepository();

  try {
    const reservation = await reservations.trouverParId(
      payload.tenantId,
      payload.reservationId,
    );
    if (!reservation || reservation.logementId !== payload.logementId) {
      redirect(`${base}&police=erreur`);
    }
    const existantes = await fiches.listerParReservation(
      payload.tenantId,
      reservation.id,
    );
    if (fichesRestantes(reservation.voyageurs, existantes.length) === 0) {
      redirect(`${base}&police=complet`);
    }

    const fiche = await new EnregistrerFichePolice(
      fiches,
      reservations,
    ).executer({
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
      ref: String(formData.get("ref") ?? ""),
      nom: String(formData.get("nom") ?? ""),
      prenoms: String(formData.get("prenoms") ?? ""),
      nationalite: String(formData.get("nationalite") ?? ""),
      dateNaissance: String(formData.get("dateNaissance") ?? ""),
      lieuNaissance: String(formData.get("lieuNaissance") ?? ""),
      domicile: String(formData.get("domicile") ?? ""),
      telephone: String(formData.get("telephone") ?? ""),
      email: String(formData.get("email") ?? ""),
    });

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action: "fiche_police.enregistrer",
        cible: fiche.id,
        ref: fiche.ref,
        payload: { reservationId: fiche.reservationId },
      }),
    );
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("enregistrerFichePoliceAction", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
    }
    redirect(`${base}&police=erreur`);
  }

  redirect(`${base}&police=ok`);
}
