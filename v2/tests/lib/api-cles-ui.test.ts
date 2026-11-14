import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { LIBELLES_SCOPE_API, SCOPES_API } from "@/domain/cle-api";

const serveur = readFileSync(
  new URL("../../src/routes/hote/integrations/api/+page.server.ts", import.meta.url),
  "utf8",
);
const page = readFileSync(
  new URL("../../src/routes/hote/integrations/api/+page.svelte", import.meta.url),
  "utf8",
);
const integrations = readFileSync(
  new URL("../../src/routes/hote/integrations/+page.svelte", import.meta.url),
  "utf8",
);

describe("UI clés API — T710", () => {
  it("est réservée aux rôles admin/hôte et journalise", () => {
    expect(serveur).toContain('requireRole(event, ["admin", "hote"])');
    expect(serveur).toContain('action: "api.cle_creer"');
    expect(serveur).toContain('action: "api.cle_revoquer"');
  });

  it("n'affiche la clé en clair qu'au retour de création", () => {
    expect(serveur).toContain("return { cleClair: cle, nom: entite.nom }");
    expect(page).toContain("data-cle-clair");
    expect(page).toContain("elle ne sera plus jamais affichée");
  });

  it("propose les six scopes et les actions natives", () => {
    for (const scope of SCOPES_API) {
      expect(LIBELLES_SCOPE_API[scope]).toBeTruthy();
    }
    expect(page).toContain('action="?/creer"');
    expect(page).toContain('action="?/revoquer"');
    expect(page).toContain('name="scopes"');
  });

  it("est reliée depuis la page intégrations", () => {
    expect(integrations).toContain('href="/hote/integrations/api"');
  });
});
