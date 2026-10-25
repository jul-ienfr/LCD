import type { TypeEvenementWebhook } from "@/domain/webhook";
import { PlanifierWebhook } from "@/application/use-cases/planifier-webhook";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
import { logErreur } from "./logger";

/**
 * Émet un événement vers les webhooks actifs du tenant. Best-effort : une
 * erreur d'intégration ne doit jamais faire échouer l'action métier.
 */
export async function emettreEvenement(
  tenantId: string,
  eventType: TypeEvenementWebhook,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    await new PlanifierWebhook(new DrizzleWebhookRepository()).executer({
      tenantId,
      eventType,
      data,
    });
  } catch (error) {
    logErreur("emettreEvenement", error, { tenantId, eventType });
  }
}
