import { connection } from "next/server";
import { RelancerFacturesEchues } from "@/application/use-cases/relancer-factures-echues";
import { ajouterJours } from "@/domain/calendrier";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleRelanceFactureRepository } from "@/infrastructure/db/repositories/relance-facture-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { cronSecretValide } from "@/lib/cron-secret";
import { jourParis } from "@/lib/date-paris";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

export async function POST(request: Request) {
  await connection();

  if (!env.CRON_SECRET) {
    return Response.json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!env.RELANCE_AUTO_ENABLED) {
    return Response.json(
      { ok: false, erreur: "Relances automatiques désactivées." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return Response.json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  const jour = jourParis();
  const echeancesAutorisees = [1, 7, 15, 30].map((decalage) =>
    ajouterJours(jour, -decalage),
  );
  const tenants = await new DrizzleTenantRepository().listerIdsActifs();
  const total = {
    envoyees: 0,
    dejaRelancees: 0,
    sansEmail: 0,
    echecs: 0,
  };
  let echecsTenants = 0;

  for (const tenantId of tenants) {
    try {
      const resultat = await new RelancerFacturesEchues(
        new DrizzleFactureRepository(),
        new DrizzlePaiementRepository(),
        new DrizzleRelanceFactureRepository(),
        new DrizzleTenantRepository(),
        creerEmailSmtp(),
      ).executer({
        tenantId,
        jour,
        baseUrl: env.APP_URL,
        echeancesAutorisees,
      });

      total.envoyees += resultat.envoyees;
      total.dejaRelancees += resultat.dejaRelancees;
      total.sansEmail += resultat.sansEmail;
      total.echecs += resultat.echecs;

      if (resultat.envoyees > 0 || resultat.echecs > 0) {
        try {
          await withTenant(tenantId, (tx) =>
            tx.insert(auditLogs).values({
              tenantId,
              qui: "cron",
              action: "facture.relances.auto",
              cible: jour,
              ref: String(resultat.envoyees),
              payload: { ...resultat },
            }),
          );
        } catch (error) {
          logErreur("cronRelancesAudit", error, { tenantId, jour });
        }
      }
    } catch (error) {
      echecsTenants += 1;
      logErreur("cronRelancesTenant", error, { tenantId, jour });
    }
  }

  return Response.json(
    {
      ok: echecsTenants === 0,
      jour,
      echeances: echeancesAutorisees,
      tenants: tenants.length,
      ...total,
      echecsTenants,
    },
    { status: echecsTenants === 0 ? 200 : 500 },
  );
}
