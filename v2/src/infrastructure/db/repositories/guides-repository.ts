/**
 * T602 — Repositories Drizzle du guide voyageur et de l'accès serrure.
 *
 * Isolation tenant : toutes les opérations passent par `withTenant()` qui
 * positionne `app.tenant_id` ; les policies RLS des tables `guide_contenus`
 * et `acces_serrure` filtrent en défense profonde.
 *
 * Idempotence :
 * - un contenu de guide est unique par (tenant, logement, section, langue) :
 *   un upsert remplace sans dupliquer ;
 * - un accès serrure est unique par (tenant, ref) (migration 0097) : un rejeu
 *   de création retourne la ligne existante (`cree: false`).
 */
import { and, desc, eq } from "drizzle-orm";
import type {
  AccesSerrureRepository,
  AccesSerrureRow,
  GuideContenuRow,
  GuideContenusRepository,
} from "@/application/ports/guides-repository";
import type { LangueGuide, SectionGuide } from "@/domain/guide-voyageur";
import { withTenant } from "../client";
import {
  accesSerrure,
  guideContenus,
  type AccesSerrureRow as AccesSerrureDbRow,
  type GuideContenuRow as GuideContenuDbRow,
} from "../schema";

function versGuideContenu(row: GuideContenuDbRow): GuideContenuRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    section: row.section as SectionGuide,
    langue: row.langue as LangueGuide,
    titre: row.titre,
    corps: row.corps,
  };
}

function versAccesSerrure(row: AccesSerrureDbRow): AccesSerrureRow {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    ref: row.ref,
    type: row.type as AccesSerrureRow["type"],
    code: row.code,
    statut: row.statut as AccesSerrureRow["statut"],
    fournisseur: row.fournisseur,
    valideDe: row.valideDe.toISOString(),
    valideA: row.valideA.toISOString(),
    expireLe: row.expireLe ? row.expireLe.toISOString() : null,
    note: row.note,
    revoqueLe: row.revoqueLe ? row.revoqueLe.toISOString() : null,
    revoquePar: row.revoquePar,
    externalId: row.externalId,
  };
}

export class DrizzleGuideContenusRepository implements GuideContenusRepository {
  async enregistrer(
    tenantId: string,
    data: {
      logementId: string;
      section: SectionGuide;
      langue: LangueGuide;
      titre: string;
      corps: string;
    },
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(guideContenus)
        .values({
          tenantId,
          logementId: data.logementId,
          section: data.section,
          langue: data.langue,
          titre: data.titre,
          corps: data.corps,
        })
        .onConflictDoUpdate({
          target: [
            guideContenus.tenantId,
            guideContenus.logementId,
            guideContenus.section,
            guideContenus.langue,
          ],
          set: {
            titre: data.titre,
            corps: data.corps,
            updatedAt: new Date(),
          },
        })
        .returning({ id: guideContenus.id });
      const premier = inseres[0];
      if (!premier) {
        throw new Error("Contenu guide introuvable après upsert.");
      }
      return { id: premier.id, cree: true };
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<GuideContenuRow[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(guideContenus)
        .where(
          and(
            eq(guideContenus.tenantId, tenantId),
            eq(guideContenus.logementId, logementId),
          ),
        )
        .orderBy(guideContenus.section, guideContenus.langue);
      return rows.map(versGuideContenu);
    });
  }

  async trouverParSectionLangue(
    tenantId: string,
    logementId: string,
    section: SectionGuide,
    langue: LangueGuide,
  ): Promise<GuideContenuRow | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(guideContenus)
        .where(
          and(
            eq(guideContenus.tenantId, tenantId),
            eq(guideContenus.logementId, logementId),
            eq(guideContenus.section, section),
            eq(guideContenus.langue, langue),
          ),
        )
        .limit(1);
      return row ? versGuideContenu(row) : null;
    });
  }

  async supprimer(
    tenantId: string,
    logementId: string,
    section: SectionGuide,
    langue: LangueGuide,
  ): Promise<void> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .delete(guideContenus)
        .where(
          and(
            eq(guideContenus.tenantId, tenantId),
            eq(guideContenus.logementId, logementId),
            eq(guideContenus.section, section),
            eq(guideContenus.langue, langue),
          ),
        );
    });
  }
}

export class DrizzleAccesSerrureRepository implements AccesSerrureRepository {
  async creer(
    tenantId: string,
    data: {
      logementId: string;
      reservationId?: string | null;
      ref: string;
      type: "numerique" | "manuel";
      code?: string | null;
      fournisseur?: string | null;
      valideDe: string;
      valideA: string;
      expireLe?: string | null;
      note?: string | null;
      externalId?: string | null;
    },
  ): Promise<{ id: string; cree: boolean }> {
    return withTenant(tenantId, async (tx) => {
      const inseres = await tx
        .insert(accesSerrure)
        .values({
          tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId ?? null,
          ref: data.ref,
          type: data.type,
          code: data.code ?? null,
          fournisseur: data.fournisseur ?? null,
          valideDe: new Date(data.valideDe),
          valideA: new Date(data.valideA),
          expireLe: data.expireLe ? new Date(data.expireLe) : null,
          note: data.note ?? null,
          externalId: data.externalId ?? null,
        })
        .onConflictDoNothing({
          target: [accesSerrure.tenantId, accesSerrure.ref],
        })
        .returning({ id: accesSerrure.id });
      const premier = inseres[0];
      if (premier) return { id: premier.id, cree: true };

      // Rejeu : l'accès existe déjà pour cette ref.
      const [existant] = await tx
        .select()
        .from(accesSerrure)
        .where(
          and(
            eq(accesSerrure.tenantId, tenantId),
            eq(accesSerrure.ref, data.ref),
          ),
        )
        .limit(1);
      if (!existant) {
        throw new Error("Accès introuvable après conflit d'unicité.");
      }
      return { id: existant.id, cree: false };
    });
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<AccesSerrureRow | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(accesSerrure)
        .where(
          and(
            eq(accesSerrure.tenantId, tenantId),
            eq(accesSerrure.ref, ref),
          ),
        )
        .limit(1);
      return row ? versAccesSerrure(row) : null;
    });
  }

  async trouverParId(
    tenantId: string,
    accesId: string,
  ): Promise<AccesSerrureRow | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(accesSerrure)
        .where(
          and(
            eq(accesSerrure.tenantId, tenantId),
            eq(accesSerrure.id, accesId),
          ),
        )
        .limit(1);
      return row ? versAccesSerrure(row) : null;
    });
  }

  async listerParLogement(
    tenantId: string,
    logementId: string,
    options?: { statut?: AccesSerrureRow["statut"] },
  ): Promise<AccesSerrureRow[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [
        eq(accesSerrure.tenantId, tenantId),
        eq(accesSerrure.logementId, logementId),
      ];
      if (options?.statut) {
        conditions.push(eq(accesSerrure.statut, options.statut));
      }
      const rows = await tx
        .select()
        .from(accesSerrure)
        .where(and(...conditions))
        .orderBy(desc(accesSerrure.createdAt))
        .limit(100);
      return rows.map(versAccesSerrure);
    });
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<AccesSerrureRow[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(accesSerrure)
        .where(
          and(
            eq(accesSerrure.tenantId, tenantId),
            eq(accesSerrure.reservationId, reservationId),
            eq(accesSerrure.statut, "actif"),
          ),
        )
        .orderBy(desc(accesSerrure.createdAt))
        .limit(20);
      return rows.map(versAccesSerrure);
    });
  }

  async revoquer(
    tenantId: string,
    accesId: string,
    options: { par: string; maintenant?: string },
  ): Promise<AccesSerrureRow | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(accesSerrure)
        .set({
          statut: "revoque",
          revoqueLe: new Date(options.maintenant ?? new Date().toISOString()),
          revoquePar: options.par,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(accesSerrure.tenantId, tenantId),
            eq(accesSerrure.id, accesId),
          ),
        )
        .returning();
      return row ? versAccesSerrure(row) : null;
    });
  }
}
