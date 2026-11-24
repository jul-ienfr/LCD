import { isRedirect, redirect } from "@sveltejs/kit";
import { echecSaisie } from "@/lib/server/saisie";
import {
  EnregistrerParametresFiscaux,
  ObtenirParametresFiscaux,
} from "@/application/use-cases/parametres-fiscaux";
import { ErreurMetier } from "@/domain/erreurs";
import { formaterTauxTva } from "@/domain/fiscal";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { traductionsCompta } from "@/lib/i18n-compta";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";
import { langueRequete } from "@/lib/server/langue";

function euros(centimes: number | null): string {
  return centimes === null ? "" : (centimes / 100).toFixed(2).replace(".", ",");
}

function centimesOuNull(valeur: FormDataEntryValue | null): number | null {
  const texte = String(valeur ?? "").trim();
  return texte ? centimesDepuisSaisie(texte) : null;
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);
  const parametres = await new ObtenirParametresFiscaux(
    new DrizzleParametresFiscauxRepository(),
  ).executer(tenantId);
  const langue = langueRequete(event);

  return {
    langue,
    t: traductionsCompta(langue),
    parametres: {
      ...parametres,
      tauxTvaSaisie: (parametres.tauxTvaBp / 100).toString().replace(".", ","),
      tauxTvaLibelle: formaterTauxTva(parametres.tauxTvaBp),
      taxeSaisie: euros(parametres.taxeSejourNuitPersonneCentimes),
      plafondSaisie: euros(parametres.taxeSejourPlafondCentimes),
      taxeLibelle: formaterEuros(parametres.taxeSejourNuitPersonneCentimes),
      plafondLibelle:
        parametres.taxeSejourPlafondCentimes === null
          ? "sans plafond"
          : `plafond ${formaterEuros(parametres.taxeSejourPlafondCentimes)}`,
    },
    ok: event.url.searchParams.get("ok") === "1",
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote", "comptable"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const tauxSaisie = String(donnees.get("tauxTva") ?? "").trim().replace(",", ".");
    const taux = Number(tauxSaisie);

    if (!tauxSaisie || !Number.isFinite(taux)) {
      return echecSaisie(donnees, "taux");
    }
    const taxeCentimes = centimesOuNull(donnees.get("taxeNuitEuros"));
    if (taxeCentimes === null) {
      return echecSaisie(donnees, "taxe");
    }
    const plafondTexte = String(donnees.get("plafondEuros") ?? "").trim();
    const plafondCentimes = plafondTexte ? centimesDepuisSaisie(plafondTexte) : null;
    if (plafondTexte && plafondCentimes === null) {
      return echecSaisie(donnees, "plafond");
    }

    try {
      const parametres = await new EnregistrerParametresFiscaux(
        new DrizzleParametresFiscauxRepository(),
      ).executer({
        tenantId,
        tauxTvaBp: Math.round(taux * 100),
        taxeSejourNuitPersonneCentimes: taxeCentimes,
        taxeSejourPlafondCentimes: plafondCentimes,
        prefixeFacture: String(donnees.get("prefixeFacture") ?? "FAC"),
        mentionsLegales: String(donnees.get("mentionsLegales") ?? ""),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "fiscalite.parametres",
          cible: tenantId,
          ref: parametres.prefixeFacture,
          payload: {
            tauxTvaBp: parametres.tauxTvaBp,
            taxeSejourNuitPersonneCentimes: parametres.taxeSejourNuitPersonneCentimes,
            taxeSejourPlafondCentimes: parametres.taxeSejourPlafondCentimes,
          },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return echecSaisie(donnees, error.message);
      }
      logErreur("fiscalite.enregistrer", error, { tenantId });
      return echecSaisie(donnees, "inattendu", { statut: 500 });
    }

    redirect(303, "/hote/compta/parametres?ok=1");
  },
} satisfies Actions;
