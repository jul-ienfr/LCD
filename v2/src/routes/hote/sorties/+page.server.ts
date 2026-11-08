import { fail, isRedirect, redirect } from "@sveltejs/kit";
import {
  LIBELLES_STATUT_VALIDATION,
  LIBELLES_TYPE_VALIDATION,
  TYPES_SORTIE_ARGENT,
  type TypeSortieArgent,
} from "@/domain/validation-sensible";
import { ErreurMetier } from "@/domain/erreurs";
import { SortiesArgent } from "@/application/use-cases/sorties-argent";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleValidationSensibleRepository } from "@/infrastructure/db/repositories/validation-sensible-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsFinance } from "@/lib/i18n-finance";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, cle: string): string {
  return String(donnees.get(cle) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const sorties = await new DrizzleValidationSensibleRepository().listerParTypes(
    tenantId,
    TYPES_SORTIE_ARGENT,
  );
  const role = session.user.role ?? "";
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    langue,
    t: traductionsFinance(langue),
    moi: session.user.id,
    peutDecider: role === "admin" || role === "comptable",
    types: TYPES_SORTIE_ARGENT.map((valeur) => ({
      valeur,
      libelle: LIBELLES_TYPE_VALIDATION[valeur],
    })),
    sorties: sorties.map((sortie) => ({
      ...sortie,
      typeLibelle: LIBELLES_TYPE_VALIDATION[sortie.type],
      statutLibelle: LIBELLES_STATUT_VALIDATION[sortie.statut],
      montant: formaterEuros(sortie.montantCentimes),
      beneficiaire:
        typeof sortie.payload.beneficiaire === "string"
          ? sortie.payload.beneficiaire
          : "—",
      motif:
        typeof sortie.payload.motif === "string" ? sortie.payload.motif : "",
    })),
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions = {
  demander: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    try {
      const montantCentimes = centimesDepuisSaisie(
        texte(donnees, "montantEuros"),
      );
      if (montantCentimes === null) {
        throw new ErreurMetier(
          "VALIDATION_SENSIBLE_INVALIDE",
          "Le montant est invalide.",
        );
      }
      const validation = await new SortiesArgent(
        new DrizzleValidationSensibleRepository(),
      ).demander({
        tenantId,
        type: texte(donnees, "type") as TypeSortieArgent,
        beneficiaire: texte(donnees, "beneficiaire"),
        montantCentimes,
        motif: texte(donnees, "motif"),
        reference: texte(donnees, "reference"),
        demandeurId: session.user.id,
        demandeurEmail: session.user.email ?? "inconnu",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: "sortie.demander",
          cible: validation.id,
          ref: validation.ref,
          payload: {
            type: validation.type,
            montantCentimes: validation.montantCentimes,
          },
        }),
      );

      redirect(303, "/hote/sorties?ok=demande");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("sorties.demander", error, { tenantId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant la demande.",
      });
    }
  },

  decider: async (event) => {
    const session = requireRole(event, ["admin", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const validationId = texte(donnees, "validationId");
    const decision = texte(donnees, "decision");
    const motifDecision = texte(donnees, "motifDecision").slice(0, 500) || null;
    if (decision !== "approuvee" && decision !== "rejetee") {
      return fail(400, { ok: false, message: "Décision invalide." });
    }

    try {
      const validation = await new SortiesArgent(
        new DrizzleValidationSensibleRepository(),
      ).decider({
        tenantId,
        validationId,
        decision,
        decideurId: session.user.id,
        decideurEmail: session.user.email ?? "inconnu",
        motifDecision,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: decision === "approuvee" ? "sortie.approuver" : "sortie.rejeter",
          cible: validationId,
          ref: validation.ref,
          payload: { montantCentimes: validation.montantCentimes },
        }),
      );

      redirect(303, "/hote/sorties?ok=decide");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("sorties.decider", error, { tenantId, validationId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant la décision.",
      });
    }
  },

  payer: async (event) => {
    const session = requireRole(event, ["admin", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const validationId = texte(donnees, "validationId");
    try {
      const validation = await new SortiesArgent(
        new DrizzleValidationSensibleRepository(),
      ).payer({
        tenantId,
        validationId,
        acteurId: session.user.id,
        acteurEmail: session.user.email ?? "inconnu",
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "inconnu",
          action: "sortie.payer",
          cible: validationId,
          ref: validation.ref,
          payload: { montantCentimes: validation.montantCentimes },
        }),
      );

      redirect(303, "/hote/sorties?ok=paye");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("sorties.payer", error, { tenantId, validationId });
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant le marquage payé.",
      });
    }
  },
} satisfies Actions;
