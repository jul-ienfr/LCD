import { and, desc, eq, gte, isNull, lte, or } from "drizzle-orm";
import type {
  CreerPromotionData,
  PromotionsRepository,
} from "@/application/ports/promotions-repository";
import type { ConditionsPromotion, Promotion } from "@/domain/promotion";
import { normaliserCodePromo } from "@/domain/promotion";
import { withTenant } from "../client";
import { promotions } from "../schema";

function versConditions(valeur: unknown): ConditionsPromotion {
  if (!valeur || typeof valeur !== "object" || Array.isArray(valeur)) {
    return {};
  }
  const source = valeur as Record<string, unknown>;
  const conditions: ConditionsPromotion = {};
  if (typeof source.minNuits === "number") conditions.minNuits = source.minNuits;
  if (typeof source.maxNuits === "number") conditions.maxNuits = source.maxNuits;
  if (typeof source.minMontantCentimes === "number") {
    conditions.minMontantCentimes = source.minMontantCentimes;
  }
  if (typeof source.logementId === "string") {
    conditions.logementId = source.logementId;
  }
  return conditions;
}

function versPromotion(row: typeof promotions.$inferSelect): Promotion {
  return {
    id: row.id,
    code: row.code ?? "",
    type: row.type === "montant" ? "montant" : "pourcentage",
    valeur: row.valeur,
    conditions: versConditions(row.conditions),
    actif: row.actif,
    debutAt: row.debutAt,
    finAt: row.finAt,
  };
}

export class DrizzlePromotionsRepository implements PromotionsRepository {
  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Promotion | null> {
    const normalise = normaliserCodePromo(code);
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(promotions)
        .where(
          and(eq(promotions.tenantId, tenantId), eq(promotions.code, normalise)),
        )
        .limit(1);
      return row ? versPromotion(row) : null;
    });
  }

  async listerActives(tenantId: string, date: string): Promise<Promotion[]> {
    const borne = new Date(`${date}T23:59:59.999Z`);
    const debut = new Date(`${date}T00:00:00.000Z`);
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(promotions)
        .where(
          and(
            eq(promotions.tenantId, tenantId),
            eq(promotions.actif, true),
            or(isNull(promotions.debutAt), lte(promotions.debutAt, borne)),
            or(isNull(promotions.finAt), gte(promotions.finAt, debut)),
          ),
        );
      return rows.map(versPromotion);
    });
  }

  async listerParTenant(tenantId: string): Promise<Promotion[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(promotions)
        .where(eq(promotions.tenantId, tenantId))
        .orderBy(desc(promotions.actif), desc(promotions.createdAt));
      return rows.map(versPromotion);
    });
  }

  async basculerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<Promotion | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(promotions)
        .set({ actif })
        .where(and(eq(promotions.tenantId, tenantId), eq(promotions.id, id)))
        .returning();
      return row ? versPromotion(row) : null;
    });
  }

  async creer(data: CreerPromotionData): Promise<Promotion> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(promotions)
        .values({
          tenantId: data.tenantId,
          code: normaliserCodePromo(data.code),
          type: data.type,
          valeur: data.valeur,
          conditions: (data.conditions ?? {}) as Record<string, unknown>,
          logementId: data.logementId ?? null,
          actif: data.actif ?? true,
          debutAt: data.debutAt ?? null,
          finAt: data.finAt ?? null,
        })
        .returning();
      if (!row) throw new Error("Promotion non créée.");
      return versPromotion(row);
    });
  }
}
