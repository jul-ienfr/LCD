import { and, eq, sql } from "drizzle-orm";
import { AppliquerRecommandation } from "@/application/use-cases/appliquer-recommandation";
import { ImporterRecommandations } from "@/application/use-cases/importer-recommandations";
import { DrizzleTarifRepository } from "@/infrastructure/db/repositories/tarif-repository";
import { DrizzleRecommandationsPrixRepository } from "@/infrastructure/db/repositories/recommandations-prix-repository";
import { dbAdmin, withTenant } from "@/infrastructure/db/client";
import { logements, tenants } from "@/infrastructure/db/schema";
import { creerPricingLocal } from "@/infrastructure/adapters/pricing-local";
import { creerPricingPriceLabs } from "@/infrastructure/adapters/pricing-pricelabs";
import { jourParis } from "@/lib/date-paris";
import { logErreur, logInfo } from "@/lib/logger";
import { env } from "@/lib/env";

export interface ResultatImportPricing {
  tenants: number;
  logements: number;
  joursImportes: number;
  joursIgnores: number;
  source: string;
  /** Nombre de jours dont la recommandation a été appliquée automatiquement
   *  (toujours 0 : l'application reste une décision humaine). */
  appliquees: number;
}

/** Plage par défaut d'un import quotidien : 90 jours à partir de demain. */
export const HORIZON_IMPORT_JOURS = 90;

function ajouterJours(jour: string, jours: number): string {
  const date = new Date(`${jour}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

/**
 * Importe les recommandations de prix (partenaire si disponible, sinon calcul
 * local) pour les logements actifs. Rien n'est appliqué : les recommandations
 * attendent une décision humaine sur `/hote/prix/recommandations`.
 */
export async function executerImportPricing(
  options: { tenantIds?: string[]; debut?: string; fin?: string; simulation?: boolean } = {},
): Promise<ResultatImportPricing> {
  const debut = options.debut ?? ajouterJours(jourParis(), 1);
  const fin = options.fin ?? ajouterJours(debut, HORIZON_IMPORT_JOURS);
  const resultat: ResultatImportPricing = {
    tenants: 0,
    logements: 0,
    joursImportes: 0,
    joursIgnores: 0,
    source: "aucune",
    appliquees: 0,
  };

  let cibles: { id: string }[] = [];
  if (options.tenantIds && options.tenantIds.length > 0) {
    cibles = options.tenantIds.map((id) => ({ id }));
  } else if (dbAdmin) {
    cibles = await dbAdmin
      .select({ id: tenants.id })
      .from(tenants)
      .where(eq(tenants.statut, "actif"));
  } else {
    throw new Error("Base d'administration indisponible pour l'import pricing.");
  }

  const priceLabs = creerPricingPriceLabs();
  const partenaires = [
    priceLabs,
    creerPricingLocal({
      lirePrixCatalogue: async () => new Map(),
      tauxOccupation: async () => 0,
    }),
  ];
  resultat.source = partenaires.find((port) => port.estDisponible())?.nom ?? "aucune";

  for (const tenant of cibles) {
    resultat.tenants += 1;
    try {
      const lignes = await withTenant(tenant.id, async (tx) =>
        tx
          .select({
            id: logements.id,
            nom: logements.nom,
            code: logements.code,
          })
          .from(logements)
          .where(and(eq(logements.tenantId, tenant.id), eq(logements.statut, "actif"))),
      );

      for (const logement of lignes) {
        resultat.logements += 1;
        if (options.simulation) continue;
        try {
          const local = creerPricingLocal({
            lirePrixCatalogue: async (demande) => {
              const tarifs = await new DrizzleTarifRepository().listerParMois(
                tenant.id,
                demande.logementId,
                demande.debut,
                demande.fin,
              );
              return new Map(tarifs.map((tarif) => [tarif.date, tarif.prixCentimes]));
            },
            tauxOccupation: async (logementId) => tauxOccupation30Jours(tenant.id, logementId),
          });
          const importateur = new ImporterRecommandations(
            new DrizzleRecommandationsPrixRepository(),
            new DrizzleTarifRepository(),
            [priceLabs, local],
          );
          const resultatLogement = await importateur.executer({
            tenantId: tenant.id,
            logementId: logement.id,
            referencePartenaire: logement.code,
            debut,
            fin,
          });
          resultat.joursImportes += resultatLogement.joursImportes;
          resultat.joursIgnores += resultatLogement.joursIgnores;
        } catch (erreur) {
          logErreur("pricing.import.logement", erreur, {
            tenantId: tenant.id,
            logementId: logement.id,
          });
        }
      }
    } catch (erreur) {
      logErreur("pricing.import.tenant", erreur, { tenantId: tenant.id });
    }
  }

  logInfo("pricing.import.fin", { ...resultat, debut, fin });
  return resultat;
}

/**
 * Taux d'occupation des 30 derniers jours : nuits vendues / nuits disponibles.
 * Sert de seul signal local quand aucun partenaire n'est configuré.
 */
export async function tauxOccupation30Jours(
  tenantId: string,
  logementId: string,
  aujourdHui: string = jourParis(),
): Promise<number> {
  const debut = ajouterJours(aujourdHui, -30);
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.execute<{ nuits: number }>(sql`
      select coalesce(sum(
        least(r.fin::date, ${aujourdHui}::date) - greatest(r.debut::date, ${debut}::date)
      ), 0)::int as nuits
      from reservations r
      where r.tenant_id = ${tenantId}::uuid
        and r.logement_id = ${logementId}::uuid
        and r.statut in ('confirmee', 'en_sejour', 'terminee')
        and r.debut::date < ${aujourdHui}::date
        and r.fin::date > ${debut}::date
    `);
    const nuits = Number(row?.nuits ?? 0);
    return Math.min(1, Math.max(0, nuits / 30));
  });
}

/** Applique une recommandation déjà importée (utilisé par l'écran staff). */
export function creerAppliqueur(tenantId: string) {
  return new AppliquerRecommandation({
    recommandations: new DrizzleRecommandationsPrixRepository(),
    tarifs: new DrizzleTarifRepository(),
  });
}

/**
 * Nuits vendues et revenus d'une période, pour le calcul du RevPAR.
 * Seules les réservations confirmées, en séjour ou terminées comptent.
 */
export async function donneesPeriode(
  tenantId: string,
  logementId: string,
  debut: string,
  fin: string,
): Promise<{ jours: number; nuitsVendues: number; revenusCentimes: number }> {
  const jours = Math.max(
    0,
    Math.round(
      (Date.parse(`${fin}T00:00:00.000Z`) - Date.parse(`${debut}T00:00:00.000Z`)) /
        86_400_000,
    ),
  );
  return withTenant(tenantId, async (tx) => {
    const [row] = await tx.execute<{ nuits: number; revenus: number }>(sql`
      select
        coalesce(sum(
          least(r.fin::date, ${fin}::date) - greatest(r.debut::date, ${debut}::date)
        ), 0)::int as nuits,
        coalesce(sum(
          round(
            r.montant_centimes::numeric
            * (
              least(r.fin::date, ${fin}::date) - greatest(r.debut::date, ${debut}::date)
            ) / greatest(r.fin::date - r.debut::date, 1)
          )
        ), 0)::int as revenus
      from reservations r
      where r.tenant_id = ${tenantId}::uuid
        and r.logement_id = ${logementId}::uuid
        and r.statut in ('confirmee', 'en_sejour', 'terminee')
        and r.debut::date < ${fin}::date
        and r.fin::date > ${debut}::date
    `);
    return {
      jours,
      nuitsVendues: Number(row?.nuits ?? 0),
      revenusCentimes: Number(row?.revenus ?? 0),
    };
  });
}

/** Cron : protégé par `PRICING_IMPORT_ENABLED` (faux par défaut). */
export function importPricingActif(): boolean {
  return env.PRICING_IMPORT_ENABLED;
}
