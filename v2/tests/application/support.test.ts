import { describe, expect, it } from "vitest";
import { AjouterMessageTicket } from "@/application/use-cases/ajouter-message-ticket";
import { ChangerStatutTicket } from "@/application/use-cases/changer-statut-ticket";
import { CreerTicket } from "@/application/use-cases/creer-ticket";
import { TicketRepositoryMemoire } from "../helpers/ticket-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

async function contexte() {
  const repo = new TicketRepositoryMemoire();
  const resultat = await new CreerTicket(repo).executer({
    tenantId,
    createdByUserId: "user-1",
    ref: "SUP-0001",
    sujet: "Problème WiFi",
    priorite: "haute",
    message: "Le WiFi ne fonctionne plus.",
    auteurLabel: "proprio@lcd.test",
  });
  return { repo, ticket: resultat.ticket };
}

describe("support", () => {
  it("crée un ticket avec son premier message", async () => {
    const { repo, ticket } = await contexte();
    expect(ticket.statut).toBe("ouvert");
    expect(ticket.priorite).toBe("haute");
    expect(await repo.listerMessages(tenantId, ticket.id)).toHaveLength(1);
  });

  it("ajoute un message", async () => {
    const { repo, ticket } = await contexte();
    const message = await new AjouterMessageTicket(repo).executer({
      tenantId,
      ticketId: ticket.id,
      auteurUserId: "user-2",
      auteurLabel: "admin@lcd.test",
      contenu: "Nous regardons cela.",
    });
    expect(message.contenu).toBe("Nous regardons cela.");
    expect(await repo.listerMessages(tenantId, ticket.id)).toHaveLength(2);
  });

  it("suit ouvert → en cours → résolu", async () => {
    const { repo, ticket } = await contexte();
    const uc = new ChangerStatutTicket(repo);
    expect(
      (await uc.executer({ tenantId, ticketId: ticket.id, statut: "en_cours" }))
        .statut,
    ).toBe("en_cours");
    expect(
      (await uc.executer({ tenantId, ticketId: ticket.id, statut: "resolu" }))
        .statut,
    ).toBe("resolu");
  });

  it("refuse fermé → en cours", async () => {
    const { repo, ticket } = await contexte();
    const uc = new ChangerStatutTicket(repo);
    await uc.executer({ tenantId, ticketId: ticket.id, statut: "ferme" });
    await expect(
      uc.executer({ tenantId, ticketId: ticket.id, statut: "en_cours" }),
    ).rejects.toMatchObject({ code: "TICKET_INVALIDE" });
  });

  it("filtre les tickets par créateur", async () => {
    const { repo } = await contexte();
    await new CreerTicket(repo).executer({
      tenantId,
      createdByUserId: "user-2",
      ref: "SUP-0002",
      sujet: "Autre ticket",
      priorite: "normale",
      message: "Message.",
      auteurLabel: "autre@lcd.test",
    });
    expect(await repo.lister(tenantId, { createdByUserId: "user-1" })).toHaveLength(1);
    expect(await repo.lister(tenantId)).toHaveLength(2);
  });
});
