import { json } from "@sveltejs/kit";
import { eq } from "drizzle-orm";
import { RelancerPanierAbandonne } from "@/application/use-cases/relancer-panier";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { dbAdmin } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { tenants } from "@/infrastructure/db/schema";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import {
  envoyerEmailReservation,
  lienGestion,
  messageRelancePaiement,
} from "@/lib/server/email-reservation";
import { logErreur } from "@/lib/logger";
import { executerRappelsPaiement } from "@/lib/server/planificateur-paiement";
import type { RequestHandler } from "./$types";

/**
 * Relances de séjour : échéances de paiement J-30 et, si
 * `PANIER_RELANCE_ENABLED=true`, paniers abandonnés.
 * `?simulation=1` liste sans envoyer.
 */
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
  const baseUrl = env.APP_URL?.replace(/\/+$/, "") || url.origin;

  try {
    const email = creerEmailSmtp();
    const actifs = await dbAdmin
      .select({ id: tenants.id, slug: tenants.slug })
      .from(tenants)
      .where(eq(tenants.statut, "actif"));
    const slugParTenant = new Map(actifs.map((t) => [t.id, t.slug]));

    let envoyes = 0;
    const paiement = await executerRappelsPaiement({
      envoyer: async (relance) => {
        if (simulation || !relance.email) return;
        await envoyerEmailReservation(
          email,
          messageRelancePaiement(
            {
              ref: relance.ref,
              clientNom: relance.clientNom ?? "",
              logementNom: "votre logement",
              debut: "",
              fin: "",
              voyageurs: 0,
              totalCentimes: 0,
              acompteCentimes: 0,
              soldeCentimes: 0,
              lienGestion: lienGestion(
                baseUrl,
                relance.ref,
                slugParTenant.get(relance.tenantId) ?? "",
              ),
            },
            {
              type: relance.type,
              montantCentimes: relance.montantCentimes,
              exigibleLe: relance.exigibleLe,
            },
            relance.joursRestants,
          ),
          relance.email,
        );
        envoyes += 1;
      },
    });

    let panier: { candidats: number; envoyes: number; dejaPayes: number } | null =
      null;
    if ((process.env.PANIER_RELANCE_ENABLED ?? "") === "true") {
      const cas = new RelancerPanierAbandonne(
        new DrizzleReservationRepository(),
        new DrizzlePaiementRepository(),
        email,
        new DrizzleLogementRepository(),
      );
      panier = { candidats: 0, envoyes: 0, dejaPayes: 0 };
      for (const tenant of actifs) {
        const resultat = await cas.executer({
          tenantId: tenant.id,
          baseUrl,
          tenantSlug: tenant.slug,
          simulation,
        });
        panier.candidats += resultat.candidats.length;
        panier.envoyes += resultat.envoyes;
        panier.dejaPayes += resultat.dejaPayes;
      }
    }

    return json({
      ok: true,
      simulation,
      paiement: { ...paiement, envoyes },
      panier,
    });
  } catch (erreur) {
    logErreur("cronRelancesSejour", erreur);
    return json(
      { ok: false, erreur: "Erreur pendant les relances de séjour." },
      { status: 500 },
    );
  }
}

export const GET: RequestHandler = ({ request, url }) => executer(request, url);
export const POST: RequestHandler = ({ request, url }) => executer(request, url);
