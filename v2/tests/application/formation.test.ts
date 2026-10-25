import { describe, expect, it } from "vitest";
import type {
  EnregistrerProgressionData,
  FormationsRepository,
} from "@/application/ports/formations-repository";
import { EnregistrerFormation } from "@/application/use-cases/formation";
import type { ProgressionFormation } from "@/domain/formation";

class MemoireFormations implements FormationsRepository {
  items: ProgressionFormation[] = [];

  async trouver(
    tenantId: string,
    userId: string,
    moduleCode: string,
  ): Promise<ProgressionFormation | null> {
    return (
      this.items.find(
        (p) =>
          p.tenantId === tenantId &&
          p.userId === userId &&
          p.moduleCode === moduleCode,
      ) ?? null
    );
  }
  async enregistrer(
    data: EnregistrerProgressionData,
  ): Promise<ProgressionFormation> {
    const existante = await this.trouver(
      data.tenantId,
      data.userId,
      data.moduleCode,
    );
    if (existante) {
      existante.etapesFaites = [...data.etapesFaites];
      existante.updatedAt = new Date();
      return existante;
    }
    const progression: ProgressionFormation = {
      ...data,
      updatedAt: new Date(),
    };
    this.items.push(progression);
    return progression;
  }
  async listerParUtilisateur(tenantId: string, userId: string) {
    return this.items.filter(
      (p) => p.tenantId === tenantId && p.userId === userId,
    );
  }
}

const base = {
  tenantId: "t1",
  userId: "u1",
  moduleCode: "accueil",
  etapesFaites: ["guide", "check-in", "inventee"],
};

describe("cas d'usage formation", () => {
  it("enregistre une progression filtrée", async () => {
    const repo = new MemoireFormations();
    const progression = await new EnregistrerFormation(repo).executer(base);
    expect(progression.etapesFaites).toEqual(["guide", "check-in"]);
    expect(repo.items).toHaveLength(1);
  });

  it("met à jour la progression existante sans doublon", async () => {
    const repo = new MemoireFormations();
    const cas = new EnregistrerFormation(repo);
    await cas.executer(base);
    const misAJour = await cas.executer({
      ...base,
      etapesFaites: ["guide", "check-in", "etat-entree", "message-arrivee"],
    });
    expect(misAJour.etapesFaites).toHaveLength(4);
    expect(repo.items).toHaveLength(1);
  });

  it("refuse un module inconnu", async () => {
    const repo = new MemoireFormations();
    await expect(
      new EnregistrerFormation(repo).executer({
        ...base,
        moduleCode: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "FORMATION_INVALIDE" });
    expect(repo.items).toHaveLength(0);
  });

  it("isole les progressions par utilisateur et tenant", async () => {
    const repo = new MemoireFormations();
    const cas = new EnregistrerFormation(repo);
    await cas.executer(base);
    await cas.executer({ ...base, userId: "u2" });
    await cas.executer({ ...base, tenantId: "t2" });
    expect(await repo.listerParUtilisateur("t1", "u1")).toHaveLength(1);
    expect(await repo.listerParUtilisateur("t1", "u2")).toHaveLength(1);
    expect(await repo.listerParUtilisateur("t2", "u1")).toHaveLength(1);
    expect(repo.items).toHaveLength(3);
  });
});
