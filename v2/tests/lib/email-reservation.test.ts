import { describe, expect, it } from "vitest";
import {
  lienGestion,
  messageAnnulation,
  messageConfirmation,
  messageRelancePaiement,
  type DonneesEmailReservation,
} from "@/lib/server/email-reservation";

function normaliser(texte: string): string {
  return texte.replace(/[\u202f\u00a0]/g, " ");
}

const DONNEES: DonneesEmailReservation = {
  ref: "DIR-2026-0001",
  clientNom: "Camille",
  logementNom: "Villa Océan",
  debut: "2026-12-20",
  fin: "2026-12-27",
  voyageurs: 4,
  totalCentimes: 120_000,
  acompteCentimes: 36_000,
  soldeCentimes: 84_000,
  lienGestion: "https://lcd.test/reserver/DIR-2026-0001?tenant=demo",
  echeances: [
    { type: "acompte", montantCentimes: 36_000, exigibleLe: "2026-11-20" },
    { type: "solde", montantCentimes: 84_000, exigibleLe: "2026-11-20" },
  ],
};

describe("emails de réservation", () => {
  it("compose le lien de gestion sans double slash", () => {
    expect(lienGestion("https://lcd.test/", "DIR 1", "démo")).toBe(
      "https://lcd.test/reserver/DIR%201?tenant=d%C3%A9mo",
    );
  });

  it("confirme la réservation avec les échéances", () => {
    const message = messageConfirmation(DONNEES);
    const texte = normaliser(message.text);
    expect(message.subject).toContain("DIR-2026-0001");
    expect(texte).toContain("1 200,00 €");
    expect(texte).toContain("Acompte : 360,00 €");
    expect(texte).toContain("- Solde : 840,00 € le 2026-11-20");
    expect(texte).toContain(DONNEES.lienGestion);
  });

  it("relance une échéance en retard", () => {
    const message = messageRelancePaiement(
      DONNEES,
      DONNEES.echeances![1]!,
      -3,
    );
    expect(message.subject).toContain("en retard depuis 3 jour(s)");
    expect(normaliser(message.text)).toContain("comporte un solde");
  });

  it("annonce l'annulation et le remboursement", () => {
    const message = messageAnnulation(DONNEES, 36_000, "Annulation voyageur");
    expect(message.subject).toContain("annulée");
    expect(normaliser(message.text)).toContain("360,00 €");
    expect(message.text).toContain("Annulation voyageur");
  });
});
