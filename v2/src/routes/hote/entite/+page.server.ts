import { isRedirect, redirect } from "@sveltejs/kit";
import { MettreAJourEntite } from "@/application/use-cases/mettre-a-jour-entite";
import {
  LIBELLES_NATURE,
  LIBELLES_REGIME,
  LIBELLES_TVA,
  NATURES_ENTITE,
  REGIMES_ENTITE,
  TVA_ENTITE,
} from "@/domain/entite";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { traductionsEntite } from "@/lib/i18n-entite";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin"]);
  const tenantId = tenantIdDeSession(session);
  const tenant = await new DrizzleTenantRepository().trouver(tenantId);

  return {
    t: traductionsEntite(event.cookies.get("lcd_langue") ?? "fr"),
    tenant,
    natures: NATURES_ENTITE.map((valeur) => ({ valeur, libelle: LIBELLES_NATURE[valeur] })),
    regimes: REGIMES_ENTITE.map((valeur) => ({ valeur, libelle: LIBELLES_REGIME[valeur] })),
    tvas: TVA_ENTITE.map((valeur) => ({ valeur, libelle: LIBELLES_TVA[valeur] })),
    ok: event.url.searchParams.get("ok") === "1",
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();

    try {
      const entite = await new MettreAJourEntite(
        new DrizzleTenantRepository(),
      ).executer({
        tenantId,
        nom: texte(donnees, "nom"),
        nature: texte(donnees, "nature"),
        regime: texte(donnees, "regime"),
        tva: texte(donnees, "tva"),
        siren: texte(donnees, "siren"),
        adresse: texte(donnees, "adresse"),
        mentionsLegales: texte(donnees, "mentionsLegales"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "entite.mettre_a_jour",
          cible: entite.id,
          payload: {
            nature: entite.nature,
            regime: entite.regime,
            tva: entite.tva,
            siren: entite.siren,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/entite?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("entite.enregistrer", error, { tenantId });
      redirect(303, "/hote/entite?erreur=inattendu");
    }

    redirect(303, "/hote/entite?ok=1");
  },
} satisfies Actions;
