import { beforeEach, describe, expect, it } from "vitest";
import {
  chiffrer,
  dechiffrer,
  reinitialiserCleMaitre,
  verifierChiffrement,
} from "@/lib/server/chiffrement";

const SECRET_TEST = "cle-secrete-de-test-32-characters!";

describe("chiffrement applicatif", () => {
  beforeEach(() => {
    reinitialiserCleMaitre();
  });

  it("chiffre et déchiffre correctement", () => {
    const clair = "sk_live_abc123xyz";
    const chiffre = chiffrer(clair, SECRET_TEST);
    expect(chiffre).not.toBe(clair);
    expect(chiffre).not.toContain(clair);

    const dechiffre = dechiffrer(chiffre, SECRET_TEST);
    expect(dechiffre).toBe(clair);
  });

  it("produit un format iv:tag:ciphertext en base64url", () => {
    const chiffre = chiffrer("secret", SECRET_TEST);
    const parties = chiffre.split(":");
    expect(parties).toHaveLength(3);
    // base64url : pas de +, /, =
    for (const partie of parties) {
      expect(partie).toMatch(/^[A-Za-z0-9_-]+$/);
    }
  });

  it("produit des chiffrés différents pour le même clair (IV aléatoire)", () => {
    const a = chiffrer("meme-secret", SECRET_TEST);
    const b = chiffrer("meme-secret", SECRET_TEST);
    expect(a).not.toBe(b);
    // Mais les deux se déchiffrent pareil
    expect(dechiffrer(a, SECRET_TEST)).toBe("meme-secret");
    expect(dechiffrer(b, SECRET_TEST)).toBe("meme-secret");
  });

  it("échoue avec une mauvaise clé", () => {
    const chiffre = chiffrer("secret", SECRET_TEST);
    expect(() => dechiffrer(chiffre, "mauvaise-cle-32-characters!!!!!")).toThrow();
  });

  it("échoue avec un format invalide", () => {
    expect(() => dechiffrer("pas-un-format-valide", SECRET_TEST)).toThrow("format invalide");
    expect(() => dechiffrer("a:b", SECRET_TEST)).toThrow("format invalide");
  });

  it("échoue avec un tag altéré (authentification)", () => {
    const chiffre = chiffrer("secret", SECRET_TEST);
    const parties = chiffre.split(":");
    // Altérer le tag
    const tagOriginal = Buffer.from(parties[1]!, "base64url");
    tagOriginal[0] = tagOriginal[0]! ^ 0xff;
    parties[1] = tagOriginal.toString("base64url");
    expect(() => dechiffrer(parties.join(":"), SECRET_TEST)).toThrow();
  });

  it("verifierChiffrement retourne true pour un chiffré valide", () => {
    const chiffre = chiffrer("secret", SECRET_TEST);
    expect(verifierChiffrement(chiffre, SECRET_TEST)).toBe(true);
  });

  it("verifierChiffrement retourne false pour un chiffré invalide", () => {
    expect(verifierChiffrement("n-importe-quoi", SECRET_TEST)).toBe(false);
    const chiffre = chiffrer("secret", SECRET_TEST);
    expect(verifierChiffrement(chiffre, "mauvaise-cle")).toBe(false);
  });

  it("gère les chaînes vides et longues", () => {
    const vide = chiffrer("", SECRET_TEST);
    expect(dechiffrer(vide, SECRET_TEST)).toBe("");

    const long = "x".repeat(10_000);
    const chiffreLong = chiffrer(long, SECRET_TEST);
    expect(dechiffrer(chiffreLong, SECRET_TEST)).toBe(long);
  });

  it("gère les caractères unicode", () => {
    const unicode = "clé-secrète-émoji-🔑";
    const chiffre = chiffrer(unicode, SECRET_TEST);
    expect(dechiffrer(chiffre, SECRET_TEST)).toBe(unicode);
  });
});
