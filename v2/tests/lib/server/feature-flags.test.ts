import { describe, expect, it } from "vitest";
import {
  flagActif,
  flagsParDefaut,
  FLAGS_TENANT,
  validerFlags,
} from "@/lib/server/feature-flags";

describe("flags tenant (T011)", () => {
  it("expose les sept flags attendus", () => {
    expect(FLAGS_TENANT).toEqual([
      "distribution",
      "site_paiement",
      "inbox",
      "pricing",
      "reporting",
      "api",
      "integrations",
    ]);
  });

  it("flagActif retourne true seulement si explicitement true", () => {
    expect(flagActif({ distribution: true }, "distribution")).toBe(true);
    expect(flagActif({ distribution: false }, "distribution")).toBe(false);
    expect(flagActif({}, "inbox")).toBe(false);
    expect(flagActif(null, "pricing")).toBe(false);
    expect(flagActif(undefined, "api")).toBe(false);
  });

  it("flagsParDefaut active tout en environnement de test", () => {
    // vitest définit NODE_ENV=test : tous les modules sont actifs.
    const flags = flagsParDefaut();
    for (const flag of FLAGS_TENANT) {
      expect(flags[flag]).toBe(true);
    }
  });

  it("validerFlags ne garde que les clés connues et force le booléen", () => {
    expect(
      validerFlags({ distribution: true, pricing: "oui", inconnu: true }),
    ).toEqual({ distribution: true, pricing: false });
    expect(validerFlags(null)).toBeNull();
    expect(validerFlags("chaine")).toBeNull();
    expect(validerFlags(["distribution"])).toBeNull();
  });
});
