import { createHash } from "node:crypto";
import { ErreurMetier } from "@/domain/erreurs";
import type { EmailEntrant } from "@/domain/email-entrant";
import type { FilVoyageur } from "@/domain/fil-voyageur";
import type {
  FilsVoyageurRepository,
  MessageFil,
} from "../ports/fils-voyageur-repository";
import type { StockageFichiers } from "../ports/stockage";
import { AjouterPieceJointe } from "./ajouter-piece-jointe";

export type ResultatEmailEntrant =
  | { type: "ignore"; motif: "fil_introuvable" | "logement_absent" }
  | { type: "recu"; message: MessageFil; dejaRecu: boolean };

/**
 * T307 — range un e-mail entrant dans le fil du contact.
 *
 * Aucune création de fil depuis un expéditeur inconnu : un e-mail non
 * rattachable reste ignoré, pour ne pas fabriquer de voyageur à partir d'un
 * expéditeur arbitraire. L'idempotence repose sur le `Message-ID` du fournisseur.
 */
export class RecevoirEmailEntrant {
  private readonly ajouterPieceJointe: AjouterPieceJointe | null;

  constructor(
    private readonly fils: FilsVoyageurRepository,
    stockage: StockageFichiers | null = null,
  ) {
    this.ajouterPieceJointe = stockage
      ? new AjouterPieceJointe(fils, stockage)
      : null;
  }

  async executer(
    tenantId: string,
    email: EmailEntrant,
  ): Promise<ResultatEmailEntrant> {
    const existant = await this.fils.trouverMessageParExternalId(
      tenantId,
      "email",
      email.messageId,
    );
    if (existant) return { type: "recu", message: existant, dejaRecu: true };

    const fil = email.inReplyTo
      ? await this.filDepuisReponse(tenantId, email.inReplyTo)
      : null;
    const filCible =
      fil ?? (await this.fils.trouverParContact(tenantId, { email: email.de }));
    if (!filCible) return { type: "ignore", motif: "fil_introuvable" };
    if (!filCible.logementId) return { type: "ignore", motif: "logement_absent" };

    const ref = `mail-${createHash("sha256")
      .update(email.messageId)
      .digest("hex")
      .slice(0, 32)}`;
    const contenu = (email.texte || email.sujet).trim().slice(0, 8_000);

    const message = await this.fils.creerMessage({
      tenantId,
      filId: filCible.id,
      ref,
      canal: "email",
      sens: "entrant",
      contenu,
      destinataire: email.vers,
      expediteur: email.de,
      externalId: email.messageId,
      statut: "recu",
      envoyeAt: email.date,
    });

    for (const piece of email.piecesJointes) {
      if (!this.ajouterPieceJointe) break;
      try {
        await this.ajouterPieceJointe.executer({
          tenantId,
          messageId: message.id,
          nomFichier: piece.nomFichier,
          contentType: piece.typeMime,
          octets: piece.octets,
        });
      } catch (erreur) {
        // Un format non accepté (ex. .docx) ne doit pas perdre le message.
        if (!(erreur instanceof ErreurMetier)) throw erreur;
      }
    }

    await this.fils.mettreAJour(tenantId, filCible.id, {
      dernierMessageAt: message.createdAt,
      statut: "en_attente",
    });

    return { type: "recu", message, dejaRecu: false };
  }

  /**
   * `In-Reply-To` pointe vers le Message-ID du message précédent. On retrouve
   * d'abord ce message, puis son fil, avant tout repli sur l'adresse du
   * contact : deux séjours du même voyageur ne doivent pas fusionner.
   */
  private async filDepuisReponse(
    tenantId: string,
    inReplyTo: string,
  ): Promise<FilVoyageur | null> {
    const parent = await this.fils.trouverMessageParExternalId(
      tenantId,
      "email",
      inReplyTo,
    );
    return parent ? this.fils.trouverParId(tenantId, parent.filId) : null;
  }
}
