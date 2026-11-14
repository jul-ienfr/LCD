import { describe, expect, it } from "vitest";
import { cleIdempotence, hashPayload, tronquerEmpreinte } from "@/domain/idempotence";

describe("idempotence", () => {
  describe("cleIdempotence", () => {
    it("produit une clé SHA-256 hex de 64 caractères", () => {
      const cle = cleIdempotence("tenant-1", "logement-2", "action");
      expect(cle).toMatch(/^[0-9a-f]{64}$/);
    });

    it("est déterministe : mêmes composants → même clé", () => {
      const a = cleIdempotence("t1", "l1", "push");
      const b = cleIdempotence("t1", "l1", "push");
      expect(a).toBe(b);
    });

    it("produit des clés différentes pour des composants différents", () => {
      const a = cleIdempotence("t1", "l1", "push");
      const b = cleIdempotence("t1", "l1", "pull");
      const c = cleIdempotence("t2", "l1", "push");
      expect(a).not.toBe(b);
      expect(a).not.toBe(c);
    });

    it("ignore les composants null ou undefined", () => {
      const avec = cleIdempotence("t1", null, "action", undefined);
      const sans = cleIdempotence("t1", "action");
      expect(avec).toBe(sans);
    });

    it("ignore les composants vides", () => {
      const avec = cleIdempotence("t1", "", "action");
      const sans = cleIdempotence("t1", "action");
      expect(avec).toBe(sans);
    });

    it("lance une erreur si aucun composant valide", () => {
      expect(() => cleIdempotence()).toThrow("au moins un composant");
      expect(() => cleIdempotence("")).toThrow("au moins un composant");
      expect(() => cleIdempotence(null, undefined)).toThrow("au moins un composant");
    });
  });

  describe("hashPayload", () => {
    it("hash un string en SHA-256 hex", () => {
      const empreinte = hashPayload('{"action":"booking"}');
      expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
    });

    it("hash un Buffer correctement", () => {
      const empreinte = hashPayload(Buffer.from("test"));
      expect(empreinte).toMatch(/^[0-9a-f]{64}$/);
    });

    it("est déterministe", () => {
      const a = hashPayload("contenu");
      const b = hashPayload("contenu");
      expect(a).toBe(b);
    });

    it("produit des empreintes différentes pour des contenus différents", () => {
      const a = hashPayload("contenu-a");
      const b = hashPayload("contenu-b");
      expect(a).not.toBe(b);
    });
  });

  describe("tronquerEmpreinte", () => {
    it("tronque à 16 caractères par défaut", () => {
      const empreinte = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";
      expect(tronquerEmpreinte(empreinte)).toBe("abcdef1234567890");
    });

    it("respecte la longueur demandée", () => {
      const empreinte = "abcdef1234567890abcdef";
      expect(tronquerEmpreinte(empreinte, 8)).toBe("abcdef12");
    });
  });
});
