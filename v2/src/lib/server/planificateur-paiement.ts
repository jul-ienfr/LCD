import { and, asc, eq, lte } from "drizzle-orm";
import {
  echeancesARelancer,
  type LigneRelance,
  type RelancePaiement,
} from "@/domain/relance-paiement";
import { dbAdmin, withTenant } from "@/infrastructure/db/client";
import {
  echeancesPaiement,
  reservations,
  tenants,
} from "@/infrastructure/db/schema";
import { jourParis } from "@/lib/date-paris";
import { logErreur, logInfo } from "@/lib/logger";

export type { LigneRelance, RelancePaiement } from "@/domain/relance-paiement";

export interface ExecuterRappelsOptions {
  envoyer: (relance: RelancePaiement) => Promise<void>;
  fenetreJours?: number;
  aujourdhui?: string;
}

/**
 * Parcourt les tenants actifs, repère les échéances a_payer dues ou proches
 * (J-30) et délègue l'envoi. L'idempotence d'envoi reste à la charge de
 * l'appelant (journal de relance ou `ref` stable).
 */
export async function executerRappelsPaiement(
  options: ExecuterRappelsOptions,
): Promise<{ tenants: number; candidats: number; envoyes: number }> {
  if (!dbAdmin) {
    throw new Error("Base d'administration indisponible pour les relances.");
  }
  const aujourdhui = options.aujourdhui ?? jourParis();
  const fenetre = options.fenetreJours ?? 30;
  const limite = new Date(
    new Date(`${aujourdhui}T00:00:00Z`).getTime() + fenetre * 86_400_000,
  )
    .toISOString()
    .slice(0, 10);

  const actifs = await dbAdmin
    .select({ id: tenants.id })
    .from(tenants)
    .where(eq(tenants.statut, "actif"));

  let candidats = 0;
  let envoyes = 0;

  for (const tenant of actifs) {
    try {
      const lignes: LigneRelance[] = await withTenant(tenant.id, async (tx) =>
        tx
          .select({
            echeanceId: echeancesPaiement.id,
            reservationId: echeancesPaiement.reservationId,
            type: echeancesPaiement.type,
            montantCentimes: echeancesPaiement.montantCentimes,
            exigibleLe: echeancesPaiement.exigibleLe,
            ref: reservations.ref,
            clientNom: reservations.clientNom,
            email: reservations.clientEmail,
          })
          .from(echeancesPaiement)
          .innerJoin(
            reservations,
            eq(reservations.id, echeancesPaiement.reservationId),
          )
          .where(
            and(
              eq(echeancesPaiement.tenantId, tenant.id),
              eq(echeancesPaiement.statut, "a_payer"),
              lte(echeancesPaiement.exigibleLe, limite),
            ),
          )
          .orderBy(asc(echeancesPaiement.exigibleLe)),
      );

      const relances = echeancesARelancer(lignes, {
        tenantId: tenant.id,
        aujourdhui,
        fenetreJours: fenetre,
      });
      candidats += relances.length;
      for (const relance of relances) {
        await options.envoyer(relance);
        envoyes += 1;
      }
    } catch (erreur) {
      logErreur("paiement.relance.tenant", erreur, { tenantId: tenant.id });
    }
  }

  logInfo("paiement.relance.fin", {
    tenants: actifs.length,
    candidats,
    envoyes,
    aujourdhui,
  });
  return { tenants: actifs.length, candidats, envoyes };
}
