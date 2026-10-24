import type {
  PrioriteTicket,
  Ticket,
  TicketMessage,
} from "@/domain/ticket";

export interface CreerTicketData {
  tenantId: string;
  createdByUserId: string | null;
  assignedUserId: string | null;
  reservationId: string | null;
  logementId: string | null;
  ref: string;
  sujet: string;
  priorite: PrioriteTicket;
  message: string;
  auteurLabel: string;
}

export interface ResultatTicket {
  ticket: Ticket;
  message: TicketMessage;
}

export interface TicketRepository {
  creer(data: CreerTicketData): Promise<ResultatTicket>;
  lister(
    tenantId: string,
    options?: { createdByUserId?: string },
  ): Promise<Ticket[]>;
  trouverParId(tenantId: string, id: string): Promise<Ticket | null>;
  listerMessages(
    tenantId: string,
    ticketId: string,
  ): Promise<TicketMessage[]>;
  ajouterMessage(
    tenantId: string,
    ticketId: string,
    data: {
      auteurUserId: string | null;
      auteurLabel: string;
      contenu: string;
    },
  ): Promise<TicketMessage>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: Ticket["statut"],
  ): Promise<Ticket | null>;
}
