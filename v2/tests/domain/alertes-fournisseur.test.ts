import { describe, expect, it } from "vitest";
import type { LogementAvecFournisseur } from "@/application/ports/fournisseur-repository";
import { construireAlertesFournisseurs } from "@/domain/alertes-fournisseur";
import type { SanteSync } from "@/domain/sante-fournisseur";

function logement(
  id: string,
  sante: SanteSync | null,
  overrides: Partial<LogementAvecFournisseur> = {},
): LogementAvecFournisseur & { sante: SanteSync | null } {
  return {
    tenantId: "tenant-1",
    tenantNom: "Tenant",
    tenantSlug: "tenant",
    logementId: id,
    logementNom: `Logement ${id}`,
    logementCode: id,
    fournisseurCode: "beds24",
    externalPropertyId: `ext-${id}`,
    externalRoomTypeId: null,
    externalRatePlanId: null,
    actif: true,
    derniereSync: null,
    dernierStatut: null,
    dernierMessage: null,
    ...overrides,
    sante,
  };
}

describe("construireAlertesFournisseurs", () => {
  it("signale une erreur en danger", () => {
    const alertes = construireAlertesFournisseurs([
      logement("a", { etat: "erreur", ageMinutes: 2, seuilMinutes: 30 }),
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]?.severite).toBe("danger");
  });

  it("signale une synchronisation jamais faite", () => {
    const alertes = construireAlertesFournisseurs([
      logement("a", { etat: "jamais", ageMinutes: null, seuilMinutes: 30 }),
    ]);
    expect(alertes[0]?.message).toContain("Aucune synchronisation");
  });

  it("signale un pull de plus de 15 minutes", () => {
    const alertes = construireAlertesFournisseurs([
      logement("a", { etat: "retard", ageMinutes: 16, seuilMinutes: 30 }),
    ]);
    expect(alertes).toHaveLength(1);
    expect(alertes[0]?.message).toContain("16 min");
  });

  it("ne signale pas un pull de 15 minutes pile", () => {
    const alertes = construireAlertesFournisseurs([
      logement("a", { etat: "retard", ageMinutes: 15, seuilMinutes: 30 }),
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("ignore les états ok et partiel", () => {
    const alertes = construireAlertesFournisseurs([
      logement("a", { etat: "ok", ageMinutes: 1, seuilMinutes: 30 }),
      logement("b", { etat: "partiel", ageMinutes: 1, seuilMinutes: 30 }),
    ]);
    expect(alertes).toHaveLength(0);
  });

  it("trie les dangers avant les alertes", () => {
    const alertes = construireAlertesFournisseurs([
      logement("retard", {
        etat: "retard",
        ageMinutes: 90,
        seuilMinutes: 30,
      }),
      logement("erreur", { etat: "erreur", ageMinutes: 2, seuilMinutes: 30 }),
    ]);
    expect(alertes.map((alerte) => alerte.severite)).toEqual([
      "danger",
      "alerte",
    ]);
  });
});
