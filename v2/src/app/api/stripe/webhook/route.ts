import { connection } from "next/server";
import { ErreurMetier } from "@/domain/erreurs";
import { TraiterPaiementStripe } from "@/application/use-cases/traiter-paiement-stripe";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";

export async function POST(request: Request) {
  await connection();

  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return Response.json(
      { ok: false, erreur: "Stripe non configuré." },
      { status: 503 },
    );
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  try {
    const evenement = await creerPaiementStripe().verifierEtLireWebhook(
      payload,
      signature,
    );
    if (evenement.type !== "paiement_reussi") {
      return Response.json({ received: true, ignored: true });
    }

    const tenantId = evenement.metadata.tenant_id;
    if (!tenantId) {
      return Response.json(
        { ok: false, erreur: "tenant_id absent." },
        { status: 400 },
      );
    }

    const resultat = await new TraiterPaiementStripe(
      new DrizzlePaiementRepository(),
      new DrizzleFactureRepository(),
    ).executer(evenement);

    if (!resultat.ignore) {
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: "stripe",
          action: "paiement.stripe",
          cible: resultat.paiement.id,
          ref: evenement.sessionId,
          payload: {
            factureId: evenement.metadata.facture_id,
            montantCentimes: resultat.paiement.montantCentimes,
            resteCentimes: resultat.resteCentimes,
          },
        }),
      );
    }

    return Response.json({ received: true, ignored: resultat.ignore });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      logErreur("webhookStripeMetier", error, {});
      return Response.json({ received: true, ignored: true });
    }
    logErreur("webhookStripe", error, {});
    return Response.json(
      { ok: false, erreur: "Webhook Stripe invalide." },
      { status: 400 },
    );
  }
}
