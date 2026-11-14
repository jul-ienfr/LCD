/**
 * T609 — Page voyageur de dépôt d'avis `/avis/[token]`.
 *
 * Accès sans compte via le token voyageur signé HMAC. La signature est
 * vérifiée AVANT toute lecture du payload (règle 11) : `verifierTokenVoyageur`
 * retourne `null` sur toute anomalie. Route HTML-first, sans JS obligatoire
 * (`csr = false`, règle 3).
 */
import { isRedirect, redirect } from "@sveltejs/kit";
import {
  DeposerAvisVoyageur,
  InviterAvisVoyageur,
} from "@/application/use-cases/gerer-avis-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleAvisVoyageurRepository } from "@/infrastructure/db/repositories/avis-voyageur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { verifierTokenVoyageur } from "@/lib/voyageur-token";
import type { Actions, PageServerLoad } from "./$types";

export const csr = false;

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async ({ params, url }) => {
  // Règle 11 : vérifier la signature HMAC AVANT toute lecture du payload.
  const payload = verifierTokenVoyageur(params.token);
  if (!payload) return { indisponible: "invalide" as const };

  const reservation = await new DrizzleReservationRepository().trouverParId(
    payload.tenantId,
    payload.reservationId,
  );
  if (!reservation || reservation.logementId !== payload.logementId) {
    return { indisponible: "reservation" as const };
  }

  const avisRepo = new DrizzleAvisVoyageurRepository();
  let avis = await avisRepo.trouverParReservation(
    payload.tenantId,
    reservation.id,
  );

  // L'invitation est normalement créée par le planificateur à J+1 ; on la crée
  // à la volée si le lien est ouvert avant, sans jamais bloquer le voyageur.
  if (!avis) {
    const { avis: cree } = await new InviterAvisVoyageur(avisRepo).executer({
      tenantId: payload.tenantId,
      reservationId: reservation.id,
      logementId: reservation.logementId,
      depart: reservation.fin,
    });
    avis = cree;
  }

  const logement = await new DrizzleLogementRepository().trouverParId(
    payload.tenantId,
    reservation.logementId,
  );

  return {
    indisponible: null,
    token: params.token,
    logementNom: logement?.nom ?? null,
    voyageur: reservation.clientNom,
    dejaDepose: avis.statut !== "invite",
    note: avis.note,
    commentaire: avis.commentaire,
    ok: url.searchParams.get("ok") === "1",
    erreur: url.searchParams.get("erreur"),
  };
};

export const actions: Actions = {
  deposer: async ({ params, request }) => {
    const payload = verifierTokenVoyageur(params.token);
    if (!payload) redirect(303, "/avis/invalide");

    const donnees = await request.formData();
    const note = Number(texte(donnees, "note"));
    const commentaire = texte(donnees, "commentaire") || null;

    try {
      const avis = await new DeposerAvisVoyageur(
        new DrizzleAvisVoyageurRepository(),
      ).executer({
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
        note,
        commentaire,
      });

      await withTenant(payload.tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId: payload.tenantId,
          qui: "voyageur",
          action: "avis.creer",
          cible: avis.id,
          ref: avis.ref,
          payload: { note: avis.note },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/avis/${encodeURIComponent(params.token)}?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("avis.deposer", error, {
        tenantId: payload.tenantId,
        reservationId: payload.reservationId,
      });
      redirect(
        303,
        `/avis/${encodeURIComponent(params.token)}?erreur=avis`,
      );
    }

    redirect(303, `/avis/${encodeURIComponent(params.token)}?ok=1`);
  },
};
