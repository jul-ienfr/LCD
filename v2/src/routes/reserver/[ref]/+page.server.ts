import { fail, redirect } from "@sveltejs/kit";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { formaterEuros } from "@/lib/format";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES: Record<string, string> = {
  acompte: "Acompte",
  solde: "Solde",
  caution: "Caution",
  a_payer: "À payer",
  paye: "Payé",
  annule: "Annulé",
  rembourse: "Remboursé",
};

export const load: PageServerLoad = async ({ params, url }) => {
  const slug = (url.searchParams.get("tenant") ?? "").trim();
  const ref = params.ref?.trim() ?? "";
  if (!slug) {
    return { introuvable: true as const, ref, message: "Lien incomplet." };
  }

  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant || tenant.statut !== "actif") {
    return { introuvable: true as const, ref, message: "Site indisponible." };
  }

  const reservation = await new DrizzleReservationRepository().trouverParRef(
    tenant.id,
    ref,
  );
  if (!reservation) {
    return {
      introuvable: true as const,
      ref,
      message: "Cette réservation est introuvable.",
    };
  }

  const echeances = await new DrizzleEcheancesPaiementRepository()
    .listerParReservation(tenant.id, reservation.id);

  return {
    introuvable: false as const,
    ref,
    slug,
    paiementEnLigne: Boolean(env.STRIPE_SECRET_KEY),
    paiement: url.searchParams.get("paiement"),
    reservation: {
      ref: reservation.ref,
      debut: reservation.debut,
      fin: reservation.fin,
      voyageurs: reservation.voyageurs,
      montant: formaterEuros(reservation.montantCentimes),
    },
    echeances: echeances.map((echeance) => ({
      id: echeance.id,
      type: echeance.type,
      typeLibelle: LIBELLES[echeance.type] ?? echeance.type,
      statut: echeance.statut,
      statutLibelle: LIBELLES[echeance.statut] ?? echeance.statut,
      exigibleLe: echeance.exigibleLe,
      montant: formaterEuros(echeance.montantCentimes),
      montantCentimes: echeance.montantCentimes,
      payable: echeance.statut === "a_payer" && echeance.montantCentimes > 0,
    })),
  };
};

export const actions = {
  payer: async ({ params, url, request }) => {
    const donnees = await request.formData();
    const slug = String(donnees.get("tenant") ?? "").trim();
    const echeanceId = String(donnees.get("echeance") ?? "").trim();
    const ref = params.ref?.trim() ?? "";
    if (!slug || !echeanceId) {
      return fail(400, { message: "Demande de paiement incomplète." });
    }
    if (!env.STRIPE_SECRET_KEY) {
      return fail(503, { message: "Le paiement en ligne n'est pas configuré." });
    }

    try {
      const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
      if (!tenant || tenant.statut !== "actif" || tenant.ventesSuspendues) {
        return fail(404, { message: "Site indisponible." });
      }
      const reservation = await new DrizzleReservationRepository().trouverParRef(
        tenant.id,
        ref,
      );
      if (!reservation) {
        return fail(404, { message: "Réservation introuvable." });
      }
      const echeances = await new DrizzleEcheancesPaiementRepository()
        .listerParReservation(tenant.id, reservation.id);
      const echeance = echeances.find((entree) => entree.id === echeanceId);
      if (!echeance || echeance.statut !== "a_payer") {
        return fail(409, { message: "Cette échéance n'est plus payable." });
      }

      const session = await creerPaiementStripe().creerSession({
        ref: echeance.id,
        montantCentimes: echeance.montantCentimes,
        devise: "EUR",
        description: LIBELLES[echeance.type] ?? "Réservation",
        emailClient: reservation.clientEmail ?? undefined,
        successUrl: `${url.origin}/reserver/${encodeURIComponent(ref)}?tenant=${encodeURIComponent(slug)}&paiement=ok`,
        cancelUrl: `${url.origin}/reserver/${encodeURIComponent(ref)}?tenant=${encodeURIComponent(slug)}&paiement=annule`,
        metadata: {
          tenant_id: tenant.id,
          echeance_id: echeance.id,
          reservation_id: reservation.id,
        },
      });
      redirect(303, session.url);
    } catch (erreur) {
      if (erreur instanceof Response) throw erreur;
      logErreur("reserver.payer", erreur, { ref, slug });
      return fail(502, { message: "Paiement momentanément indisponible." });
    }
  },
} satisfies Actions;
