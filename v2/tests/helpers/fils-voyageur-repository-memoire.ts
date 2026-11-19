import type {
  CreerFilData,
  CreerMessageFilData,
  CreerPieceJointeData,
  FilsVoyageurRepository,
  MessageFil,
  MettreAJourFilData,
  MettreAJourMessageData,
  PieceJointeMessage,
  ResumeMessagesFil,
} from "@/application/ports/fils-voyageur-repository";
import {
  resumerMessagesParFils,
  type CanalFil,
  type FilVoyageur,
  type StatutFil,
} from "@/domain/fil-voyageur";

let compteur = 0;
function id(suffixe = ""): string {
  compteur += 1;
  return `00000000-0000-4000-8000-${String(compteur).padStart(12, "0")}${suffixe}`;
}

export class FilsVoyageurRepositoryMemoire implements FilsVoyageurRepository {
  readonly fils: FilVoyageur[] = [];
  readonly messages: MessageFil[] = [];
  readonly piecesJointes: PieceJointeMessage[] = [];

  async creer(data: CreerFilData): Promise<FilVoyageur> {
    const fil: FilVoyageur = {
      id: id(),
      tenantId: data.tenantId,
      logementId: data.logementId ?? null,
      reservationId: data.reservationId ?? null,
      voyageurNom: data.voyageurNom.trim(),
      voyageurEmail: data.voyageurEmail?.trim().toLowerCase() ?? null,
      voyageurTelephone: data.voyageurTelephone ?? null,
      langue: data.langue ?? "fr",
      cleRegroupement: data.cleRegroupement,
      consentements:
        data.consentements ?? { email: true, sms: false, whatsapp: false },
      statut: "ouvert",
      assigneA: null,
      dernierMessageAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.fils.push(fil);
    return fil;
  }

  async trouverParId(tenantId: string, filId: string): Promise<FilVoyageur | null> {
    return (
      this.fils.find((fil) => fil.tenantId === tenantId && fil.id === filId) ?? null
    );
  }

  async trouverParCle(
    tenantId: string,
    cleRegroupement: string,
  ): Promise<FilVoyageur | null> {
    return (
      this.fils.find(
        (fil) =>
          fil.tenantId === tenantId && fil.cleRegroupement === cleRegroupement,
      ) ?? null
    );
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FilVoyageur | null> {
    return (
      this.fils.find(
        (fil) => fil.tenantId === tenantId && fil.reservationId === reservationId,
      ) ?? null
    );
  }

  async trouverParContact(
    tenantId: string,
    contact: { email?: string | null; telephone?: string | null },
  ): Promise<FilVoyageur | null> {
    const email = contact.email?.trim().toLowerCase() ?? "";
    const telephone = contact.telephone?.replace(/[\s.\-()]/g, "") ?? "";
    return (
      this.fils.find(
        (fil) =>
          fil.tenantId === tenantId &&
          ((email && fil.voyageurEmail === email) ||
            (telephone && fil.voyageurTelephone === telephone)),
      ) ?? null
    );
  }

  async listerParTenant(
    tenantId: string,
    filtre?: { statut?: StatutFil; logementId?: string; recherche?: string },
  ): Promise<FilVoyageur[]> {
    const recherche = filtre?.recherche?.toLowerCase() ?? "";
    return this.fils.filter((fil) => {
      if (fil.tenantId !== tenantId) return false;
      if (filtre?.statut && fil.statut !== filtre.statut) return false;
      if (filtre?.logementId && fil.logementId !== filtre.logementId) return false;
      if (recherche) {
        const champs = [
          fil.voyageurNom,
          fil.voyageurEmail ?? "",
          fil.voyageurTelephone ?? "",
        ]
          .join(" ")
          .toLowerCase();
        if (!champs.includes(recherche)) return false;
      }
      return true;
    });
  }

  async mettreAJour(
    tenantId: string,
    filId: string,
    data: MettreAJourFilData,
  ): Promise<FilVoyageur | null> {
    const fil = await this.trouverParId(tenantId, filId);
    if (!fil) return null;
    Object.assign(fil, {
      ...data,
      voyageurEmail:
        data.voyageurEmail === undefined
          ? fil.voyageurEmail
          : (data.voyageurEmail?.trim().toLowerCase() ?? null),
      updatedAt: new Date(),
    });
    return fil;
  }

  async supprimer(tenantId: string, filId: string): Promise<boolean> {
    const index = this.fils.findIndex(
      (fil) => fil.tenantId === tenantId && fil.id === filId,
    );
    if (index < 0) return false;
    this.fils.splice(index, 1);
    return true;
  }

  async creerMessage(data: CreerMessageFilData): Promise<MessageFil> {
    const message: MessageFil = {
      id: id(),
      tenantId: data.tenantId,
      filId: data.filId,
      ref: data.ref,
      canal: data.canal,
      sens: data.sens,
      contenu: data.contenu,
      destinataire: data.destinataire ?? null,
      expediteur: data.expediteur ?? null,
      externalId: data.externalId ?? null,
      statut: data.statut ?? (data.sens === "sortant" ? "brouillon" : "recu"),
      envoyeAt: data.envoyeAt ?? null,
      luAt: null,
      createdAt: new Date(),
    };
    this.messages.push(message);
    return message;
  }

  async trouverMessageParRef(
    tenantId: string,
    ref: string,
  ): Promise<MessageFil | null> {
    return (
      this.messages.find(
        (message) => message.tenantId === tenantId && message.ref === ref,
      ) ?? null
    );
  }

  async trouverMessageParId(
    tenantId: string,
    messageId: string,
  ): Promise<MessageFil | null> {
    return (
      this.messages.find(
        (message) => message.tenantId === tenantId && message.id === messageId,
      ) ?? null
    );
  }

  async trouverMessageParExternalId(
    tenantId: string,
    canal: CanalFil,
    externalId: string,
  ): Promise<MessageFil | null> {
    return (
      this.messages.find(
        (message) =>
          message.tenantId === tenantId &&
          message.canal === canal &&
          message.externalId === externalId,
      ) ?? null
    );
  }

  async listerMessages(tenantId: string, filId: string): Promise<MessageFil[]> {
    return this.messages.filter(
      (message) => message.tenantId === tenantId && message.filId === filId,
    );
  }

  async resumerMessagesParFils(
    tenantId: string,
    filIds: readonly string[],
  ): Promise<Map<string, ResumeMessagesFil>> {
    return resumerMessagesParFils(
      filIds,
      this.messages.filter((message) => message.tenantId === tenantId),
    );
  }

  async marquerMessagesLus(tenantId: string, filId: string): Promise<number> {
    let total = 0;
    for (const message of this.messages) {
      if (
        message.tenantId === tenantId &&
        message.filId === filId &&
        message.sens === "entrant"
      ) {
        message.statut = "lu";
        total += 1;
      }
    }
    return total;
  }

  async mettreAJourMessage(
    tenantId: string,
    messageId: string,
    data: MettreAJourMessageData,
  ): Promise<MessageFil | null> {
    const message = this.messages.find(
      (m) => m.tenantId === tenantId && m.id === messageId,
    );
    if (!message) return null;
    Object.assign(message, data);
    return message;
  }

  async creerPieceJointe(
    data: CreerPieceJointeData,
  ): Promise<PieceJointeMessage> {
    const piece: PieceJointeMessage = { id: id(), createdAt: new Date(), ...data };
    this.piecesJointes.push(piece);
    return piece;
  }

  async listerPiecesJointes(
    tenantId: string,
    messageId: string,
  ): Promise<PieceJointeMessage[]> {
    return this.piecesJointes.filter(
      (piece) => piece.tenantId === tenantId && piece.messageId === messageId,
    );
  }

  async trouverPieceJointe(
    tenantId: string,
    pieceId: string,
  ): Promise<PieceJointeMessage | null> {
    return (
      this.piecesJointes.find(
        (piece) => piece.tenantId === tenantId && piece.id === pieceId,
      ) ?? null
    );
  }

  async supprimerPieceJointe(tenantId: string, pieceId: string): Promise<boolean> {
    const index = this.piecesJointes.findIndex(
      (piece) => piece.tenantId === tenantId && piece.id === pieceId,
    );
    if (index < 0) return false;
    this.piecesJointes.splice(index, 1);
    return true;
  }
}
