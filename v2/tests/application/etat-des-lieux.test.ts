import { describe, expect, it } from "vitest";
import type { BiensRepository } from "@/application/ports/biens-repository";
import type {
  CreerEtatDesLieuxData,
  EtatsDesLieuxRepository,
} from "@/application/ports/etats-des-lieux-repository";
import { EnregistrerEtatDesLieux } from "@/application/use-cases/etat-des-lieux";
import { analyserEtatDesLieux, type EtatDesLieux } from "@/domain/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";
import type { Bien, BienInput } from "@/domain/inventaire";
import { ReservationRepositoryMemoire } from "../helpers/reservation-repository-memoire";

function bien(over: Partial<Bien> = {}): Bien {
  return {
    id: over.id ?? "b1",
    tenantId: "t1",
    logementId: over.logementId ?? "l1",
    qr: over.qr ?? "drap-1",
    categorie: over.categorie ?? "Linge",
    label: over.label ?? "Drap 160",
    dateAchat: null,
    prixAchatCentimes: over.prixAchatCentimes ?? 4000,
    fournisseur: null,
    garantieFin: null,
    lavagesNb: 0,
    utilisationsNb: 0,
    derniereUtilisation: null,
    etat: over.etat ?? 5,
    photoUrl: null,
    notes: null,
  };
}

class MemoireBiens implements BiensRepository {
  items: Bien[] = [];

  async listerParLogement(_t: string, logementId: string) {
    return this.items.filter((b) => b.logementId === logementId);
  }
  async trouverParQr(_t: string, _l: string, qr: string) {
    return this.items.find((b) => b.qr === qr) ?? null;
  }
  async enregistrer(input: BienInput) {
    const cree = bien({ ...input, id: input.id ?? crypto.randomUUID() });
    this.items.push(cree);
    return cree;
  }
  async enregistrerUtilisation(): Promise<Bien> {
    throw new Error("non utilisé");
  }
  async changerEtat(): Promise<Bien> {
    throw new Error("non utilisé");
  }
  async evenementExiste(): Promise<boolean> {
    return false;
  }
  async enregistrerEvenement(): Promise<void> {}
}

class MemoireEtats implements EtatsDesLieuxRepository {
  items: EtatDesLieux[] = [];

  async creer(data: CreerEtatDesLieuxData): Promise<EtatDesLieux> {
    const maintenant = new Date();
    const etat: EtatDesLieux = {
      id: crypto.randomUUID(),
      ...data,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.items.push(etat);
    return etat;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((e) => e.tenantId === tenantId && e.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((e) => e.tenantId === tenantId && e.id === id) ?? null
    );
  }
  async listerParTenant(tenantId: string) {
    return this.items.filter((e) => e.tenantId === tenantId);
  }
}

function preparer() {
  const biens = new MemoireBiens();
  biens.items = [
    bien({ id: "b1", qr: "drap-1", label: "Drap 160", etat: 5 }),
    bien({
      id: "b2",
      qr: "serviette-1",
      label: "Serviette",
      etat: 4,
      prixAchatCentimes: null,
    }),
  ];
  const etats = new MemoireEtats();
  const reservations = new ReservationRepositoryMemoire();
  const cas = new EnregistrerEtatDesLieux(etats, biens, reservations);
  return { biens, etats, reservations, cas };
}

const base = {
  tenantId: "t1",
  logementId: "l1",
  reservationId: null,
  type: "sortie",
  date: "2026-10-25",
};

describe("cas d'usage état des lieux", () => {
  it("construit les lignes depuis l’inventaire durable", async () => {
    const { etats, cas } = preparer();
    const etat = await cas.executer({ ...base, ref: "edl-1", constats: {} });

    expect(etat.lignes).toHaveLength(2);
    const drap = etat.lignes.find((l) => l.qr === "drap-1");
    expect(drap).toMatchObject({
      libelle: "Drap 160",
      etatReference: 5,
      etatConstate: 5,
      manquant: false,
      prixReferenceCentimes: 4000,
    });
    expect(analyserEtatDesLieux(etat.lignes).coutRemplacementCentimes).toBe(0);
    expect(etats.items).toHaveLength(1);
  });

  it("enregistre un manquant et son coût de remplacement", async () => {
    const { cas } = preparer();
    const etat = await cas.executer({
      ...base,
      ref: "edl-2",
      notes: "  Drap absent  ",
      constats: {
        "drap-1": {
          etat: null,
          manquant: true,
          commentaire: "  Non retrouvé  ",
        },
        "serviette-1": { etat: 3, manquant: false },
      },
    });

    expect(etat.notes).toBe("Drap absent");
    const analyse = analyserEtatDesLieux(etat.lignes);
    expect(analyse.manquants).toHaveLength(1);
    expect(analyse.manquants[0]?.commentaire).toBe("Non retrouvé");
    expect(analyse.coutRemplacementCentimes).toBe(4000);
    expect(analyse.degrades.map((l) => l.qr)).toEqual(["serviette-1"]);
  });

  it("est idempotent sur la référence", async () => {
    const { etats, cas } = preparer();
    const premier = await cas.executer({ ...base, ref: "edl-3", constats: {} });
    const second = await cas.executer({
      ...base,
      ref: "edl-3",
      constats: { "drap-1": { etat: null, manquant: true } },
    });

    expect(second.id).toBe(premier.id);
    expect(etats.items).toHaveLength(1);
  });

  it("refuse un logement sans bien inventorié", async () => {
    const { cas } = preparer();
    await expect(
      cas.executer({
        ...base,
        logementId: "l2",
        ref: "edl-4",
        constats: {},
      }),
    ).rejects.toMatchObject({ code: "ETAT_DES_LIEUX_INVALIDE" });
  });

  it("refuse un séjour qui n’appartient pas au logement", async () => {
    const { reservations, cas } = preparer();
    const reservation = await reservations.creer({
      tenantId: "t1",
      logementId: "l2",
      ref: "resa-1",
      voyageurs: 2,
      debut: "2026-10-01",
      fin: "2026-10-05",
      montantCentimes: 50_000,
    });

    await expect(
      cas.executer({
        ...base,
        reservationId: reservation.id,
        ref: "edl-5",
        constats: {},
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("refuse un état constaté invalide sans rien écrire", async () => {
    const { etats, cas } = preparer();
    await expect(
      cas.executer({
        ...base,
        ref: "edl-6",
        constats: { "drap-1": { etat: 9, manquant: false } },
      }),
    ).rejects.toMatchObject({ code: "ETAT_DES_LIEUX_INVALIDE" });
    expect(etats.items).toHaveLength(0);
  });
});
