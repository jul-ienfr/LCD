import { json } from "@sveltejs/kit";
import type { EvenementPaiement } from "@/application/ports/paiement";
import { ErreurMetier } from "@/domain/erreurs";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { traiterAvecTrace } from "@/lib/server/evenements-stripe";
import type { RequestHandler } from "./$types";

/**
 * Webhook Stripe (spec 006, FR-024) : chaque événement signé est tracé par
 * son identifiant (`evt_...`) avant traitement.
 *  - doublon de livraison : rien n'est retraité (ni audit, ni webhook sortant) ;
 *  - échec : trace `echec` rejouable depuis /supervision, alerte critique
 *    « stripe:evenements-echec » au prochain contrôle ;
 *  - erreur transitoire : réponse 500, Stripe redélivre avec backoff.
 */
export const POST: RequestHandler = async ({ request }) => {
  if (!env.STRIPE_SECRET_KEY || !env.STRIPE_WEBHOOK_SECRET) {
    return json({ ok: false, erreur: "Stripe non configuré." }, { status: 503 });
  }

  const payload = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";

  let evenement: EvenementPaiement;
  try {
    evenement = await creerPaiementStripe().verifierEtLireWebhook(
      payload,
      signature,
    );
  } catch (error) {
    logErreur("webhookStripe", error, {});
    return json(
      { ok: false, erreur: "Webhook Stripe invalide." },
      { status: 400 },
    );
  }

  try {
    const resultat = await traiterAvecTrace(evenement);
    if (resultat.deja) {
      return json({ received: true, ignored: true, deja: true });
    }
    return json({ received: true, ...(resultat.traitement?.reponse ?? {}) });
  } catch (error) {
    if (error instanceof ErreurMetier) {
      logErreur("webhookStripeMetier", error, {
        evenementId: evenement.evenementId,
      });
      return json({ received: true, ignored: true });
    }
    logErreur("webhookStripe", error, { evenementId: evenement.evenementId });
    return json(
      { ok: false, erreur: "Traitement du webhook en échec." },
      { status: 500 },
    );
  }
};
