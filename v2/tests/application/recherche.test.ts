import { describe, expect, it } from "vitest";
import type {
  RechercheRepository,
  ResultatRecherche,
} from "@/application/ports/recherche-repository";
import {
  RechercherRefs,
  requeteRechercheValide,
} from "@/application/use-cases/recherche";

class RechercheMemoire implements RechercheRepository {
  appels: { tenantId: string; q: string; limite: number }[] = [];
  resultats: ResultatRecherche[] = [];

  async chercher(
    tenantId: string,
    q: string,
    limite: number,
  ): Promise<ResultatRecherche[]> {
    this.appels.push({ tenantId, q, limite });
    return this.resultats;
  }
}

const resultat: ResultatRecherche = {
  id: "r1",
  categorie: "reservation",
  ref: "RESA-2026-001",
  titre: "Dupont",
  detail: "2026-11-01 → 2026-11-05",
  date: "2026-11-01",
  href: "/hote/planning?mois=2026-11",
};

describe("RechercherRefs", () => {
  it("borne la requête entre 2 et 80 caractères", () => {
    expect(requeteRechercheValide("a")).toBe(false);
    expect(requeteRechercheValide("ab")).toBe(true);
    expect(requeteRechercheValide("a".repeat(80))).toBe(true);
    expect(requeteRechercheValide("a".repeat(81))).toBe(false);
    expect(requeteRechercheValide("   ")).toBe(false);
  });

  it("n'interroge pas le dépôt pour une requête vide ou trop courte", async () => {
    const depot = new RechercheMemoire();
    const useCase = new RechercherRefs(depot);
    expect(await useCase.executer("t1", "")).toEqual([]);
    expect(await useCase.executer("t1", " a ")).toEqual([]);
    expect(depot.appels).toEqual([]);
  });

  it("nettoie la requête et transmet le tenant", async () => {
    const depot = new RechercheMemoire();
    depot.resultats = [resultat];
    const useCase = new RechercherRefs(depot);
    const trouves = await useCase.executer("t1", "  RESA-2026-001  ");
    expect(trouves).toEqual([resultat]);
    expect(depot.appels).toEqual([
      { tenantId: "t1", q: "RESA-2026-001", limite: 40 },
    ]);
  });
});
