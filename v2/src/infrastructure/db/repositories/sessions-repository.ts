import { and, count, desc, eq, gt } from "drizzle-orm";
import type { SessionsRepository } from "@/application/ports/sessions-repository";
import type { RoleUtilisateur } from "@/domain/utilisateur";
import { db } from "../client";
import { session } from "../auth-schema";
import { users } from "../schema";

type Ligne = {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  tenantId: string;
  userName: string;
  userEmail: string;
  role: string;
};

function versSession(row: Ligne) {
  return {
    id: row.id,
    userId: row.userId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    expiresAt: row.expiresAt,
    ipAddress: row.ipAddress,
    userAgent: row.userAgent,
    tenantId: row.tenantId,
    userName: row.userName,
    userEmail: row.userEmail,
    role: row.role as RoleUtilisateur,
  };
}

const colonnes = {
  id: session.id,
  userId: session.userId,
  createdAt: session.createdAt,
  updatedAt: session.updatedAt,
  expiresAt: session.expiresAt,
  ipAddress: session.ipAddress,
  userAgent: session.userAgent,
  tenantId: users.tenantId,
  userName: users.name,
  userEmail: users.email,
  role: users.role,
};

export class DrizzleSessionsRepository implements SessionsRepository {
  async listerParTenant(tenantId: string, limite: number) {
    const rows = await db
      .select(colonnes)
      .from(session)
      .innerJoin(users, eq(session.userId, users.id))
      .where(eq(users.tenantId, tenantId))
      .orderBy(desc(session.updatedAt))
      .limit(limite);
    return rows.map(versSession);
  }

  async trouverParId(tenantId: string, id: string) {
    const [row] = await db
      .select(colonnes)
      .from(session)
      .innerJoin(users, eq(session.userId, users.id))
      .where(and(eq(session.id, id), eq(users.tenantId, tenantId)))
      .limit(1);
    return row ? versSession(row) : null;
  }

  async compterActivesParUtilisateur(tenantId: string) {
    const rows = await db
      .select({ userId: session.userId, total: count() })
      .from(session)
      .innerJoin(users, eq(session.userId, users.id))
      .where(
        and(eq(users.tenantId, tenantId), gt(session.expiresAt, new Date())),
      )
      .groupBy(session.userId);
    const resultat: Record<string, number> = {};
    for (const row of rows) resultat[row.userId] = Number(row.total);
    return resultat;
  }

  async supprimer(tenantId: string, id: string) {
    const cible = await this.trouverParId(tenantId, id);
    if (!cible) throw new Error("Session introuvable pour ce tenant.");
    await db.delete(session).where(eq(session.id, id));
  }
}
