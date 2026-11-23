/**
 * FR-025 (spec 006) — règles pures de la file de jobs durable.
 *
 * Le worker et l'adaptateur sont couverts par la base ; ici on fige ce qui
 * décide d'un rejeu ou d'un abandon : backoff exponentiel plafonné, plafond de
 * tentatives et statuts terminaux. Un redémarrage ne perd rien tant que la
 * ligne n'est pas terminale — c'est cette règle-là qui est testée.
 */
import { describe, expect, it } from "vitest";
import {
  apresEchec,
  BAIL_JOB_MINUTES,
  DELAI_REESSAI_BASE_MS,
  DELAI_REESSAI_MAX_MS,
  delaiReessaiMs,
  doitAbandonner,
  estTerminal,
  LIMITE_LOT_JOBS,
  STATUTS_JOB,
  TENTATIVES_MAX_DEFAUT,
} from "@/domain/jobs-outbox";

const MAINTENANT = new Date("2026-11-23T12:00:00.000Z");

describe("delaiReessaiMs", () => {
  it("double à chaque tentative depuis 30 s", () => {
    expect(delaiReessaiMs(1)).toBe(30_000);
    expect(delaiReessaiMs(2)).toBe(60_000);
    expect(delaiReessaiMs(3)).toBe(120_000);
    expect(delaiReessaiMs(4)).toBe(240_000);
  });

  it("plafonne à une heure", () => {
    expect(delaiReessaiMs(8)).toBe(DELAI_REESSAI_MAX_MS);
    expect(delaiReessaiMs(50)).toBe(DELAI_REESSAI_MAX_MS);
  });

  it("reste positif pour une valeur aberrante", () => {
    expect(delaiReessaiMs(0)).toBe(DELAI_REESSAI_BASE_MS);
    expect(delaiReessaiMs(-3)).toBe(DELAI_REESSAI_BASE_MS);
  });
});

describe("doitAbandonner", () => {
  it("abandonne au plafond, pas avant", () => {
    expect(doitAbandonner(4, 5)).toBe(false);
    expect(doitAbandonner(5, 5)).toBe(true);
    expect(doitAbandonner(6, 5)).toBe(true);
  });

  it("traite un plafond nul comme une seule tentative", () => {
    expect(doitAbandonner(0, 0)).toBe(false);
    expect(doitAbandonner(1, 0)).toBe(true);
  });
});

describe("apresEchec", () => {
  it("remet en attente avec un backoff quand il reste des tentatives", () => {
    const suite = apresEchec(2, 5, MAINTENANT);

    expect(suite.statut).toBe("en_attente");
    expect(suite.disponibleA.toISOString()).toBe(
      new Date(MAINTENANT.getTime() + 60_000).toISOString(),
    );
  });

  it("passe en échec terminal à la dernière tentative", () => {
    const suite = apresEchec(5, 5, MAINTENANT);

    expect(suite.statut).toBe("echec");
    expect(suite.disponibleA).toEqual(MAINTENANT);
  });
});

describe("estTerminal", () => {
  it("reussi et echec ne sont plus réclamés", () => {
    expect(estTerminal("reussi")).toBe(true);
    expect(estTerminal("echec")).toBe(true);
  });

  it("en_attente et en_cours restent repris après un redémarrage", () => {
    expect(estTerminal("en_attente")).toBe(false);
    expect(estTerminal("en_cours")).toBe(false);
  });

  it("ne déclare que des statuts connus", () => {
    expect([...STATUTS_JOB]).toEqual([
      "en_attente",
      "en_cours",
      "reussi",
      "echec",
    ]);
  });
});

describe("bornes de la file", () => {
  it("garde un plafond de tentatives et un bail raisonnables", () => {
    expect(TENTATIVES_MAX_DEFAUT).toBe(5);
    expect(BAIL_JOB_MINUTES).toBeGreaterThan(0);
    expect(LIMITE_LOT_JOBS).toBeGreaterThan(0);
    expect(LIMITE_LOT_JOBS).toBeLessThanOrEqual(100);
  });
});
