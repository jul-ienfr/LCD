import { isRedirect, redirect } from "@sveltejs/kit";
import {
  DesactiverLieuTourisme,
  EnregistrerLieuTourisme,
  ListerLieuxTourisme,
} from "@/application/use-cases/tourisme";
import { ErreurMetier } from "@/domain/erreurs";
import { CATEGORIES_LIEU } from "@/domain/tourisme";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLieuxTourismeRepository } from "@/infrastructure/db/repositories/lieux-tourisme-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(suffixe: string): never {
  redirect(303, `/hote/tourisme?${suffixe}`);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logementId = logements[0]?.id ?? "";
  const lieux = logementId
    ? await new ListerLieuxTourisme(new DrizzleLieuxTourismeRepository()).executer(
        tenantId,
        logementId,
        { inclureInactifs: true },
      )
    : [];
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    langue,
    logements: logements.map((logement) => ({ id: logement.id, nom: logement.nom })),
    lieux: lieux.map((lieu) => ({
      id: lieu.id,
      slug: lieu.slug,
      nom: lieu.nom,
      categorie: lieu.categorie,
      commune: lieu.commune,
      acces: lieu.acces,
      prix: lieu.prixIndicatif,
      extraId: lieu.extraId,
      lien: lieu.lien,
      actif: lieu.actif,
    })),
    categories: CATEGORIES_LIEU.map((categorie) => ({ id: categorie })),
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const slug = texte(donnees, "slug");

    try {
      await new EnregistrerLieuTourisme(new DrizzleLieuxTourismeRepository()).executer({
        tenantId,
        logementId: texte(donnees, "logementId") || null,
        slug,
        nom: texte(donnees, "nom"),
        categorie: texte(donnees, "categorie"),
        commune: texte(donnees, "commune") || null,
        acces: texte(donnees, "acces") || null,
        prixIndicatif: texte(donnees, "prixIndicatif") || null,
        lien: texte(donnees, "lien") || null,
        mode: texte(donnees, "mode") || null,
        extraId: texte(donnees, "extraId") || null,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "tourisme.enregistrer",
          cible: slug,
          payload: { logementId: texte(donnees, "logementId") || null },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(`erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("tourisme.enregistrer", error, { tenantId });
      retour("erreur=inattendu");
    }

    retour("ok=enregistre");
  },

  desactiver: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const slug = texte(donnees, "slug");

    try {
      await new DesactiverLieuTourisme(
        new DrizzleLieuxTourismeRepository(),
      ).executer(tenantId, slug);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "tourisme.desactiver",
          cible: slug,
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("tourisme.desactiver", error, { tenantId });
      retour("erreur=inattendu");
    }

    retour("ok=desactive");
  },
} satisfies Actions;
