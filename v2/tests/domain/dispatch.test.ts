import { describe, expect, it } from "vitest";
import {
  dispatchActif,
  MESSAGE_DISPATCH_MAX,
  refDispatchValide,
  repondreDispatch,
  retirerDispatch,
  validerMessageDispatch,
} from "@/domain/dispatch";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine dispatch", () => {
  it("identifie les statuts actifs", () => {
    expect(dispatchActif("proposee")).toBe(true);
    expect(dispatchActif("acceptee")).toBe(true);
    expect(dispatchActif("refusee")).toBe(false);
    expect(dispatchActif("retiree")).toBe(false);
    expect(refDispatchValide("DSP-2026-0001")).toBe(true);
    expect(refDispatchValide("DSP 1")).toBe(false);
  });

  it("répond à une offre proposée", () => {
    const maintenant = new Date("2026-10-25T10:00:00Z");
    expect(
      repondreDispatch({ statut: "proposee" }, "accepter", maintenant),
    ).toEqual({ statut: "acceptee", reponduAt: maintenant });
    expect(
      repondreDispatch({ statut: "proposee" }, "refuser", maintenant),
    ).toEqual({ statut: "refusee", reponduAt: maintenant });
    expect(() =>
      repondreDispatch({ statut: "acceptee" }, "accepter"),
    ).toThrow(ErreurMetier);
    expect(() =>
      repondreDispatch({ statut: "refusee" }, "refuser"),
    ).toThrow(ErreurMetier);
  });

  it("retire uniquement une offre proposée", () => {
    const maintenant = new Date("2026-10-25T10:00:00Z");
    expect(retirerDispatch({ statut: "proposee" }, maintenant)).toEqual({
      statut: "retiree",
      reponduAt: maintenant,
    });
    expect(() => retirerDispatch({ statut: "acceptee" })).toThrow(
      ErreurMetier,
    );
  });

  it("borne et nettoie le message", () => {
    expect(validerMessageDispatch("  Créneau 8 h  ")).toBe("Créneau 8 h");
    expect(() =>
      validerMessageDispatch("a".repeat(MESSAGE_DISPATCH_MAX + 1)),
    ).toThrow(ErreurMetier);
  });
});
