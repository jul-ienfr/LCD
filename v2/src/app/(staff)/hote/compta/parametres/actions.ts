"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { EnregistrerParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatParametresFiscaux = { ok: boolean; message: string };

function centimesOuNull(valeur: FormDataEntryValue | null): number | null {
  const texte = String(valeur ?? "").trim();
  if (!texte) return null;
  return centimesDepuisSaisie(texte);
}

export async function enregistrerParametresFiscauxAction(
  _etat: EtatParametresFiscaux,
  formData: FormData,
): Promise<EtatParametresFiscaux> {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const tauxSaisie = String(formData.get("tauxTva") ?? "")
    .trim()
    .replace(",", ".");
  const taux = Number(tauxSaisie);
  if (!tauxSaisie || !Number.isFinite(taux)) {
    return { ok: false, message: "Taux de TVA invalide (ex. 10 ou 5,5)." };
  }
  const tauxTvaBp = Math.round(taux * 100);

  const taxeCentimes = centimesOuNull(formData.get("taxeNuitEuros"));
  if (taxeCentimes === null) {
    return {
      ok: false,
      message: "Taxe de séjour invalide (ex. 1,50 ; 0 pour aucune taxe).",
    };
  }

  const plafondTexte = String(formData.get("plafondEuros") ?? "").trim();
  const plafondCentimes = plafondTexte
    ? centimesDepuisSaisie(plafondTexte)
    : null;
  if (plafondTexte && plafondCentimes === null) {
    return { ok: false, message: "Plafond invalide (ex. 4,20)." };
  }

  try {
    const parametres = await new EnregistrerParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer({
      tenantId,
      tauxTvaBp,
      taxeSejourNuitPersonneCentimes: taxeCentimes,
      taxeSejourPlafondCentimes: plafondCentimes,
      prefixeFacture: String(formData.get("prefixeFacture") ?? "FAC"),
      mentionsLegales: String(formData.get("mentionsLegales") ?? ""),
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
          taxeSejourNuitPersonneCentimes:
            parametres.taxeSejourNuitPersonneCentimes,
          taxeSejourPlafondCentimes:
            parametres.taxeSejourPlafondCentimes,
        },
      }),
    );

    revalidatePath("/hote/compta/parametres");
    revalidatePath("/hote/factures");
    revalidatePath("/hote/compta");
    return {
      ok: true,
      message: "Paramètres fiscaux enregistrés.",
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("enregistrerParametresFiscauxAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
