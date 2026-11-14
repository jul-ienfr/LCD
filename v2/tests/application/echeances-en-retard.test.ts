import { describe, expect, it } from "vitest";
import { EcheancesPaiementRepositoryMemoire } from "../helpers/echeances-paiement-repository-memoire";

const TENANT = "11111111-1111-4111-8111-111111111111";
const AUTRE_TENANT = "22222222-2222-4222-8222-222222222222";

describe("échéances en retard (centre de notifications)", () => {
  it("ne retient que les échéances à payer et déjà exigibles, du bon tenant", async () => {
    const depot = new EcheancesPaiementRepositoryMemoire();
    await depot.creerPlusieurs([
      {
        tenantId: TENANT,
        reservationId: "r-1",
        type: "acompte",
        montantCentimes: 30000,
        exigibleLe: "2026-11-01",
      },
      {
        tenantId: TENANT,
        reservationId: "r-2",
        type: "solde",
        montantCentimes: 70000,
        exigibleLe: "2026-12-20",
      },
      {
        tenantId: AUTRE_TENANT,
        reservationId: "r-3",
        type: "acompte",
        montantCentimes: 10000,
        exigibleLe: "2026-10-01",
      },
    ]);

    const retard = await depot.listerEnRetard(TENANT, "2026-11-09");

    expect(retard).toHaveLength(1);
    expect(retard[0]?.reservationId).toBe("r-1");
    expect(retard[0]?.montantCentimes).toBe(30000);
  });

  it("oublie une échéance dès qu'elle est payée", async () => {
    const depot = new EcheancesPaiementRepositoryMemoire();
    const [echeance] = await depot.creerPlusieurs([
      {
        tenantId: TENANT,
        reservationId: "r-4",
        type: "acompte",
        montantCentimes: 20000,
        exigibleLe: "2026-11-02",
      },
    ]);
    expect(await depot.listerEnRetard(TENANT, "2026-11-09")).toHaveLength(1);

    await depot.marquerPaye(TENANT, echeance!.id, "paiement-1");

    expect(await depot.listerEnRetard(TENANT, "2026-11-09")).toHaveLength(0);
  });
});
