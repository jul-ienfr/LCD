/**
 * T508 — Endpoint cron : génération et envoi récurrent des relevés propriétaires.
 *
 * Appelé le 1er de chaque mois (mensuel) et le 1er de chaque trimestre
 * (trimestriel). Pour chaque tenant actif :
 * 1. Détermine les périodes à générer via `selectionnerRelevesAGenerer` ;
 * 2. Pour chaque propriétaire avec mandat actif, génère le relevé
 *    (idempotent par période) ;
 * 3. Envoie le relevé par email (idempotent par envoiRef).
 *
 * Sécurité : CRON_SECRET requis. `?simulation=1` liste sans envoyer.
 */
import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { dbAdmin } from "@/infrastructure/db/client";
import { DrizzleRapportsRepository } from "@/infrastructure/db/repositories/rapports-repository";
import { DrizzleRelevesProprietairesRepository, DrizzleEnvoisRelevesRepository } from "@/infrastructure/db/repositories/releves-repository";
import { GenererReleve } from "@/application/use-cases/generer-releve";
import { EnvoyerReleve } from "@/application/use-cases/envoyer-releve";
import { genererReleveProprietairePdf } from "@/infrastructure/adapters/pdf-releve-proprietaire";
import { versOptionsPdfReleve } from "@/infrastructure/adapters/pdf-releve-mapping";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { stockageFichiers } from "@/lib/server/stockage";
import { tenants } from "@/infrastructure/db/schema";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { jourParis } from "@/lib/date-paris";
import { logErreur, logInfo } from "@/lib/logger";
import {
  proprietairesDistincts,
  selectionnerRelevesAGenerer,
} from "@/application/use-cases/planifier-releves";
import type { RequestHandler } from "./$types";

async function executer(request: Request, url: URL) {
  if (!env.CRON_SECRET) {
    return json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }
  if (!dbAdmin) {
    return json(
      { ok: false, erreur: "Base d'administration indisponible." },
      { status: 503 },
    );
  }

  const simulation = url.searchParams.get("simulation") === "1";
  const aujourdhui = url.searchParams.get("date") || jourParis();

  try {
    const candidats = selectionnerRelevesAGenerer(aujourdhui, ["mensuel", "trimestriel"]);
    if (candidats.length === 0) {
      return json({
        ok: true,
        simulation,
        message: `Aucun relevé à générer le ${aujourdhui}.`,
      });
    }

    const actifs = await dbAdmin
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.statut, "actif"));

    const rapports = new DrizzleRapportsRepository();
    const relevesRepo = new DrizzleRelevesProprietairesRepository();
    const envoisRepo = new DrizzleEnvoisRelevesRepository();
    const generer = new GenererReleve(rapports, relevesRepo);

    let generes = 0;
    let envoyes = 0;

    for (const tenant of actifs) {
      try {
        const mandats = await rapports.listerLogementsAvecMandat(tenant.id);
        const proprietaires = proprietairesDistincts(mandats);

        for (const proprio of proprietaires) {
          for (const candidat of candidats) {
            // Générer (idempotent par période)
            const { releve, cree } = await generer.executer({
              tenantId: tenant.id,
              proprietaireId: proprio.proprietaireId,
              proprietaireNom: proprio.proprietaireNom,
              moisDebut: candidat.moisDebut,
              periode: candidat.periode,
            });
            if (cree) generes += 1;

            // Envoyer (idempotent par envoiRef)
            if (!simulation) {
              if (!proprio.proprietaireEmail) {
                // Pas d'email : le relevé reste consultable dans le portail.
                logErreur(
                  "cronReleves.emailAbsent",
                  new Error("Email propriétaire absent"),
                  {
                    tenantId: tenant.id,
                    proprietaireId: proprio.proprietaireId,
                    periode: candidat.periode,
                  },
                );
              } else {
                const emailDestinataire = proprio.proprietaireEmail;

                try {
                  const email = creerEmailSmtp();
                  const stockage = stockageFichiers();
                  const envoyer = new EnvoyerReleve(
                    relevesRepo,
                    envoisRepo,
                    email,
                    stockage,
                    async (r, accent) => {
                      const options = versOptionsPdfReleve(r, accent);
                      return genererReleveProprietairePdf(options);
                    },
                  );
                  const resultat = await envoyer.executer({
                    tenantId: tenant.id,
                    releveId: releve.id,
                    emailDestinataire,
                    proprietaireNom: proprio.proprietaireNom,
                    cleStockage: `releves/${tenant.id}/${releve.id}`,
                  });
                  if (!resultat.dejaEnvoye) envoyes += 1;
                } catch (erreurEnvoi) {
                  logErreur("cronReleves.envoi", erreurEnvoi, {
                    tenantId: tenant.id,
                    proprietaireId: proprio.proprietaireId,
                    periode: candidat.periode,
                  });
                }
              }
            }
          }
        }
      } catch (erreurTenant) {
        logErreur("cronReleves.tenant", erreurTenant, { tenantId: tenant.id });
      }
    }

    logInfo("cronReleves.fin", { aujourdhui, generes, envoyes, simulation });
    return json({ ok: true, simulation, aujourdhui, generes, envoyes });
  } catch (erreur) {
    logErreur("cronReleves", erreur);
    return json(
      { ok: false, erreur: "Erreur pendant la génération des relevés." },
      { status: 500 },
    );
  }
}

export const GET: RequestHandler = ({ request, url }) => executer(request, url);
export const POST: RequestHandler = ({ request, url }) => executer(request, url);
