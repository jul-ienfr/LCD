import { describe, expect, it } from "vitest";
import {
  emailValide,
  prospectValide,
  TRANSITIONS_PROSPECT,
} from "@/domain/prospect";

describe("prospect", () => {
  it("valide un prospect correct", () => {
    expect(
      prospectValide({
        nom: "M. Dupont",
        email: "dupont@example.com",
        telephone: "+33612345678",
      }),
    ).toBe(true);
  });

  it("refuse un email invalide", () => {
    expect(emailValide("pas-un-email")).toBe(false);
    expect(
      prospectValide({ nom: "Test", email: "pas-un-email" }),
    ).toBe(false);
  });

  it("refuse un nom trop court", () => {
    expect(prospectValide({ nom: "A" })).toBe(false);
  });

  it("définit les transitions du pipeline", () => {
    expect(TRANSITIONS_PROSPECT.nouveau).toContain("qualifie");
    expect(TRANSITIONS_PROSPECT.gagne).toHaveLength(0);
  });
});
