"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import { GererWebhook } from "@/application/use-cases/gerer-webhook";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export type EtatWebhook = { ok: boolean; message: string };

export async function creerWebhookAction(
  _etat: EtatWebhook,
  formData: FormData,
): Promise<EtatWebhook> {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const libelle = String(formData.get("libelle") ?? "");
  const url = String(formData.get("url") ?? "");
  const secret = String(formData.get("secret") ?? "");
  const events = formData.getAll("events").map(String);

  try {
    const webhook = await new GererWebhook(
      new DrizzleWebhookRepository(),
    ).enregistrer({ tenantId, libelle, url, secret, events });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "webhook.enregistrer",
        cible: webhook.id,
        ref: webhook.libelle,
        payload: { url: webhook.url, events: webhook.events },
      }),
    );

    revalidatePath("/hote/integrations");
    return {
      ok: true,
      message: `Webhook « ${webhook.libelle} » enregistré.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerWebhookAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function supprimerWebhookAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const webhookId = String(formData.get("webhookId") ?? "");
  if (!webhookId) return;

  try {
    await new GererWebhook(new DrizzleWebhookRepository()).supprimer(
      tenantId,
      webhookId,
    );
    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.email,
        action: "webhook.supprimer",
        cible: webhookId,
        payload: {},
      }),
    );
    revalidatePath("/hote/integrations");
  } catch (error) {
    logErreur("supprimerWebhookAction", error, { tenantId, webhookId });
  }
}
