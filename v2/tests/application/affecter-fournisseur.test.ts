import { describe, expect, it } from "vitest";
import { AffecterFournisseur } from "@/application/use-cases/affecter-fournisseur";
import { FournisseurRepositoryMemoire } from "../helpers/fournisseur-repository-memoire";
import type { FournisseurCanal, LogementExterne, ResultatTestFournisseur } from "@/application/ports/fournisseur-canal";
import type { SanteConnexion } from "@/domain/canal";
import type { CodeFournisseur } from "@/domain/fournisseur";

const base = {
  tenantId: "11111111-1111-4111-8111-111111111111",
  logementId: "22222222-2222-4222-8222-222222222222",
};

function creerFauxFournisseur(
  code: CodeFournisseur,
  resultat: ResultatTestFournisseur,
): FournisseurCanal {
  return {
    code,
    mode: "complet",
    capacites: {
      ecritureDisponibilites: true,
      ecritureTarifs: true,
      ecritureRestrictions: true,
      lectureReservations: true,
      webhooks: true,
      marqueBlanche: false,
      messaging: false,
      multiUnite: false,
      googleVr: false,
    },
    testerConnexion: async () => resultat,
    listerLogements: async () => [],
    recupererReservations: async () => [],
    pousserDisponibilites: async () => {},
    pousserTarifs: async () => {},
    pousserRestrictions: async () => {},
    verifierWebhook: async () => true,
  };
}

describe("AffecterFournisseur", () => {
  it("affecte un fournisseur et ses identifiants externes", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("channex", true, "super@lcd.test");
    const affectation = await new AffecterFournisseur(repo).executer({
      ...base,
      fournisseurCode: "channex",
      externalPropertyId: "property-1",
      externalRoomTypeId: "room-1",
      externalRatePlanId: "rate-1",
    });
    expect(affectation.fournisseurCode).toBe("channex");
    expect(affectation.externalRoomTypeId).toBe("room-1");
    expect(affectation.externalRatePlanId).toBe("rate-1");
  });

  it("remplace le fournisseur d'un logement sans doublon", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("beds24", true, "super@lcd.test");
    await repo.definirActivation("smoobu", true, "super@lcd.test");
    const useCase = new AffecterFournisseur(repo);
    await useCase.executer({ ...base, fournisseurCode: "beds24" });
    await useCase.executer({ ...base, fournisseurCode: "smoobu" });
    expect(repo.affectations).toHaveLength(1);
    expect(repo.affectations[0]?.fournisseurCode).toBe("smoobu");
  });

  it("refuse un fournisseur non activé", async () => {
    await expect(
      new AffecterFournisseur(new FournisseurRepositoryMemoire()).executer({
        ...base,
        fournisseurCode: "beds24",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });

  it("refuse un code inconnu", async () => {
    await expect(
      new AffecterFournisseur(new FournisseurRepositoryMemoire()).executer({
        ...base,
        fournisseurCode: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "FOURNISSEUR_INVALIDE" });
  });

  // --- T116 : test de connexion ---

  it("exécute le test de connexion quand la factory est fournie et enregistre la santé ok", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("beds24", true, "super@lcd.test");
    const faux = creerFauxFournisseur("beds24", {
      ok: true,
      message: "Beds24 joignable.",
    });
    const useCase = new AffecterFournisseur(repo, () => faux);
    const affectation = await useCase.executer({
      ...base,
      fournisseurCode: "beds24",
      externalPropertyId: "prop-42",
    });
    expect(affectation.fournisseurCode).toBe("beds24");
    // La santé doit être enregistrée comme ok
    expect(affectation.dernierStatut).toBe("ok");
    expect(affectation.dernierMessage).toContain("Connexion vérifiée");
  });

  it("affecte quand même si le test de connexion échoue (trace l'erreur)", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("beds24", true, "super@lcd.test");
    const faux = creerFauxFournisseur("beds24", {
      ok: false,
      message: "Jeton expiré.",
    });
    const useCase = new AffecterFournisseur(repo, () => faux);
    const affectation = await useCase.executer({
      ...base,
      fournisseurCode: "beds24",
    });
    // L'affectation réussit quand même
    expect(affectation.fournisseurCode).toBe("beds24");
    // Mais la santé trace l'échec
    expect(affectation.dernierStatut).toBe("erreur");
    expect(affectation.dernierMessage).toContain("Test connexion échoué");
  });

  it("affecte quand le test de connexion lève une exception (trace l'erreur)", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("channex", true, "super@lcd.test");
    const faux = {
      ...creerFauxFournisseur("channex", { ok: true, message: "ok" }),
      testerConnexion: async () => {
        throw new Error("timeout réseau");
      },
    };
    const useCase = new AffecterFournisseur(repo, () => faux);
    const affectation = await useCase.executer({
      ...base,
      fournisseurCode: "channex",
    });
    expect(affectation.fournisseurCode).toBe("channex");
    expect(affectation.dernierStatut).toBe("erreur");
    expect(affectation.dernierMessage).toContain("timeout réseau");
  });

  it("fonctionne sans factory (comportement legacy, pas de test connexion)", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("smoobu", true, "super@lcd.test");
    const useCase = new AffecterFournisseur(repo); // pas de factory
    const affectation = await useCase.executer({
      ...base,
      fournisseurCode: "smoobu",
    });
    expect(affectation.fournisseurCode).toBe("smoobu");
    // Pas de test connexion : pas de statut enregistré
    expect(affectation.dernierStatut).toBeNull();
  });

  it("la factory retournant null (fournisseur non configuré) ne bloque pas", async () => {
    const repo = new FournisseurRepositoryMemoire();
    await repo.definirActivation("hostport", true, "super@lcd.test");
    const useCase = new AffecterFournisseur(repo, () => null);
    const affectation = await useCase.executer({
      ...base,
      fournisseurCode: "hostport",
    });
    expect(affectation.fournisseurCode).toBe("hostport");
    expect(affectation.dernierStatut).toBeNull();
  });
});
