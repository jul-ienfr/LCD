import { describe, expect, it } from "vitest";
import type {
  CreerObjetTrouveData,
  MiseAJourObjetTrouveData,
  ObjetsTrouvesRepository,
} from "@/application/ports/objets-trouves-repository";
import {
  CloturerObjetTrouve,
  EnregistrerObjetTrouve,
  EnvoyerObjetTrouve,
  ReclamerObjetTrouve,
} from "@/application/use-cases/objet-trouve";
import {
  FORFAIT_OBJET_CENTIMES,
  type ObjetTrouve,
} from "@/domain/objet-trouve";
import { LogementRepositoryMemoire } from "../helpers/logement-repository-memoire";

class MemoireObjets implements ObjetsTrouvesRepository {
  items: ObjetTrouve[] = [];

  async creer(data: CreerObjetTrouveData): Promise<ObjetTrouve> {
    const maintenant = new Date();
    const objet: ObjetTrouve = {
      id: crypto.randomUUID(),
      ...data,
      statut: "trouve",
      fraisCentimes: 0,
      envoyeLe: null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(objet);
    return objet;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((o) => o.tenantId === tenantId && o.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((o) => o.tenantId === tenantId && o.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (o) => o.tenantId === tenantId && o.logementId === logementId,
    );
  }
  async mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourObjetTrouveData,
  ) {
    const objet = await this.trouverParId(tenantId, id);
    if (!objet) return null;
    Object.assign(objet, data, { updatedAt: new Date() });
    return objet;
  }
}

async function preparer() {
  const logements = new LogementRepositoryMemoire();
  const logement = await logements.creer({
    tenantId: "t1",
    code: "log1",
    nom: "Logement 1",
  });
  const objets = new MemoireObjets();
  const enregistrer = new EnregistrerObjetTrouve(objets, logements);
  return { logements, logement, objets, enregistrer };
}

const base = {
  tenantId: "t1",
  ref: "objet-1000",
  description: "Chargeur USB",
  lieu: "Salon",
  trouveLe: "2026-10-20",
};

describe("cas d'usage objet trouvé", () => {
  it("enregistre un objet au statut trouvé", async () => {
    const { logement, objets, enregistrer } = await preparer();
    const objet = await enregistrer.executer({ ...base, logementId: logement.id });
    expect(objet.statut).toBe("trouve");
    expect(objet.fraisCentimes).toBe(0);
    expect(objet.logementId).toBe(logement.id);
    expect(objets.items).toHaveLength(1);
  });

  it("est idempotent par référence et refuse un logement inconnu", async () => {
    const { logement, objets, enregistrer } = await preparer();
    const premier = await enregistrer.executer({
      ...base,
      logementId: logement.id,
    });
    const second = await enregistrer.executer({
      ...base,
      logementId: logement.id,
      description: "Autre",
    });
    expect(second.id).toBe(premier.id);
    expect(objets.items).toHaveLength(1);

    await expect(
      enregistrer.executer({ ...base, ref: "objet-2000", logementId: "x" }),
    ).rejects.toMatchObject({ code: "OBJET_TROUVE_INVALIDE" });
  });

  it("réclame un objet avec le forfait", async () => {
    const { logement, objets, enregistrer } = await preparer();
    const objet = await enregistrer.executer({
      ...base,
      logementId: logement.id,
    });
    const reclame = await new ReclamerObjetTrouve(objets).executer(
      "t1",
      objet.id,
      { voyageurNom: "Camille", contact: "camille@example.com" },
    );
    expect(reclame.statut).toBe("reclame");
    expect(reclame.fraisCentimes).toBe(FORFAIT_OBJET_CENTIMES);
    expect(reclame.voyageurNom).toBe("Camille");
  });

  it("suit les transitions réclamation, envoi, don", async () => {
    const { logement, objets, enregistrer } = await preparer();
    const objet = await enregistrer.executer({
      ...base,
      logementId: logement.id,
      trouveLe: "2026-09-01",
    });

    await expect(
      new EnvoyerObjetTrouve(objets).executer("t1", objet.id),
    ).rejects.toMatchObject({ code: "OBJET_TROUVE_INVALIDE" });

    const reclame = await new ReclamerObjetTrouve(objets).executer(
      "t1",
      objet.id,
      { voyageurNom: "Camille", contact: "camille@example.com" },
    );
    const envoye = await new EnvoyerObjetTrouve(objets).executer(
      "t1",
      reclame.id,
    );
    expect(envoye.statut).toBe("envoye");
    expect(envoye.envoyeLe).toBeTruthy();

    await expect(
      new CloturerObjetTrouve(objets).executer("t1", envoye.id),
    ).rejects.toMatchObject({ code: "OBJET_TROUVE_INVALIDE" });
  });

  it("refuse le don avant trente jours", async () => {
    const { logement, objets, enregistrer } = await preparer();
    const objet = await enregistrer.executer({
      ...base,
      logementId: logement.id,
      trouveLe: "2026-10-20",
    });
    await expect(
      new CloturerObjetTrouve(objets).executer(
        "t1",
        objet.id,
        new Date("2026-10-25T12:00:00Z"),
      ),
    ).rejects.toMatchObject({ code: "OBJET_TROUVE_INVALIDE" });

    const donne = await new CloturerObjetTrouve(objets).executer(
      "t1",
      objet.id,
      new Date("2026-11-25T12:00:00Z"),
    );
    expect(donne.statut).toBe("donne");
  });
});
