import { describe, expect, it } from "vitest";
import type {
  CreerPreuveData,
  PreuvesTranquilliteRepository,
} from "@/application/ports/preuves-tranquillite-repository";
import {
  EnregistrerPreuve,
  SupprimerPreuve,
} from "@/application/use-cases/preuve-tranquillite";
import type { PreuveTranquillite } from "@/domain/preuve-tranquillite";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoirePreuves implements PreuvesTranquilliteRepository {
  items: PreuveTranquillite[] = [];

  async creer(data: CreerPreuveData): Promise<PreuveTranquillite> {
    const preuve: PreuveTranquillite = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: new Date(),
    };
    this.items.push(preuve);
    return preuve;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((p) => p.tenantId === tenantId && p.ref === ref) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (p) => p.tenantId === tenantId && p.logementId === logementId,
    );
  }
  async supprimer(tenantId: string, id: string) {
    this.items = this.items.filter(
      (p) => !(p.tenantId === tenantId && p.id === id),
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
  const preuves = new MemoirePreuves();
  const enregistrer = new EnregistrerPreuve(preuves, logements);
  return { logement, preuves, enregistrer };
}

const base = {
  tenantId: "t1",
  ref: "preuve-1000",
  type: "db",
  date: "2026-10-20",
  moment: "nuit",
  valeurDb: 62,
  note: "Fête voisine",
};

describe("cas d'usage carnet de tranquillité", () => {
  it("enregistre une preuve liée au logement", async () => {
    const { logement, preuves, enregistrer } = await preparer();
    const preuve = await enregistrer.executer({
      ...base,
      logementId: logement.id,
    });
    expect(preuve.logementId).toBe(logement.id);
    expect(preuve.type).toBe("db");
    expect(preuve.valeurDb).toBe(62);
    expect(preuves.items).toHaveLength(1);
  });

  it("est idempotent et refuse un logement inconnu", async () => {
    const { logement, preuves, enregistrer } = await preparer();
    const premier = await enregistrer.executer({
      ...base,
      logementId: logement.id,
    });
    const second = await enregistrer.executer({
      ...base,
      logementId: logement.id,
      note: "Autre",
    });
    expect(second.id).toBe(premier.id);
    expect(preuves.items).toHaveLength(1);
    await expect(
      enregistrer.executer({
        ...base,
        ref: "preuve-2000",
        logementId: "inconnu",
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
  });

  it("accepte une attestation sans mesure", async () => {
    const { logement, enregistrer } = await preparer();
    const preuve = await enregistrer.executer({
      tenantId: "t1",
      logementId: logement.id,
      ref: "preuve-3000",
      type: "attestation",
      date: "2026-10-21",
      note: "Attestation du gardien",
    });
    expect(preuve.valeurDb).toBeNull();
    expect(preuve.moment).toBeNull();
  });

  it("refuse une attestation sans note", async () => {
    const { logement, preuves, enregistrer } = await preparer();
    await expect(
      enregistrer.executer({
        tenantId: "t1",
        logementId: logement.id,
        ref: "preuve-4000",
        type: "attestation",
        date: "2026-10-21",
        note: "  ",
      }),
    ).rejects.toMatchObject({ code: "PREUVE_INVALIDE" });
    expect(preuves.items).toHaveLength(0);
  });

  it("supprime une preuve", async () => {
    const { logement, preuves, enregistrer } = await preparer();
    const preuve = await enregistrer.executer({
      ...base,
      logementId: logement.id,
    });
    await new SupprimerPreuve(preuves).executer("t1", preuve.id);
    expect(preuves.items).toHaveLength(0);
  });
});
