import { describe, expect, it } from "vitest";
import type {
  CreerSinistreData,
  SinistresRepository,
} from "@/application/ports/sinistres-repository";
import {
  AvancerSinistre,
  DeclarerSinistre,
} from "@/application/use-cases/sinistre";
import type {
  Sinistre,
  StatutSinistre,
} from "@/domain/sinistre";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoireSinistres implements SinistresRepository {
  items: Sinistre[] = [];

  async creer(data: CreerSinistreData): Promise<Sinistre> {
    const sinistre: Sinistre = {
      id: crypto.randomUUID(),
      ...data,
      statut: "declare",
      montantIndemniseCentimes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(sinistre);
    return sinistre;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((s) => s.tenantId === tenantId && s.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((s) => s.tenantId === tenantId && s.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (s) => s.tenantId === tenantId && s.logementId === logementId,
    );
  }
  async mettreAJourStatut(
    tenantId: string,
    id: string,
    statut: StatutSinistre,
    montantIndemniseCentimes: number | null,
  ) {
    const sinistre = await this.trouverParId(tenantId, id);
    if (!sinistre) throw new Error("introuvable");
    sinistre.statut = statut;
    sinistre.montantIndemniseCentimes = montantIndemniseCentimes;
    sinistre.updatedAt = new Date();
    return sinistre;
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const sinistres = new MemoireSinistres();
  return {
    logement,
    sinistres,
    declarer: new DeclarerSinistre(sinistres, logements),
    avancer: new AvancerSinistre(sinistres),
  };
}

const base = {
  tenantId: "t1",
  ref: "sinistre-1000",
  type: "degat_eaux",
  date: "2026-10-20",
  description: "Fuite sous l’évier constatée au départ.",
  montantEstimeCentimes: 120_000,
  franchiseCentimes: 15_000,
};

describe("cas d'usage sinistres", () => {
  it("déclare un sinistre et reste idempotent", async () => {
    const { logement, sinistres, declarer } = await preparer();
    const premier = await declarer.executer({
      ...base,
      logementId: logement.id,
      numeroDeclaration: "SIN-2026-0042",
    });
    const second = await declarer.executer({
      ...base,
      logementId: logement.id,
      description: "Autre description.",
    });
    expect(premier.statut).toBe("declare");
    expect(premier.numeroDeclaration).toBe("SIN-2026-0042");
    expect(second.id).toBe(premier.id);
    expect(sinistres.items).toHaveLength(1);
  });

  it("refuse un logement inconnu ou une franchise trop haute", async () => {
    const { logement, sinistres, declarer } = await preparer();
    await expect(
      declarer.executer({
        ...base,
        logementId: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "SINISTRE_INVALIDE" });
    await expect(
      declarer.executer({
        ...base,
        logementId: logement.id,
        franchiseCentimes: 500_000,
      }),
    ).rejects.toMatchObject({ code: "SINISTRE_INVALIDE" });
    expect(sinistres.items).toHaveLength(0);
  });

  it("avance expertise, indemnisation puis clôture", async () => {
    const { logement, declarer, avancer } = await preparer();
    const sinistre = await declarer.executer({
      ...base,
      logementId: logement.id,
    });

    const expertise = await avancer.executer({
      tenantId: "t1",
      id: sinistre.id,
    });
    expect(expertise.statut).toBe("expertise");

    await expect(
      avancer.executer({ tenantId: "t1", id: sinistre.id }),
    ).rejects.toMatchObject({ code: "SINISTRE_INVALIDE" });

    const indemnise = await avancer.executer({
      tenantId: "t1",
      id: sinistre.id,
      montantIndemniseCentimes: 90_000,
    });
    expect(indemnise.statut).toBe("indemnise");
    expect(indemnise.montantIndemniseCentimes).toBe(90_000);

    const clos = await avancer.executer({
      tenantId: "t1",
      id: sinistre.id,
    });
    expect(clos.statut).toBe("clos");
    await expect(
      avancer.executer({ tenantId: "t1", id: sinistre.id }),
    ).rejects.toMatchObject({ code: "SINISTRE_INVALIDE" });
  });

  it("refuse un dossier inconnu", async () => {
    const { avancer } = await preparer();
    await expect(
      avancer.executer({ tenantId: "t1", id: "inconnu" }),
    ).rejects.toMatchObject({ code: "SINISTRE_INVALIDE" });
  });
});
