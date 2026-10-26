import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import { ReinitialiserDeuxFacteurs } from "@/application/use-cases/reinitialiser-deux-facteurs";
import { UserRepositoryMemoire } from "../helpers/user-repository-memoire";

async function utilisateurAvecDeuxFacteurs() {
  const users = new UserRepositoryMemoire();
  const cible = await users.creer({
    tenantId: "tenant-1",
    name: "Camille",
    email: "camille@example.com",
    role: "hote",
    password: "MotDePasse-2026!",
  });
  users.activerDeuxFacteurs(cible.id);
  return { users, cible };
}

describe("réinitialisation de la 2FA par un admin", () => {
  it("supprime le facteur et les sessions de la cible", async () => {
    const { users, cible } = await utilisateurAvecDeuxFacteurs();
    const resultat = await new ReinitialiserDeuxFacteurs(users).executer({
      tenantId: "tenant-1",
      id: cible.id,
      acteurId: "admin-1",
    });

    expect(resultat.email).toBe("camille@example.com");
    expect(await users.aDeuxFacteurs("tenant-1", cible.id)).toBe(false);
  });

  it("refuse de réinitialiser sa propre 2FA", async () => {
    const { users, cible } = await utilisateurAvecDeuxFacteurs();
    await expect(
      new ReinitialiserDeuxFacteurs(users).executer({
        tenantId: "tenant-1",
        id: cible.id,
        acteurId: cible.id,
      }),
    ).rejects.toThrow(/page Sécurité/);
    expect(await users.aDeuxFacteurs("tenant-1", cible.id)).toBe(true);
  });

  it("refuse un compte sans 2FA ou d’un autre tenant", async () => {
    const users = new UserRepositoryMemoire();
    const sansDeuxFacteurs = await users.creer({
      tenantId: "tenant-1",
      name: "Sans 2FA",
      email: "sans@example.com",
      role: "hote",
      password: "MotDePasse-2026!",
    });

    await expect(
      new ReinitialiserDeuxFacteurs(users).executer({
        tenantId: "tenant-1",
        id: sansDeuxFacteurs.id,
        acteurId: "admin-1",
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);

    const { cible } = await utilisateurAvecDeuxFacteurs();
    await expect(
      new ReinitialiserDeuxFacteurs(users).executer({
        tenantId: "tenant-2",
        id: cible.id,
        acteurId: "admin-1",
      }),
    ).rejects.toThrow(/introuvable/);
  });
});
