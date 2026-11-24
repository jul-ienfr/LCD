import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  construirePreuveRestauration,
  evaluerObjectifs,
} from "../../scripts/preuve-restauration.mjs";

/**
 * Restauration vérifiée chaque semaine, RTO et RPO prouvés (spec 006, FR-008
 * et FR-009). Une preuve ne vaut que si la restauration a réussi ET que les
 * deux objectifs sont tenus ; un échec doit alerter.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const SCRIPT = lire("scripts", "restore-test.mjs");
const VERIF = lire("scripts", "verifier-restauration.sh");
const DOC = lire("BACKUPS.md");

const minute = 60_000;

describe("objectifs RTO/RPO (FR-009)", () => {
  it("accepte une restauration de 29 min et refuse 31 min", () => {
    expect(evaluerObjectifs({ dureeMs: 29 * minute, ageSauvegardeHeures: 1 })).toMatchObject({
      rtoConforme: true,
      conforme: true,
    });
    expect(evaluerObjectifs({ dureeMs: 31 * minute, ageSauvegardeHeures: 1 })).toMatchObject({
      rtoConforme: false,
      conforme: false,
    });
  });

  it("accepte une sauvegarde de 23 h et refuse 25 h", () => {
    expect(evaluerObjectifs({ dureeMs: minute, ageSauvegardeHeures: 23 }).rpoConforme).toBe(true);
    expect(evaluerObjectifs({ dureeMs: minute, ageSauvegardeHeures: 25 }).rpoConforme).toBe(false);
  });

  it("refuse une mesure absente ou aberrante", () => {
    expect(evaluerObjectifs({ dureeMs: Number.NaN, ageSauvegardeHeures: 1 }).conforme).toBe(false);
    expect(
      evaluerObjectifs({ dureeMs: minute, ageSauvegardeHeures: Number.NaN }).conforme,
    ).toBe(false);
    expect(evaluerObjectifs({ dureeMs: -1, ageSauvegardeHeures: 1 }).conforme).toBe(false);
  });

  it("respecte des seuils surchargés", () => {
    const resultat = evaluerObjectifs({
      dureeMs: 10 * minute,
      ageSauvegardeHeures: 1,
      rtoMaxMinutes: 5,
      rpoMaxHeures: 2,
    });
    expect(resultat.rtoConforme).toBe(false);
    expect(resultat.rpoConforme).toBe(true);
  });
});

describe("preuve datée de restauration (FR-008)", () => {
  const base = {
    fichier: "backups/lcd-1.sql.gz",
    demarreLe: "2026-11-29T04:30:00.000Z",
    dureeMs: 3 * minute,
    ageSauvegardeHeures: 1.3,
    comptes: { tenants: 1, users: 2 },
    ok: true,
    erreur: null,
  };

  it("n'est conforme que si la restauration a réussi", () => {
    expect(construirePreuveRestauration(base)).toMatchObject({
      ok: true,
      rtoConforme: true,
      rpoConforme: true,
      conforme: true,
    });
    expect(construirePreuveRestauration({ ...base, ok: false }).ok).toBe(false);
  });

  it("garde la trace d'un échec et l'âge inconnu", () => {
    const preuve = construirePreuveRestauration({
      ...base,
      ok: false,
      ageSauvegardeHeures: null,
      erreur: "RTO dépassé",
    });
    expect(preuve.ok).toBe(false);
    expect(preuve.erreur).toBe("RTO dépassé");
    expect(preuve.rpoConforme).toBe(false);
    expect(preuve.verifieLe).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("est écrite dans tous les cas, y compris en échec", () => {
    expect(SCRIPT).toContain('process.on("exit"');
    expect(SCRIPT).toContain("uncaughtExceptionMonitor");
    expect(SCRIPT).toContain("preuves");
    expect(SCRIPT).toContain("restauration-derniere.json");
  });
});

describe("vérification automatique branchée (FR-008)", () => {
  it("mesure RTO et RPO et invalide la preuve au dépassement", () => {
    expect(SCRIPT).toContain("evaluerObjectifs");
    expect(SCRIPT).toContain("RTO dépassé");
    expect(SCRIPT).toContain("RPO dépassé");
    expect(SCRIPT).toContain("preuve.ok = true");
  });

  it("alerte en cas d'échec", () => {
    expect(VERIF).toContain("alerter-exploitation.mjs");
    expect(VERIF).toContain("--severite critique");
    expect(VERIF).toContain("PREUVE");
  });

  it("documente la cadence hebdomadaire et la preuve", () => {
    expect(DOC).toContain("30 4 * * 0");
    expect(DOC).toContain("verifier-restauration.sh");
    expect(DOC).toContain("rtoConforme");
  });
});
