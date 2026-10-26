import { and, count, eq, gte, sql } from "drizzle-orm";
import type {
  ConsommationsAssistantRepository,
  EnregistrerConsommationData,
} from "@/application/ports/consommations-assistant-repository";
import type { ConsommationMois } from "@/domain/assistant";
import { withTenant } from "../client";
import { assistantConsommations } from "../schema";

export class DrizzleConsommationsAssistantRepository
  implements ConsommationsAssistantRepository
{
  async enregistrer(data: EnregistrerConsommationData): Promise<void> {
    await withTenant(data.tenantId, (tx) =>
      tx
        .insert(assistantConsommations)
        .values({
          tenantId: data.tenantId,
          messageId: data.messageId,
          modele: data.modele,
          coutCentimes: data.coutCentimes,
        })
        .onConflictDoNothing({
          target: assistantConsommations.messageId,
        }),
    );
  }

  async totalMois(
    tenantId: string,
    depuis: Date,
  ): Promise<ConsommationMois> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select({
          nombre: count(),
          coutCentimes: sql<number>`coalesce(sum(${assistantConsommations.coutCentimes}), 0)`,
        })
        .from(assistantConsommations)
        .where(
          and(
            eq(assistantConsommations.tenantId, tenantId),
            gte(assistantConsommations.createdAt, depuis),
          ),
        );
      return {
        nombre: Number(row?.nombre ?? 0),
        coutCentimes: Number(row?.coutCentimes ?? 0),
      };
    });
  }
}
