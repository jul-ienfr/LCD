import { describe, expect, it } from "vitest";
import { logementPubliable } from "@/domain/logement";

describe("publiabilité d’un logement", () => {
  it("exige un logement actif et une copropriété vérifiée", () => {
    expect(
      logementPubliable({ statut: "actif", coproVerifiee: true }),
    ).toBe(true);
    expect(
      logementPubliable({ statut: "actif", coproVerifiee: false }),
    ).toBe(false);
    expect(
      logementPubliable({ statut: "inactif", coproVerifiee: true }),
    ).toBe(false);
    expect(
      logementPubliable({ statut: "archive", coproVerifiee: true }),
    ).toBe(false);
  });
});
