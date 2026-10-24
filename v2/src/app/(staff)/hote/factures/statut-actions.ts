"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { StatutFacture } from "@/domain/facture";
import { ChangerStatutFacture } from "@/application/use-cases/changer-statut-facture";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

const STATUTS: StatutFacture[] = ["brouillon", "emise", "payee", "annulee"];

export async function changerStatutFactureAction(formData: FormData) {
  const session = await requireRole(["admin", "hote", "comptable"]);
  const tenantId = tenantIdDeSession(session);

  const factureId = String(formData.get("factureId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutFacture;

  if (!factureId || !STATUTS.includes(statut)) {
    redirect("/hote/factures");
  }

  try {
    const facture = await new ChangerStatutFacture(
      new DrizzleFactureRepository(),
    ).executer({ tenantId, factureId, statut });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "facture.statut",
        cible: facture.id,
        ref: facture.numero,
        payload: { statut: facture.statut },
      }),
    );

    revalidatePath(`/hote/factures/${factureId}`);
    revalidatePath("/hote/factures");
    revalidatePath("/hote/compta");
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutFactureAction", error, { tenantId, factureId });
    }
  }

  redirect(`/hote/factures/${factureId}`);
}
