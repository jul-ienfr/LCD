import { and, asc, desc, eq, lte } from "drizzle-orm";
import type {
  CreerLivraisonData,
  EnregistrerWebhookData,
  MarquerLivraisonData,
  WebhookRepository,
} from "@/application/ports/webhook-repository";
import {
  evenementWebhookValide,
  type Webhook,
  type WebhookDelivery,
} from "@/domain/webhook";
import { db, withTenant } from "../client";
import { webhookDeliveries, webhooks } from "../schema";

function versDomaine(row: typeof webhooks.$inferSelect): Webhook {
  return {
    id: row.id,
    tenantId: row.tenantId,
    libelle: row.libelle,
    url: row.url,
    secret: row.secret,
    events: row.events.split(",").filter(evenementWebhookValide),
    actif: row.actif,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versLivraison(
  row: typeof webhookDeliveries.$inferSelect,
): WebhookDelivery {
  return {
    id: row.id,
    tenantId: row.tenantId,
    webhookId: row.webhookId,
    eventType: row.eventType as WebhookDelivery["eventType"],
    payload: row.payload,
    statut: row.statut as WebhookDelivery["statut"],
    tentatives: row.tentatives,
    prochaineTentative: row.prochaineTentative,
    dernierCode: row.dernierCode,
    dernierMessage: row.dernierMessage,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleWebhookRepository implements WebhookRepository {
  async enregistrer(data: EnregistrerWebhookData): Promise<Webhook> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(webhooks)
        .values({
          tenantId: data.tenantId,
          libelle: data.libelle,
          url: data.url,
          secret: data.secret,
          events: data.events.join(","),
        })
        .onConflictDoUpdate({
          target: [webhooks.tenantId, webhooks.url],
          set: {
            libelle: data.libelle,
            secret: data.secret,
            events: data.events.join(","),
            actif: true,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) throw new Error("Webhook : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParTenant(tenantId: string): Promise<Webhook[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(webhooks)
        .where(eq(webhooks.tenantId, tenantId))
        .orderBy(asc(webhooks.libelle));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Webhook | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.tenantId, tenantId), eq(webhooks.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async supprimer(tenantId: string, id: string): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(webhooks)
        .where(and(eq(webhooks.tenantId, tenantId), eq(webhooks.id, id)));
    });
  }

  async listerActifsPourEvenement(
    tenantId: string,
    eventType: Webhook["events"][number],
  ): Promise<Webhook[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(webhooks)
        .where(and(eq(webhooks.tenantId, tenantId), eq(webhooks.actif, true)));
      return rows.map(versDomaine).filter((webhook) =>
        webhook.events.includes(eventType),
      );
    });
  }

  async creerLivraison(data: CreerLivraisonData): Promise<WebhookDelivery> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(webhookDeliveries)
        .values({
          tenantId: data.tenantId,
          webhookId: data.webhookId,
          eventType: data.eventType,
          payload: data.payload,
        })
        .returning();
      if (!row) throw new Error("Livraison webhook : aucune ligne.");
      return versLivraison(row);
    });
  }

  async listerLivraisonsDues(limit: number): Promise<WebhookDelivery[]> {
    // Tâche système : traverse tous les tenants.
    const rows = await db
      .select()
      .from(webhookDeliveries)
      .where(
        and(
          eq(webhookDeliveries.statut, "pending"),
          lte(webhookDeliveries.prochaineTentative, new Date()),
        ),
      )
      .orderBy(asc(webhookDeliveries.prochaineTentative))
      .limit(limit);
    return rows.map(versLivraison);
  }

  async marquerLivraison(
    id: string,
    data: MarquerLivraisonData,
  ): Promise<void> {
    await db
      .update(webhookDeliveries)
      .set({
        statut: data.statut,
        tentatives: data.tentatives,
        prochaineTentative: data.prochaineTentative,
        dernierCode: data.dernierCode,
        dernierMessage: data.dernierMessage,
        updatedAt: new Date(),
      })
      .where(eq(webhookDeliveries.id, id));
  }

  async listerLivraisonsParTenant(
    tenantId: string,
    limit: number,
  ): Promise<WebhookDelivery[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(webhookDeliveries)
        .where(eq(webhookDeliveries.tenantId, tenantId))
        .orderBy(desc(webhookDeliveries.createdAt))
        .limit(limit);
      return rows.map(versLivraison);
    });
  }
}
