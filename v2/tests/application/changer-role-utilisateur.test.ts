import { beforeEach, describe, expect, it } from "vitest";
import type { UtilisateurTenant } from "@/application/ports/user-repository";
import { ChangerRoleUtilisateur } from "@/application/use-cases/changer-role-utilisateur";
import { UserRepositoryMemoire } from "../helpers/user-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const AUTRE_TENANT = "22222222-2222-4222-8222-222222222222";

function semer(
  repo: UserRepositoryMemoire,
  data: {
    id: string;
    name: string;
    email: string;
    role: string;
    actif?: boolean;
    tenantId?: string;
  },
): UtilisateurTenant {
  const utilisateur: UtilisateurTenant = {
    id: data.id,
    tenantId: data.tenantId ?? TENANT,
    email: data.email,
    name: data.name,
    role: data.role,
    actif: data.actif ?? true,
  };
  repo.rows.push(utilisateur);
  return utilisateur;
}

describe("changement de rôle", () => {
  let repo: UserRepositoryMemoire;
  let changer: ChangerRoleUtilisateur;
  let admin1: UtilisateurTenant;
  let admin2: UtilisateurTenant;
  let hote: UtilisateurTenant;

  beforeEach(() => {
    repo = new UserRepositoryMemoire();
    changer = new ChangerRoleUtilisateur(repo);
    admin1 = semer(repo, {
      id: "admin-1",
      name: "Admin Un",
      email: "admin1@lcd.fr",
      role: "admin",
    });
    admin2 = semer(repo, {
      id: "admin-2",
      name: "Admin Deux",
      email: "admin2@lcd.fr",
      role: "admin",
    });
    hote = semer(repo, {
      id: "hote-1",
      name: "Hôte",
      email: "hote@lcd.fr",
      role: "hote",
    });
  });

  it("change le rôle d’un utilisateur", async () => {
    const resultat = await changer.executer({
      tenantId: TENANT,
      id: hote.id,
      role: "comptable",
      acteurId: admin1.id,
    });
    expect(resultat.role).toBe("comptable");
    expect(hote.role).toBe("comptable");
  });

  it("refuse de modifier son propre rôle", async () => {
    await expect(
      changer.executer({
        tenantId: TENANT,
        id: admin1.id,
        role: "hote",
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Vous ne pouvez pas modifier votre propre rôle.",
    });
    expect(admin1.role).toBe("admin");
  });

  it("protège le dernier administrateur actif", async () => {
    await changer.executer({
      tenantId: TENANT,
      id: admin2.id,
      role: "hote",
      acteurId: admin1.id,
    });

    await expect(
      changer.executer({
        tenantId: TENANT,
        id: admin1.id,
        role: "hote",
        acteurId: hote.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Impossible de retirer le rôle du dernier administrateur actif.",
    });
    expect(admin1.role).toBe("admin");
  });

  it("refuse un rôle inconnu et un utilisateur d’un autre tenant", async () => {
    const autre = semer(repo, {
      id: "autre-1",
      name: "Autre",
      email: "autre@lcd.fr",
      role: "hote",
      tenantId: AUTRE_TENANT,
    });

    await expect(
      changer.executer({
        tenantId: TENANT,
        id: hote.id,
        role: "superadmin",
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Rôle inconnu.",
    });

    await expect(
      changer.executer({
        tenantId: TENANT,
        id: autre.id,
        role: "comptable",
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Utilisateur introuvable.",
    });
  });

  it("ne fait rien si le rôle est identique", async () => {
    const resultat = await changer.executer({
      tenantId: TENANT,
      id: hote.id,
      role: "hote",
      acteurId: admin1.id,
    });
    expect(resultat.role).toBe("hote");
  });
});
