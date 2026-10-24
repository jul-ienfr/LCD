import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_TICKET,
  type StatutTicket,
} from "@/domain/ticket";
import type { TicketRepository } from "../ports/ticket-repository";

export class ChangerStatutTicket {
  constructor(private readonly repo: TicketRepository) {}

  async executer(input: {
    tenantId: string;
    ticketId: string;
    statut: StatutTicket;
  }) {
    const ticket = await this.repo.trouverParId(
      input.tenantId,
      input.ticketId,
    );
    if (!ticket) {
      throw new ErreurMetier("TICKET_INVALIDE", "Ticket introuvable.");
    }
    if (ticket.statut === input.statut) return ticket;
    if (!TRANSITIONS_TICKET[ticket.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "TICKET_INVALIDE",
        `Transition ${ticket.statut} → ${input.statut} interdite.`,
      );
    }

    const miseAJour = await this.repo.changerStatut(
      input.tenantId,
      input.ticketId,
      input.statut,
    );
    if (!miseAJour) {
      throw new ErreurMetier("TICKET_INVALIDE", "Mise à jour impossible.");
    }
    return miseAJour;
  }
}
