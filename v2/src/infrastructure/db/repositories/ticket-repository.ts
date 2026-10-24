import { and, asc, desc, eq } from "drizzle-orm";
import type {
  CreerTicketData,
  ResultatTicket,
  TicketRepository,
} from "@/application/ports/ticket-repository";
import type { Ticket, TicketMessage } from "@/domain/ticket";
import { withTenant } from "../client";
import { ticketMessages, tickets } from "../schema";

function versTicket(row: typeof tickets.$inferSelect): Ticket {
  return {
    id: row.id,
    tenantId: row.tenantId,
    createdByUserId: row.createdByUserId,
    assignedUserId: row.assignedUserId,
    reservationId: row.reservationId,
    logementId: row.logementId,
    ref: row.ref,
    sujet: row.sujet,
    priorite: row.priorite as Ticket["priorite"],
    statut: row.statut as Ticket["statut"],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versMessage(
  row: typeof ticketMessages.$inferSelect,
): TicketMessage {
  return {
    id: row.id,
    ticketId: row.ticketId,
    auteurUserId: row.auteurUserId,
    auteurLabel: row.auteurLabel,
    contenu: row.contenu,
    createdAt: row.createdAt,
  };
}

export class DrizzleTicketRepository implements TicketRepository {
  async creer(data: CreerTicketData): Promise<ResultatTicket> {
    return withTenant(data.tenantId, async (tx) => {
      const [ticket] = await tx
        .insert(tickets)
        .values({
          tenantId: data.tenantId,
          createdByUserId: data.createdByUserId,
          assignedUserId: data.assignedUserId,
          reservationId: data.reservationId,
          logementId: data.logementId,
          ref: data.ref,
          sujet: data.sujet,
          priorite: data.priorite,
        })
        .returning();
      if (!ticket) throw new Error("Ticket : aucune ligne retournée.");

      const [message] = await tx
        .insert(ticketMessages)
        .values({
          tenantId: data.tenantId,
          ticketId: ticket.id,
          auteurUserId: data.createdByUserId,
          auteurLabel: data.auteurLabel,
          contenu: data.message,
        })
        .returning();
      if (!message) throw new Error("Message de ticket non créé.");

      return { ticket: versTicket(ticket), message: versMessage(message) };
    });
  }

  async lister(
    tenantId: string,
    options?: { createdByUserId?: string },
  ): Promise<Ticket[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(tickets.tenantId, tenantId)];
      if (options?.createdByUserId) {
        conditions.push(eq(tickets.createdByUserId, options.createdByUserId));
      }
      const rows = await tx
        .select()
        .from(tickets)
        .where(and(...conditions))
        .orderBy(desc(tickets.createdAt));
      return rows.map(versTicket);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Ticket | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(tickets)
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)))
        .limit(1);
      return row ? versTicket(row) : null;
    });
  }

  async listerMessages(
    tenantId: string,
    ticketId: string,
  ): Promise<TicketMessage[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(ticketMessages)
        .where(
          and(
            eq(ticketMessages.tenantId, tenantId),
            eq(ticketMessages.ticketId, ticketId),
          ),
        )
        .orderBy(asc(ticketMessages.createdAt));
      return rows.map(versMessage);
    });
  }

  async ajouterMessage(
    tenantId: string,
    ticketId: string,
    data: {
      auteurUserId: string | null;
      auteurLabel: string;
      contenu: string;
    },
  ): Promise<TicketMessage> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .insert(ticketMessages)
        .values({
          tenantId,
          ticketId,
          auteurUserId: data.auteurUserId,
          auteurLabel: data.auteurLabel,
          contenu: data.contenu,
        })
        .returning();
      if (!row) throw new Error("Message de ticket non créé.");
      return versMessage(row);
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Ticket["statut"],
  ): Promise<Ticket | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(tickets)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(tickets.tenantId, tenantId), eq(tickets.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
