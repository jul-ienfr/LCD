import { and, asc, count, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import type {
  CreerUtilisateurData,
  UserRepository,
  UtilisateurTenant,
} from "@/application/ports/user-repository";
import { withTenant, db } from "../client";
import { account, session } from "../auth-schema";
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
        )
        .orderBy(asc(users.name));
      return rows.map(versDomaine);
    });
  }

  async listerParTenant(tenantId: string): Promise<UtilisateurTenant[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select()
        .from(users)
        .where(eq(users.tenantId, tenantId))
        .orderBy(asc(users.name));
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

  async trouverParEmail(email: string): Promise<UtilisateurTenant | null> {
    // `users` n'est pas sous RLS : l'email est unique au niveau plateforme.
    const [row] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.trim().toLowerCase()))
      .limit(1);
    return row ? versDomaine(row) : null;
  }

  async creer(data: CreerUtilisateurData): Promise<UtilisateurTenant> {
    return withTenant(data.tenantId, async (tx) => {
      const id = randomUUID();
      const [user] = await tx
        .insert(users)
        .values({
          id,
          tenantId: data.tenantId,
          name: data.name,
          email: data.email.toLowerCase(),
          emailVerified: true,
          role: data.role,
          actif: true,
        })
        .returning();
      if (!user) throw new Error("Utilisateur : aucune ligne retournée.");

      const hash = await hashPassword(data.password);
      await tx.insert(account).values({
        id: randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hash,
      });

      return versDomaine(user);
    });
  }

  async changerActif(
    tenantId: string,
    id: string,
    actif: boolean,
  ): Promise<UtilisateurTenant | null> {
    await withTenant(tenantId, async (tx) => {
      await tx
        .update(users)
        .set({ actif, updatedAt: new Date() })
        .where(and(eq(users.tenantId, tenantId), eq(users.id, id)));
      if (!actif) {
        // Déconnexion immédiate de toutes les sessions ouvertes.
        await tx.delete(session).where(eq(session.userId, id));
      }
    });
    return this.trouverParId(tenantId, id);
  }

  async reinitialiserMotDePasse(
    tenantId: string,
    id: string,
    password: string,
  ): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const [existant] = await tx
        .select({ id: account.id })
        .from(account)
        .where(
          and(eq(account.userId, id), eq(account.providerId, "credential")),
        )
        .limit(1);
      const hash = await hashPassword(password);

      if (existant) {
        await tx
          .update(account)
          .set({ password: hash, updatedAt: new Date() })
          .where(eq(account.id, existant.id));
      } else {
        await tx.insert(account).values({
          id: randomUUID(),
          accountId: id,
          providerId: "credential",
          userId: id,
          password: hash,
        });
      }
      // Un mot de passe réinitialisé invalide les sessions existantes.
      await tx.delete(session).where(eq(session.userId, id));
      return true;
    });
  }

  async compterActifsParRole(
    tenantId: string,
    role: string,
  ): Promise<number> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({ nombre: count() })
        .from(users)
        .where(
          and(
            eq(users.tenantId, tenantId),
            eq(users.role, role),
            eq(users.actif, true),
          ),
        );
      return Number(row?.nombre ?? 0);
    });
  }
}
