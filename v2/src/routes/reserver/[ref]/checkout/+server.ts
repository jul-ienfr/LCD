import { json } from "@sveltejs/kit";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { RequestHandler } from "./$types";

/**
 * Crée une session Stripe Checkout pour la prochaine échéance due.
 * Le webhook `/api/webhooks/stripe` marque ensuite l'échéance payée.
 */
export const POST: RequestHandler = async ({ params, url, request }) => {
  if (!env.STRIPE_SECRET_KEY) {
    return json(
      { ok: false, erreur: "Paiement en ligne non configuré." },
      { status: 503 },
    );
  }

  const ref = params.ref?.trim();
  if (!ref) return json({ ok: false, erreur: "Référence manquante." }, { status: 400 });

  const corps = await lireCorps(request);
  const slug = (corps.tenant ?? url.searchParams.get("tenant") ?? "").trim();
  if (!slug) {
    return json({ ok: false, erreur: "Tenant manquant." }, { status: 400 });
  }

  try {
    const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
    if (!tenant || tenant.statut !== "actif" || tenant.ventesSuspendues) {
      return json({ ok: false, erreur: "Site indisponible." }, { status: 404 });
    }

    const reservation = await new DrizzleReservationRepository().trouverParRef(
      tenant.id,
      ref,
    );
    if (!reservation) {
      return json({ ok: false, erreur: "Réservation inconnue." }, { status: 404 });
    }

    const echeances = await new DrizzleEcheancesPaiementRepository()
      .listerParReservation(tenant.id, reservation.id);
    const aPayer = echeances.find(
      (echeance) => echeance.statut === "a_payer" && echeance.montantCentimes > 0,
    );
    if (!aPayer) {
      return json(
        { ok: false, erreur: "Aucune échéance à payer." },
        { status: 409 },
      );
    }

    const session = await creerPaiementStripe().creerSession({
      ref: aPayer.id,
      montantCentimes: aPayer.montantCentimes,
      devise: "EUR",
      description: libelleEcheance(aPayer.type),
      emailClient: reservation.clientEmail ?? undefined,
      successUrl: `${url.origin}/reserver/${encodeURIComponent(ref)}?tenant=${encodeURIComponent(slug)}&paiement=ok`,
      cancelUrl: `${url.origin}/reserver/${encodeURIComponent(ref)}?tenant=${encodeURIComponent(slug)}&paiement=annule`,
      metadata: {
        tenant_id: tenant.id,
        echeance_id: aPayer.id,
        reservation_id: reservation.id,
      },
    });

    return json({ ok: true, url: session.url, sessionId: session.id });
  } catch (erreur) {
    logErreur("reserver.checkout", erreur, { ref, slug });
    return json(
      { ok: false, erreur: "Paiement momentanément indisponible." },
      { status: 502 },
    );
  }
};

async function lireCorps(request: Request): Promise<Record<string, string>> {
  const type = request.headers.get("content-type") ?? "";
  try {
    if (type.includes("application/json")) {
      const donnees = (await request.json()) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(donnees).map(([cle, valeur]) => [cle, String(valeur ?? "")]),
      );
    }
    const donnees = await request.formData();
    return Object.fromEntries(
      [...donnees.entries()].map(([cle, valeur]) => [cle, String(valeur)]),
    );
  } catch {
    return {};
  }
}

function libelleEcheance(type: string): string {
  if (type === "acompte") return "Acompte de réservation";
  if (type === "solde") return "Solde du séjour";
  return "Caution";
}
