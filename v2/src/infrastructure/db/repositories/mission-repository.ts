import { and, asc, eq, gte, lte } from "drizzle-orm";
import type {
  CreerMissionData,
  MissionRepository,
} from "@/application/ports/mission-repository";
import type { Mission, SourcePointage } from "@/domain/mission";
import { statutPreuve } from "@/domain/preuve-intervention";
import { withTenant } from "../client";
import { missions } from "../schema";

function versDomaine(row: typeof missions.$inferSelect): Mission {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    reservationId: row.reservationId,
    assignedUserId: row.assignedUserId,
    ref: row.ref,
    type: row.type as Mission["type"],
    date: row.date,
    heure: row.heure,
    statut: row.statut as Mission["statut"],
    notes: row.notes,
    dureePrevueMinutes: row.dureePrevueMinutes,
    debutReel: row.debutReel,
    finReelle: row.finReelle,
    debutReelSource: row.debutReelSource as Mission["debutReelSource"],
    finReelleSource: row.finReelleSource as Mission["finReelleSource"],
    debutReelRecuLe: row.debutReelRecuLe,
    finReelleRecuLe: row.finReelleRecuLe,
    preuveStatut: statutPreuve(row.preuveStatut),
    preuveMotifRefus: row.preuveMotifRefus,
    preuveSoumiseLe: row.preuveSoumiseLe,
    preuveValideeLe: row.preuveValideeLe,
    preuveValideePar: row.preuveValideePar,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class DrizzleMissionRepository implements MissionRepository {
  async creer(data: CreerMissionData): Promise<Mission> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(missions)
        .values({
          tenantId: data.tenantId,
          logementId: data.logementId,
          reservationId: data.reservationId,
          assignedUserId: data.assignedUserId,
          ref: data.ref,
          type: data.type,
          date: data.date,
          heure: data.heure,
          notes: data.notes,
        })
        .returning();
      if (!row) throw new Error("Mission : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Mission[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(missions)
        .where(
          and(
            eq(missions.tenantId, tenantId),
            gte(missions.date, debut),
            lte(missions.date, fin),
          ),
        )
        .orderBy(asc(missions.date), asc(missions.heure));
      return rows.map(versDomaine);
    });
  }

  async listerParPrestataire(
    tenantId: string,
    assignedUserId: string,
  ): Promise<Mission[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(missions)
        .where(
          and(
            eq(missions.tenantId, tenantId),
            eq(missions.assignedUserId, assignedUserId),
          ),
        )
        .orderBy(asc(missions.date), asc(missions.heure));
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Mission | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(missions)
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: Mission["statut"],
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({ statut, updatedAt: new Date() })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async assigner(
    tenantId: string,
    id: string,
    userId: string,
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({ assignedUserId: userId, updatedAt: new Date() })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async pointerDebut(
    tenantId: string,
    id: string,
    pointage: { at: Date; source: SourcePointage; recuLe: Date },
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({
          debutReel: pointage.at,
          debutReelSource: pointage.source,
          debutReelRecuLe: pointage.recuLe,
          statut: "en_cours",
          updatedAt: new Date(),
        })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async pointerFin(
    tenantId: string,
    id: string,
    pointage: { at: Date; source: SourcePointage; recuLe: Date },
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({
          finReelle: pointage.at,
          finReelleSource: pointage.source,
          finReelleRecuLe: pointage.recuLe,
          statut: "terminee",
          updatedAt: new Date(),
        })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async soumettrePreuve(
    tenantId: string,
    id: string,
    soumission: { le: Date },
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({
          preuveStatut: "soumise",
          preuveSoumiseLe: soumission.le,
          // La resoumission après refus efface le motif précédent.
          preuveMotifRefus: null,
          updatedAt: new Date(),
        })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async validerPreuve(
    tenantId: string,
    id: string,
    validation: { le: Date; par: string },
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({
          preuveStatut: "validee",
          preuveValideeLe: validation.le,
          preuveValideePar: validation.par,
          preuveMotifRefus: null,
          updatedAt: new Date(),
        })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }

  async refuserPreuve(
    tenantId: string,
    id: string,
    refus: { le: Date; par: string; motif: string },
  ): Promise<Mission | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(missions)
        .set({
          preuveStatut: "refusee",
          preuveMotifRefus: refus.motif,
          updatedAt: new Date(),
        })
        .where(and(eq(missions.tenantId, tenantId), eq(missions.id, id)));
    });
    return this.trouverParId(tenantId, id);
  }
}
