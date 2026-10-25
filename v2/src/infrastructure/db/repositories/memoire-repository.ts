import { and, eq, lt } from "drizzle-orm";
import type {
  EnregistrerMemoireData,
  MemoireRepository,
  MemoireVoyageur,
} from "@/application/ports/memoire-repository";
import { withTenant } from "../client";
import { memoireVoyageurs } from "../schema";

function versDomaine(
  row: typeof memoireVoyageurs.$inferSelect,
): MemoireVoyageur {
  return {
    id: row.id,
    tenantId: row.tenantId,
    emailHash: row.emailHash,
    nom: row.nom,
    preferences: row.preferences,
    consentementAt: row.consentementAt,
    expireAt: row.expireAt,
    lastSeenAt: row.lastSeenAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMemoireRepository implements MemoireRepository {
  async enregistrer(data: EnregistrerMemoireData): Promise<MemoireVoyageur> {
    return withTenant(data.tenantId, async (tx) => {
      const maintenant = new Date();
      const [row] = await tx
        .insert(memoireVoyageurs)
        .values({
          tenantId: data.tenantId,
          emailHash: data.emailHash,
          nom: data.nom,
          preferences: data.preferences,
          consentementAt: data.consentementAt,
          expireAt: data.expireAt,
          lastSeenAt: maintenant,
        })
        .onConflictDoUpdate({
          target: [
            memoireVoyageurs.tenantId,
            memoireVoyageurs.emailHash,
          ],
          set: {
            nom: data.nom,
            preferences: data.preferences,
            consentementAt: data.consentementAt,
            expireAt: data.expireAt,
            lastSeenAt: maintenant,
            updatedAt: maintenant,
          },
        })
        .returning();
      if (!row) throw new Error("Mémoire voyageur : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParHash(
    tenantId: string,
    emailHash: string,
  ): Promise<MemoireVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(memoireVoyageurs)
        .where(
          and(
            eq(memoireVoyageurs.tenantId, tenantId),
            eq(memoireVoyageurs.emailHash, emailHash),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async supprimer(tenantId: string, emailHash: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(memoireVoyageurs)
        .where(
          and(
            eq(memoireVoyageurs.tenantId, tenantId),
            eq(memoireVoyageurs.emailHash, emailHash),
          ),
        )
        .returning({ id: memoireVoyageurs.id });
      return rows.length > 0;
    });
  }

  async purgerExpires(
    tenantId: string,
    maintenant = new Date(),
  ): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(memoireVoyageurs)
        .where(
          and(
            eq(memoireVoyageurs.tenantId, tenantId),
            lt(memoireVoyageurs.expireAt, maintenant),
          ),
        )
        .returning({ id: memoireVoyageurs.id });
      return rows.length;
    });
  }
}
