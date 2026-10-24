import { ErreurMetier } from "@/domain/erreurs";
import {
  PRIORITES_TICKET,
  messageTicketValide,
  refTicketValide,
  sujetTicketValide,
  type PrioriteTicket,
} from "@/domain/ticket";
import type { TicketRepository } from "../ports/ticket-repository";

export interface CreerTicketInput {
  tenantId: string;
  createdByUserId: string | null;
  ref: string;
  sujet: string;
  priorite: PrioriteTicket;
  message: string;
  auteurLabel: string;
  reservationId?: string | null;
  logementId?: string | null;
}

export class CreerTicket {
  constructor(private readonly repo: TicketRepository) {}

  async executer(input: CreerTicketInput) {
    const sujet = input.sujet.trim();
    const message = input.message.trim();
    const ref = input.ref.trim();

    if (!refTicketValide(ref)) {
      throw new ErreurMetier("TICKET_INVALIDE", "Référence de ticket invalide.");
    }
    if (!sujetTicketValide(sujet)) {
      throw new ErreurMetier(
        "TICKET_INVALIDE",
        "Le sujet doit faire 3 à 120 caractères.",
      );
    }
    if (!messageTicketValide(message)) {
      throw new ErreurMetier(
        "TICKET_INVALIDE",
        "Le message doit faire 2 à 4000 caractères.",
      );
    }
    if (!PRIORITES_TICKET.includes(input.priorite)) {
      throw new ErreurMetier("TICKET_INVALIDE", "Priorité invalide.");
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      createdByUserId: input.createdByUserId,
      assignedUserId: null,
      reservationId: input.reservationId ?? null,
      logementId: input.logementId ?? null,
      ref,
      sujet,
      priorite: input.priorite,
      message,
      auteurLabel: input.auteurLabel,
    });
  }
}
