/**
 * Gardes statiques pour la chaîne de scrape Prometheus (spec 006, FR-019).
 *
 * Ces tests empêchent la régression silencieuse qui faisait envoyer à Prometheus
 * la chaîne littérale `${METRICS_TOKEN}` (401 au scrape) : le fichier de
 * credentials doit être écrit par le déploiement depuis `.env.prod`, monté en
 * lecture seule dans le conteneur, référencé par `prometheus.yml`, et jamais
 * versionné.
 */

import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const racineV2 = new URL("../../../", import.meta.url);

function lire(cheminRelatifDepuisV2: string): string {
  return readFileSync(new URL(cheminRelatifDepuisV2, racineV2), "utf-8");
}

function lireYaml(cheminRelatifDepuisV2: string): unknown {
  return parse(lire(cheminRelatifDepuisV2));
}

describe("chaîne de scrape Prometheus (FR-019)", () => {
  it("prometheus.yml lit le jeton depuis un credentials_file (pas d'expansion d'env)", () => {
    const config = lireYaml("monitoring/prometheus.yml") as {
      scrape_configs: Array<{
        authorization?: { type?: string; credentials_file?: string; credentials?: string };
      }>;
    };
    const scrape = config.scrape_configs[0];
    if (!scrape) throw new Error("prometheus.yml ne déclare aucun scrape_config.");
    expect(scrape.authorization?.type).toBe("Bearer");
    expect(scrape.authorization?.credentials_file).toBe("/etc/prometheus/lcd/metrics_token");
    // Garde critique : pas de credentials inline (Prometheus n'étend pas ${VAR}).
    expect(scrape.authorization?.credentials).toBeUndefined();
  });

  it("deployer.sh écrit monitoring/metrics_token depuis METRICS_TOKEN de .env.prod", () => {
    const script = lire("scripts/deployer.sh");
    expect(script).toMatch(/METRICS_TOKEN/);
    expect(script).toMatch(/monitoring\/metrics_token/);
    // Le jeton doit provenir de .env.prod (source de vérité du déploiement).
    expect(script).toMatch(/\.env\.prod/);
  });

  it("compose.monitoring.yml monte ./monitoring en lecture seule pour Prometheus", () => {
    const config = lireYaml("compose.monitoring.yml") as {
      services: { prometheus: { volumes?: string[] } };
    };
    const volumes = config.services.prometheus.volumes ?? [];
    expect(volumes).toContain("./monitoring:/etc/prometheus/lcd:ro");
  });

  it("compose.prod.yml monte ./monitoring et démarre Prometheus par défaut (FR-004)", () => {
    const config = lireYaml("compose.prod.yml") as {
      services: { prometheus: { volumes?: string[]; profiles?: string[] } };
    };
    const prometheus = config.services.prometheus;
    // La supervision n'est plus optionnelle : pas de profil à activer.
    expect(prometheus.profiles).toBeUndefined();
    expect(prometheus.volumes ?? []).toContain("./monitoring:/etc/prometheus/lcd:ro");
  });

  it(".gitignore exclut le fichier de jeton de scrape", () => {
    const gitignore = lire(".gitignore");
    expect(gitignore).toMatch(/monitoring\/metrics_token/);
  });
});