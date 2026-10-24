import { describe, expect, it } from "vitest";
import {
  messageTicketValide,
  sujetTicketValide,
  TRANSITIONS_TICKET,
} from "@/domain/ticket";

describe("ticket", () => {
  it("valide sujet et message", () => {
    expect(sujetTicketValide("Problème WiFi")).toBe(true);
    expect(sujetTicketValide("ab")).toBe(false);
    expect(messageTicketValide("Le WiFi ne fonctionne plus.")).toBe(true);
    expect(messageTicketValide("")).toBe(false);
  });

  it("définit les transitions", () => {
    expect(TRANSITIONS_TICKET.ouvert).toContain("en_cours");
    expect(TRANSITIONS_TICKET.en_cours).toContain("resolu");
    expect(TRANSITIONS_TICKET.ferme).toHaveLength(0);
  });
});
