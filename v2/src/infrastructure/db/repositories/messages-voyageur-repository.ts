import { and, desc, eq } from "drizzle-orm";
import type {
  CreerMessageData,
  MessagesVoyageurRepository,
} from "@/application/ports/messages-voyageur-repository";
import type {
  CanalMessage,
  MessageVoyageur,
  StatutMessageVoyageur,
  TypeMessageVoyageur,
} from "@/domain/message-voyageur";
import { withTenant } from "../client";
import { messagesVoyageur } from "../schema";

function versDomaine(
  row: typeof messagesVoyageur.$inferSelect,
): MessageVoyageur {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    canal: row.canal as CanalMessage,
    type: row.type as TypeMessageVoyageur,
    contenu: row.contenu,
    statut: row.statut as StatutMessageVoyageur,
    envoyeAt: row.envoyeAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleMessagesVoyageurRepository
  implements MessagesVoyageurRepository
{
  async creer(data: CreerMessageData): Promise<MessageVoyageur> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(messagesVoyageur)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          ref: data.ref,
          canal: data.canal,
          type: data.type,
          contenu: data.contenu,
        })
        .returning();
      if (!row) throw new Error("Message voyageur : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<MessageVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.ref, ref),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<MessageVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.id, id),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<MessageVoyageur[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.logementId, logementId),
          ),
        )
        .orderBy(desc(messagesVoyageur.createdAt));
      return rows.map(versDomaine);
    });
  }

  async marquerEnvoye(
    tenantId: string,
    id: string,
  ): Promise<MessageVoyageur> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(messagesVoyageur)
        .set({ statut: "envoye", envoyeAt: new Date() })
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.id, id),
          ),
        )
        .returning();
      if (!row) throw new Error("Message voyageur : aucune ligne mise à jour.");
      return versDomaine(row);
    });
  }
}
