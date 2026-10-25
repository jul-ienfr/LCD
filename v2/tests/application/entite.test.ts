import { beforeEach, describe, expect, it } from "vitest";
import { MettreAJourEntite } from "@/application/use-cases/mettre-a-jour-entite";
import type { Tenant } from "@/domain/tenant";
import { TenantRepositoryMemoire } from "../helpers/tenant-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";

function tenant(): Tenant {
  return {
    id: TENANT,
    slug: "lcd",
    nom: "LCD Parc",
    nature: "nom_propre",
    regime: "micro_bic_non_classe",
    tva: "non",
    siren: null,
    adresse: null,
    mentionsLegales: null,
    statut: "actif",
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("mise à jour de l’entité", () => {
  let repo: TenantRepositoryMemoire;
  let useCase: MettreAJourEntite;

  beforeEach(() => {
    repo = new TenantRepositoryMemoire();
    repo.ajouter(tenant());
    useCase = new MettreAJourEntite(repo);
  });

  it("met à jour une entité valide", async () => {
    const entite = await useCase.executer({
      tenantId: TENANT,
      nom: "  LCD Parc SARL  ",
      nature: "sarl",
      regime: "reel_simplifie",
      tva: "reelle",
      siren: "123456789",
      adresse: "12 rue des Lilas, 75011 Paris",
      mentionsLegales: "TVA acquittée sur les encaissements.",
    });
    expect(entite.nom).toBe("LCD Parc SARL");
    expect(entite.siren).toBe("123456789");
    expect(entite.nature).toBe("sarl");
  });

  it("accepte un SIREN vide", async () => {
    const entite = await useCase.executer({
      tenantId: TENANT,
      nom: "LCD Parc",
      nature: "nom_propre",
      regime: "micro_bic_non_classe",
      tva: "non",
      siren: "",
      adresse: "",
      mentionsLegales: "",
    });
    expect(entite.siren).toBeNull();
    expect(entite.adresse).toBeNull();
    expect(entite.mentionsLegales).toBeNull();
  });

  it("refuse un SIREN invalide et un régime inconnu", async () => {
    await expect(
      useCase.executer({
        tenantId: TENANT,
        nom: "LCD Parc",
        nature: "nom_propre",
        regime: "micro_bic_non_classe",
        tva: "non",
        siren: "12345678",
        adresse: null,
        mentionsLegales: null,
      }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });

    await expect(
      useCase.executer({
        tenantId: TENANT,
        nom: "LCD Parc",
        nature: "nom_propre",
        regime: "inconnu",
        tva: "non",
        siren: null,
        adresse: null,
        mentionsLegales: null,
      }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });
  });

  it("refuse un tenant inconnu", async () => {
    await expect(
      useCase.executer({
        tenantId: "22222222-2222-4222-8222-222222222222",
        nom: "LCD Parc",
        nature: "nom_propre",
        regime: "micro_bic_non_classe",
        tva: "non",
        siren: null,
        adresse: null,
        mentionsLegales: null,
      }),
    ).rejects.toMatchObject({ code: "TENANT_INVALIDE" });
  });
});
