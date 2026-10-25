import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  alertesInventaire,
  garantieJoursRestants,
  inactiviteJours,
  statsInventaire,
  validerBien,
  type Bien,
  type BienInput,
} from "@/domain/inventaire";
import {
  ChangerEtatBien,
  EnregistrerBien,
  LireTableauInventaire,
  UtiliserBien,
} from "@/application/use-cases/inventaire";
import type {
  BiensRepository,
  EvenementBien,
} from "@/application/ports/biens-repository";

const AUJOURDHUI = "2026-10-25";

function bien(over: Partial<Bien> = {}): Bien {
  return {
    id: over.id ?? "b1",
    tenantId: "t1",
    logementId: "l1",
    qr: over.qr ?? "drap-1",
    categorie: over.categorie ?? "Linge",
    label: over.label ?? "Drap 160",
    dateAchat: over.dateAchat ?? "2026-01-01",
    prixAchatCentimes: over.prixAchatCentimes ?? 3000,
    fournisseur: null,
    garantieFin: over.garantieFin ?? null,
    lavagesNb: over.lavagesNb ?? 0,
    utilisationsNb: over.utilisationsNb ?? 0,
    derniereUtilisation: over.derniereUtilisation ?? null,
    etat: over.etat ?? 5,
    photoUrl: null,
    notes: null,
  };
}

class MemoireBiens implements BiensRepository {
  items: Bien[] = [];
  evenements: string[] = [];

  async listerParLogement() {
    return this.items;
  }
  async trouverParQr(_t: string, _l: string, qr: string) {
    return this.items.find((b) => b.qr === qr) ?? null;
  }
  async enregistrer(input: BienInput) {
    const existant = this.items.find((b) => b.qr === input.qr);
    if (existant) {
      Object.assign(existant, input, {
        id: existant.id,
        lavagesNb: existant.lavagesNb,
        utilisationsNb: existant.utilisationsNb,
        derniereUtilisation: existant.derniereUtilisation,
      });
      return existant;
    }
    const cree: Bien = {
      ...input,
      id: input.id ?? `b-${this.items.length + 1}`,
      lavagesNb: 0,
      utilisationsNb: 0,
      derniereUtilisation: null,
    };
    this.items.push(cree);
    return cree;
  }
  async enregistrerUtilisation(
    _t: string,
    id: string,
    laver: boolean,
    date: string,
  ) {
    const b = this.items.find((i) => i.id === id);
    if (!b) throw new Error("introuvable");
    b.utilisationsNb += 1;
    if (laver) b.lavagesNb += 1;
    b.derniereUtilisation = date;
    return b;
  }
  async changerEtat(_t: string, id: string, etat: Bien["etat"]) {
    const b = this.items.find((i) => i.id === id);
    if (!b) throw new Error("introuvable");
    b.etat = etat;
    return b;
  }
  async evenementExiste(_t: string, ref: string) {
    return this.evenements.includes(ref);
  }
  async enregistrerEvenement(e: EvenementBien) {
    if (!this.evenements.includes(e.ref)) this.evenements.push(e.ref);
  }
}

describe("domaine inventaire", () => {
  it("calcule l’inactivité et la garantie", () => {
    expect(inactiviteJours(bien({ dateAchat: "2026-07-01" }), AUJOURDHUI)).toBe(
      116,
    );
    expect(
      inactiviteJours(
        bien({ derniereUtilisation: "2026-10-20", dateAchat: "2020-01-01" }),
        AUJOURDHUI,
      ),
    ).toBe(5);
    expect(
      garantieJoursRestants(bien({ garantieFin: "2026-11-10" }), AUJOURDHUI),
    ).toBe(16);
    expect(garantieJoursRestants(bien(), AUJOURDHUI)).toBeNull();
  });

  it("classe dormants, remplacements et garanties qui expirent", () => {
    const alertes = alertesInventaire(
      [
        bien({ qr: "dormant", dateAchat: "2026-01-01" }),
        bien({ qr: "use", etat: 2 }),
        bien({ qr: "garantie", garantieFin: "2026-11-10" }),
        bien({ qr: "neuf", dateAchat: "2026-10-01", etat: 5 }),
      ],
      AUJOURDHUI,
    );
    expect(alertes.dormants.map((d) => d.bien.qr)).toEqual([
      "dormant",
      "use",
      "garantie",
    ]);
    expect(alertes.remplacements.map((b) => b.qr)).toEqual(["use"]);
    expect(alertes.garanties.map((g) => g.bien.qr)).toEqual(["garantie"]);
  });

  it("calcule coût par séjour, âge moyen, usure et budget", () => {
    const stats = statsInventaire(
      [
        bien({ qr: "a", prixAchatCentimes: 3000, utilisationsNb: 3 }),
        bien({ qr: "b", prixAchatCentimes: 1000, utilisationsNb: 0, etat: 1 }),
      ],
      AUJOURDHUI,
    );
    expect(stats.nbBiens).toBe(2);
    expect(stats.rotations).toBe(3);
    expect(stats.coutParSejour[0]?.coutCentimes).toBe(1000);
    expect(stats.budgetPrevisionnelCentimes).toBe(1000);
    expect(stats.ageMoyenJours).toBe(297);
    expect(stats.topUsure[0]?.qr).toBe("b");
  });

  it("refuse un QR invalide, un état hors bornes et un prix négatif", () => {
    expect(() =>
      validerBien({
        qr: "avec espaces",
        categorie: "Linge",
        label: "Drap",
        prixAchatCentimes: 0,
        etat: 5,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerBien({
        qr: "ok",
        categorie: "Linge",
        label: "Drap",
        prixAchatCentimes: 0,
        etat: 6,
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerBien({
        qr: "ok",
        categorie: "Linge",
        label: "Drap",
        prixAchatCentimes: -1,
        etat: 5,
      }),
    ).toThrow(ErreurMetier);
  });
});

describe("cas d'usage inventaire", () => {
  const base = {
    tenantId: "t1",
    logementId: "l1",
    qr: "drap-1",
    categorie: "Linge",
    label: "Drap 160",
    dateAchat: "2026-01-01",
    prixAchatCentimes: 3000,
    fournisseur: "IKEA",
    garantieFin: "2027-01-01",
    etat: 4,
    photoUrl: null,
    notes: null,
  };

  it("crée puis met à jour sans écraser les compteurs", async () => {
    const repo = new MemoireBiens();
    const cas = new EnregistrerBien(repo);
    const cree = await cas.executer(base);
    expect(cree.id).toBe("b-1");
    repo.items[0]!.utilisationsNb = 7;
    repo.items[0]!.lavagesNb = 2;

    const maj = await cas.executer({ ...base, label: "Drap 160 cm" });
    expect(maj.id).toBe(cree.id);
    expect(maj.label).toBe("Drap 160 cm");
    expect(maj.utilisationsNb).toBe(7);
    expect(maj.lavagesNb).toBe(2);
  });

  it("refuse une garantie antérieure à l’achat", async () => {
    const cas = new EnregistrerBien(new MemoireBiens());
    await expect(
      cas.executer({ ...base, garantieFin: "2025-12-31" }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("utilise un bien, lave si demandé et reste idempotent", async () => {
    const repo = new MemoireBiens();
    repo.items = [bien({ utilisationsNb: 1, lavagesNb: 0 })];
    const cas = new UtiliserBien(repo);

    const apres = await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qr: "drap-1",
      laver: true,
      qui: "menage@lcd.test",
      ref: "use-1",
      aujourdHui: AUJOURDHUI,
    });
    expect(apres.utilisationsNb).toBe(2);
    expect(apres.lavagesNb).toBe(1);
    expect(apres.derniereUtilisation).toBe(AUJOURDHUI);

    await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qr: "drap-1",
      laver: true,
      qui: "menage@lcd.test",
      ref: "use-1",
      aujourdHui: AUJOURDHUI,
    });
    expect(repo.items[0]?.utilisationsNb).toBe(2);
    expect(repo.evenements).toEqual(["use-1:drap-1"]);
  });

  it("change l’état et reste idempotent", async () => {
    const repo = new MemoireBiens();
    repo.items = [bien({ etat: 5 })];
    const cas = new ChangerEtatBien(repo);
    const apres = await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qr: "drap-1",
      etat: 2,
      note: "Trou",
      qui: "hote@lcd.test",
      ref: "etat-1",
    });
    expect(apres.etat).toBe(2);
    await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qr: "drap-1",
      etat: 4,
      note: null,
      qui: "hote@lcd.test",
      ref: "etat-1",
    });
    expect(repo.items[0]?.etat).toBe(2);
  });

  it("assemble le tableau alertes + stats", async () => {
    const repo = new MemoireBiens();
    repo.items = [
      bien({ qr: "a", etat: 1, dateAchat: "2025-01-01" }),
      bien({ qr: "b", etat: 5, dateAchat: "2026-10-01" }),
    ];
    const tableau = await new LireTableauInventaire(repo).executer(
      "t1",
      "l1",
      AUJOURDHUI,
    );
    expect(tableau.biens).toHaveLength(2);
    expect(tableau.alertes.remplacements).toHaveLength(1);
    expect(tableau.stats.nbBiens).toBe(2);
  });
});
