import { isRedirect, redirect } from "@sveltejs/kit";
import { EnregistrerFormation } from "@/application/use-cases/formation";
import { ErreurMetier } from "@/domain/erreurs";
import {
  avancementFormation,
  avancementGlobal,
  moduleParCode,
  MODULES_FORMATION,
} from "@/domain/formation";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFormationsRepository } from "@/infrastructure/db/repositories/formations-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsConformite } from "@/lib/i18n-conformite";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const progressions = await new DrizzleFormationsRepository().listerParUtilisateur(
    tenantId,
    session.user.id,
  );
  const globale = avancementGlobal(progressions);

  return {
    t: traductionsConformite(event.cookies.get("lcd_langue") ?? "fr"),
    globale,
    modules: MODULES_FORMATION.map((module) => {
      const progression = progressions.find((entree) => entree.moduleCode === module.code);
      const avancement = avancementFormation(module, progression?.etapesFaites ?? []);
      return {
        code: module.code,
        titre: module.titre,
        description: module.description,
        avancement,
        etapes: module.etapes.map((etape) => ({
          code: etape.code,
          titre: etape.titre,
          detail: etape.detail,
          fait: progression?.etapesFaites.includes(etape.code) ?? false,
        })),
      };
    }),
    ok: event.url.searchParams.get("ok") === "1",
    module: event.url.searchParams.get("module"),
    pourcentage: event.url.searchParams.get("p"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const moduleCode = String(donnees.get("moduleCode") ?? "");
    let pourcentage = 0;

    try {
      const moduleFormation = moduleParCode(moduleCode);
      const etapesFaites = MODULES_FORMATION.flatMap((module) =>
        module.code === moduleCode
          ? module.etapes
              .filter((etape) => donnees.get(`etape-${etape.code}`) === "on")
              .map((etape) => etape.code)
          : [],
      );

      const progression = await new EnregistrerFormation(
        new DrizzleFormationsRepository(),
      ).executer({ tenantId, userId: session.user.id, moduleCode, etapesFaites });
      pourcentage = moduleFormation
        ? avancementFormation(moduleFormation, progression.etapesFaites).pourcentage
        : 0;

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "formation.enregistrer",
          cible: moduleCode,
          payload: { moduleCode, pourcentage },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/formation?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("formation.enregistrer", error, { tenantId, moduleCode });
      redirect(303, "/hote/formation?erreur=inattendu");
    }

    redirect(303, `/hote/formation?ok=1&module=${encodeURIComponent(moduleCode)}&p=${pourcentage}`);
  },
} satisfies Actions;
