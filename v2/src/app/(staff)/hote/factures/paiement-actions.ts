"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { ModePaiement } from "@/domain/paiement";
import { EnregistrerPaiement } from "@/application/use-cases/enregistrer-paiement";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie, formaterEuros } from "@/lib/format";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatPaiement = { ok: boolean; message: string };

export async function enregistrerPaiementAction(
  _etat: EtatPaiement,
  formData: FormData,
): Promise<EtatPaiement> {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const factureId = String(formData.get("factureId") ?? "");
  const ref = String(formData.get("ref") ?? "");
  const montantCentimes = centimesDepuisSaisie(
    String(formData.get("montantEuros") ?? ""),
  );
  const mode = String(formData.get("mode") ?? "virement") as ModePaiement;
  const datePaiement = String(formData.get("datePaiement") ?? "");
  const reference = String(formData.get("reference") ?? "");
  const notes = String(formData.get("notes") ?? "");

  if (!factureId) {
    return { ok: false, message: "Facture introuvable." };
  }
  if (montantCentimes === null || montantCentimes <= 0) {
    return { ok: false, message: "Montant invalide (ex. 120 ou 120,50)." };
  }

  try {
    const resultat = await new EnregistrerPaiement(
      new DrizzlePaiementRepository(),
      new DrizzleFactureRepository(),
    ).executer({
      tenantId,
      factureId,
      ref,
      montantCentimes,
      mode,
      datePaiement,
      reference,
      notes,
    });

    if (resultat.cree) {
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "paiement.creer",
          cible: resultat.paiement.id,
          ref: resultat.paiement.ref,
          payload: {
            factureId,
            montantCentimes: resultat.paiement.montantCentimes,
            mode: resultat.paiement.mode,
            resteCentimes: resultat.resteCentimes,
          },
        }),
      );
    }

    revalidatePath(`/hote/factures/${factureId}`);
    revalidatePath("/hote/factures");
    revalidatePath("/hote/compta");
    return {
      ok: true,
      message: resultat.cree
        ? `Paiement de ${formaterEuros(resultat.paiement.montantCentimes)} enregistré.`
        : "Ce paiement a déjà été enregistré.",
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("enregistrerPaiementAction", error, { tenantId, factureId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
