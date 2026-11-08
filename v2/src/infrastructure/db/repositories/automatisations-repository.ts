import { and, desc, eq } from "drizzle-orm";
import type {
  AutomatisationsRepository,
  CreerAutomatisationData,
  CreerExecutionData,
  ExecutionAutomatisation,
  ModifierAutomatisationData,
} from "@/application/ports/automatisations-repository";
import type {
  Automatisation,
  CanalFil,
  ConditionsAutomatisation,
  DeclencheurAutomatisation,
} from "@/domain/automatisation-message";
import { withTenant } from "../client";
import { automatisations, executionsAutomatisation } from "../schema";

function versDomaine(row: typeof automatisations.$inferSelect): Automatisation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    code: row.code,
    libelle: row.libelle,
    declencheur: row.declencheur as DeclencheurAutomatisation,
    canal: row.canal as CanalFil,
    sujet: row.sujet,
    modele: row.modele,
    conditions: (row.conditions ?? {}) as ConditionsAutomatisation,
    actif: row.actif,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versExecution(
  row: typeof executionsAutomatisation.$inferSelect,
): ExecutionAutomatisation {
  return {
    id: row.id,
    tenantId: row.tenantId,
    automatisationId: row.automatisationId,
    reservationId: row.reservationId,
    filId: row.filId,
    messageId: row.messageId,
    ref: row.ref,
    statut: row.statut,
    details: (row.details ?? {}) as Record<string, unknown>,
    createdAt: row.createdAt,
  };
}

export class DrizzleAutomatisationsRepository
  implements AutomatisationsRepository
{
  async creer(data: CreerAutomatisationData): Promise<Automatisation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(automatisations)
        .values({
          tenantId: data.tenantId,
          code: data.code,
          libelle: data.libelle.trim(),
          declencheur: data.declencheur,
          canal: data.canal,
          sujet: data.sujet ?? null,
          modele: data.modele.trim(),
          conditions: (data.conditions ?? {}) as Record<string, unknown>,
          actif: data.actif ?? true,
        })
        .returning();
      if (!row) throw new Error("Automatisation : aucune ligne retournée.");
      return versDomaine(row);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Automatisation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(automatisations)
        .where(
          and(eq(automatisations.tenantId, tenantId), eq(automatisations.id, id)),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Automatisation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(automatisations)
        .where(
          and(
            eq(automatisations.tenantId, tenantId),
            eq(automatisations.code, code),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async listerParTenant(tenantId: string): Promise<Automatisation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(automatisations)
        .where(eq(automatisations.tenantId, tenantId))
        .orderBy(desc(automatisations.actif), automatisations.code)
        .limit(200);
      return rows.map(versDomaine);
    });
  }

  async listerActivesParDeclencheur(
    tenantId: string,
    declencheur: DeclencheurAutomatisation,
  ): Promise<Automatisation[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(automatisations)
        .where(
          and(
            eq(automatisations.tenantId, tenantId),
            eq(automatisations.declencheur, declencheur),
            eq(automatisations.actif, true),
          ),
        )
        .orderBy(automatisations.code)
        .limit(50);
      return rows.map(versDomaine);
    });
  }

  async modifier(
    tenantId: string,
    id: string,
    data: ModifierAutomatisationData,
  ): Promise<Automatisation | null> {
    const valeurs: Record<string, unknown> = {};
    if (data.libelle !== undefined) valeurs.libelle = data.libelle.trim();
    if (data.declencheur !== undefined) valeurs.declencheur = data.declencheur;
    if (data.canal !== undefined) valeurs.canal = data.canal;
    if (data.sujet !== undefined) valeurs.sujet = data.sujet;
    if (data.modele !== undefined) valeurs.modele = data.modele.trim();
    if (data.conditions !== undefined) valeurs.conditions = data.conditions;
    if (data.actif !== undefined) valeurs.actif = data.actif;
    if (Object.keys(valeurs).length === 0) {
      return this.trouverParId(tenantId, id);
    }
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .update(automatisations)
        .set(valeurs)
        .where(
          and(eq(automatisations.tenantId, tenantId), eq(automatisations.id, id)),
        )
        .returning();
      return row ? versDomaine(row) : null;
    });
  }

  async supprimer(tenantId: string, id: string): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .delete(automatisations)
        .where(
          and(eq(automatisations.tenantId, tenantId), eq(automatisations.id, id)),
        )
        .returning({ id: automatisations.id });
      return rows.length > 0;
    });
  }

  async creerExecution(
    data: CreerExecutionData,
  ): Promise<ExecutionAutomatisation> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(executionsAutomatisation)
        .values({
          tenantId: data.tenantId,
          automatisationId: data.automatisationId,
          reservationId: data.reservationId,
          filId: data.filId ?? null,
          messageId: data.messageId ?? null,
          ref: data.ref,
          statut: data.statut,
          details: data.details ?? {},
        })
        .returning();
      if (!row) throw new Error("Exécution : aucune ligne retournée.");
      return versExecution(row);
    });
  }

  async trouverExecutionParRef(
    tenantId: string,
    ref: string,
  ): Promise<ExecutionAutomatisation | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(executionsAutomatisation)
        .where(
          and(
            eq(executionsAutomatisation.tenantId, tenantId),
            eq(executionsAutomatisation.ref, ref),
          ),
        )
        .limit(1);
      return row ? versExecution(row) : null;
    });
  }

  async listerExecutions(
    tenantId: string,
    automatisationId?: string,
  ): Promise<ExecutionAutomatisation[]> {
    return withTenant(tenantId, async (tx) => {
      const conditions = [eq(executionsAutomatisation.tenantId, tenantId)];
      if (automatisationId) {
        conditions.push(
          eq(executionsAutomatisation.automatisationId, automatisationId),
        );
      }
      const rows = await tx
        .select()
        .from(executionsAutomatisation)
        .where(and(...conditions))
        .orderBy(desc(executionsAutomatisation.createdAt))
        .limit(200);
      return rows.map(versExecution);
    });
  }
}
