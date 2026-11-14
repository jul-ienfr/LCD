import { fail, redirect } from "@sveltejs/kit";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { dateIsoValide, nuitsEntre } from "@/domain/calendrier";
import { montantTaxeSejour } from "@/domain/fiscal";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleReservationRepository } from "@/infrastructure/db/repositories/reservation-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { formaterEuros } from "@/lib/format";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import {
  enregistrerEvenementSuivi,
  lireConsentementRequete,
  suiviActifPourTenant,
} from "@/lib/server/suivi";
import type { Actions, PageServerLoad } from "./$types";

/** Motif d'indisponibilité : la page le traduit, le serveur ne fige pas de texte. */
export type MotifIntrouvable = "lien" | "site" | "introuvable";

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
    return { introuvable: true as const, ref, motif: "lien" as const };
  }

  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant || tenant.statut !== "actif") {
    return { introuvable: true as const, ref, motif: "site" as const };
  }

  const reservation = await new DrizzleReservationRepository().trouverParRef(
    tenant.id,
    ref,
  );
  if (!reservation) {
    return { introuvable: true as const, ref, motif: "introuvable" as const };
  }

  const echeances = await new DrizzleEcheancesPaiementRepository()
    .listerParReservation(tenant.id, reservation.id);

  // Rappel logement et taxe de séjour : uniquement des données du serveur.
  const logement = await new DrizzleLogementRepository().trouverParId(
    tenant.id,
    reservation.logementId,
  );
  const nuits =
    dateIsoValide(reservation.debut) && dateIsoValide(reservation.fin)
      ? Math.max(0, nuitsEntre(reservation.debut, reservation.fin))
      : 0;
  const fiscal = await new ObtenirParametresFiscaux(
    new DrizzleParametresFiscauxRepository(),
  ).executer(tenant.id);
  const taxeCentimes =
    fiscal.taxeSejourNuitPersonneCentimes > 0 && nuits > 0
      ? montantTaxeSejour({
          nuits,
          voyageurs: reservation.voyageurs,
          taxeSejourNuitPersonneCentimes: fiscal.taxeSejourNuitPersonneCentimes,
          taxeSejourPlafondCentimes: fiscal.taxeSejourPlafondCentimes,
        })
      : 0;

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
      nuits,
      montant: formaterEuros(reservation.montantCentimes),
      logement: logement?.nom ?? null,
      adresse: logement?.adresse ?? null,
      statut: reservation.statut,
      confirme:
        reservation.statut === "confirmee" ||
        reservation.statut === "en_sejour" ||
        reservation.statut === "terminee",
    },
    taxe:
      taxeCentimes > 0
        ? { montant: formaterEuros(taxeCentimes), montantCentimes: taxeCentimes }
        : null,
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
  payer: async (event) => {
    const { params, url, request } = event;
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
      const consentement = lireConsentementRequete(event);
      if (consentement && (await suiviActifPourTenant(tenant.id))) {
        await enregistrerEvenementSuivi(event, tenant.id, consentement, {
          type: "conversion",
          nom: "paiement_initie",
          page: url.pathname,
          valeurCentimes: echeance.montantCentimes,
          metadata: { ref, echeance: echeance.type },
        });
      }
      redirect(303, session.url);
    } catch (erreur) {
      if (erreur instanceof Response) throw erreur;
      logErreur("reserver.payer", erreur, { ref, slug });
      return fail(502, { message: "Paiement momentanément indisponible." });
    }
  },
} satisfies Actions;
