"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { CreerLogement } from "@/application/use-cases/creer-logement";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatFormulaireLogement = {
  ok: boolean;
  message: string;
};

export async function creerLogementAction(
  _etat: EtatFormulaireLogement,
  formData: FormData,
): Promise<EtatFormulaireLogement> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const code = String(formData.get("code") ?? "");
  const nom = String(formData.get("nom") ?? "");
  const adresse = String(formData.get("adresse") ?? "");

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

    revalidatePath("/hote/logements");
    return {
      ok: true,
      message: `Logement « ${logement.code} » créé.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerLogementAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
