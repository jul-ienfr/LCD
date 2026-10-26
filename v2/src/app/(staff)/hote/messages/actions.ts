"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  EnvoyerMessageVoyageur,
  PreparerMessageVoyageur,
} from "@/application/use-cases/message-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMessagesVoyageurRepository } from "@/infrastructure/db/repositories/messages-voyageur-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { env } from "@/lib/env";
import { requireRole, tenantIdDeSession } from "@/lib/session";

function retour(logementId: string, suffixe: string): never {
  redirect(
    `/hote/messages?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export async function preparerMessageAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");

  try {
    const message = await new PreparerMessageVoyageur(
      new DrizzleMessagesVoyageurRepository(),
      new DrizzleLogementRepository(),
    ).executer({
      tenantId,
      logementId,
      ref:
        String(formData.get("ref") ?? "").trim() ||
        `MSG-${crypto.randomUUID()}`,
      canal: String(formData.get("canal") ?? ""),
      destinataire: String(formData.get("destinataire") ?? ""),
      type: String(formData.get("type") ?? ""),
      contenu: String(formData.get("contenu") ?? ""),
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "message.preparer",
        cible: message.id,
        ref: message.ref,
        payload: {
          canal: message.canal,
          type: message.type,
          logementId,
        },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("preparerMessageAction", error, { tenantId, logementId });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/messages");
  retour(logementId, "ok=prepare");
}

export async function envoyerMessageAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logementId = String(formData.get("logementId") ?? "");
  const id = String(formData.get("id") ?? "");

  try {
    const message = await new EnvoyerMessageVoyageur(
      new DrizzleMessagesVoyageurRepository(),
      env.EMAIL_ENABLED ? creerEmailSmtp() : null,
    ).executer(tenantId, id);

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "message.envoyer",
        cible: message.id,
        ref: message.ref,
        payload: { canal: message.canal, type: message.type },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
    }
    logErreur("envoyerMessageAction", error, { tenantId, cible: id });
    retour(logementId, "erreur=inattendu");
  }

  revalidatePath("/hote/messages");
  retour(logementId, "ok=envoi");
}
