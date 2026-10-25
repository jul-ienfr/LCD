import { eq } from "drizzle-orm";
import type { ParametresSiteRepository } from "@/application/ports/parametres-site-repository";
import { db } from "../client";
import { parametresSite } from "../schema";

export class DrizzleParametresSiteRepository
  implements ParametresSiteRepository
{
  async lire(cle: string): Promise<string | null> {
    const [row] = await db
      .select()
      .from(parametresSite)
      .where(eq(parametresSite.cle, cle))
      .limit(1);
    return row?.valeur ?? null;
  }

  async ecrire(cle: string, valeur: string): Promise<void> {
    await db
      .insert(parametresSite)
      .values({ cle, valeur })
      .onConflictDoUpdate({
        target: parametresSite.cle,
        set: { valeur, updatedAt: new Date() },
      });
  }
}
