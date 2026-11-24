import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Retour arrière automatique après un déploiement en échec (spec 006, FR-010).
 *
 * Les contrôles post-déploiement ne doivent pas laisser la production sur une
 * version cassée : tout échec ramène la version précédente et alerte.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const DEPLOIEMENT = lire("scripts", "deployer.sh");
const DOC = lire("DEPLOIEMENT-VPS.md");

describe("retour arrière automatique (FR-010)", () => {
  it("ramène la version précédente sans reprendre une sauvegarde", () => {
    expect(DEPLOIEMENT).toContain("revenir.sh --sans-sauvegarde");
    expect(DEPLOIEMENT).toContain('"${PRECEDENT}" = "${COURANT}"');
  });

  it("libère le verrou avant d'appeler revenir.sh", () => {
    expect(DEPLOIEMENT.indexOf("exec 9>&-")).toBeGreaterThan(-1);
    expect(DEPLOIEMENT.indexOf("exec 9>&-")).toBeLessThan(
      DEPLOIEMENT.lastIndexOf("./scripts/revenir.sh --sans-sauvegarde"),
    );
  });

  it("alerte dans tous les cas, succès comme échec du retour arrière", () => {
    expect(DEPLOIEMENT).toContain("--source deploiement");
    expect(DEPLOIEMENT).toContain("Retour arrière automatique vers");
    expect(DEPLOIEMENT).toContain("Le retour arrière automatique a échoué");
    expect(DEPLOIEMENT).toContain("Aucun retour arrière possible");
  });

  it("déclenche le retour arrière sur chaque contrôle post-déploiement", () => {
    const appels = DEPLOIEMENT.match(/retour_arriere "/g) ?? [];
    expect(appels).toHaveLength(3);
    expect(DEPLOIEMENT).toContain("/api/health");
    expect(DEPLOIEMENT).toContain("/api/ready");
    expect(DEPLOIEMENT).toContain("https://${DOMAINE}/api/ready");
  });

  it("documente le comportement automatique", () => {
    expect(DOC).toContain("FR-010");
    expect(DOC).toContain("revenir.sh --sans-sauvegarde");
  });
});
