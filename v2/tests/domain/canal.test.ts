import { describe, expect, it } from "vitest";
import {
  BUFFER_MAX_JOURS,
  bufferJoursValide,
  cleCanal,
  codeCanalValide,
  externalListingIdValide,
  ficheCanal,
  libelleCanalValide,
} from "@/domain/canal";

describe("canal", () => {
  it("reconnaît les plateformes du catalogue", () => {
    expect(codeCanalValide("airbnb")).toBe(true);
    expect(codeCanalValide("booking")).toBe(true);
    expect(codeCanalValide("generique")).toBe(true);
    expect(codeCanalValide("inconnu")).toBe(false);
    expect(ficheCanal("airbnb")?.nom).toBe("Airbnb");
  });

  it("marque les plateformes iCal à vérifier", () => {
    expect(ficheCanal("agoda")?.aVerifier).toBe(true);
    expect(ficheCanal("airbnb")?.aVerifier).toBe(false);
  });

  it("valide le libellé", () => {
    expect(libelleCanalValide("Airbnb — Studio Nice")).toBe(true);
    expect(libelleCanalValide(" a ")).toBe(false);
    expect(libelleCanalValide("x".repeat(81))).toBe(false);
  });

  it("valide le buffer de ménage", () => {
    expect(bufferJoursValide(0)).toBe(true);
    expect(bufferJoursValide(BUFFER_MAX_JOURS)).toBe(true);
    expect(bufferJoursValide(-1)).toBe(false);
    expect(bufferJoursValide(BUFFER_MAX_JOURS + 1)).toBe(false);
    expect(bufferJoursValide(1.5)).toBe(false);
  });

  it("construit une clé stable par annonce", () => {
    expect(cleCanal("airbnb", null)).toBe("airbnb:principal");
    expect(cleCanal("airbnb", " 12345678 ")).toBe("airbnb:12345678");
    expect(cleCanal("airbnb", "ABC")).toBe("airbnb:abc");
  });

  it("refuse les identifiants avec caractères de contrôle", () => {
    expect(externalListingIdValide(null)).toBe(true);
    expect(externalListingIdValide("12345678")).toBe(true);
    expect(externalListingIdValide("abc\u0000def")).toBe(false);
    expect(externalListingIdValide("x".repeat(121))).toBe(false);
  });
});
