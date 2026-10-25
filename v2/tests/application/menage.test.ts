import { describe, expect, it } from "vitest";
import type {
  CreerMenageData,
  MenagesRepository,
  MettreAJourMenageData,
} from "@/application/ports/menages-repository";
import type { ConsommablesRepository } from "@/application/ports/consommables-repository";
import { EnregistrerMenage, PlanifierMenage } from "@/application/use-cases/menage";
import type { Menage } from "@/domain/menage";
import type {
  Consommable,
  ConsommableInput,
  MouvementStock,
} from "@/domain/stocks";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

class MemoireMenages implements MenagesRepository {
  items: Menage[] = [];

  async creer(data: CreerMenageData): Promise<Menage> {
    const maintenant = new Date();
    const menage: Menage = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(menage);
    return menage;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (m) => m.tenantId === tenantId && m.logementId === logementId,
    );
  }
  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourMenageData,
  ): Promise<Menage> {
    const menage = await this.trouverParId(tenantId, id);
    if (!menage) throw new Error("introuvable");
    Object.assign(menage, data, { updatedAt: new Date() });
    return menage;
  }
}

class MemoireConsommables implements ConsommablesRepository {
  items: Consommable[] = [];
  mouvements: Omit<MouvementStock, "id">[] = [];

  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (c) => c.tenantId === tenantId && c.logementId === logementId,
    );
  }
  async trouverParCode(tenantId: string, logementId: string, code: string) {
    return (
      this.items.find(
        (c) =>
          c.tenantId === tenantId &&
          c.logementId === logementId &&
          c.code === code,
      ) ?? null
    );
  }
  async enregistrer(input: ConsommableInput) {
    const cree: Consommable = { ...input, id: input.id ?? crypto.randomUUID() };
    this.items.push(cree);
    return cree;
  }
  async mettreAJourStock(tenantId: string, id: string, stock: number) {
    const item = this.items.find((c) => c.tenantId === tenantId && c.id === id);
    if (!item) throw new Error("introuvable");
    item.stock = stock;
    return item;
  }
  async mouvementExiste(tenantId: string, ref: string) {
    return this.mouvements.some(
      (m) => m.tenantId === tenantId && m.ref === ref,
    );
  }
  async enregistrerMouvement(mouvement: Omit<MouvementStock, "id">) {
    this.mouvements.push(mouvement);
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const autre = await logements.creer({
    tenantId: "t1",
    code: "log2",
    nom: "Logement 2",
  });
  const reservations = new ReservationRepositoryMemoire();
  const sejour = await reservations.creer({
    tenantId: "t1",
    logementId: logement.id,
    ref: "resa-1",
    voyageurs: 2,
    debut: "2026-10-20",
    fin: "2026-10-25",
    montantCentimes: 50_000,
  });
  const sejourAutre = await reservations.creer({
    tenantId: "t1",
    logementId: autre.id,
    ref: "resa-2",
    voyageurs: 2,
    debut: "2026-10-20",
    fin: "2026-10-25",
    montantCentimes: 50_000,
  });
  const menages = new MemoireMenages();
  const consommables = new MemoireConsommables();
  await consommables.enregistrer({
    tenantId: "t1",
    logementId: logement.id,
    code: "savon",
    label: "Savon",
    stock: 10,
    unite: "unité",
    seuil: 2,
    cible: 10,
    consoRotation: 2,
  });
  const planifier = new PlanifierMenage(menages, reservations, logements);
  const enregistrer = new EnregistrerMenage(menages, consommables);
  return {
    logement,
    sejour,
    sejourAutre,
    menages,
    consommables,
    planifier,
    enregistrer,
  };
}

const base = {
  tenantId: "t1",
  ref: "men-1",
  date: "2026-10-25",
  notes: "  Draps propres  ",
};

describe("cas d'usage ménage", () => {
  it("planifie un ménage lié à un séjour avec la checklist par défaut", async () => {
    const { logement, sejour, menages, planifier } = await preparer();
    const menage = await planifier.executer({
      ...base,
      logementId: logement.id,
      reservationId: sejour.id,
    });

    expect(menage.statut).toBe("planifie");
    expect(menage.notes).toBe("Draps propres");
    expect(menage.reservationId).toBe(sejour.id);
    expect(menage.taches.length).toBeGreaterThan(0);
    expect(menages.items).toHaveLength(1);
  });

  it("est idempotent sur la référence", async () => {
    const { logement, menages, planifier } = await preparer();
    const premier = await planifier.executer({
      ...base,
      logementId: logement.id,
    });
    const second = await planifier.executer({
      ...base,
      logementId: logement.id,
      date: "2026-10-26",
    });

    expect(second.id).toBe(premier.id);
    expect(second.date).toBe("2026-10-25");
    expect(menages.items).toHaveLength(1);
  });

  it("refuse un séjour d’un autre logement", async () => {
    const { logement, sejourAutre, menages, planifier } = await preparer();
    await expect(
      planifier.executer({
        ...base,
        logementId: logement.id,
        reservationId: sejourAutre.id,
      }),
    ).rejects.toMatchObject({ code: "MENAGE_INVALIDE" });
    expect(menages.items).toHaveLength(0);
  });

  it("consomme la rotation une seule fois au passage à « fait »", async () => {
    const { logement, sejour, consommables, planifier, enregistrer } =
      await preparer();
    const menage = await planifier.executer({
      ...base,
      logementId: logement.id,
      reservationId: sejour.id,
    });

    const fait = await enregistrer.executer({
      tenantId: "t1",
      id: menage.id,
      statut: "fait",
      notes: "",
      taches: menage.taches.map((t) => ({ libelle: t.libelle, fait: true })),
      qui: "menage@lcd.test",
    });
    expect(fait.statut).toBe("fait");
    expect(consommables.items[0]?.stock).toBe(8);
    expect(consommables.mouvements).toHaveLength(1);
    expect(consommables.mouvements[0]?.ref).toBe(`menage-${menage.ref}:savon`);

    await enregistrer.executer({
      tenantId: "t1",
      id: menage.id,
      statut: "fait",
      notes: "",
      taches: fait.taches,
      qui: "menage@lcd.test",
    });
    expect(consommables.items[0]?.stock).toBe(8);
    expect(consommables.mouvements).toHaveLength(1);
  });

  it("refuse un ménage inconnu et une checklist vide", async () => {
    const { logement, planifier, enregistrer } = await preparer();
    await expect(
      enregistrer.executer({
        tenantId: "t1",
        id: "inconnu",
        statut: "fait",
        taches: [{ libelle: "Sols", fait: true }],
        qui: "menage@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "MENAGE_INVALIDE" });

    const menage = await planifier.executer({
      ...base,
      logementId: logement.id,
    });
    await expect(
      enregistrer.executer({
        tenantId: "t1",
        id: menage.id,
        statut: "planifie",
        taches: [],
        qui: "menage@lcd.test",
      }),
    ).rejects.toMatchObject({ code: "MENAGE_INVALIDE" });
  });
});
