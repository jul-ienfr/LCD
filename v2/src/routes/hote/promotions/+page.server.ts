import { isRedirect, redirect } from "@sveltejs/kit";
import { CreerPromotion } from "@/application/use-cases/creer-promotion";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePromotionsRepository } from "@/infrastructure/db/repositories/promotions-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsDetails } from "@/lib/i18n-details";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function nombre(donnees: FormData, nom: string): number | null {
  const brut = texte(donnees, nom);
  if (!brut) return null;
  const valeur = Number(brut);
  return Number.isFinite(valeur) ? valeur : null;
}

function dateOuNull(donnees: FormData, nom: string): Date | null {
  const brut = texte(donnees, nom);
  if (!brut) return null;
  const date = new Date(`${brut}T00:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const promotions = await new DrizzlePromotionsRepository().listerParTenant(
    tenantId,
  );
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );

  return {
    t: traductionsDetails(event.cookies.get("lcd_langue") ?? "fr"),
    promotions: promotions.map((promotion) => ({
      id: promotion.id,
      code: promotion.code,
      type: promotion.type,
      valeur: promotion.valeur,
      valeurAffichee:
        promotion.type === "pourcentage"
          ? `${promotion.valeur} %`
          : formaterEuros(promotion.valeur),
      conditions: promotion.conditions,
      actif: promotion.actif,
      debut: promotion.debutAt?.toISOString().slice(0, 10) ?? "",
      fin: promotion.finAt?.toISOString().slice(0, 10) ?? "",
    })),
    logements: logements.map((logement) => ({
      id: logement.id,
      nom: logement.nom,
    })),
    erreur: event.url.searchParams.get("erreur"),
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions: Actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();

    const type = texte(donnees, "type") === "montant" ? "montant" : "pourcentage";
    const valeurBrute = texte(donnees, "valeur");
    const valeur =
      type === "montant"
        ? (centimesDepuisSaisie(valeurBrute) ?? 0)
        : Math.round(Number(valeurBrute));

    try {
      const promotion = await new CreerPromotion(
        new DrizzlePromotionsRepository(),
      ).executer({
        tenantId,
        code: texte(donnees, "code"),
        type,
        valeur,
        minNuits: nombre(donnees, "minNuits"),
        maxNuits: nombre(donnees, "maxNuits"),
        minMontantCentimes: texte(donnees, "minMontantEuros")
          ? centimesDepuisSaisie(texte(donnees, "minMontantEuros"))
          : null,
        logementId: texte(donnees, "logementId") || null,
        debutAt: dateOuNull(donnees, "debut"),
        finAt: dateOuNull(donnees, "fin"),
        actif: texte(donnees, "actif") !== "0",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "promotion.creer",
          cible: promotion.id,
          ref: promotion.code,
          payload: {
            type: promotion.type,
            valeur: promotion.valeur,
            conditions: promotion.conditions,
          },
        }),
      );
      redirect(303, `/hote/promotions?ok=${encodeURIComponent(promotion.code)}`);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(
          303,
          `/hote/promotions?erreur=${encodeURIComponent(error.message)}`,
        );
      }
      logErreur("promotions.creer", error, { tenantId });
      redirect(303, "/hote/promotions?erreur=promotion");
    }
  },

  basculer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const id = texte(donnees, "id");
    const actif = texte(donnees, "actif") === "1";

    try {
      const promotion = await new DrizzlePromotionsRepository().basculerActif(
        tenantId,
        id,
        actif,
      );
      if (!promotion) {
        redirect(303, "/hote/promotions?erreur=promotion");
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "promotion.basculer",
          cible: promotion.id,
          ref: promotion.code,
          payload: { actif: promotion.actif },
        }),
      );
      redirect(303, "/hote/promotions?ok=statut");
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("promotions.basculer", error, { tenantId, id });
      redirect(303, "/hote/promotions?erreur=promotion");
    }
  },
};
