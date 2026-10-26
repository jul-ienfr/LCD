import { describe, expect, it } from "vitest";
import {
  libelleDuree,
  minutesDepuis,
  peutRevoquerSession,
  sessionActive,
} from "@/domain/acces";
import { ErreurMetier } from "@/domain/erreurs";

describe("domaine accès", () => {
  it("distingue une session active d’une session expirée", () => {
    const maintenant = new Date("2026-10-25T12:00:00Z");
    expect(sessionActive(new Date("2026-10-25T12:30:00Z"), maintenant)).toBe(
      true,
    );
    expect(sessionActive(new Date("2026-10-25T11:59:00Z"), maintenant)).toBe(
      false,
    );
  });

  it("interdit de révoquer sa propre session", () => {
    expect(() => peutRevoquerSession("u1", "u2")).not.toThrow();
    expect(() => peutRevoquerSession("u1", "u1")).toThrow(ErreurMetier);
  });

  it("formate l’ancienneté", () => {
    const maintenant = new Date("2026-10-25T12:00:00Z");
    expect(libelleDuree(0)).toBe("à l’instant");
    expect(libelleDuree(42)).toBe("il y a 42 min");
    expect(libelleDuree(180)).toBe("il y a 3 h");
    expect(libelleDuree(60 * 48)).toBe("il y a 2 j");
    expect(
      minutesDepuis(new Date("2026-10-25T11:00:00Z"), maintenant),
    ).toBe(60);
    expect(
      minutesDepuis(new Date("2026-10-25T13:00:00Z"), maintenant),
    ).toBe(0);
  });
});
