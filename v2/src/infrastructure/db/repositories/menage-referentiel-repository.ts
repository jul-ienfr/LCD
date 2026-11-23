import { and, asc, eq } from "drizzle-orm";
import type { MenageReferentielRepository } from "@/application/ports/menage-referentiel-repository";
import type { PieceReferentiel } from "@/domain/menage";
import { withTenant } from "../client";
import { menageReferentiels } from "../schema";

export class DrizzleMenageReferentielRepository
  implements MenageReferentielRepository
{
  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PieceReferentiel[]> {
    const rows = await withTenant(tenantId, (tx) =>
      tx
        .select()
        .from(menageReferentiels)
        .where(
          and(
            eq(menageReferentiels.tenantId, tenantId),
            eq(menageReferentiels.logementId, logementId),
          ),
        )
        .orderBy(
          asc(menageReferentiels.pieceOrdre),
          asc(menageReferentiels.ordre),
        ),
    );
    const pieces: PieceReferentiel[] = [];
    const parPiece = new Map<string, PieceReferentiel>();
    for (const row of rows) {
      const cle = `${row.pieceOrdre}:${row.piece}`;
      let piece = parPiece.get(cle);
      if (!piece) {
        piece = { piece: row.piece, taches: [] };
        parPiece.set(cle, piece);
        pieces.push(piece);
      }
      piece.taches.push(row.libelle);
    }
    return pieces;
  }

  async remplacer(
    tenantId: string,
    logementId: string,
    pieces: readonly PieceReferentiel[],
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(menageReferentiels)
        .where(
          and(
            eq(menageReferentiels.tenantId, tenantId),
            eq(menageReferentiels.logementId, logementId),
          ),
        );
      const lignes = pieces.flatMap((piece, pieceOrdre) =>
        piece.taches.map((libelle, ordre) => ({
          tenantId,
          logementId,
          piece: piece.piece,
          pieceOrdre,
          libelle,
          ordre,
        })),
      );
      if (lignes.length > 0) {
        await tx.insert(menageReferentiels).values(lignes);
      }
    });
  }
}
