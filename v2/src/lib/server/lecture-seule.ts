import { eq } from "drizzle-orm";
import { withTenant } from "@/infrastructure/db/client";
import { tenants } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";

const DUREE_CACHE_MS = 30_000;
const cache = new Map<string, { valeur: boolean; expire: number }>();

/** Vide le cache (tests, bascule manuelle d'un tenant). */
export function viderCacheLectureSeule(): void {
  cache.clear();
}

/**
 * Le drapeau est lu sur le tenant de la session. En cas d'erreur base, on
 * laisse passer : bloquer toutes les écritures sur une panne transitoire
 * serait pire que le risque d'une écriture de démonstration.
 */
export async function tenantEnLectureSeule(tenantId: string): Promise<boolean> {
  if (!tenantId) return false;
  const maintenant = Date.now();
  const enCache = cache.get(tenantId);
  if (enCache && enCache.expire > maintenant) return enCache.valeur;

  try {
    const [row] = await withTenant(tenantId, (tx) =>
      tx
        .select({ lectureSeule: tenants.lectureSeule })
        .from(tenants)
        .where(eq(tenants.id, tenantId))
        .limit(1),
    );
    const valeur = row?.lectureSeule ?? false;
    cache.set(tenantId, { valeur, expire: maintenant + DUREE_CACHE_MS });
    return valeur;
  } catch (error) {
    logErreur("lecture-seule.lecture", error, { tenantId });
    return false;
  }
}
