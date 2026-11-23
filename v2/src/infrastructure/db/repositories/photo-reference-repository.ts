import { and, asc, count, eq } from "drizzle-orm";
import type {
  CreerPhotoReferenceData,
  PhotoReference,
  PhotoReferenceRepository,
} from "@/application/ports/photo-reference-repository";
import { withTenant } from "../client";
import { photosReference } from "../schema";

function versDomaine(row: typeof photosReference.$inferSelect): PhotoReference {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    piece: row.piece,
    ref: row.ref,
    chemin: row.chemin,
    contentType: row.contentType,
    tailleOctets: row.tailleOctets,
    legende: row.legende,
    createdAt: row.createdAt,
  };
}

export class DrizzlePhotoReferenceRepository
  implements PhotoReferenceRepository
{
  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PhotoReference[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(photosReference)
        .where(
          and(
            eq(photosReference.tenantId, tenantId),
            eq(photosReference.logementId, logementId),
          ),
        )
        .orderBy(asc(photosReference.piece), asc(photosReference.createdAt));
      return rows.map(versDomaine);
    });
  }

  async listerParPiece(
    tenantId: string,
    logementId: string,
    piece: string,
  ): Promise<PhotoReference[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(photosReference)
        .where(
          and(
            eq(photosReference.tenantId, tenantId),
            eq(photosReference.logementId, logementId),
            eq(photosReference.piece, piece),
          ),
        )
        .orderBy(asc(photosReference.createdAt));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<PhotoReference | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(photosReference)
        .where(
          and(eq(photosReference.tenantId, tenantId), eq(photosReference.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async compterParPiece(
    tenantId: string,
    logementId: string,
    piece: string,
  ): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ total: count() })
        .from(photosReference)
        .where(
          and(
            eq(photosReference.tenantId, tenantId),
            eq(photosReference.logementId, logementId),
            eq(photosReference.piece, piece),
          ),
        );
      return Number(row?.total ?? 0);
    });
  }

  async creer(data: CreerPhotoReferenceData): Promise<PhotoReference> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(photosReference)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          piece: data.piece,
          ref: data.ref,
          chemin: data.chemin,
          contentType: data.contentType,
          tailleOctets: data.tailleOctets,
          legende: data.legende,
        })
        .returning();
      if (!row) throw new Error("Photo de référence non enregistrée.");
      return versDomaine(row);
    });
  }

  async supprimer(tenantId: string, id: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(photosReference)
        .where(
          and(eq(photosReference.tenantId, tenantId), eq(photosReference.id, id)),
        )
        .returning({ id: photosReference.id });
      return rows.length > 0;
    });
  }
}
