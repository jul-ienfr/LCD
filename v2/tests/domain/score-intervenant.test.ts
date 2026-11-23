import { describe, expect, it } from "vitest";
import {
  analyserPlage,
  calculerScore,
  comparerScores,
  formaterEcartMoyen,
  libelleScore,
  PERIODE_MAX_JOURS,
  plageValide,
  taux,
  type ScoreIntervenant,
  type StatsIntervenant,
} from "@/domain/score-intervenant";

const base: StatsIntervenant = {
  userId: "presta-1",
  interventions: 10,
  annulees: 1,
  terminees: 9,
  pointagesMesurables: 0,
  pointagesALHeure: 0,
  retardMoyenMinutes: null,
  dureesMesurables: 0,
  dureesConformes: 0,
  ecartMoyenMinutes: null,
  preuvesValideesSansRefus: 0,
  preuvesRefuseesAuMoinsUneFois: 0,
  preuvesEnAttente: 0,
};

const stats = (partiel: Partial<StatsIntervenant>): StatsIntervenant => ({
  ...base,
  ...partiel,
});

describe("taux", () => {
  it("rend null quand rien n'est mesurable", () => {
    expect(taux(0, 0)).toBeNull();
    expect(taux(3, 0)).toBeNull();
    expect(taux(Number.NaN, 4)).toBeNull();
  });

  it("arrondit et borne le pourcentage", () => {
    expect(taux(1, 2)).toBe(50);
    expect(taux(1, 3)).toBe(33);
    expect(taux(2, 3)).toBe(67);
    expect(taux(5, 4)).toBe(100);
  });
});

describe("calculerScore", () => {
  it("ne note pas un intervenant sans donnée mesurable", () => {
    const score = calculerScore(stats({}));
    expect(score.score).toBeNull();
    expect(score.qualite).toBeNull();
    expect(score.ponctualite).toBeNull();
    expect(score.regularite).toBeNull();
  });

  it("renormalise sur les composantes mesurables", () => {
    // Qualité parfaite seule : le score vaut la qualité, pas un demi-score
    // parce que les deux autres composantes sont absentes.
    const score = calculerScore(
      stats({ preuvesValideesSansRefus: 4, preuvesRefuseesAuMoinsUneFois: 0 }),
    );
    expect(score.score).toBe(100);
    expect(score.ponctualite).toBeNull();
  });

  it("pondère qualité, ponctualité et régularité", () => {
    const score = calculerScore(
      stats({
        preuvesValideesSansRefus: 2,
        preuvesRefuseesAuMoinsUneFois: 0,
        pointagesMesurables: 4,
        pointagesALHeure: 0,
        dureesMesurables: 2,
        dureesConformes: 2,
      }),
    );
    expect(score.qualite).toBe(100);
    expect(score.ponctualite).toBe(0);
    expect(score.regularite).toBe(100);
    // (50 × 100 + 25 × 0 + 25 × 100) / 100 = 75
    expect(score.score).toBe(75);
  });

  it("compte une preuve refusée au moins une fois dans la qualité", () => {
    const score = calculerScore(
      stats({ preuvesValideesSansRefus: 3, preuvesRefuseesAuMoinsUneFois: 1 }),
    );
    expect(score.qualite).toBe(75);
    expect(score.score).toBe(75);
  });

  it("laisse les preuves en attente hors du calcul de qualité", () => {
    const score = calculerScore(
      stats({
        preuvesValideesSansRefus: 1,
        preuvesRefuseesAuMoinsUneFois: 0,
        preuvesEnAttente: 9,
      }),
    );
    expect(score.qualite).toBe(100);
  });

  it("conserve les agrégats bruts", () => {
    const score = calculerScore(
      stats({ interventions: 7, annulees: 2, retardMoyenMinutes: -4.5 }),
    );
    expect(score.interventions).toBe(7);
    expect(score.annulees).toBe(2);
    expect(score.retardMoyenMinutes).toBe(-4.5);
    expect(score.userId).toBe("presta-1");
  });
});

describe("comparerScores", () => {
  const score = (
    userId: string,
    valeur: number | null,
    qualite: number | null = valeur,
  ): ScoreIntervenant => ({
    ...stats({ userId }),
    score: valeur,
    qualite,
    ponctualite: null,
    regularite: null,
  });

  it("classe du meilleur au moins bon, sans score en dernier", () => {
    const liste = [
      score("b", 60),
      score("a", null),
      score("c", 90),
    ].sort(comparerScores);
    expect(liste.map((s) => s.userId)).toEqual(["c", "b", "a"]);
  });

  it("départage à score égal par la qualité puis par identifiant", () => {
    const liste = [
      score("z", 80, 80),
      score("a", 80, 90),
      score("m", 80, 80),
    ].sort(comparerScores);
    expect(liste.map((s) => s.userId)).toEqual(["a", "m", "z"]);
  });
});

describe("libelleScore", () => {
  it("formate sur 100 ou rien", () => {
    expect(libelleScore(82)).toBe("82/100");
    expect(libelleScore(0)).toBe("0/100");
    expect(libelleScore(null)).toBeNull();
  });
});

describe("formaterEcartMoyen", () => {
  it("n'affiche rien sans mesure", () => {
    expect(formaterEcartMoyen(null)).toBeNull();
    expect(formaterEcartMoyen(Number.POSITIVE_INFINITY)).toBeNull();
  });

  it("affiche l'absence d'écart puis les écarts signés", () => {
    expect(formaterEcartMoyen(0)).toBe("aucun écart");
    expect(formaterEcartMoyen(0.4)).toBe("aucun écart");
    expect(formaterEcartMoyen(12)).toBe("+12 min");
    expect(formaterEcartMoyen(-8.6)).toBe("-9 min");
    expect(formaterEcartMoyen(95)).toBe("+1 h 35");
    expect(formaterEcartMoyen(-120)).toBe("-2 h");
  });
});

describe("plageValide", () => {
  it("accepte une période ordonnée dans les bornes", () => {
    expect(plageValide("2026-11-01", "2026-11-30")).toBe(true);
    expect(plageValide("2026-11-07", "2026-11-07")).toBe(true);
  });

  it("refuse une date invalide ou une période inversée", () => {
    expect(plageValide("2026-11-31", "2026-12-05")).toBe(false);
    expect(plageValide("2026-11-30", "2026-11-01")).toBe(false);
    expect(plageValide("", "2026-11-01")).toBe(false);
  });

  it("refuse une période de plus d'un an", () => {
    expect(plageValide("2026-01-01", "2026-12-31")).toBe(true);
    expect(plageValide("2026-01-01", "2027-01-01")).toBe(true);
    expect(plageValide("2026-01-01", "2027-01-02")).toBe(false);
    expect(PERIODE_MAX_JOURS).toBe(366);
  });
});

describe("analyserPlage", () => {
  const defauts = { du: "2026-11-01", au: "2026-11-30" };

  it("retient les défauts quand rien n'est saisi", () => {
    expect(analyserPlage(null, null, defauts)).toEqual({
      plage: defauts,
      erreur: false,
    });
  });

  it("complète la borne manquante par le défaut", () => {
    expect(analyserPlage("2026-10-05", null, defauts)).toEqual({
      plage: { du: "2026-10-05", au: "2026-11-30" },
      erreur: false,
    });
  });

  it("revient aux défauts en signalant la saisie invalide", () => {
    expect(analyserPlage("2026-11-30", "2026-11-01", defauts)).toEqual({
      plage: defauts,
      erreur: true,
    });
    expect(analyserPlage("hier", null, defauts)).toEqual({
      plage: defauts,
      erreur: true,
    });
  });
});
