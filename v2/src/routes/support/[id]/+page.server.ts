import { error, fail } from "@sveltejs/kit";
import { AjouterMessageTicket } from "@/application/use-cases/ajouter-message-ticket";
import { ChangerStatutTicket } from "@/application/use-cases/changer-statut-ticket";
import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_TICKET,
  type StatutTicket,
} from "@/domain/ticket";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireSession, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const STATUTS: StatutTicket[] = ["ouvert", "en_cours", "resolu", "ferme"];

export const load: PageServerLoad = async (event) => {
  const session = requireSession(event);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleTicketRepository();
  const ticket = await repo.trouverParId(tenantId, event.params.id);
  if (!ticket) error(404, "Ticket introuvable");

  const estStaff = ["admin", "hote"].includes(session.user.role ?? "");
  if (!estStaff && ticket.createdByUserId !== session.user.id) {
    error(404, "Ticket introuvable");
  }
  const messages = await repo.listerMessages(tenantId, ticket.id);

  return {
    estStaff,
    ticket: {
      id: ticket.id,
      ref: ticket.ref,
      sujet: ticket.sujet,
      statut: ticket.statut,
      priorite: ticket.priorite,
      date: ticket.createdAt.toISOString().slice(0, 10),
    },
    messages: messages.map((message) => ({
      id: message.id,
      auteur: message.auteurLabel,
      contenu: message.contenu,
      date: message.createdAt.toISOString().slice(0, 16).replace("T", " "),
    })),
    transitions: TRANSITIONS_TICKET[ticket.statut],
  };
};

export const actions = {
  repondre: async (event) => {
    const session = requireSession(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const ticketId = String(donnees.get("ticketId") ?? "");
    try {
      const ticket = await new DrizzleTicketRepository().trouverParId(
        tenantId,
        ticketId,
      );
      if (!ticket) return fail(404, { ok: false, message: "Ticket introuvable." });
      const estStaff = ["admin", "hote"].includes(session.user.role ?? "");
      if (!estStaff && ticket.createdByUserId !== session.user.id) {
        return fail(403, { ok: false, message: "Accès refusé à ce ticket." });
      }
      await new AjouterMessageTicket(
        new DrizzleTicketRepository(),
      ).executer({
        tenantId,
        ticketId,
        auteurUserId: session.user.id,
        auteurLabel: session.user.email,
        contenu: String(donnees.get("message") ?? ""),
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "ticket.message",
          cible: ticketId,
          ref: ticket.ref,
          payload: {},
        }),
      );
      return { ok: true, message: "Réponse envoyée." };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("support.repondre", error, { tenantId, ticketId });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },

  statut: async (event) => {
    const session = requireSession(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const ticketId = String(donnees.get("ticketId") ?? "");
    const statut = String(donnees.get("statut") ?? "") as StatutTicket;
    if (!STATUTS.includes(statut)) return fail(400, { ok: false, message: "Statut invalide." });
    try {
      const ticket = await new ChangerStatutTicket(
        new DrizzleTicketRepository(),
      ).executer({ tenantId, ticketId, statut });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "ticket.statut",
          cible: ticket.id,
          ref: ticket.ref,
          payload: { statut: ticket.statut },
        }),
      );
      return { ok: true, message: `Statut : ${ticket.statut}.` };
    } catch (error) {
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("support.statut", error, { tenantId, ticketId });
      return fail(500, { ok: false, message: "Erreur inattendue." });
    }
  },
} satisfies Actions;
