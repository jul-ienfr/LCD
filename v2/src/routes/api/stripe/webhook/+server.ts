import { json } from "@sveltejs/kit";
import { ErreurMetier } from "@/domain/erreurs";
import { TraiterPaiementStripe } from "@/application/use-cases/traiter-paiement-stripe";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { withTenant } from "@/infrastructure/db/client";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request }) => {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ ok: false, erreur: "Stripe non configuré." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  try {
    const evenement = await creerPaiementStripe().verifierEtLireWebhook(payload, signature);
    if (evenement.type === "litige") {
      const tenantId = evenement.litige.metadata.tenant_id;
      if (!tenantId) {
        logErreur(
          "webhookStripeLitige",
          new Error("Litige Stripe sans tenant_id."),
          { disputeId: evenement.litige.id },
        );
        return json({ received: true, ignored: true });
      }
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: "stripe",
          action: "facture.litige_stripe",
          cible:
            evenement.litige.metadata.facture_id ?? evenement.litige.id,
          ref: evenement.litige.id,
          payload: {
            factureId: evenement.litige.metadata.facture_id ?? null,
            montantCentimes: evenement.litige.montantCentimes,
            devise: evenement.litige.devise,
            motif: evenement.litige.motif,
            statut: evenement.litige.statut,
            echeance: evenement.litige.echeance,
            paymentIntentId: evenement.litige.paymentIntentId,
          },
        }),
      );
      return json({ received: true, litige: true });
    }
    if (evenement.type !== "paiement_reussi") {
      return json({ received: true, ignored: true });
    }

    const tenantId = evenement.metadata.tenant_id;
    if (!tenantId) {
      return json({ ok: false, erreur: "tenant_id absent." }, { status: 400 });
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
      await emettreEvenement(tenantId, "paiement.created", {
        factureId: evenement.metadata.facture_id,
        paiementId: resultat.paiement.id,
        montantCentimes: resultat.paiement.montantCentimes,
        mode: "cb",
        resteCentimes: resultat.resteCentimes,
        stripe: true,
      });
    }

    return json({ received: true, ignored: resultat.ignore });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      logErreur("webhookStripeMetier", error, {});
      return json({ received: true, ignored: true });
    }
    logErreur("webhookStripe", error, {});
    return json({ ok: false, erreur: "Webhook Stripe invalide." }, { status: 400 });
  }
};
