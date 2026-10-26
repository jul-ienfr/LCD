"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { EnregistrerBrouillonAssistant } from "@/application/use-cases/enregistrer-brouillon";
import { PreparerMessageVoyageur } from "@/application/use-cases/message-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommationsAssistantRepository } from "@/infrastructure/db/repositories/consommations-assistant-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMessagesVoyageurRepository } from "@/infrastructure/db/repositories/messages-voyageur-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/session";

export async function enregistrerBrouillonAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);

  const logementId = String(formData.get("logementId") ?? "");
  const intention = String(formData.get("intention") ?? "");
  const ton = String(formData.get("ton") ?? "");
  const canal = String(formData.get("canal") ?? "");
  const destinataire = String(formData.get("destinataire") ?? "");
  const telephone = String(formData.get("telephone") ?? "");
  const voyageur = String(formData.get("voyageur") ?? "");
  const details = String(formData.get("details") ?? "");
  const texte = String(formData.get("texte") ?? "");

  function retourAssistant(erreur: string): never {
    const query = new URLSearchParams({
      logement: logementId,
      intention,
      ton,
      voyageur,
      details,
      erreur,
    });
    redirect(`/hote/assistant?${query.toString()}`);
  }

  try {
    const brouillon = new EnregistrerBrouillonAssistant(
      new PreparerMessageVoyageur(
        new DrizzleMessagesVoyageurRepository(),
        new DrizzleLogementRepository(),
      ),
      new DrizzleMessagesVoyageurRepository(),
      new DrizzleConsommationsAssistantRepository(),
    );
    const message = await brouillon.executer({
      tenantId,
      logementId,
      intention,
      ton,
      canal,
      destinataire: canal === "sms" ? telephone : destinataire,
      voyageur,
      details,
      texte,
    });

    await withTenant(tenantId, (tx) =>
      tx.insert(auditLogs).values({
        tenantId,
        qui: session.user.id,
        action: "assistant.enregistrer",
        cible: message.id,
        ref: message.ref,
        payload: { intention, ton, canal, type: message.type },
      }),
    );
  } catch (error) {
    if (error instanceof ErreurMetier) {
      retourAssistant(error.message);
    }
    logErreur("enregistrerBrouillonAction", error, { tenantId, logementId });
    retourAssistant("Erreur inattendue. Réessayez.");
  }

  revalidatePath("/hote/messages");
  revalidatePath("/hote/assistant");
  redirect(
    `/hote/messages?logement=${encodeURIComponent(logementId)}&ok=prepare`,
  );
}
