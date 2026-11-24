import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { construirePreuve } from "../../scripts/preuve-photos.mjs";

/**
 * Photos couvertes par la sauvegarde (spec 006, FR-007).
 *
 * La sauvegarde doit inclure le volume photos, prouver sa complétude par
 * comparaison de comptages, et alerter en cas d'écart ou d'échec.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const BACKUP = lire("scripts", "backup-vps.sh");
const COPIE = lire("scripts", "copier-hors-site.sh");
const DOC = lire("BACKUPS.md");

const base = {
  archive: "photos-20261124-031500.tar.gz",
  sha256: "a".repeat(64),
  fichiers: 1284,
  octets: 734003200,
};

describe("preuve de complétude des photos (FR-007)", () => {
  it("marque conforme une archive qui contient tous les fichiers", () => {
    const preuve = construirePreuve({ ...base, fichiersArchive: 1284 });
    expect(preuve).toMatchObject({
      fichiers: 1284,
      fichiersArchive: 1284,
      octets: 734003200,
      complet: true,
    });
    expect(preuve.prisLe).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("refuse une archive incomplète", () => {
    const preuve = construirePreuve({ ...base, fichiersArchive: 1200 });
    expect(preuve.complet).toBe(false);
  });

  it("refuse un comptage invalide plutôt que de le croire complet", () => {
    expect(construirePreuve({ ...base, fichiersArchive: Number.NaN }).complet).toBe(false);
  });

  it("sort en code 3 quand l'archive est incomplète", () => {
    const script = join(process.cwd(), "scripts", "preuve-photos.mjs");
    const args = [
      script,
      "--archive", base.archive,
      "--sha256", base.sha256,
      "--fichiers", "10",
      "--archives", "9",
    ];
    let statut = 0;
    try {
      execFileSync(process.execPath, args);
    } catch (erreur) {
      statut = (erreur as { status?: number }).status ?? -1;
    }
    expect(statut).toBe(3);
  });
});

describe("branchement de la sauvegarde photos (FR-007)", () => {
  it("archive le volume photos et compare les comptages", () => {
    expect(BACKUP).toContain("/var/lib/lcd/photos");
    expect(BACKUP).toContain("tar -czf -");
    expect(BACKUP).toContain("photos-${horodatage}.tar.gz");
    expect(BACKUP).toContain("fichiers_vivants");
    expect(BACKUP).toContain("fichiers_archives");
    expect(BACKUP).toContain("preuve-photos.mjs");
  });

  it("alerte et échoue plutôt que de laisser une archive muette", () => {
    expect(BACKUP).toContain("alerter-exploitation.mjs");
    expect(BACKUP).toContain("Archive photos incomplète");
    expect(BACKUP).toContain("trap 'on_error $LINENO' ERR");
  });

  it("conserve la rétention et la copie hors-site", () => {
    expect(BACKUP).toContain("-mtime +14 -delete");
    expect(BACKUP).toContain("copier-hors-site.sh");
    expect(COPIE).toContain("OFFSITE_CIBLE");
    expect(COPIE).toContain("sha256sum -c");
    expect(COPIE).toContain("Copie hors-site altérée");
  });

  it("documente la couverture photos et sa vérification", () => {
    expect(DOC).toContain("FR-007");
    expect(DOC).toContain("photos-<horodatage>.json");
    expect(DOC).toContain("sauvegarde-photos.test.ts");
  });
});
