import { ErreurMetier } from "@/domain/erreurs";
import type {
  FilsVoyageurRepository,
  PieceJointeMessage,
} from "../ports/fils-voyageur-repository";
import type { StockageFichiers } from "../ports/stockage";

/** Types acceptés pour une pièce jointe de message. */
export const TYPES_PIECE_JOINTE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export const TAILLE_PIECE_JOINTE_MAX = 8 * 1024 * 1024;

export interface AjouterPieceJointeInput {
  tenantId: string;
  messageId: string;
  nomFichier: string;
  contentType: string;
  octets: Uint8Array;
}

export function validerPieceJointe(input: {
  contentType: string;
  taille: number;
}): { contentType: string; extension: string } {
  const extension = TYPES_PIECE_JOINTE[input.contentType];
  if (!extension) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Format de pièce jointe non accepté (jpg, png, webp ou pdf).",
    );
  }
  if (input.taille <= 0) {
    throw new ErreurMetier("MESSAGE_INVALIDE", "La pièce jointe est vide.");
  }
  if (input.taille > TAILLE_PIECE_JOINTE_MAX) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Pièce jointe trop lourde (8 Mo maximum).",
    );
  }
  return { contentType: input.contentType, extension };
}

export function nomFichierPropre(nom: string): string {
  const base = nom
    .replace(/[\\/]/g, "-")
    .replace(/[\u0000-\u001f]/g, "")
    .replace(/\.{2,}/g, "-")
    .trim()
    .slice(0, 120);
  if (base.length < 1 || base.replace(/[.-]/g, "").length < 1) {
    throw new ErreurMetier("MESSAGE_INVALIDE", "Nom de fichier invalide.");
  }
  return base;
}

/**
 * Range une pièce jointe dans le stockage puis la rattache au message.
 * Le fichier est écrit avant la ligne en base : un fichier orphelin est
 * préférable à une ligne pointant vers un fichier absent.
 */
export class AjouterPieceJointe {
  constructor(
    private readonly fils: FilsVoyageurRepository,
    private readonly stockage: StockageFichiers,
    private readonly prefixeCle = "messages",
  ) {}

  async executer(input: AjouterPieceJointeInput): Promise<PieceJointeMessage> {
    const message = await this.fils.trouverMessageParId(
      input.tenantId,
      input.messageId,
    );
    if (!message) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Message introuvable.");
    }

    const { contentType, extension } = validerPieceJointe({
      contentType: input.contentType,
      taille: input.octets.byteLength,
    });
    const nomFichier = nomFichierPropre(input.nomFichier);
    const cle = `${this.prefixeCle}/${input.tenantId}/${input.messageId}/${Date.now()}-${nomFichier.slice(0, 60)}.${extension}`;

    await this.stockage.put(cle, input.octets, contentType);

    try {
      return await this.fils.creerPieceJointe({
        tenantId: input.tenantId,
        messageId: input.messageId,
        nomFichier,
        typeMime: contentType,
        tailleOctets: input.octets.byteLength,
        cleStockage: cle,
      });
    } catch (erreur) {
      await this.stockage.delete(cle).catch(() => undefined);
      throw erreur;
    }
  }
}
