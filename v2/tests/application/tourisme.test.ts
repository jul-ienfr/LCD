import { describe, expect, it } from "vitest";
import { ErreurMetier } from "@/domain/erreurs";
import {
  categorieValide,
  filtrerLieux,
  slugLieuValide,
  validerLieu,
  type LieuTourisme,
  type LieuTourismeInput,
} from "@/domain/tourisme";
import {
  DesactiverLieuTourisme,
  EnregistrerLieuTourisme,
  ListerLieuxTourisme,
} from "@/application/use-cases/tourisme";
import type { LieuxTourismeRepository } from "@/application/ports/lieux-tourisme-repository";

function lieu(over: Partial<LieuTourisme> = {}): LieuTourisme {
  return {
    id: over.id ?? "l1",
    tenantId: "t1",
    logementId: over.logementId ?? null,
    slug: over.slug ?? "plage",
    nom: over.nom ?? "Plage",
    categorie: over.categorie ?? "plage",
    commune: null,
    acces: null,
    prixIndicatif: null,
    lien: null,
    mode: null,
    extraId: null,
    actif: over.actif ?? true,
  };
}

class MemoireLieux implements LieuxTourismeRepository {
  items: LieuTourisme[] = [];

  async lister(_t: string, logementId: string, options?: { inclureInactifs?: boolean }) {
    return this.items.filter(
      (l) =>
        (l.logementId === null || l.logementId === logementId) &&
        (options?.inclureInactifs || l.actif),
    );
  }
  async enregistrer(input: LieuTourismeInput) {
    const existant = this.items.find((l) => l.slug === input.slug);
    if (existant) {
      Object.assign(existant, input, { id: existant.id });
      return existant;
    }
    const cree: LieuTourisme = {
      ...input,
      id: input.id ?? `l-${this.items.length + 1}`,
      actif: input.actif ?? true,
    };
    this.items.push(cree);
    return cree;
  }
  async desactiver(_t: string, slug: string) {
    const item = this.items.find((l) => l.slug === slug);
    if (item) item.actif = false;
  }
}

describe("domaine tourisme", () => {
  it("valide slugs et catégories", () => {
    expect(slugLieuValide("promenade-littoral")).toBe(true);
    expect(slugLieuValide("Promenade Littoral")).toBe(false);
    expect(categorieValide("plage")).toBe(true);
    expect(categorieValide("inconnue")).toBe(false);
  });

  it("refuse un lien non http et un nom vide", () => {
    expect(() =>
      validerLieu({
        slug: "ok",
        nom: "Lieu",
        categorie: "visite",
        lien: "javascript:alert(1)",
      }),
    ).toThrow(ErreurMetier);
    expect(() =>
      validerLieu({
        slug: "ok",
        nom: "",
        categorie: "visite",
        lien: null,
      }),
    ).toThrow(ErreurMetier);
  });

  it("filtre par catégorie connue", () => {
    const lieux = [lieu({ slug: "a", categorie: "plage" }), lieu({ slug: "b", categorie: "resto" })];
    expect(filtrerLieux(lieux, "plage")).toHaveLength(1);
    expect(filtrerLieux(lieux, "inconnue")).toHaveLength(0);
    expect(filtrerLieux(lieux)).toHaveLength(2);
  });
});

describe("cas d'usage tourisme", () => {
  const base = {
    tenantId: "t1",
    logementId: null,
    slug: "Promenade-Littoral",
    nom: "Promenade du littoral",
    categorie: "visite",
    commune: "Saint-Laurent-du-Var",
    acces: "10 min à pied",
    prixIndicatif: "gratuit",
    lien: "https://example.test",
    mode: null,
    extraId: null,
  };

  it("enregistre, met à jour par slug et filtre par logement", async () => {
    const repo = new MemoireLieux();
    const cas = new EnregistrerLieuTourisme(repo);
    const cree = await cas.executer(base);
    expect(cree.slug).toBe("promenade-littoral");
    const maj = await cas.executer({ ...base, nom: "Littoral" });
    expect(maj.id).toBe(cree.id);
    expect(repo.items).toHaveLength(1);

    repo.items.push(lieu({ slug: "local", logementId: "l1" }));
    const liste = await new ListerLieuxTourisme(repo).executer("t1", "l1");
    expect(liste).toHaveLength(2);
    const autre = await new ListerLieuxTourisme(repo).executer("t1", "l2");
    expect(autre).toHaveLength(1);
  });

  it("filtre par catégorie et masque les inactifs", async () => {
    const repo = new MemoireLieux();
    repo.items = [
      lieu({ slug: "a", categorie: "plage" }),
      lieu({ slug: "b", categorie: "resto" }),
      lieu({ slug: "c", categorie: "plage", actif: false }),
    ];
    const cas = new ListerLieuxTourisme(repo);
    const plages = await cas.executer("t1", "l1", { categorie: "plage" });
    expect(plages.map((l) => l.slug)).toEqual(["a"]);
    const tous = await cas.executer("t1", "l1", { inclureInactifs: true });
    expect(tous).toHaveLength(3);
  });

  it("désactive un lieu", async () => {
    const repo = new MemoireLieux();
    repo.items = [lieu({ slug: "a" })];
    await new DesactiverLieuTourisme(repo).executer("t1", "a");
    expect(repo.items[0]?.actif).toBe(false);
  });
});
