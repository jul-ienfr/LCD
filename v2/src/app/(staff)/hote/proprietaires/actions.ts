"use server";

import { revalidatePath } from "next/cache";
import {
  commissionBpValide,
  formaterCommissionBp,
} from "@/domain/commission";
import { DrizzleLogementProprietaireRepository } from "@/infrastructure/db/repositories/logement-proprietaire-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleUserRepository } from "@/infrastructure/db/repositories/user-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatAssignation = { ok: boolean; message: string };

export async function assignerProprietaireAction(
  _etat: EtatAssignation,
  formData: FormData,
): Promise<EtatAssignation> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const userId = String(formData.get("userId") ?? "");
  const commissionSaisie = String(formData.get("commission") ?? "20")
    .trim()
    .replace(",", ".");
  const commissionBp = Math.round(Number(commissionSaisie) * 100);

  if (!commissionBpValide(commissionBp)) {
    return {
      ok: false,
      message: "Commission invalide (0 à 50 %).",
    };
  }

  try {
    const logement = await new DrizzleLogementRepository().trouverParId(
      tenantId,
      logementId,
    );
    if (!logement) {
      return { ok: false, message: "Logement introuvable." };
    }

    const proprietaire = await new DrizzleUserRepository().trouverParId(
      tenantId,
      userId,
    );
    if (
      !proprietaire ||
      proprietaire.role !== "proprietaire" ||
      !proprietaire.actif
    ) {
      return { ok: false, message: "Propriétaire introuvable ou inactif." };
    }

    await new DrizzleLogementProprietaireRepository().assigner(
      tenantId,
      logementId,
      userId,
      commissionBp,
    );

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "proprietaire.assigner",
        cible: logementId,
        ref: proprietaire.email,
        payload: { logementId, userId, commissionBp },
      }),
    );

    revalidatePath("/hote/proprietaires");
    revalidatePath("/proprio");
    return {
      ok: true,
      message: `${proprietaire.name} est rattaché à ${logement.nom} (commission ${formaterCommissionBp(commissionBp)}).`,
    };
  } catch (error) {
    logErreur("assignerProprietaireAction", error, { tenantId, logementId, userId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function retirerProprietaireAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const userId = String(formData.get("userId") ?? "");

  await new DrizzleLogementProprietaireRepository().retirer(
    tenantId,
    logementId,
    userId,
  );

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: session.user.email,
      action: "proprietaire.retirer",
      cible: logementId,
      ref: userId,
      payload: { logementId, userId },
    }),
  );

  revalidatePath("/hote/proprietaires");
  revalidatePath("/proprio");
}
