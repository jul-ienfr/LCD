import { describe, expect, it } from "vitest";
import type {
  CreerEntretienData,
  EntretiensRepository,
} from "@/application/ports/entretiens-repository";
import { EnregistrerEntretien } from "@/application/use-cases/entretien";
import type { Entretien } from "@/domain/entretien";
import { ErreurMetier } from "@/domain/erreurs";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoireEntretiens implements EntretiensRepository {
  items: Entretien[] = [];

  async creer(data: CreerEntretienData): Promise<Entretien> {
    const maintenant = new Date();
    const entretien: Entretien = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(entretien);
    return entretien;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((e) => e.tenantId === tenantId && e.ref === ref) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (e) => e.tenantId === tenantId && e.logementId === logementId,
    );
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const entretiens = new MemoireEntretiens();
  const cas = new EnregistrerEntretien(entretiens, logements);
  return { logements, logement, entretiens, cas };
}

const base = {
  tenantId: "t1",
  ref: "ent-1",
  date: "2026-10-25",
  type: "reparation",
  titre: "  Mitigeur  ",
  description: "  Fuite sous l’évier  ",
  prestataire: "  Plombier  ",
  coutCentimes: 12_000,
};

describe("cas d'usage entretien", () => {
  it("enregistre une intervention normalisée", async () => {
    const { logement, entretiens, cas } = await preparer();
    const cree = await cas.executer({
      ...base,
      logementId: logement.id,
    });

    expect(cree.logementId).toBe(logement.id);
    expect(cree.titre).toBe("Mitigeur");
    expect(cree.description).toBe("Fuite sous l’évier");
    expect(cree.prestataire).toBe("Plombier");
    expect(cree.coutCentimes).toBe(12_000);
    expect(entretiens.items).toHaveLength(1);
  });

  it("est idempotent sur la référence", async () => {
    const { logement, entretiens, cas } = await preparer();
    const premier = await cas.executer({ ...base, logementId: logement.id });
    const second = await cas.executer({
      ...base,
      logementId: logement.id,
      titre: "Autre titre",
      coutCentimes: 1,
    });

    expect(second.id).toBe(premier.id);
    expect(second.titre).toBe("Mitigeur");
    expect(entretiens.items).toHaveLength(1);
  });

  it("refuse un logement inconnu", async () => {
    const { entretiens, cas } = await preparer();
    await expect(
      cas.executer({ ...base, logementId: "inconnu" }),
    ).rejects.toMatchObject({ code: "ENTRETIEN_INVALIDE" });
    expect(entretiens.items).toHaveLength(0);
  });

  it("refuse une référence invalide", async () => {
    const { logement, cas } = await preparer();
    await expect(
      cas.executer({ ...base, logementId: logement.id, ref: "ab" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse un coût négatif", async () => {
    const { logement, entretiens, cas } = await preparer();
    await expect(
      cas.executer({
        ...base,
        logementId: logement.id,
        coutCentimes: -100,
      }),
    ).rejects.toMatchObject({ code: "ENTRETIEN_INVALIDE" });
    expect(entretiens.items).toHaveLength(0);
  });
});
