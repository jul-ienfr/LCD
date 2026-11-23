import type { MenageReferentielRepository } from "@/application/ports/menage-referentiel-repository";
import type { PieceReferentiel } from "@/domain/menage";

/**
 * Double mémoire du référentiel de ménage (FR-035) : un référentiel par
 * logement, remplacé en bloc comme en base.
 */
export class MenageReferentielRepositoryMemoire
  implements MenageReferentielRepository
{
  private readonly parLogement = new Map<string, PieceReferentiel[]>();
  readonly ecritures: {
    tenantId: string;
    logementId: string;
    pieces: PieceReferentiel[];
  }[] = [];

  private cle(tenantId: string, logementId: string): string {
    return `${tenantId}:${logementId}`;
  }

  definir(
    tenantId: string,
    logementId: string,
    pieces: PieceReferentiel[],
  ): void {
    this.parLogement.set(this.cle(tenantId, logementId), pieces);
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PieceReferentiel[]> {
    const pieces = this.parLogement.get(this.cle(tenantId, logementId)) ?? [];
    return pieces.map((piece) => ({
      piece: piece.piece,
      taches: [...piece.taches],
    }));
  }

  async remplacer(
    tenantId: string,
    logementId: string,
    pieces: readonly PieceReferentiel[],
  ): Promise<void> {
    const copie = pieces.map((piece) => ({
      piece: piece.piece,
      taches: [...piece.taches],
    }));
    this.ecritures.push({ tenantId, logementId, pieces: copie });
    if (copie.length === 0) {
      this.parLogement.delete(this.cle(tenantId, logementId));
      return;
    }
    this.parLogement.set(this.cle(tenantId, logementId), copie);
  }
}
