import { beforeEach, describe, expect, it } from "vitest";
import type { UtilisateurTenant } from "@/application/ports/user-repository";
import { ChangerActifUtilisateur } from "@/application/use-cases/changer-actif-utilisateur";
import { CreerUtilisateur } from "@/application/use-cases/creer-utilisateur";
import { ReinitialiserMotDePasse } from "@/application/use-cases/reinitialiser-mot-de-passe";
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
    email: data.email.toLowerCase(),
    name: data.name,
    role: data.role,
    actif: data.actif ?? true,
  };
  repo.rows.push(utilisateur);
  repo.motsDePasse.set(utilisateur.id, "AncienMotDePasse-2026!");
  return utilisateur;
}

describe("création d’utilisateur", () => {
  let repo: UserRepositoryMemoire;
  let creer: CreerUtilisateur;

  beforeEach(() => {
    repo = new UserRepositoryMemoire();
    creer = new CreerUtilisateur(repo);
  });

  it("crée un compte avec un email normalisé", async () => {
    const utilisateur = await creer.executer({
      tenantId: TENANT,
      name: "  Julie Martin  ",
      email: " Julie.Martin@LCD.FR ",
      role: "hote",
      password: "MotDePasse-2026!",
    });

    expect(utilisateur).toMatchObject({
      tenantId: TENANT,
      name: "Julie Martin",
      email: "julie.martin@lcd.fr",
      role: "hote",
      actif: true,
    });
    expect(repo.rows).toHaveLength(1);
    expect(repo.motsDePasse.get(utilisateur.id)).toBe("MotDePasse-2026!");
  });

  it("refuse un email déjà utilisé, sans tenir compte de la casse", async () => {
    semer(repo, {
      id: "user-existant",
      name: "Existant",
      email: "julie@lcd.fr",
      role: "hote",
    });

    await expect(
      creer.executer({
        tenantId: TENANT,
        name: "Julie",
        email: "JULIE@lcd.fr",
        role: "hote",
        password: "MotDePasse-2026!",
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Un compte utilise déjà cette adresse email.",
    });
    expect(repo.rows).toHaveLength(1);
  });

  it("refuse les champs invalides", async () => {
    const base = {
      tenantId: TENANT,
      name: "Julie",
      email: "julie@lcd.fr",
      role: "hote",
      password: "MotDePasse-2026!",
    };

    await expect(creer.executer({ ...base, role: "superadmin" })).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Rôle inconnu.",
    });
    await expect(
      creer.executer({ ...base, password: "court" }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Le mot de passe doit contenir entre 12 et 128 caractères.",
    });
    await expect(
      creer.executer({ ...base, email: "pas-un-email" }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "L’adresse email n’est pas valide.",
    });
    await expect(
      creer.executer({ ...base, name: " " }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Le nom doit contenir entre 2 et 120 caractères.",
    });
    expect(repo.rows).toHaveLength(0);
  });
});

describe("activation d’utilisateur", () => {
  let repo: UserRepositoryMemoire;
  let changer: ChangerActifUtilisateur;
  let admin1: UtilisateurTenant;
  let admin2: UtilisateurTenant;
  let hote: UtilisateurTenant;

  beforeEach(() => {
    repo = new UserRepositoryMemoire();
    changer = new ChangerActifUtilisateur(repo);
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

  it("interdit de désactiver son propre compte", async () => {
    await expect(
      changer.executer({
        tenantId: TENANT,
        id: admin1.id,
        actif: false,
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Vous ne pouvez pas désactiver votre propre compte.",
    });
    expect(admin1.actif).toBe(true);
  });

  it("désactive puis réactive un compte", async () => {
    const desactive = await changer.executer({
      tenantId: TENANT,
      id: hote.id,
      actif: false,
      acteurId: admin1.id,
    });
    expect(desactive.actif).toBe(false);

    const reactive = await changer.executer({
      tenantId: TENANT,
      id: hote.id,
      actif: true,
      acteurId: admin1.id,
    });
    expect(reactive.actif).toBe(true);
  });

  it("protège le dernier administrateur actif", async () => {
    await changer.executer({
      tenantId: TENANT,
      id: admin2.id,
      actif: false,
      acteurId: admin1.id,
    });

    await expect(
      changer.executer({
        tenantId: TENANT,
        id: admin1.id,
        actif: false,
        acteurId: hote.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Impossible de désactiver le dernier administrateur actif.",
    });
    expect(admin1.actif).toBe(true);
  });

  it("refuse un utilisateur d’un autre tenant ou inconnu", async () => {
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
        id: autre.id,
        actif: false,
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Utilisateur introuvable.",
    });
    await expect(
      changer.executer({
        tenantId: TENANT,
        id: "inconnu",
        actif: true,
        acteurId: admin1.id,
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Utilisateur introuvable.",
    });
  });
});

describe("réinitialisation de mot de passe", () => {
  let repo: UserRepositoryMemoire;
  let reinitialiser: ReinitialiserMotDePasse;
  let hote: UtilisateurTenant;

  beforeEach(() => {
    repo = new UserRepositoryMemoire();
    reinitialiser = new ReinitialiserMotDePasse(repo);
    hote = semer(repo, {
      id: "hote-1",
      name: "Hôte",
      email: "hote@lcd.fr",
      role: "hote",
    });
  });

  it("remplace le mot de passe", async () => {
    const cible = await reinitialiser.executer({
      tenantId: TENANT,
      id: hote.id,
      password: "NouveauMotDePasse-2026!",
    });
    expect(cible.email).toBe("hote@lcd.fr");
    expect(repo.motsDePasse.get(hote.id)).toBe("NouveauMotDePasse-2026!");
  });

  it("refuse un mot de passe trop court", async () => {
    await expect(
      reinitialiser.executer({
        tenantId: TENANT,
        id: hote.id,
        password: "court",
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Le mot de passe doit contenir entre 12 et 128 caractères.",
    });
    expect(repo.motsDePasse.get(hote.id)).toBe("AncienMotDePasse-2026!");
  });

  it("refuse un utilisateur d’un autre tenant", async () => {
    await expect(
      reinitialiser.executer({
        tenantId: AUTRE_TENANT,
        id: hote.id,
        password: "NouveauMotDePasse-2026!",
      }),
    ).rejects.toMatchObject({
      code: "UTILISATEUR_INVALIDE",
      message: "Utilisateur introuvable.",
    });
  });
});
