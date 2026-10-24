import type {
  CreerTicketData,
  ResultatTicket,
  TicketRepository,
} from "@/application/ports/ticket-repository";
import type { Ticket, TicketMessage } from "@/domain/ticket";

export class TicketRepositoryMemoire implements TicketRepository {
  private readonly tickets: Ticket[] = [];
  private readonly messages: TicketMessage[] = [];

  async creer(data: CreerTicketData): Promise<ResultatTicket> {
    const maintenant = new Date();
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      createdByUserId: data.createdByUserId,
      assignedUserId: data.assignedUserId,
      reservationId: data.reservationId,
      logementId: data.logementId,
      ref: data.ref,
      sujet: data.sujet,
      priorite: data.priorite,
      statut: "ouvert",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    const message: TicketMessage = {
      id: crypto.randomUUID(),
      ticketId: ticket.id,
      auteurUserId: data.createdByUserId,
      auteurLabel: data.auteurLabel,
      contenu: data.message,
      createdAt: maintenant,
    };
    this.tickets.push(ticket);
    this.messages.push(message);
    return { ticket, message };
  }

  async lister(
    tenantId: string,
    options?: { createdByUserId?: string },
  ): Promise<Ticket[]> {
    return this.tickets.filter(
      (t) =>
        t.tenantId === tenantId &&
        (!options?.createdByUserId ||
          t.createdByUserId === options.createdByUserId),
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Ticket | null> {
    return (
      this.tickets.find((t) => t.tenantId === tenantId && t.id === id) ?? null
    );
  }

  async listerMessages(
    tenantId: string,
    ticketId: string,
  ): Promise<TicketMessage[]> {
    const ticket = await this.trouverParId(tenantId, ticketId);
    if (!ticket) return [];
    return this.messages.filter((m) => m.ticketId === ticketId);
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
    const message: TicketMessage = {
      id: crypto.randomUUID(),
      ticketId,
      auteurUserId: data.auteurUserId,
      auteurLabel: data.auteurLabel,
      contenu: data.contenu,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Ticket["statut"],
  ): Promise<Ticket | null> {
    const ticket = await this.trouverParId(tenantId, id);
    if (!ticket) return null;
    ticket.statut = statut;
    ticket.updatedAt = new Date();
    return ticket;
  }
}
