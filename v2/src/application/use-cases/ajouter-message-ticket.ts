import { ErreurMetier } from "@/domain/erreurs";
import { messageTicketValide } from "@/domain/ticket";
import type { TicketRepository } from "../ports/ticket-repository";

export class AjouterMessageTicket {
  constructor(private readonly repo: TicketRepository) {}

  async executer(input: {
    tenantId: string;
    ticketId: string;
    auteurUserId: string | null;
    auteurLabel: string;
    contenu: string;
  }) {
    const contenu = input.contenu.trim();
    if (!messageTicketValide(contenu)) {
      throw new ErreurMetier(
        "TICKET_INVALIDE",
        "Le message doit faire 2 à 4000 caractères.",
      );
    }

    const ticket = await this.repo.trouverParId(
      input.tenantId,
      input.ticketId,
    );
    if (!ticket) {
      throw new ErreurMetier("TICKET_INVALIDE", "Ticket introuvable.");
    }

    return this.repo.ajouterMessage(input.tenantId, input.ticketId, {
      auteurUserId: input.auteurUserId,
      auteurLabel: input.auteurLabel,
      contenu,
    });
  }
}
