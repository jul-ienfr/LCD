import { beforeEach, describe, expect, it } from "vitest";
import { CreerEspace } from "@/application/use-cases/creer-espace";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";
import { TenantRepositoryMemoire } from "../helpers/tenant-repository-memoire";
import { UserRepositoryMemoire } from "../helpers/user-repository-memoire";

const BASE = {
  acteurRole: "super_admin",
  slug: "parc-nord",
  nom: "Parc Nord",
  adminNom: "Julie Martin",
  adminEmail: "Julie.Martin@Parc-Nord.FR",
  adminPassword: "MotDePasse-2026!",
  logementCode: "LOG-1",
  logementNom: "Santa Severa",
  logementAdresse: "Saint-Laurent-du-Var",
} as const;

describe("CreerEspace (FR-018)", () => {
  let tenants: TenantRepositoryMemoire;
  let users: UserRepositoryMemoire;
  let logements: LogementRepositoryMemoire;
  let useCase: CreerEspace;

  beforeEach(() => {
    tenants = new TenantRepositoryMemoire();
    users = new UserRepositoryMemoire();
    logements = new LogementRepositoryMemoire();
    useCase = new CreerEspace(tenants, users, logements);
  });

  it("crée l’espace complet : tenant, compte admin et premier logement", async () => {
    const { tenant, admin, logement } = await useCase.executer({ ...BASE });

    expect(tenant).toMatchObject({
      slug: "parc-nord",
      nom: "Parc Nord",
      statut: "actif",
    });
    expect(admin).toMatchObject({
      tenantId: tenant.id,
      role: "admin",
      name: "Julie Martin",
      email: "julie.martin@parc-nord.fr",
      actif: true,
    });
    expect(logement).toMatchObject({
      tenantId: tenant.id,
      code: "log-1",
      nom: "Santa Severa",
      adresse: "Saint-Laurent-du-Var",
    });
    expect(users.motsDePasse.get(admin.id)).toBe("MotDePasse-2026!");
    expect(await tenants.lister()).toHaveLength(1);
  });

  it("refuse un acteur qui n’est pas super-administrateur", async () => {
    await expect(
      useCase.executer({ ...BASE, acteurRole: "admin" }),
    ).rejects.toMatchObject({ code: "NON_AUTORISE" });
    expect(await tenants.lister()).toHaveLength(0);
    expect(users.rows).toHaveLength(0);
  });

  it("refuse un slug invalide avant toute écriture", async () => {
    await expect(
      useCase.executer({ ...BASE, slug: "Parc Nord !" }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(0);
    expect(users.rows).toHaveLength(0);
  });

  it("refuse un nom d’espace hors bornes avant toute écriture", async () => {
    await expect(
      useCase.executer({ ...BASE, nom: "x" }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(0);
  });

  it("refuse un slug déjà utilisé", async () => {
    await useCase.executer({ ...BASE });
    await expect(
      useCase.executer({
        ...BASE,
        adminEmail: "autre@parc-nord.fr",
        logementCode: "log-2",
      }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(1);
    expect(users.rows).toHaveLength(1);
  });

  it("refuse un email déjà utilisé avant de créer l’espace", async () => {
    await users.creer({
      tenantId: "11111111-1111-4111-8111-111111111111",
      name: "Déjà là",
      email: BASE.adminEmail,
      role: "hote",
      password: "MotDePasse-2026!",
    });

    await expect(useCase.executer({ ...BASE })).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
    });
    expect(await tenants.lister()).toHaveLength(0);
  });

  it("nettoie l’espace si le code logement est invalide", async () => {
    await expect(
      useCase.executer({ ...BASE, logementCode: "A!" }),
    ).rejects.toMatchObject({ code: "CODE_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(0);
  });

  it("nettoie l’espace si le mot de passe admin est trop court", async () => {
    await expect(
      useCase.executer({ ...BASE, adminPassword: "court" }),
    ).rejects.toMatchObject({ code: "UTILISATEUR_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(0);
  });

  it("nettoie l’espace si l’email admin est mal formé", async () => {
    await expect(
      useCase.executer({ ...BASE, adminEmail: "pas-un-email" }),
    ).rejects.toMatchObject({ code: "UTILISATEUR_INVALIDE" });
    expect(await tenants.lister()).toHaveLength(0);
  });
});
