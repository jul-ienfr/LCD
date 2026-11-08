import { and, asc, desc, eq } from "drizzle-orm";
import type {
  AjouterMessageFilInput,
  CreerFilInterneInput,
  FilInterne,
  FilInterneDetail,
  FilsInternesRepository,
  MessageFilInterne,
} from "@/application/ports/fils-internes-repository";
import type {
  CanalFilInterne,
  StatutFilInterne,
} from "@/domain/fil-interne";
import { withTenant } from "../client";
import { filsInternes, logements, messagesFilsInternes } from "../schema";

function versFil(
  row: typeof filsInternes.$inferSelect,
  logementNom: string | null,
): FilInterne {
  return {
    id: row.id,
    tenantId: row.tenantId,
    logementId: row.logementId,
    logementNom,
    canal: row.canal as CanalFilInterne,
    sujet: row.sujet,
    statut: row.statut === "ferme" ? "ferme" : "ouvert",
    creePar: row.creePar,
    dernierMessageAt: row.dernierMessageAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function versMessage(
  row: typeof messagesFilsInternes.$inferSelect,
): MessageFilInterne {
  return {
    id: row.id,
    tenantId: row.tenantId,
    filId: row.filId,
    auteurEmail: row.auteurEmail,
    auteurRole: row.auteurRole,
    corps: row.corps,
    createdAt: row.createdAt,
  };
}

export class DrizzleFilsInternesRepository
  implements FilsInternesRepository
{
  async lister(
    tenantId: string,
    canal?: CanalFilInterne,
  ): Promise<FilInterne[]> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .select({
          fil: filsInternes,
          logementNom: logements.nom,
        })
        .from(filsInternes)
        .leftJoin(logements, eq(logements.id, filsInternes.logementId))
        .where(
          and(
            eq(filsInternes.tenantId, tenantId),
            canal ? eq(filsInternes.canal, canal) : undefined,
          ),
        )
        .orderBy(desc(filsInternes.dernierMessageAt))
        .limit(200);
      return rows.map((row) => versFil(row.fil, row.logementNom));
    });
  }

  async trouver(
    tenantId: string,
    id: string,
  ): Promise<FilInterneDetail | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          fil: filsInternes,
          logementNom: logements.nom,
        })
        .from(filsInternes)
        .leftJoin(logements, eq(logements.id, filsInternes.logementId))
        .where(
          and(eq(filsInternes.tenantId, tenantId), eq(filsInternes.id, id)),
        )
        .limit(1);
      if (!row) return null;

      const messages = await tx
        .select()
        .from(messagesFilsInternes)
        .where(
          and(
            eq(messagesFilsInternes.tenantId, tenantId),
            eq(messagesFilsInternes.filId, id),
          ),
        )
        .orderBy(asc(messagesFilsInternes.createdAt));

      return {
        ...versFil(row.fil, row.logementNom),
        messages: messages.map(versMessage),
      };
    });
  }

  async creer(input: CreerFilInterneInput): Promise<FilInterne> {
    return withTenant(input.tenantId, async (tx) => {
      const [row] = await tx
        .insert(filsInternes)
        .values({
          tenantId: input.tenantId,
          logementId: input.logementId,
          canal: input.canal,
          sujet: input.sujet,
          creePar: input.creePar,
        })
        .returning();
      if (!row) throw new Error("Création du fil impossible.");
      return versFil(row, null);
    });
  }

  async ajouterMessage(
    input: AjouterMessageFilInput,
  ): Promise<MessageFilInterne | null> {
    return withTenant(input.tenantId, async (tx) => {
      const [fil] = await tx
        .select()
        .from(filsInternes)
        .where(
          and(
            eq(filsInternes.tenantId, input.tenantId),
            eq(filsInternes.id, input.filId),
            eq(filsInternes.statut, "ouvert"),
          ),
        )
        .limit(1);
      if (!fil) return null;

      const [row] = await tx
        .insert(messagesFilsInternes)
        .values({
          tenantId: input.tenantId,
          filId: input.filId,
          auteurEmail: input.auteurEmail,
          auteurRole: input.auteurRole,
          corps: input.corps,
        })
        .returning();
      if (!row) return null;

      await tx
        .update(filsInternes)
        .set({ dernierMessageAt: row.createdAt, updatedAt: new Date() })
        .where(eq(filsInternes.id, input.filId));

      return versMessage(row);
    });
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: StatutFilInterne,
  ): Promise<boolean> {
    return withTenant(tenantId, async (tx) => {
      const rows = await tx
        .update(filsInternes)
        .set({ statut, updatedAt: new Date() })
        .where(
          and(eq(filsInternes.tenantId, tenantId), eq(filsInternes.id, id)),
        )
        .returning({ id: filsInternes.id });
      return rows.length > 0;
    });
  }
}
