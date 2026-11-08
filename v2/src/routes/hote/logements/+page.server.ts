import { fail } from "@sveltejs/kit";
import { CreerLogement } from "@/application/use-cases/creer-logement";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { traductionsLogements } from "@/lib/i18n-logements";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const tous = event.url.searchParams.get("tous") === "1";
  const logements = (
    await new DrizzleLogementRepository().listerParTenant(tenantId)
  ).filter((logement) => tous || logement.statut !== "archive");

  return {
    langue: event.cookies.get("lcd_langue") ?? "fr",
    tenantId,
    tous,
    logements: logements.map((logement) => ({
      id: logement.id,
      code: logement.code,
      nom: logement.nom,
      adresse: logement.adresse ?? null,
      statut: logement.statut,
      publication: logement.publication,
      coproVerifiee: logement.coproVerifiee,
    })),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const code = String(donnees.get("code") ?? "");
    const nom = String(donnees.get("nom") ?? "");
    const adresse = String(donnees.get("adresse") ?? "");

    try {
      const logement = await new CreerLogement(
        new DrizzleLogementRepository(),
      ).executer({ tenantId, code, nom, adresse });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "logement.creer",
          cible: logement.id,
          ref: logement.code,
          payload: { code: logement.code, nom: logement.nom },
        }),
      );
      const t = traductionsLogements(event.cookies.get("lcd_langue") ?? "fr");
      return {
        ok: true,
        message: t.cree(logement.code),
        code: "",
        nom: "",
        adresse: "",
      };
    } catch (error) {
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message, code, nom, adresse });
      }
      logErreur("logements.creer", error, { tenantId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue. Réessayez.",
        code,
        nom,
        adresse,
      });
    }
  },
} satisfies Actions;
