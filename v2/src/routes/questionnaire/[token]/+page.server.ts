import { isRedirect, redirect } from "@sveltejs/kit";
import { DeposerQuestionnaire } from "@/application/use-cases/questionnaire";
import { ErreurMetier } from "@/domain/erreurs";
import {
  CRITERES_QUESTIONNAIRE,
  LIBELLES_CRITERE,
  moyenneQuestionnaire,
  type CritereQuestionnaire,
} from "@/domain/questionnaire";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleQuestionnairesRepository } from "@/infrastructure/db/repositories/questionnaires-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

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

  const existant =
    await new DrizzleQuestionnairesRepository().trouverParReservation(
      payload.tenantId,
      reservation.id,
    );

  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    reservation.logementId,
  );

  return {
    indisponible: null,
    token: params.token,
    logementNom: logement?.nom ?? null,
    reservation: {
      debut: reservation.debut,
      fin: reservation.fin,
      voyageurs: reservation.voyageurs,
    },
    criteres: CRITERES_QUESTIONNAIRE.map((critere) => ({
      id: critere,
      label: LIBELLES_CRITERE[critere],
    })),
    existant: existant
      ? {
          notes: existant.notes,
          commentaire: existant.commentaire,
          moyenne: moyenneQuestionnaire(existant),
        }
      : null,
    ref: crypto.randomUUID(),
  };
};

export const actions = {
  default: async ({ params, request }) => {
    const donnees = await request.formData();
    const payload = verifierTokenVoyageur(params.token);
    if (!payload) redirect(303, "/questionnaire/invalide?erreur=lien");

    const ref = String(donnees.get("ref") ?? "");
    const notes: Partial<Record<CritereQuestionnaire, number>> = {};
    for (const critere of CRITERES_QUESTIONNAIRE) {
      notes[critere] = Number(donnees.get(`note-${critere}`) ?? 0);
    }

    const retour = (suffixe: string): never =>
      redirect(
        303,
        `/questionnaire/${encodeURIComponent(params.token)}?${suffixe}`,
      );

    try {
      const questionnaire = await new DeposerQuestionnaire(
        new DrizzleQuestionnairesRepository(),
        new DrizzleReservationRepository(),
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        ref,
        notes,
        commentaire: String(donnees.get("commentaire") ?? ""),
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

      retour(questionnaire.ref === ref ? "ok=1" : "deja=1");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(`erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("questionnaire.deposer", error, {
        tenantId: payload.tenantId,
      });
      retour("erreur=inattendu");
    }
  },
} satisfies Actions;
