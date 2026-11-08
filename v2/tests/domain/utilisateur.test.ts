import { describe, expect, it } from "vitest";
import {
  LIBELLES_ROLE,
  ROLES_UTILISATEUR,
  assuranceRcValide,
  emailDansAllowlistSuperAdmin,
  emailUtilisateurValide,
  libelleRole,
  motDePasseValide,
  nomUtilisateurValide,
  peutAdministrerCompte,
  peutAttribuerRole,
  roleUtilisateurValide,
} from "@/domain/utilisateur";

describe("domaine utilisateur", () => {
  it("accepte les huit rôles connus", () => {
    expect(ROLES_UTILISATEUR).toHaveLength(8);
    for (const role of ROLES_UTILISATEUR) {
      expect(roleUtilisateurValide(role)).toBe(true);
      expect(libelleRole(role)).toBe(LIBELLES_ROLE[role]);
    }
    expect(roleUtilisateurValide("super_admin")).toBe(true);
    expect(roleUtilisateurValide("operateur")).toBe(true);
    expect(roleUtilisateurValide("")).toBe(false);
  });

  it("réserve le rôle super-admin à un super-admin", () => {
    expect(peutAttribuerRole("super_admin", "super_admin")).toBe(true);
    expect(peutAttribuerRole("admin", "super_admin")).toBe(false);
    expect(peutAttribuerRole(undefined, "super_admin")).toBe(false);
    expect(peutAttribuerRole("admin", "hote")).toBe(true);
    expect(peutAdministrerCompte("super_admin", "super_admin")).toBe(true);
    expect(peutAdministrerCompte("admin", "super_admin")).toBe(false);
    expect(peutAdministrerCompte("admin", "comptable")).toBe(true);
  });

  it("reconnaît l'allowlist super-admin sans tenir compte de la casse", () => {
    expect(
      emailDansAllowlistSuperAdmin(
        "Owner@LCD.test",
        "autre@lcd.test, owner@lcd.test ",
      ),
    ).toBe(true);
    expect(emailDansAllowlistSuperAdmin("owner@lcd.test", "")).toBe(false);
    expect(emailDansAllowlistSuperAdmin(null, "owner@lcd.test")).toBe(false);
    expect(
      emailDansAllowlistSuperAdmin("owner@lcd.test.evil", "owner@lcd.test"),
    ).toBe(false);
  });

  it("retombe sur le code brut pour un rôle inconnu", () => {
    expect(libelleRole("inconnu")).toBe("inconnu");
    expect(libelleRole("")).toBe("");
  });

  it("bloque une RC absente ou expirée", () => {
    expect(assuranceRcValide(null, "2026-10-26")).toBe(false);
    expect(assuranceRcValide(undefined, "2026-10-26")).toBe(false);
    expect(assuranceRcValide("2026-10-25", "2026-10-26")).toBe(false);
    expect(assuranceRcValide("2026-10-26", "2026-10-26")).toBe(true);
    expect(assuranceRcValide("2027-01-01", "2026-10-26")).toBe(true);
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
