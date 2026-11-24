import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  artefactsSauvegarde,
  etatCopieHorsSite,
} from "../../scripts/verifier-sauvegarde-externe.mjs";

/**
 * Copie hors-site des sauvegardes (spec 006, FR-006).
 *
 * La copie doit exister hors du VPS, être automatique, et son absence doit
 * alerter. Ce test vérifie la règle d'âge (RPO 24 h + marge) et le
 * branchement des workflows.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const BACKUP = lire("..", ".github", "workflows", "v2-backup.yml");
const VERIF = lire("..", ".github", "workflows", "v2-verif-sauvegarde.yml");
const DOC = lire("BACKUPS.md");

const maintenant = new Date("2026-11-24T12:00:00.000Z");
const artefact = (nom: string, creeLe: string) => ({
  name: nom,
  created_at: creeLe,
  expires_at: "2026-12-24T12:00:00.000Z",
});

describe("copie hors-site (FR-006)", () => {
  it("ne retient que les artefacts de sauvegarde", () => {
    const liste = artefactsSauvegarde([
      artefact("lcd-backup-123", "2026-11-24T02:00:00.000Z"),
      { name: "preuve-sauvegarde-hors-site-1" },
      { name: null },
      {},
    ]);
    expect(liste).toHaveLength(1);
    expect(liste[0]?.name).toBe("lcd-backup-123");
  });

  it("accepte une copie de moins de 26 heures", () => {
    const etat = etatCopieHorsSite(
      [artefact("lcd-backup-1", "2026-11-23T02:00:00.000Z")],
      maintenant,
    );
    // 34 h > 26 h : la copie de la veille n'est plus conforme.
    expect(etat.conforme).toBe(false);
    const fraiche = etatCopieHorsSite(
      [artefact("lcd-backup-2", "2026-11-24T02:00:00.000Z")],
      maintenant,
    );
    expect(fraiche.conforme).toBe(true);
    expect(fraiche.ageHeures).toBe(10);
  });

  it("échoue quand aucune copie n'existe", () => {
    const etat = etatCopieHorsSite([], maintenant);
    expect(etat).toMatchObject({ present: false, conforme: false, nom: null });
  });

  it("garde la plus récente quand plusieurs copies existent", () => {
    const etat = etatCopieHorsSite(
      [
        artefact("lcd-backup-ancienne", "2026-11-20T02:00:00.000Z"),
        artefact("lcd-backup-recente", "2026-11-24T03:00:00.000Z"),
      ],
      maintenant,
    );
    expect(etat.nom).toBe("lcd-backup-recente");
    expect(etat.conforme).toBe(true);
  });
});

describe("branchement de la copie hors-site (FR-006)", () => {
  it("publie la sauvegarde comme artefact hors du serveur", () => {
    expect(BACKUP).toContain("actions/upload-artifact@v4");
    expect(BACKUP).toContain("lcd-backup-${{ github.run_id }}");
    expect(BACKUP).toContain("if: failure()");
    expect(BACKUP).toContain("secrets.ALERTE_WEBHOOK_URL");
  });

  it("vérifie chaque jour la fraîcheur de la copie", () => {
    expect(VERIF).toContain('cron: "0 4 * * *"');
    expect(VERIF).toContain("db:verifier-hors-site");
    expect(VERIF).toContain("AGE_MAX_HEURES");
    expect(VERIF).toContain("if: failure()");
  });

  it("documente la copie hors-site et sa vérification", () => {
    expect(DOC).toContain("hors-site");
    expect(DOC).toContain("v2-verif-sauvegarde");
  });
});
