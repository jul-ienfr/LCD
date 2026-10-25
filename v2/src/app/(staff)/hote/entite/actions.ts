"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { MettreAJourEntite } from "@/application/use-cases/mettre-a-jour-entite";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatEntite = { ok: boolean; message: string };

export async function mettreAJourEntiteAction(
  _etat: EtatEntite,
  formData: FormData,
): Promise<EtatEntite> {
  const session = await requireRole(["admin"]);
  const tenantId = tenantIdDeSession(session);

  const nom = String(formData.get("nom") ?? "");
  const nature = String(formData.get("nature") ?? "");
  const regime = String(formData.get("regime") ?? "");
  const tva = String(formData.get("tva") ?? "");
  const siren = String(formData.get("siren") ?? "");
  const adresse = String(formData.get("adresse") ?? "");
  const mentionsLegales = String(formData.get("mentionsLegales") ?? "");

  try {
    const entite = await new MettreAJourEntite(
      new DrizzleTenantRepository(),
    ).executer({
      tenantId,
      nom,
      nature,
      regime,
      tva,
      siren,
      adresse,
      mentionsLegales,
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

    revalidatePath("/hote/entite");
    revalidatePath("/hote/proprietaires");
    revalidatePath("/hote/factures");
    revalidatePath("/hote/compta");
    return { ok: true, message: "Entité juridique mise à jour." };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("mettreAJourEntiteAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}
