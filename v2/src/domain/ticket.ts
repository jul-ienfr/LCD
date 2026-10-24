export type TicketId = string;
export type StatutTicket = "ouvert" | "en_cours" | "resolu" | "ferme";
export type PrioriteTicket = "basse" | "normale" | "haute" | "urgente";

export interface Ticket {
  id: TicketId;
  tenantId: string;
  createdByUserId: string | null;
  assignedUserId: string | null;
  reservationId: string | null;
  logementId: string | null;
  ref: string;
  sujet: string;
  priorite: PrioriteTicket;
  statut: StatutTicket;
  createdAt: Date;
  updatedAt: Date;
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  auteurUserId: string | null;
  auteurLabel: string;
  contenu: string;
  createdAt: Date;
}

export const TRANSITIONS_TICKET: Record<StatutTicket, StatutTicket[]> = {
  ouvert: ["en_cours", "resolu", "ferme"],
  en_cours: ["resolu", "ferme"],
  resolu: ["en_cours", "ferme"],
  ferme: [],
};

export const PRIORITES_TICKET: PrioriteTicket[] = [
  "basse",
  "normale",
  "haute",
  "urgente",
];

export function sujetTicketValide(sujet: string): boolean {
  return sujet.trim().length >= 3 && sujet.trim().length <= 120;
}

export function messageTicketValide(message: string): boolean {
  return message.trim().length >= 2 && message.trim().length <= 4000;
}

export function refTicketValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}
