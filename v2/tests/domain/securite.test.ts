import { describe, expect, it } from "vitest";
import { deuxFacteursRequis } from "@/domain/securite";

describe("exigence de double facteur", () => {
  it("s’applique aux rôles staff quand l’obligation est active", () => {
    expect(deuxFacteursRequis("admin", false, true)).toBe(true);
    expect(deuxFacteursRequis("hote", false, true)).toBe(true);
    expect(deuxFacteursRequis("comptable", false, true)).toBe(true);
    expect(deuxFacteursRequis("operateur", false, true)).toBe(true);
  });

  it("ne s’applique pas si la 2FA est déjà active ou l’obligation coupée", () => {
    expect(deuxFacteursRequis("admin", true, true)).toBe(false);
    expect(deuxFacteursRequis("admin", false, false)).toBe(false);
  });

  it("laisse les rôles externes hors du gate", () => {
    expect(deuxFacteursRequis("presta", false, true)).toBe(false);
    expect(deuxFacteursRequis("proprietaire", false, true)).toBe(false);
    expect(deuxFacteursRequis("commercial", false, true)).toBe(false);
  });
});
