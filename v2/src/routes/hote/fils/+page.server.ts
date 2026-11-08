import { fail, isRedirect, redirect } from "@sveltejs/kit";
import {
  CANAUX_FIL_INTERNE,
  LIBELLES_CANAL_FIL,
  SUJET_FIL_MAX,
  canalFilValide,
} from "@/domain/fil-interne";
import { ErreurMetier } from "@/domain/erreurs";
import { GererFilsInternes } from "@/application/use-cases/fils-internes";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFilsInternesRepository } from "@/infrastructure/db/repositories/fils-internes-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsCommunication } from "@/lib/i18n-communication";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const canalDemande = event.url.searchParams.get("canal") ?? "";
  const canal = canalFilValide(canalDemande) ? canalDemande : undefined;
  const repo = new DrizzleFilsInternesRepository();
  const [fils, logements] = await Promise.all([
    repo.lister(tenantId, canal),
    new DrizzleLogementRepository().listerParTenant(tenantId),
  ]);

  return {
    t: traductionsCommunication(event.cookies.get("lcd_langue") ?? "fr"),
    langue: event.cookies.get("lcd_langue") ?? "fr",
    fils: fils.map((fil) => ({
      ...fil,
      canalLibelle: LIBELLES_CANAL_FIL[fil.canal],
    })),
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
    })),
    canaux: CANAUX_FIL_INTERNE.map((valeur) => ({
      valeur,
      libelle: LIBELLES_CANAL_FIL[valeur],
    })),
    canal: canal ?? null,
    sujetMax: SUJET_FIL_MAX,
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    try {
      const fil = await new GererFilsInternes(
        new DrizzleFilsInternesRepository(),
        new DrizzleLogementRepository(),
      ).creer({
        tenantId,
        logementId: String(donnees.get("logementId") ?? "") || null,
        canal: String(donnees.get("canal") ?? ""),
        sujet: String(donnees.get("sujet") ?? ""),
        auteurEmail: session.user.email ?? "inconnu",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: "fil.creer",
          cible: fil.id,
          ref: fil.sujet,
          payload: { canal: fil.canal, logementId: fil.logementId },
        }),
      );

      redirect(303, `/hote/fils/${fil.id}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("fils.creer", error, { tenantId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant la création du fil.",
      });
    }
  },
} satisfies Actions;
