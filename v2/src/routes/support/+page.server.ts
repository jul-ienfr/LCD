import { fail, isRedirect, redirect } from "@sveltejs/kit";
import { CreerTicket } from "@/application/use-cases/creer-ticket";
import { ErreurMetier } from "@/domain/erreurs";
import type { PrioriteTicket } from "@/domain/ticket";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { requireSession, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

const PRIORITES: PrioriteTicket[] = ["basse", "normale", "haute", "urgente"];

export const load: PageServerLoad = async (event) => {
  const session = requireSession(event);
  const tenantId = tenantIdDeSession(session);
  const estStaff = ["admin", "hote"].includes(session.user.role ?? "");
  const tickets = await new DrizzleTicketRepository().lister(
    tenantId,
    estStaff ? undefined : { createdByUserId: session.user.id },
  );

  return {
    estStaff,
    email: session.user.email,
    ok: event.url.searchParams.get("ok") === "cree",
    tickets: tickets.map((ticket) => ({
      id: ticket.id,
      ref: ticket.ref,
      sujet: ticket.sujet,
      statut: ticket.statut,
      priorite: ticket.priorite,
      date: ticket.createdAt.toISOString().slice(0, 10),
    })),
    priorites: PRIORITES,
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireSession(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const priorite = String(donnees.get("priorite") ?? "normale") as PrioriteTicket;
    if (!PRIORITES.includes(priorite)) {
      return fail(400, { ok: false, message: "Priorité invalide." });
    }
    try {
      const resultat = await new CreerTicket(
        new DrizzleTicketRepository(),
      ).executer({
        tenantId,
        createdByUserId: session.user.id,
        ref: `SUP-${crypto.randomUUID()}`,
        sujet: String(donnees.get("sujet") ?? ""),
        priorite,
        message: String(donnees.get("message") ?? ""),
        auteurLabel: session.user.email,
      });
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "ticket.creer",
          cible: resultat.ticket.id,
          ref: resultat.ticket.ref,
          payload: { priorite: resultat.ticket.priorite },
        }),
      );
      await emettreEvenement(tenantId, "ticket.created", {
        ticketId: resultat.ticket.id,
        ref: resultat.ticket.ref,
        priorite: resultat.ticket.priorite,
        sujet: resultat.ticket.sujet,
      });
      return redirect(303, "/support?ok=cree");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) return fail(400, { ok: false, message: error.message });
      logErreur("support.creer", error, { tenantId });
      return fail(500, { ok: false, message: "Erreur inattendue. Réessayez." });
    }
  },
} satisfies Actions;
