import { describe, expect, it } from "vitest";
import {
  dansLesDouzeMois,
  depassement,
  lettreTranquillite,
  resumeCarnet,
  SEUIL_DB_JOUR,
  SEUIL_DB_NUIT,
  seuilDb,
  validerPreuve,
  type PreuveTranquillite,
} from "@/domain/preuve-tranquillite";
import { ErreurMetier } from "@/domain/erreurs";

function preuve(over: Partial<PreuveTranquillite>): PreuveTranquillite {
  return {
    id: over.id ?? crypto.randomUUID(),
    tenantId: "t1",
    logementId: "l1",
    ref: over.ref ?? "preuve-1000",
    type: over.type ?? "db",
    date: over.date ?? "2026-10-20",
    moment: over.moment ?? "nuit",
    valeurDb: over.valeurDb ?? 62,
    note: over.note ?? "",
    createdAt: new Date(),
  };
}

describe("domaine carnet de tranquillité", () => {
  it("valide une mesure de bruit et ses bornes", () => {
    expect(
      validerPreuve({
        type: "db",
        date: "2026-10-20",
        moment: "nuit",
        valeurDb: 62,
        note: "  Fête voisine  ",
      }),
    ).toEqual({
      type: "db",
      date: "2026-10-20",
      moment: "nuit",
      valeurDb: 62,
      note: "Fête voisine",
    });
    expect(() =>
      validerPreuve({
        type: "db",
        date: "2026-10-20",
        moment: "nuit",
        valeurDb: 121,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPreuve({ type: "db", date: "2026-10-20", valeurDb: 62 }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPreuve({
        type: "db",
        date: "2999-01-01",
        moment: "jour",
        valeurDb: 50,
      }),
    ).toThrow(ErreurMetier);
  });

  it("exige une note pour une attestation", () => {
    expect(
      validerPreuve({
        type: "attestation",
        date: "2026-10-20",
        note: "Attestation du gardien",
      }),
    ).toEqual({
      type: "attestation",
      date: "2026-10-20",
      moment: null,
      valeurDb: null,
      note: "Attestation du gardien",
    });
    expect(() =>
      validerPreuve({ type: "attestation", date: "2026-10-20", note: "" }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerPreuve({ type: "pub", date: "2026-10-20", note: "Test" }),
    ).toThrow(ErreurMetier);
  });

  it("applique les seuils jour et nuit", () => {
    expect(SEUIL_DB_JOUR).toBe(55);
    expect(SEUIL_DB_NUIT).toBe(35);
    expect(seuilDb("nuit")).toBe(35);
    expect(depassement(preuve({ moment: "nuit", valeurDb: 40 }))).toBe(true);
    expect(depassement(preuve({ moment: "jour", valeurDb: 40 }))).toBe(false);
    expect(depassement(preuve({ moment: "jour", valeurDb: 56 }))).toBe(true);
    expect(depassement(preuve({ type: "attestation", valeurDb: null }))).toBe(
      false,
    );
  });

  it("résume les douze derniers mois", () => {
    const maintenant = new Date("2026-10-25T12:00:00Z");
    const preuves = [
      preuve({ date: "2026-10-20", valeurDb: 62 }),
      preuve({
        id: "a",
        ref: "preuve-2000",
        type: "attestation",
        date: "2026-01-10",
        moment: null,
        valeurDb: null,
        note: "Attestation",
      }),
      preuve({
        id: "b",
        ref: "preuve-3000",
        type: "intervention",
        date: "2025-12-01",
        moment: null,
        valeurDb: null,
        note: "Intervention",
      }),
      preuve({
        id: "c",
        ref: "preuve-4000",
        date: "2025-09-01",
        valeurDb: 80,
      }),
    ];
    expect(dansLesDouzeMois("2025-09-01", maintenant)).toBe(false);
    expect(dansLesDouzeMois("2025-12-01", maintenant)).toBe(true);
    expect(resumeCarnet(preuves, maintenant)).toEqual({
      total: 3,
      mesures: 1,
      attestations: 1,
      interventions: 1,
      depassements: 1,
      maxDb: 62,
    });
    expect(resumeCarnet([], maintenant)).toMatchObject({
      total: 0,
      maxDb: null,
    });
  });

  it("génère une lettre au syndic exploitable", () => {
    const maintenant = new Date("2026-10-25T12:00:00Z");
    const lettre = lettreTranquillite({
      logement: "Santa Severa",
      adresse: "12 rue des Pins",
      preuves: [
        preuve({ date: "2026-10-20", valeurDb: 62, note: "Fête voisine" }),
        preuve({
          id: "a",
          ref: "preuve-2000",
          type: "attestation",
          date: "2026-10-22",
          moment: null,
          valeurDb: null,
          note: "Attestation du gardien",
        }),
      ],
      maintenant,
    });
    expect(lettre).toContain("nuisances sonores — Santa Severa");
    expect(lettre).toContain("12 rue des Pins");
    expect(lettre).toContain("62 dB");
    expect(lettre).toContain("Fête voisine");
    expect(lettre).toContain("1 mesure(s) dépassent les seuils");
    expect(lettre).toContain("Attestation du gardien");
    expect(lettre).not.toContain("2025");
  });
});
