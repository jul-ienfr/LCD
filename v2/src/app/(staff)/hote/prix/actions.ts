"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { DefinirPrixJour } from "@/application/use-cases/definir-prix-jour";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { centimesDepuisSaisie } from "@/lib/format";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFormulairePrix = { ok: boolean; message: string };

export async function definirPrixAction(
  _etat: EtatFormulairePrix,
  formData: FormData,
): Promise<EtatFormulairePrix> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const date = String(formData.get("date") ?? "");
  const prixCentimes = centimesDepuisSaisie(
    String(formData.get("prixEuros") ?? ""),
  );

  if (prixCentimes === null) {
    return { ok: false, message: "Prix invalide (ex. 120 ou 120,50)." };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable pour ce tenant." };
    }

    const tarif = await new DefinirPrixJour(
      new DrizzleTarifRepository(),
    ).executer({ tenantId, logementId, date, prixCentimes });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "tarif.definir",
        cible: logement.id,
        ref: tarif.date,
        payload: { prixCentimes: tarif.prixCentimes, source: tarif.source },
      }),
    );

    revalidatePath("/hote/prix");
    return {
      ok: true,
      message: `Prix du ${tarif.date} enregistré : ${(
        tarif.prixCentimes / 100
      ).toFixed(2)} €.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    console.error("definirPrixAction", error);
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
