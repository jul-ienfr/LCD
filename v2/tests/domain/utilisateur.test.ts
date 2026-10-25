import { describe, expect, it } from "vitest";
import {
  LIBELLES_ROLE,
  ROLES_UTILISATEUR,
  emailUtilisateurValide,
  libelleRole,
  motDePasseValide,
  nomUtilisateurValide,
  roleUtilisateurValide,
} from "@/domain/utilisateur";

describe("domaine utilisateur", () => {
  it("accepte les six rôles connus", () => {
    expect(ROLES_UTILISATEUR).toHaveLength(6);
    for (const role of ROLES_UTILISATEUR) {
      expect(roleUtilisateurValide(role)).toBe(true);
      expect(libelleRole(role)).toBe(LIBELLES_ROLE[role]);
    }
    expect(roleUtilisateurValide("operateur")).toBe(false);
    expect(roleUtilisateurValide("")).toBe(false);
  });

  it("retombe sur le code brut pour un rôle inconnu", () => {
    expect(libelleRole("operateur")).toBe("operateur");
    expect(libelleRole("")).toBe("");
  });

  it("valide les emails", () => {
    expect(emailUtilisateurValide("equipe@lcd.fr")).toBe(true);
    expect(emailUtilisateurValide("  equipe@lcd.fr  ")).toBe(true);
    expect(emailUtilisateurValide("equipe+test@lcd.co")).toBe(true);
    expect(emailUtilisateurValide("")).toBe(false);
    expect(emailUtilisateurValide("equipe")).toBe(false);
    expect(emailUtilisateurValide("equipe@lcd")).toBe(false);
    expect(emailUtilisateurValide("equipe@lcd.c")).toBe(false);
    expect(emailUtilisateurValide("equipe @lcd.fr")).toBe(false);
    expect(emailUtilisateurValide(`${"a".repeat(250)}@lcd.fr`)).toBe(false);
  });

  it("impose 12 à 128 caractères au mot de passe", () => {
    expect(motDePasseValide("a".repeat(11))).toBe(false);
    expect(motDePasseValide("a".repeat(12))).toBe(true);
    expect(motDePasseValide("a".repeat(128))).toBe(true);
    expect(motDePasseValide("a".repeat(129))).toBe(false);
  });

  it("valide le nom après trim", () => {
    expect(nomUtilisateurValide("a")).toBe(false);
    expect(nomUtilisateurValide("  a  ")).toBe(false);
    expect(nomUtilisateurValide("Li")).toBe(true);
    expect(nomUtilisateurValide(` ${"a".repeat(120)} `)).toBe(true);
    expect(nomUtilisateurValide("a".repeat(121))).toBe(false);
  });
});
