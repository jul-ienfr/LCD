"use server";

import { redirect } from "next/navigation";
import { DeposerQuestionnaire } from "@/application/use-cases/questionnaire";
import { ErreurMetier } from "@/domain/erreurs";
import {
  CRITERES_QUESTIONNAIRE,
  moyenneQuestionnaire,
  type CritereQuestionnaire,
} from "@/domain/questionnaire";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleQuestionnairesRepository } from "@/infrastructure/db/repositories/questionnaires-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";

export async function deposerQuestionnaireAction(formData: FormData) {
  const token = String(formData.get("token") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const commentaire = String(formData.get("commentaire") ?? "");
  const payload = verifierTokenVoyageur(token);
  const retour = (suffixe: string) =>
    `/questionnaire/${encodeURIComponent(token)}?${suffixe}`;

  if (!payload) redirect("/questionnaire/invalide?erreur=lien");

  const notes: Partial<Record<CritereQuestionnaire, number>> = {};
  for (const critere of CRITERES_QUESTIONNAIRE) {
    notes[critere] = Number(formData.get(`note-${critere}`) ?? 0);
  }

  let suffixe = "ok=1";
  try {
    const questionnaire = await new DeposerQuestionnaire(
      new DrizzleQuestionnairesRepository(),
      new DrizzleReservationRepository(),
    ).executer({
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
      ref,
      notes,
      commentaire,
    });

    await withTenant(payload.tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: payload.tenantId,
        qui: "voyageur",
        action: "questionnaire.deposer",
        cible: questionnaire.id,
        ref: questionnaire.ref,
        payload: {
          moyenne: moyenneQuestionnaire(questionnaire),
          deja: questionnaire.ref !== ref,
        },
      }),
    );

    suffixe = questionnaire.ref === ref ? "ok=1" : "deja=1";
  } catch (error) {
    if (error instanceof ErreurMetier) {
      redirect(retour(`erreur=${encodeURIComponent(error.message)}`));
    }
    logErreur("deposerQuestionnaireAction", error, {
      tenantId: payload.tenantId,
      reservationId: payload.reservationId,
    });
    redirect(retour("erreur=inattendu"));
  }

  redirect(retour(suffixe));
}
