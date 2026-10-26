import { and, eq } from "drizzle-orm";
import type {
  EnregistrerPreferencesData,
  PreferencesSejourRepository,
} from "@/application/ports/preferences-sejour-repository";
import type { PreferencesSejour } from "@/domain/preference-sejour";
import { withTenant } from "../client";
import { preferencesSejour } from "../schema";

function versDomaine(
  row: typeof preferencesSejour.$inferSelect,
): PreferencesSejour {
  return {
    id: row.id,
    tenantId: row.tenantId,
    reservationId: row.reservationId,
    menageFrequenceJ: row.menageFrequenceJ,
    lingeInclus: row.lingeInclus,
    heureArrivee: row.heureArrivee,
    consignes: row.consignes,
    updatedAt: row.updatedAt,
  };
}

export class DrizzlePreferencesSejourRepository
  implements PreferencesSejourRepository
{
  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<PreferencesSejour | null> {
    return withTenant(tenantId, async (tx) => {
      const [row] = await tx
        .select()
        .from(preferencesSejour)
        .where(
          and(
            eq(preferencesSejour.tenantId, tenantId),
            eq(preferencesSejour.reservationId, reservationId),
          ),
        )
        .limit(1);
      return row ? versDomaine(row) : null;
    });
  }

  async enregistrer(
    data: EnregistrerPreferencesData,
  ): Promise<PreferencesSejour> {
    return withTenant(data.tenantId, async (tx) => {
      const [row] = await tx
        .insert(preferencesSejour)
        .values({
          tenantId: data.tenantId,
          reservationId: data.reservationId,
          menageFrequenceJ: data.menageFrequenceJ,
          lingeInclus: data.lingeInclus,
          heureArrivee: data.heureArrivee,
          consignes: data.consignes,
        })
        .onConflictDoUpdate({
          target: [
            preferencesSejour.tenantId,
            preferencesSejour.reservationId,
          ],
          set: {
            menageFrequenceJ: data.menageFrequenceJ,
            lingeInclus: data.lingeInclus,
            heureArrivee: data.heureArrivee,
            consignes: data.consignes,
            updatedAt: new Date(),
          },
        })
        .returning();
      if (!row) {
        throw new Error("Préférences séjour : aucune ligne retournée.");
      }
      return versDomaine(row);
    });
  }
}
