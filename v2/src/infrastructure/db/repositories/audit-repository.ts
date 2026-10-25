import { and, count, desc, eq, ilike, or } from "drizzle-orm";
import type {
  AuditEntry,
  AuditFiltre,
  AuditRepository,
} from "@/application/ports/audit-repository";
import { withTenant } from "../client";
import { auditLogs } from "../schema";

function versDomaine(
  row: typeof auditLogs.$inferSelect,
): AuditEntry {
  return {
    id: row.id,
    tenantId: row.tenantId,
    qui: row.qui,
    action: row.action,
    cible: row.cible,
    ref: row.ref,
    payload: row.payload,
    createdAt: row.createdAt,
  };
}

function conditions(tenantId: string, recherche?: string) {
  const base = [eq(auditLogs.tenantId, tenantId)];
  const terme = recherche?.trim();
  if (terme) {
    const motif = `%${terme}%`;
    const rechercheSql = or(
      ilike(auditLogs.action, motif),
      ilike(auditLogs.qui, motif),
      ilike(auditLogs.cible, motif),
      ilike(auditLogs.ref, motif),
    );
    if (rechercheSql) base.push(rechercheSql);
  }
  return and(...base);
}

export class DrizzleAuditRepository implements AuditRepository {
  async lister(
    tenantId: string,
    filtre: AuditFiltre,
  ): Promise<AuditEntry[]> {
    const limite = Math.min(Math.max(Math.trunc(filtre.limite), 1), 100);
    const decalage = Math.max(0, Math.trunc(filtre.decalage));

    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(auditLogs)
        .where(conditions(tenantId, filtre.recherche))
        .orderBy(desc(auditLogs.createdAt))
        .limit(limite)
        .offset(decalage);
      return rows.map(versDomaine);
    });
  }

  async compter(tenantId: string, recherche?: string): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ nombre: count() })
        .from(auditLogs)
        .where(conditions(tenantId, recherche));
      return Number(row?.nombre ?? 0);
    });
  }
}
