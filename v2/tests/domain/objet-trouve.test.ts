import { describe, expect, it } from "vitest";
import {
  aujourdHuiIso,
  dateIsoValide,
  datePlusJours,
  eligibleAuDon,
  FORFAIT_OBJET_CENTIMES,
  joursDepuis,
  joursRestantsAvantDon,
  refObjetTrouveValide,
  statutObjetValide,
  validerObjetTrouve,
} from "@/domain/objet-trouve";
import { ErreurMetier } from "@/domain/erreurs";

const maintenant = new Date("2026-10-25T12:00:00Z");

describe("domaine objet trouvé", () => {
  it("valide les dates ISO et les calculs de jours", () => {
    expect(dateIsoValide("2026-10-25")).toBe(true);
    expect(dateIsoValide("2026-02-30")).toBe(false);
    expect(dateIsoValide("25/10/2026")).toBe(false);
    expect(aujourdHuiIso(maintenant)).toBe("2026-10-25");
    expect(datePlusJours("2026-10-25", 30)).toBe("2026-11-24");
    expect(joursDepuis("2026-09-25", maintenant)).toBe(30);
    expect(joursDepuis("2026-10-25", maintenant)).toBe(0);
  });

  it("valide la référence et le statut", () => {
    expect(refObjetTrouveValide("objet-1234")).toBe(true);
    expect(refObjetTrouveValide("ab")).toBe(false);
    expect(statutObjetValide("trouve")).toBe(true);
    expect(statutObjetValide("perdu")).toBe(false);
  });

  it("normalise et borne les champs", () => {
    expect(
      validerObjetTrouve({
        description: "  Chargeur USB  ",
        lieu: " Salon ",
        trouveLe: "2026-10-20",
        voyageurNom: "  Camille  ",
        contact: "  camille@example.com ",
      }),
    ).toEqual({
      description: "Chargeur USB",
      lieu: "Salon",
      trouveLe: "2026-10-20",
      voyageurNom: "Camille",
      contact: "camille@example.com",
    });
    expect(() =>
      validerObjetTrouve({
        description: "a",
        lieu: "Salon",
        trouveLe: "2026-10-20",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerObjetTrouve({
        description: "Chargeur",
        lieu: "Salon",
        trouveLe: "2026-10-30",
      }),
    ).toThrow(ErreurMetier);
    expect(
      validerObjetTrouve({
        description: "Chargeur",
        lieu: "Salon",
        trouveLe: "2026-10-20",
        voyageurNom: "   ",
        contact: " ",
      }),
    ).toMatchObject({ voyageurNom: null, contact: null });
  });

  it("n’autorise le don qu’après trente jours", () => {
    const recent = { trouveLe: "2026-10-01", statut: "trouve" as const };
    const ancien = { trouveLe: "2026-09-01", statut: "reclame" as const };
    expect(eligibleAuDon(recent, maintenant)).toBe(false);
    expect(joursRestantsAvantDon(recent, maintenant)).toBe(6);
    expect(eligibleAuDon(ancien, maintenant)).toBe(true);
    expect(joursRestantsAvantDon(ancien, maintenant)).toBe(0);
    expect(FORFAIT_OBJET_CENTIMES).toBe(1500);
  });
});
