"use server";

import { revalidatePath } from "next/cache";
import { ErreurMetier } from "@/domain/erreurs";
import type { PrioriteTicket, StatutTicket } from "@/domain/ticket";
import { AjouterMessageTicket } from "@/application/use-cases/ajouter-message-ticket";
import { ChangerStatutTicket } from "@/application/use-cases/changer-statut-ticket";
import { CreerTicket } from "@/application/use-cases/creer-ticket";
import { DrizzleTicketRepository } from "@/infrastructure/db/repositories/ticket-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { logErreur } from "@/lib/logger";
import { requireRole, requireSession, tenantIdDeSession } from "@/lib/session";

export type EtatTicket = { ok: boolean; message: string };
export type EtatReponse = { ok: boolean; message: string };

const PRIORITES: PrioriteTicket[] = ["basse", "normale", "haute", "urgente"];
const STATUTS: StatutTicket[] = ["ouvert", "en_cours", "resolu", "ferme"];

export async function creerTicketAction(
  _etat: EtatTicket,
  formData: FormData,
): Promise<EtatTicket> {
  const session = await requireSession();
  const tenantId = tenantIdDeSession(session);

  const priorite = String(formData.get("priorite") ?? "normale") as PrioriteTicket;
  if (!PRIORITES.includes(priorite)) {
    return { ok: false, message: "Priorité invalide." };
  }

  try {
    const resultat = await new CreerTicket(
      new DrizzleTicketRepository(),
    ).executer({
      tenantId,
      createdByUserId: session.user.id,
      ref: `SUP-${Date.now()}`,
      sujet: String(formData.get("sujet") ?? ""),
      priorite,
      message: String(formData.get("message") ?? ""),
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

    revalidatePath("/support");
    return {
      ok: true,
      message: `Ticket ${resultat.ticket.ref} créé.`,
    };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("creerTicketAction", error, { tenantId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function repondreTicketAction(
  _etat: EtatReponse,
  formData: FormData,
): Promise<EtatReponse> {
  const session = await requireSession();
  const tenantId = tenantIdDeSession(session);
  const ticketId = String(formData.get("ticketId") ?? "");

  try {
    const ticket = await new DrizzleTicketRepository().trouverParId(
      tenantId,
      ticketId,
    );
    if (!ticket) {
      return { ok: false, message: "Ticket introuvable." };
    }

    const estStaff = ["admin", "hote"].includes(session.user.role ?? "");
    if (!estStaff && ticket.createdByUserId !== session.user.id) {
      return { ok: false, message: "Accès refusé à ce ticket." };
    }

    await new AjouterMessageTicket(
      new DrizzleTicketRepository(),
    ).executer({
      tenantId,
      ticketId,
      auteurUserId: session.user.id,
      auteurLabel: session.user.email,
      contenu: String(formData.get("message") ?? ""),
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

    revalidatePath(`/support/${ticketId}`);
    return { ok: true, message: "Réponse envoyée." };
  } catch (error) {
    if (error instanceof ErreurMetier) {
      return { ok: false, message: error.message };
    }
    logErreur("repondreTicketAction", error, { tenantId, ticketId });
    return { ok: false, message: "Erreur inattendue. Réessayez." };
  }
}

export async function changerStatutTicketAction(formData: FormData) {
  const session = await requireRole(["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const ticketId = String(formData.get("ticketId") ?? "");
  const statut = String(formData.get("statut") ?? "") as StatutTicket;

  if (!ticketId || !STATUTS.includes(statut)) return;

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

    revalidatePath(`/support/${ticketId}`);
    revalidatePath("/support");
  } catch (error) {
    if (!(error instanceof ErreurMetier)) {
      logErreur("changerStatutTicketAction", error, { tenantId, ticketId });
    }
  }
}
