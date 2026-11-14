/**
 * T609 — Repository Drizzle des avis voyageur.
 *
 * Isolation tenant : toutes les opérations passent par `withTenant()` qui
 * positionne `app.tenant_id` ; la policy RLS de la table `avis_voyageur`
 * filtre en défense profonde.
 *
 * Idempotence : un avis est unique par (tenant, ref) et par
 * (tenant, reservation_id) — le rejeu de l'invitation J+1 retourne l'avis
 * existant (`cree: false`) et ne réécrit jamais une note déjà déposée.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import type {
  AvisVoyageurRepository,
  FiltreAvis,
} from "@/application/ports/avis-voyageur-repository";
import type { AvisVoyageur, StatutAvis } from "@/domain/avis-voyageur";
import { withTenant } from "../client";
import { avisVoyageur, type AvisVoyageurRow } from "../schema";

function versAvis(row: AvisVoyageurRow): AvisVoyageur {
  return {
    id: row.id,
    ref: row.ref,
    reservationId: row.reservationId,
    logementId: row.logementId,
    note: row.note,
    commentaire: row.commentaire,
    statut: row.statut as StatutAvis,
    inviteLe: row.inviteLe.toISOString(),
    recuLe: row.recuLe ? row.recuLe.toISOString() : null,
    publieLe: row.publieLe ? row.publieLe.toISOString() : null,
    reponseHote: row.reponseHote,
  };
}

export class DrizzleAvisVoyageurRepository implements AvisVoyageurRepository {
  async enregistrer(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(avisVoyageur)
        .values({
          tenantId,
          logementId: avis.logementId,
          reservationId: avis.reservationId,
          ref: avis.ref,
          note: avis.note,
          commentaire: avis.commentaire,
          statut: avis.statut,
          inviteLe: new Date(avis.inviteLe),
          recuLe: avis.recuLe ? new Date(avis.recuLe) : null,
          publieLe: avis.publieLe ? new Date(avis.publieLe) : null,
          reponseHote: avis.reponseHote,
        })
        .onConflictDoNothing({
          target: [avisVoyageur.tenantId, avisVoyageur.reservationId],
        })
        .returning({ id: avisVoyageur.id });

      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      // Rejeu : une invitation existe déjà pour cette réservation ou cette ref.
      const [existant] = await tx
        .select()
        .from(avisVoyageur)
        .where(
          and(
            eq(avisVoyageur.tenantId, tenantId),
            sql`(${avisVoyageur.ref} = ${avis.ref} or ${avisVoyageur.reservationId} = ${avis.reservationId})`,
          ),
        )
        .limit(1);

      if (!existant) {
        throw new Error("Avis introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<AvisVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(avisVoyageur)
        .where(and(eq(avisVoyageur.tenantId, tenantId), eq(avisVoyageur.id, id)))
        .limit(1);
      return row ? versAvis(row) : null;
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<AvisVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(avisVoyageur)
        .where(
          and(eq(avisVoyageur.tenantId, tenantId), eq(avisVoyageur.ref, ref)),
        )
        .limit(1);
      return row ? versAvis(row) : null;
    });
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<AvisVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(avisVoyageur)
        .where(
          and(
            eq(avisVoyageur.tenantId, tenantId),
            eq(avisVoyageur.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versAvis(row) : null;
    });
  }

  async lister(tenantId: string, filtre?: FiltreAvis): Promise<AvisVoyageur[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(avisVoyageur.tenantId, tenantId)];
      if (filtre?.logementId) {
        conditions.push(eq(avisVoyageur.logementId, filtre.logementId));
      }
      if (filtre?.statut) {
        conditions.push(eq(avisVoyageur.statut, filtre.statut));
      }
      const rows = await tx
        .select()
        .from(avisVoyageur)
        .where(and(...conditions))
        .orderBy(desc(avisVoyageur.inviteLe))
        .limit(200);
      return rows.map(versAvis);
    });
  }

  async listerPublies(
    tenantId: string,
    logementId: string,
  ): Promise<AvisVoyageur[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(avisVoyageur)
        .where(
          and(
            eq(avisVoyageur.tenantId, tenantId),
            eq(avisVoyageur.logementId, logementId),
            eq(avisVoyageur.statut, "publie"),
          ),
        )
        .orderBy(
          sql`${avisVoyageur.publieLe} desc nulls last`,
          desc(avisVoyageur.recuLe),
        )
        .limit(50);
      return rows.map(versAvis);
    });
  }

  async mettreAJour(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<AvisVoyageur | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(avisVoyageur)
        .set({
          note: avis.note,
          commentaire: avis.commentaire,
          statut: avis.statut,
          recuLe: avis.recuLe ? new Date(avis.recuLe) : null,
          publieLe: avis.publieLe ? new Date(avis.publieLe) : null,
          reponseHote: avis.reponseHote,
          updatedAt: new Date(),
        })
        .where(and(eq(avisVoyageur.tenantId, tenantId), eq(avisVoyageur.id, avis.id)))
        .returning();
      return row ? versAvis(row) : null;
    });
  }
}

/** Compteur d'avis par statut, utilisé par l'écran staff. */
export function resumeAvis(
  avis: readonly AvisVoyageur[],
): { publies: number; enAttente: number; invites: number } {
  return {
    publies: avis.filter((a) => a.statut === "publie").length,
    enAttente: avis.filter((a) => a.statut === "recu").length,
    invites: avis.filter((a) => a.statut === "invite").length,
  };
}
