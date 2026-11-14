/**
 * T709 — Garde-fous RLS de l'API v1.
 *
 * Le test réel d'isolation (rôle `lcd_app`, deux tenants, refus d'écriture
 * hors tenant, lecture par empreinte sans contexte) est exécuté par
 * `npm run db:test-rls`. Ce test statique vérifie que la migration conserve
 * les éléments sans lesquels cette vérification ne pourrait pas passer :
 * RLS activée sur les deux tables, policy basée sur `app.tenant_id`,
 * fonction SECURITY DEFINER et droits limités.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL(
    "../../drizzle/0099_cles_api_integrations_tenant.sql",
    import.meta.url,
  ),
  "utf8",
);

const verificateur = readFileSync(
  new URL("../../scripts/verifier-rls.mjs", import.meta.url),
  "utf8",
);

describe("RLS API v1 : migration 0099", () => {
  it("active RLS sur cles_api et integrations_tenant", () => {
    expect(migration).toContain('ALTER TABLE "cles_api" ENABLE ROW LEVEL SECURITY');
    expect(migration).toContain(
      'ALTER TABLE "integrations_tenant" ENABLE ROW LEVEL SECURITY',
    );
  });

  it("filtre chaque policy par app.tenant_id", () => {
    expect(migration).toContain("CREATE POLICY cles_api_isolation");
    expect(migration).toContain("CREATE POLICY integrations_tenant_isolation");
    // Deux policies × (USING + WITH CHECK).
    expect(
      migration.match(/current_setting\('app\.tenant_id', true\)/g),
    ).toHaveLength(4);
  });

  it("limite la lecture par empreinte à une fonction contrôlée", () => {
    expect(migration).toContain(
      "CREATE OR REPLACE FUNCTION api_cle_par_hash(p_hash text)",
    );
    expect(migration).toContain("SECURITY DEFINER");
    expect(migration).toContain("SET search_path = public");
    expect(migration).toContain(
      "REVOKE ALL ON FUNCTION api_cle_par_hash(text) FROM PUBLIC",
    );
    expect(migration).toContain(
      "GRANT EXECUTE ON FUNCTION api_cle_par_hash(text) TO lcd_app",
    );
  });

  it("est couverte par le vérificateur RLS exécutable", () => {
    expect(verificateur).toContain("testerIsolationClesApiIntegrations");
    expect(verificateur).toContain('"cles_api"');
    expect(verificateur).toContain('"integrations_tenant"');
    expect(verificateur).toContain("parHashSansTenant");
  });
});
