import { error, fail, isRedirect, redirect } from "@sveltejs/kit";
import {
  LIBELLES_CANAL_FIL,
  MESSAGE_FIL_MAX,
  type StatutFilInterne,
} from "@/domain/fil-interne";
import { ErreurMetier } from "@/domain/erreurs";
import { GererFilsInternes } from "@/application/use-cases/fils-internes";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFilsInternesRepository } from "@/infrastructure/db/repositories/fils-internes-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsDetails } from "@/lib/i18n-details";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const fil = await new DrizzleFilsInternesRepository().trouver(
    tenantId,
    event.params.id,
  );
  if (!fil) error(404, "Fil introuvable.");

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  return {
    t: traductionsDetails(langue),
    langue,
    fil: {
      ...fil,
      canalLibelle: LIBELLES_CANAL_FIL[fil.canal],
      messages: fil.messages.map((message) => ({
        ...message,
        date: message.createdAt.toLocaleString(langue, { dateStyle: "short", timeStyle: "short" }),
      })),
    },
    messageMax: MESSAGE_FIL_MAX,
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions = {
  repondre: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = event.params.id;
    try {
      const message = await new GererFilsInternes(
        new DrizzleFilsInternesRepository(),
        new DrizzleLogementRepository(),
      ).repondre({
        tenantId,
        filId,
        corps: String(donnees.get("corps") ?? ""),
        auteurEmail: session.user.email ?? "inconnu",
        auteurRole: session.user.role ?? "inconnu",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: "fil.repondre",
          cible: message.id,
          ref: filId,
          payload: { filId },
        }),
      );

      redirect(303, `/hote/fils/${filId}?ok=reponse`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("fils.repondre", error, { tenantId, filId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant l’envoi.",
      });
    }
  },

  basculer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = event.params.id;
    const statutDemande = String(donnees.get("statut") ?? "");
    const statut: StatutFilInterne =
      statutDemande === "ferme" ? "ferme" : "ouvert";
    try {
      await new GererFilsInternes(
        new DrizzleFilsInternesRepository(),
        new DrizzleLogementRepository(),
      ).changerStatut(tenantId, filId, statut);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: statut === "ferme" ? "fil.fermer" : "fil.rouvrir",
          cible: filId,
          ref: filId,
          payload: { statut },
        }),
      );

      redirect(
        303,
        `/hote/fils/${filId}?ok=${statut === "ferme" ? "ferme" : "rouvert"}`,
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("fils.basculer", error, { tenantId, filId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant le changement de statut.",
      });
    }
  },
} satisfies Actions;
