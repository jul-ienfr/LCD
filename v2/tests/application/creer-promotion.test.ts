import { describe, expect, it } from "vitest";
import { CreerPromotion } from "@/application/use-cases/creer-promotion";
import { PromotionsRepositoryMemoire } from "../helpers/promotions-repository-memoire";

const tenantId = "11111111-1111-4111-8111-111111111111";

describe("CreerPromotion", () => {
  it("normalise le code et conserve les bornes", async () => {
    const repo = new PromotionsRepositoryMemoire();
    const promotion = await new CreerPromotion(repo).executer({
      tenantId,
      code: " ete-2027 ",
      type: "pourcentage",
      valeur: 15,
      minNuits: 7,
      maxNuits: 21,
      minMontantCentimes: 50_000,
    });
    expect(promotion.code).toBe("ETE-2027");
    expect(promotion.valeur).toBe(15);
    expect(promotion.conditions).toEqual({
      minNuits: 7,
      maxNuits: 21,
      minMontantCentimes: 50_000,
    });
    expect(promotion.actif).toBe(true);
  });

  it("refuse un code, un type ou une valeur invalides", async () => {
    const cas = new CreerPromotion(new PromotionsRepositoryMemoire());
    await expect(
      cas.executer({ tenantId, code: "ab", type: "pourcentage", valeur: 10 }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
    await expect(
      cas.executer({
        tenantId,
        code: "PROMO-1",
        type: "inconnu" as "montant",
        valeur: 10,
      }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
    await expect(
      cas.executer({ tenantId, code: "PROMO-1", type: "montant", valeur: 0 }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
    await expect(
      cas.executer({
        tenantId,
        code: "PROMO-1",
        type: "pourcentage",
        valeur: 101,
      }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
  });

  it("refuse des bornes de nuits incohérentes ou des dates inversées", async () => {
    const cas = new CreerPromotion(new PromotionsRepositoryMemoire());
    await expect(
      cas.executer({
        tenantId,
        code: "PROMO-1",
        type: "montant",
        valeur: 5_000,
        minNuits: 7,
        maxNuits: 3,
      }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
    await expect(
      cas.executer({
        tenantId,
        code: "PROMO-1",
        type: "montant",
        valeur: 5_000,
        debutAt: new Date("2027-06-01T00:00:00Z"),
        finAt: new Date("2027-05-01T00:00:00Z"),
      }),
    ).rejects.toMatchObject({ code: "PROMOTION_INVALIDE" });
  });

  it("bascule une promotion active ou inactive", async () => {
    const repo = new PromotionsRepositoryMemoire();
    const cas = new CreerPromotion(repo);
    const promotion = await cas.executer({
      tenantId,
      code: "LAST",
      type: "pourcentage",
      valeur: 20,
    });
    expect((await repo.basculerActif(tenantId, promotion.id, false))?.actif).toBe(
      false,
    );
    expect(await repo.listerActives(tenantId, "2027-01-01")).toHaveLength(0);
    expect(await repo.basculerActif(tenantId, "inconnu", true)).toBeNull();
  });
});
