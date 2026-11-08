import { and, desc, eq, inArray } from "drizzle-orm";
import type {
  CreerValidationSensibleData,
  ValidationSensibleRepository,
} from "@/application/ports/validation-sensible-repository";
import type {
  TypeValidationSensible,
  ValidationSensible,
} from "@/domain/validation-sensible";
import { withTenant } from "../client";
import { validationsSensibles } from "../schema";

function versDomaine(
  row: typeof validationsSensibles.$inferSelect,
): ValidationSensible {
  return {
    id: row.id,
    tenantId: row.tenantId,
    type: row.type as ValidationSensible["type"],
    cibleId: row.cibleId,
    ref: row.ref,
    montantCentimes: row.montantCentimes,
    payload:
      row.payload && typeof row.payload === "object"
        ? (row.payload as Record<string, unknown>)
        : {},
    demandeurId: row.demandeurId,
    demandeurEmail: row.demandeurEmail,
    statut: row.statut as ValidationSensible["statut"],
    decideurId: row.decideurId,
    decideurEmail: row.decideurEmail,
    motifDecision: row.motifDecision,
    decideLe: row.decideLe,
    payeeLe: row.payeeLe,
    createdAt: row.createdAt,
  };
}

export class DrizzleValidationSensibleRepository
  implements ValidationSensibleRepository
{
  async creer(
    data: CreerValidationSensibleData,
  ): Promise<ValidationSensible> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(validationsSensibles)
        .values({
          tenantId: data.tenantId,
          type: data.type,
          cibleId: data.cibleId,
          ref: data.ref,
          montantCentimes: data.montantCentimes,
          payload: data.payload,
          demandeurId: data.demandeurId,
          demandeurEmail: data.demandeurEmail,
        })
        .returning();
      if (!row) throw new Error("Validation sensible : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<ValidationSensible | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(validationsSensibles)
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            eq(validationsSensibles.id, id),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverEnAttente(
    tenantId: string,
    type: TypeValidationSensible,
    cibleId: string,
  ): Promise<ValidationSensible | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(validationsSensibles)
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            eq(validationsSensibles.type, type),
            eq(validationsSensibles.cibleId, cibleId),
            eq(validationsSensibles.statut, "en_attente"),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerEnAttente(tenantId: string): Promise<ValidationSensible[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(validationsSensibles)
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            eq(validationsSensibles.statut, "en_attente"),
          ),
        )
        .orderBy(desc(validationsSensibles.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParTypes(
    tenantId: string,
    types: readonly TypeValidationSensible[],
    limite = 200,
  ): Promise<ValidationSensible[]> {
    if (types.length === 0) return [];
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(validationsSensibles)
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            inArray(validationsSensibles.type, [...types]),
          ),
        )
        .orderBy(desc(validationsSensibles.createdAt))
        .limit(limite);
      return rows.map(versDomaine);
    });
  }

  async marquerPayee(
    tenantId: string,
    id: string,
    acteurId: string,
    acteurEmail: string,
  ): Promise<ValidationSensible | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(validationsSensibles)
        .set({
          statut: "payee",
          decideurId: acteurId,
          decideurEmail: acteurEmail,
          payeeLe: new Date(),
        })
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            eq(validationsSensibles.id, id),
            eq(validationsSensibles.statut, "approuvee"),
          ),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async decider(
    tenantId: string,
    id: string,
    statut: "approuvee" | "rejetee",
    decideurId: string,
    decideurEmail: string,
    motifDecision: string | null,
  ): Promise<ValidationSensible | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(validationsSensibles)
        .set({
          statut,
          decideurId,
          decideurEmail,
          motifDecision,
          decideLe: new Date(),
        })
        .where(
          and(
            eq(validationsSensibles.tenantId, tenantId),
            eq(validationsSensibles.id, id),
            eq(validationsSensibles.statut, "en_attente"),
          ),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }
}
