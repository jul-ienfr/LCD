import { and, eq } from "drizzle-orm";
import type {
  UserRepository,
  UtilisateurTenant,
} from "@/application/ports/user-repository";
import { withTenant } from "../client";
import { users } from "../schema";

function versDomaine(row: typeof users.$inferSelect): UtilisateurTenant {
  return {
    id: row.id,
    tenantId: row.tenantId,
    email: row.email,
    name: row.name,
    role: row.role,
    actif: row.actif,
  };
}

export class DrizzleUserRepository implements UserRepository {
  async listerParRole(
    tenantId: string,
    role: string,
  ): Promise<UtilisateurTenant[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, role),
            eq(users.actif, true),
          ),
        );
      return rows.map(versDomaine);
    });
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<UtilisateurTenant | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(users)
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)))
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }
}
