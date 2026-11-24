import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Moniteur externe au serveur surveillé (spec 006, FR-005).
 *
 * Le job doit tourner hors du VPS, sonder les surfaces publiques au moins
 * toutes les cinq minutes et alerter sur le canal d'exploitation.
 */

const YML = readFileSync(
  join(process.cwd(), "..", ".github", "workflows", "v2-moniteur-externe.yml"),
  "utf8",
);

describe("moniteur externe (FR-005)", () => {
  it("sonde toutes les cinq minutes depuis hors du serveur", () => {
    expect(YML).toContain('cron: "*/5 * * * *"');
    expect(YML).toContain("runs-on: ubuntu-latest");
    expect(YML).toContain("workflow_dispatch:");
  });

  it("vérifie les surfaces publiques", () => {
    for (const chemin of ["/api/health", "/api/ready", "/login"]) {
      expect(YML).toContain(chemin);
    }
    expect(YML).toContain("vars.LCD_APP_URL");
    expect(YML).toContain("--max-time 15");
  });

  it("alerte le canal configuré quand une sonde échoue", () => {
    expect(YML).toContain("if: failure()");
    expect(YML).toContain("secrets.ALERTE_WEBHOOK_URL");
    expect(YML).toContain("severite");
    expect(YML).toContain("runbook");
  });

  it("ne bloque pas avant go-live, faute d'URL publique", () => {
    expect(YML).toContain("if: vars.LCD_APP_URL != ''");
  });
});
