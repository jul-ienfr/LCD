import { describe, expect, it } from "vitest";
import { CalculerScoresIntervenants } from "@/application/use-cases/score-intervenant";
import {
  ScoreIntervenantRepositoryMemoire,
  statsIntervenant,
} from "../helpers/score-intervenant-repository-memoire";

const TENANT = "tenant-1";

describe("CalculerScoresIntervenants", () => {
  it("transmet la période au dépôt et rend une liste vide sans intervention", async () => {
    const depot = new ScoreIntervenantRepositoryMemoire();
    const scores = await new CalculerScoresIntervenants(depot).executer({
      tenantId: TENANT,
      du: "2026-11-01",
      au: "2026-11-30",
    });
    expect(scores).toEqual([]);
    expect(depot.appels).toEqual([
      { tenantId: TENANT, du: "2026-11-01", au: "2026-11-30" },
    ]);
  });

  it("calcule et ordonne les scores des intervenants", async () => {
    const depot = new ScoreIntervenantRepositoryMemoire();
    depot.definir(TENANT, [
      statsIntervenant({
        userId: "presta-faible",
        interventions: 6,
        preuvesValideesSansRefus: 1,
        preuvesRefuseesAuMoinsUneFois: 3,
        pointagesMesurables: 6,
        pointagesALHeure: 1,
        dureesMesurables: 6,
        dureesConformes: 2,
      }),
      statsIntervenant({
        userId: "presta-solide",
        interventions: 8,
        preuvesValideesSansRefus: 4,
        pointagesMesurables: 8,
        pointagesALHeure: 7,
        dureesMesurables: 8,
        dureesConformes: 6,
        retardMoyenMinutes: -3,
      }),
      statsIntervenant({ userId: "presta-sans-donnee", interventions: 1 }),
    ]);

    const scores = await new CalculerScoresIntervenants(depot).executer({
      tenantId: TENANT,
      du: "2026-11-01",
      au: "2026-11-30",
    });

    expect(scores.map((score) => score.userId)).toEqual([
      "presta-solide",
      "presta-faible",
      "presta-sans-donnee",
    ]);
    const solide = scores[0]!;
    expect(solide.qualite).toBe(100);
    expect(solide.ponctualite).toBe(88);
    expect(solide.regularite).toBe(75);
    // (50 × 100 + 25 × 88 + 25 × 75) / 100 = 90,75 → 91
    expect(solide.score).toBe(91);
    const faible = scores[1]!;
    expect(faible.qualite).toBe(25);
    expect(faible.ponctualite).toBe(17);
    expect(faible.regularite).toBe(33);
    // (50 × 25 + 25 × 17 + 25 × 33) / 100 = 25
    expect(faible.score).toBe(25);
    // Aucune composante mesurable : aucun score plutôt qu'un zéro trompeur.
    expect(scores[2]!.score).toBeNull();
  });

  it("n'agrège que le tenant demandé", async () => {
    const depot = new ScoreIntervenantRepositoryMemoire();
    depot.definir("autre-tenant", [
      statsIntervenant({ userId: "presta-autre", preuvesValideesSansRefus: 1 }),
    ]);
    const scores = await new CalculerScoresIntervenants(depot).executer({
      tenantId: TENANT,
      du: "2026-11-01",
      au: "2026-11-30",
    });
    expect(scores).toEqual([]);
  });
});
