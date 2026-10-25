import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  appliquerConsommation,
  appliquerReassort,
  listeCourses,
  quantiteACourse,
  statutConsommable,
  type Consommable,
  type ConsommableInput,
  type MouvementStock,
} from "@/domain/stocks";
import {
  CalculerCourses,
  ConsommerRotation,
  EnregistrerConsommable,
  ListerConsommables,
  ReassortirConsommables,
} from "@/application/use-cases/stocks";
import type {
  ConsommablesRepository,
} from "@/application/ports/consommables-repository";

function conso(over: Partial<Consommable> = {}): Consommable {
  return {
    id: over.id ?? "id-1",
    tenantId: "t1",
    logementId: "l1",
    code: over.code ?? "papier-wc",
    label: over.label ?? "Papier WC",
    stock: over.stock ?? 2,
    unite: "rouleau",
    seuil: over.seuil ?? 3,
    cible: over.cible ?? 8,
    consoRotation: over.consoRotation ?? 2,
  };
}

class MemoireConsommables implements ConsommablesRepository {
  items: Consommable[] = [];
  mouvements: string[] = [];

  async listerParLogement(_tenantId: string, logementId: string) {
    return this.items.filter((i) => i.logementId === logementId);
  }
  async trouverParCode(
    _tenantId: string,
    logementId: string,
    code: string,
  ) {
    return (
      this.items.find((i) => i.logementId === logementId && i.code === code) ??
      null
    );
  }
  async enregistrer(input: ConsommableInput) {
    const existant = this.items.find(
      (i) =>
        i.logementId === input.logementId && i.code === input.code,
    );
    if (existant) {
      Object.assign(existant, input, { id: existant.id });
      return existant;
    }
    const cree: Consommable = {
      ...input,
      id: input.id ?? `id-${this.items.length + 1}`,
    };
    this.items.push(cree);
    return cree;
  }
  async mettreAJourStock(_tenantId: string, id: string, stock: number) {
    const item = this.items.find((i) => i.id === id);
    if (!item) throw new Error("introuvable");
    item.stock = stock;
    return item;
  }
  async mouvementExiste(_tenantId: string, ref: string) {
    return this.mouvements.includes(ref);
  }
  async enregistrerMouvement(m: Omit<MouvementStock, "id">) {
    if (!this.mouvements.includes(m.ref)) this.mouvements.push(m.ref);
  }
}

describe("domaine stocks", () => {
  it("classe rupture, bas et ok", () => {
    expect(statutConsommable({ stock: 0, seuil: 3 })).toBe("rupture");
    expect(statutConsommable({ stock: 3, seuil: 3 })).toBe("bas");
    expect(statutConsommable({ stock: 4, seuil: 3 })).toBe("ok");
  });

  it("calcule la quantité à acheter vers la cible", () => {
    expect(quantiteACourse(conso({ stock: 0 }))).toBe(8);
    expect(quantiteACourse(conso({ stock: 2 }))).toBe(6);
    expect(quantiteACourse(conso({ stock: 9 }))).toBe(0);
  });

  it("borne la consommation à zéro et ne diminue jamais au réassort", () => {
    expect(appliquerConsommation(1, 2)).toBe(0);
    expect(appliquerConsommation(5, 2)).toBe(3);
    expect(appliquerReassort(2, 8)).toBe(8);
    expect(appliquerReassort(9, 8)).toBe(9);
  });

  it("sépare ruptures et stocks bas", () => {
    const courses = listeCourses([
      conso({ code: "a", stock: 0 }),
      conso({ code: "b", stock: 2 }),
      conso({ code: "c", stock: 9 }),
    ]);
    expect(courses.ruptures).toHaveLength(1);
    expect(courses.bas).toHaveLength(1);
    expect(courses.totalArticles).toBe(14);
  });
});

describe("cas d'usage stocks", () => {
  it("crée puis met à jour un consommable par son code", async () => {
    const repo = new MemoireConsommables();
    const cas = new EnregistrerConsommable(repo);
    const cree = await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      code: "Papier-WC",
      label: "Papier toilette",
      stock: 2,
      unite: "rouleau",
      seuil: 3,
      cible: 8,
      consoRotation: 2,
    });
    expect(cree.code).toBe("papier-wc");
    const maj = await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      code: "papier-wc",
      label: "Papier toilette 3 plis",
      stock: 5,
      unite: "rouleau",
      seuil: 3,
      cible: 8,
      consoRotation: 2,
    });
    expect(maj.id).toBe(cree.id);
    expect(maj.label).toBe("Papier toilette 3 plis");
    expect(repo.items).toHaveLength(1);
  });

  it("refuse un code invalide et une cible sous le seuil", async () => {
    const cas = new EnregistrerConsommable(new MemoireConsommables());
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: "l1",
        code: "Code Avec Espaces",
        label: "X",
        stock: 0,
        unite: "u",
        seuil: 1,
        cible: 2,
        consoRotation: 1,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
    await expect(
      cas.executer({
        tenantId: "t1",
        logementId: "l1",
        code: "ok",
        label: "X",
        stock: 0,
        unite: "u",
        seuil: 5,
        cible: 2,
        consoRotation: 1,
      }),
    ).rejects.toBeInstanceOf(ErreurMetier);
  });

  it("consomme la rotation, borne à zéro et reste idempotent", async () => {
    const repo = new MemoireConsommables();
    repo.items = [conso({ stock: 3, consoRotation: 2 })];
    const cas = new ConsommerRotation(repo);

    const apres = await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qui: "menage@lcd.test",
      ref: "rot-1",
    });
    expect(apres[0]?.stock).toBe(1);

    await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qui: "menage@lcd.test",
      ref: "rot-1",
    });
    expect(repo.items[0]?.stock).toBe(1);
    expect(repo.mouvements).toEqual(["rot-1:papier-wc"]);
  });

  it("réassortit à la cible sans dépasser un stock supérieur", async () => {
    const repo = new MemoireConsommables();
    repo.items = [conso({ stock: 2, cible: 8 })];
    const cas = new ReassortirConsommables(repo);

    await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qui: "hote@lcd.test",
      ref: "achat-1",
    });
    expect(repo.items[0]?.stock).toBe(8);

    repo.items[0]!.stock = 10;
    await cas.executer({
      tenantId: "t1",
      logementId: "l1",
      qui: "hote@lcd.test",
      ref: "achat-2",
    });
    expect(repo.items[0]?.stock).toBe(10);
  });

  it("liste et calcule les courses du logement", async () => {
    const repo = new MemoireConsommables();
    repo.items = [
      conso({ code: "a", stock: 0 }),
      conso({ code: "b", stock: 2 }),
    ];
    const liste = await new ListerConsommables(repo).executer("t1", "l1");
    expect(liste).toHaveLength(2);
    const courses = await new CalculerCourses(repo).executer("t1", "l1");
    expect(courses.totalArticles).toBe(14);
  });
});
