import { and, asc, desc, eq, ilike, inArray, isNull, or } from "drizzle-orm";
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
  type ConsentementsFil,
  type FilVoyageur,
  type SensMessage,
  type StatutFil,
} from "@/domain/fil-voyageur";
import { withTenant } from "../client";
import { filsVoyageur, messagesVoyageur, piecesJointesMessage } from "../schema";

function versPieceJointe(
  row: typeof piecesJointesMessage.$inferSelect,
): PieceJointeMessage {
  return {
    id: row.id,
    tenantId: row.tenantId,
    messageId: row.messageId,
    nomFichier: row.nomFichier,
    typeMime: row.typeMime,
    tailleOctets: row.tailleOctets,
    cleStockage: row.cleStockage,
    createdAt: row.createdAt,
  };
}

function versDomaine(row: typeof filsVoyageur.$inferSelect): FilVoyageur {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    voyageurNom: row.voyageurNom,
    voyageurEmail: row.voyageurEmail,
    voyageurTelephone: row.voyageurTelephone,
    langue: row.langue,
    cleRegroupement: row.cleRegroupement,
    consentements: row.consentements as ConsentementsFil,
    statut: row.statut as StatutFil,
    assigneA: row.assigneA,
    dernierMessageAt: row.dernierMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versMessage(row: typeof messagesVoyageur.$inferSelect): MessageFil {  return {
    id: row.id,
    tenantId: row.tenantId,
    filId: row.filId ?? "",
    ref: row.ref,
    canal: row.canal as CanalFil,
    sens: row.sens as SensMessage,
    contenu: row.contenu,
    destinataire: row.destinataire,
    expediteur: row.expediteur,
    externalId: row.externalId,
    statut: row.statut,
    envoyeAt: row.envoyeAt,
    luAt: row.luAt,
    createdAt: row.createdAt,
  };
}

export class DrizzleFilsVoyageurRepository implements FilsVoyageurRepository {
  async creer(data: CreerFilData): Promise<FilVoyageur> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(filsVoyageur)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId ?? null,
          reservationId: data.reservationId ?? null,
          voyageurNom: data.voyageurNom.trim(),
          voyageurEmail: data.voyageurEmail?.trim().toLowerCase() ?? null,
          voyageurTelephone: data.voyageurTelephone ?? null,
          langue: data.langue ?? "fr",
          cleRegroupement: data.cleRegroupement,
          consentements:
            data.consentements ?? {
              email: true,
              sms: false,
              whatsapp: false,
            },
        })
        .returning();
      if (!row) throw new Error("Fil voyageur : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParId(tenantId: string, id: string): Promise<FilVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(filsVoyageur)
        .where(and(eq(filsVoyageur.tenantId, tenantId), eq(filsVoyageur.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParCle(
    tenantId: string,
    cleRegroupement: string,
  ): Promise<FilVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(filsVoyageur)
        .where(
          and(
            eq(filsVoyageur.tenantId, tenantId),
            eq(filsVoyageur.cleRegroupement, cleRegroupement),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FilVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(filsVoyageur)
        .where(
          and(
            eq(filsVoyageur.tenantId, tenantId),
            eq(filsVoyageur.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParContact(
    tenantId: string,
    contact: { email?: string | null; telephone?: string | null },
  ): Promise<FilVoyageur | null> {
    const email = contact.email?.trim().toLowerCase() ?? "";
    const telephone = contact.telephone?.replace(/[\s.\-()]/g, "") ?? "";
    if (!email && !telephone) return null;
    return withTenant(tenantId, async (tx) => {
      const filtres = [];
      if (email) filtres.push(eq(filsVoyageur.voyageurEmail, email));
      if (telephone) filtres.push(eq(filsVoyageur.voyageurTelephone, telephone));
      const [row] = await tx
        .select()
        .from(filsVoyageur)
        .where(and(eq(filsVoyageur.tenantId, tenantId), or(...filtres)))
        .orderBy(desc(filsVoyageur.dernierMessageAt))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParTenant(
    tenantId: string,
    filtre?: {
      statut?: StatutFil;
      logementId?: string;
      recherche?: string;
      assigneA?: string | null;
    },
  ): Promise<FilVoyageur[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(filsVoyageur.tenantId, tenantId)];
      if (filtre?.statut) {
        conditions.push(eq(filsVoyageur.statut, filtre.statut));
      }
      if (filtre?.logementId) {
        conditions.push(eq(filsVoyageur.logementId, filtre.logementId));
      }
      if (filtre?.assigneA === null) {
        conditions.push(isNull(filsVoyageur.assigneA));
      } else if (filtre?.assigneA) {
        conditions.push(eq(filsVoyageur.assigneA, filtre.assigneA));
      }
      const recherche = filtre?.recherche?.trim() ?? "";
      if (recherche) {
        const motif = `%${recherche}%`;
        const rechercheCondition = or(
          ilike(filsVoyageur.voyageurNom, motif),
          ilike(filsVoyageur.voyageurEmail, motif),
          ilike(filsVoyageur.voyageurTelephone, motif),
        );
        if (rechercheCondition) conditions.push(rechercheCondition);
      }
      const rows = await tx
        .select()
        .from(filsVoyageur)
        .where(and(...conditions))
        .orderBy(desc(filsVoyageur.dernierMessageAt), desc(filsVoyageur.createdAt))
        .limit(200);
      return rows.map(versDomaine);
    });
  }

  async mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourFilData,
  ): Promise<FilVoyageur | null> {
    const valeurs: Record<string, unknown> = {};
    if (data.logementId !== undefined) valeurs.logementId = data.logementId;
    if (data.reservationId !== undefined) valeurs.reservationId = data.reservationId;
    if (data.voyageurNom !== undefined) valeurs.voyageurNom = data.voyageurNom.trim();
    if (data.voyageurEmail !== undefined) {
      valeurs.voyageurEmail = data.voyageurEmail?.trim().toLowerCase() ?? null;
    }
    if (data.voyageurTelephone !== undefined) {
      valeurs.voyageurTelephone = data.voyageurTelephone;
    }
    if (data.langue !== undefined) valeurs.langue = data.langue;
    if (data.statut !== undefined) valeurs.statut = data.statut;
    if (data.assigneA !== undefined) valeurs.assigneA = data.assigneA;
    if (data.consentements !== undefined) valeurs.consentements = data.consentements;
    if (data.dernierMessageAt !== undefined) {
      valeurs.dernierMessageAt = data.dernierMessageAt;
    }
    if (Object.keys(valeurs).length === 0) {
      return this.trouverParId(tenantId, id);
    }
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(filsVoyageur)
        .set(valeurs)
        .where(and(eq(filsVoyageur.tenantId, tenantId), eq(filsVoyageur.id, id)))
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async supprimer(tenantId: string, id: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(filsVoyageur)
        .where(and(eq(filsVoyageur.tenantId, tenantId), eq(filsVoyageur.id, id)))
        .returning({ id: filsVoyageur.id });
      return rows.length > 0;
    });
  }

  async creerMessage(data: CreerMessageFilData): Promise<MessageFil> {
    const fil = await this.trouverParId(data.tenantId, data.filId);
    if (!fil) throw new Error("Message de fil : fil introuvable.");
    if (!fil.logementId) {
      throw new Error("Message de fil : le fil n'a pas de logement.");
    }
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(messagesVoyageur)
        .values({
          tenantId: data.tenantId,
          logementId: fil.logementId as string,
          ref: data.ref,
          canal: data.canal,
          destinataire: data.destinataire ?? null,
          expediteur: data.expediteur ?? null,
          externalId: data.externalId ?? null,
          sens: data.sens,
          type: "autre",
          contenu: data.contenu,
          statut: data.statut ?? (data.sens === "sortant" ? "brouillon" : "recu"),
          envoyeAt: data.envoyeAt ?? null,
          filId: data.filId,
          reservationId: fil.reservationId,
          luAt: data.sens === "sortant" ? new Date() : null,
        })
        .returning();
      if (!row) throw new Error("Message de fil : aucune ligne retournée.");
      return versMessage(row);
    });
  }

  async trouverMessageParRef(
    tenantId: string,
    ref: string,
  ): Promise<MessageFil | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(eq(messagesVoyageur.tenantId, tenantId), eq(messagesVoyageur.ref, ref)),
        )
        .limit(1);
      return row ? versMessage(row) : null;
    });
  }

  async trouverMessageParId(
    tenantId: string,
    id: string,
  ): Promise<MessageFil | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(eq(messagesVoyageur.tenantId, tenantId), eq(messagesVoyageur.id, id)),
        )
        .limit(1);
      return row ? versMessage(row) : null;
    });
  }

  async trouverMessageParExternalId(
    tenantId: string,
    canal: CanalFil,
    externalId: string,
  ): Promise<MessageFil | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.canal, canal),
            eq(messagesVoyageur.externalId, externalId),
          ),
        )
        .limit(1);
      return row ? versMessage(row) : null;
    });
  }

  async listerMessages(tenantId: string, filId: string): Promise<MessageFil[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.filId, filId),
          ),
        )
        .orderBy(asc(messagesVoyageur.createdAt))
        .limit(500);
      return rows.map(versMessage);
    });
  }

  /**
   * Résumé par fil en une requête (FR-027) : au lieu d'appeler
   * `listerMessages` pour chaque fil (N+1), on charge une fois les messages
   * des fils demandés et on agrège — logique partagée dans le domaine.
   */
  async resumerMessagesParFils(
    tenantId: string,
    filIds: readonly string[],
  ): Promise<Map<string, ResumeMessagesFil>> {
    if (filIds.length === 0) return new Map();
    const ids = [...new Set(filIds)];
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(messagesVoyageur)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            inArray(messagesVoyageur.filId, ids),
          ),
        )
        .orderBy(asc(messagesVoyageur.createdAt));
      return resumerMessagesParFils(ids, rows.map(versMessage));
    });
  }

  async marquerMessagesLus(tenantId: string, filId: string): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .update(messagesVoyageur)
        .set({ luAt: new Date() })
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.filId, filId),
            eq(messagesVoyageur.sens, "entrant"),
          ),
        )
        .returning({ id: messagesVoyageur.id });
      return rows.length;
    });
  }

  async mettreAJourMessage(
    tenantId: string,
    messageId: string,
    data: MettreAJourMessageData,
  ): Promise<MessageFil | null> {
    return withTenant(tenantId, async (tx) => {
      const valeurs: Partial<typeof messagesVoyageur.$inferInsert> = {};
      if (data.statut !== undefined) valeurs.statut = data.statut;
      if (data.envoyeAt !== undefined) valeurs.envoyeAt = data.envoyeAt;
      if (data.externalId !== undefined) valeurs.externalId = data.externalId;
      if (data.luAt !== undefined) valeurs.luAt = data.luAt;
      if (data.contenu !== undefined) valeurs.contenu = data.contenu;
      if (Object.keys(valeurs).length === 0) {
        return this.trouverMessageParId(tenantId, messageId);
      }
      const [row] = await tx
        .update(messagesVoyageur)
        .set(valeurs)
        .where(
          and(
            eq(messagesVoyageur.tenantId, tenantId),
            eq(messagesVoyageur.id, messageId),
          ),
        )
        .returning();
      return row ? versMessage(row) : null;
    });
  }

  async creerPieceJointe(data: CreerPieceJointeData): Promise<PieceJointeMessage> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(piecesJointesMessage)
        .values({
          tenantId: data.tenantId,
          messageId: data.messageId,
          nomFichier: data.nomFichier,
          typeMime: data.typeMime,
          tailleOctets: data.tailleOctets,
          cleStockage: data.cleStockage,
        })
        .returning();
      if (!row) throw new Error("Pièce jointe : aucune ligne retournée.");
      return versPieceJointe(row);
    });
  }

  async listerPiecesJointes(
    tenantId: string,
    messageId: string,
  ): Promise<PieceJointeMessage[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(piecesJointesMessage)
        .where(
          and(
            eq(piecesJointesMessage.tenantId, tenantId),
            eq(piecesJointesMessage.messageId, messageId),
          ),
        )
        .orderBy(asc(piecesJointesMessage.createdAt))
        .limit(100);
      return rows.map(versPieceJointe);
    });
  }

  /**
   * FR-027 : une seule requête pour les pièces jointes de tous les messages
   * d'un fil, au lieu d'un `listerPiecesJointes` par message.
   */
  async listerPiecesJointesParMessages(
    tenantId: string,
    messageIds: readonly string[],
  ): Promise<Map<string, PieceJointeMessage[]>> {
    const parMessage = new Map<string, PieceJointeMessage[]>();
    if (messageIds.length === 0) return parMessage;
    const ids = [...new Set(messageIds)].slice(0, 500);
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(piecesJointesMessage)
        .where(
          and(
            eq(piecesJointesMessage.tenantId, tenantId),
            inArray(piecesJointesMessage.messageId, ids),
          ),
        )
        .orderBy(asc(piecesJointesMessage.createdAt));
      for (const row of rows) {
        const piece = versPieceJointe(row);
        const liste = parMessage.get(piece.messageId) ?? [];
        liste.push(piece);
        parMessage.set(piece.messageId, liste);
      }
      return parMessage;
    });
  }

  async trouverPieceJointe(
    tenantId: string,
    id: string,
  ): Promise<PieceJointeMessage | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(piecesJointesMessage)
        .where(
          and(
            eq(piecesJointesMessage.tenantId, tenantId),
            eq(piecesJointesMessage.id, id),
          ),
        )
        .limit(1);
      return row ? versPieceJointe(row) : null;
    });
  }

  async supprimerPieceJointe(tenantId: string, id: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(piecesJointesMessage)
        .where(
          and(
            eq(piecesJointesMessage.tenantId, tenantId),
            eq(piecesJointesMessage.id, id),
          ),
        )
        .returning({ id: piecesJointesMessage.id });
      return rows.length > 0;
    });
  }
}
