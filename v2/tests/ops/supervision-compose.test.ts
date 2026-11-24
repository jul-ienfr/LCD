import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Supervision déployée par défaut (spec 006, FR-004).
 *
 * Uptime Kuma et Prometheus ne doivent pas dépendre d'un profil Compose
 * optionnel : un `docker compose up -d` ordinaire les démarre. Leurs ports
 * restent liés à la boucle locale, jamais exposés publiquement.
 */

const lire = (...morceaux: string[]): string =>
  readFileSync(join(process.cwd(), ...morceaux), "utf8");

const COMPOSE = lire("compose.prod.yml");
const DOC = lire("MONITORING.md");

function bloc(service: string): string {
  const debut = COMPOSE.indexOf(`\n  ${service}:`);
  expect(debut, service).toBeGreaterThan(-1);
  const suite = COMPOSE.slice(debut + 1);
  const fin = suite.search(/\n  [a-z][a-z0-9-]*:\s*\n/);
  return fin === -1 ? suite : suite.slice(0, fin);
}

describe("supervision par défaut (FR-004)", () => {
  it("démarre Uptime Kuma et Prometheus sans profil", () => {
    for (const service of ["uptime-kuma", "prometheus"]) {
      const definition = bloc(service);
      expect(definition, service).not.toContain("profiles:");
      expect(definition, service).toContain("restart: unless-stopped");
    }
  });

  it("n'expose les interfaces que sur la boucle locale", () => {
    expect(bloc("uptime-kuma")).toContain('"127.0.0.1:3001:3001"');
    expect(bloc("prometheus")).toContain('"127.0.0.1:9090:9090"');
    expect(bloc("uptime-kuma")).not.toMatch(/"0\.0\.0\.0:/);
    expect(bloc("prometheus")).not.toMatch(/"0\.0\.0\.0:/);
  });

  it("garde une configuration versionnée dans le dépôt", () => {
    expect(COMPOSE).toContain("./monitoring:/etc/prometheus/lcd:ro");
    expect(lire("monitoring", "prometheus.yml")).toContain("lcd");
    // Le tableau des monitors est la référence versionnée.
    expect(DOC).toContain("configuration versionnée");
    expect(DOC).not.toContain("--profile monitoring");
  });
});
