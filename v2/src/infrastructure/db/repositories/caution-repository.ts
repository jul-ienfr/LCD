import { and, asc, eq } from "drizzle-orm";
import type {
  CautionRepository,
  ChangerStatutCautionData,
  CreerCautionData,
  ResultatCaution,
} from "@/application/ports/caution-repository";
import type { Caution } from "@/domain/caution";
import { withTenant } from "../client";
import { cautions } from "../schema";

function versDomaine(row: typeof cautions.$inferSelect): Caution {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reservationId: row.reservationId,
    montantCentimes: row.montantCentimes,
    statut: row.statut as Caution["statut"],
    dateReception: row.dateReception,
    dateRestitution: row.dateRestitution,
    montantRetenuCentimes: row.montantRetenuCentimes,
    motifRetenue: row.motifRetenue,
    notes: row.notes,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleCautionRepository implements CautionRepository {
  async creer(data: CreerCautionData): Promise<ResultatCaution> {
    return withTenant(data.tenantId, async (tx) => {
      const [cree] = await tx
        .insert(cautions)
        .values({
          tenantId: data.tenantId,
          reservationId: data.reservationId,
          montantCentimes: data.montantCentimes,
          notes: data.notes ?? null,
        })
        .onConflictDoNothing({
          target: [cautions.tenantId, cautions.reservationId],
        })
        .returning();

      if (cree) return { caution: versDomaine(cree), cree: true };

      const [existant] = await tx
        .select()
        .from(cautions)
        .where(
          and(
            eq(cautions.tenantId, data.tenantId),
            eq(cautions.reservationId, data.reservationId),
          ),
        )
        .limit(1);
      if (!existant) throw new Error("Caution idempotente introuvable.");
      return { caution: versDomaine(existant), cree: false };
    });
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Caution | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(cautions)
        .where(
          and(
            eq(cautions.tenantId, tenantId),
            eq(cautions.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<Caution | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(cautions)
        .where(and(eq(cautions.tenantId, tenantId), eq(cautions.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParTenant(tenantId: string): Promise<Caution[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(cautions)
        .where(eq(cautions.tenantId, tenantId))
        .orderBy(asc(cautions.createdAt));
      return rows.map(versDomaine);
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    data: ChangerStatutCautionData,
  ): Promise<Caution | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(cautions)
        .set({
          statut: data.statut,
          dateReception:
            data.dateReception === undefined
              ? undefined
              : data.dateReception,
          dateRestitution:
            data.dateRestitution === undefined
              ? undefined
              : data.dateRestitution,
          montantRetenuCentimes:
            data.montantRetenuCentimes === undefined
              ? undefined
              : data.montantRetenuCentimes,
          motifRetenue:
            data.motifRetenue === undefined ? undefined : data.motifRetenue,
          updatedAt: new Date(),
        })
        .where(and(eq(cautions.tenantId, tenantId), eq(cautions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
