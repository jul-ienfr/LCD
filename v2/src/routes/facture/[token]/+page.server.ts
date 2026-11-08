import { isRedirect, redirect } from "@sveltejs/kit";
import { CreerSessionPaiement } from "@/application/use-cases/creer-session-paiement";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { ErreurMetier } from "@/domain/erreurs";
import { mediateurDepuisEnv, mentionMediation } from "@/domain/mediation";
import { LIBELLES_MODE_PAIEMENT, resteAPayer, totalPaiements } from "@/domain/paiement";
import { creerPaiementStripe } from "@/infrastructure/adapters/paiement-stripe";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { env } from "@/lib/env";
import { verifierTokenFacture } from "@/lib/facture-token";
import { logErreur } from "@/lib/logger";
import type { Actions, PageServerLoad } from "./$types";

const LIBELLES_STATUT = {
  brouillon: "Brouillon",
  emise: "À régler",
  payee: "Payée",
  annulee: "Annulée",
} as const;

export const load: PageServerLoad = async ({ params }) => {
  const payload = verifierTokenFacture(params.token);
  if (!payload) return { indisponible: "invalide" as const };

  const facture = await new DrizzleFactureRepository().trouver(
    payload.tenantId,
    payload.factureId,
  );
  if (!facture || (facture.statut !== "emise" && facture.statut !== "payee")) {
    return { indisponible: "facture" as const };
  }

  const [logement, tenant, fiscal, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      payload.tenantId,
      facture.logementId,
    ),
    new DrizzleTenantRepository().trouver(payload.tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(payload.tenantId),
    new DrizzlePaiementRepository().listerParFacture(
      payload.tenantId,
      facture.id,
    ),
  ]);

  const totalPaye = totalPaiements(paiements);
  const reste =
    facture.statut === "payee"
      ? 0
      : resteAPayer(facture.montantTtcCentimes, paiements);

  return {
    indisponible: null,
    token: params.token,
    facture: {
      id: facture.id,
      numero: facture.numero,
      statut: facture.statut,
      statutLibelle: LIBELLES_STATUT[facture.statut],
      dateEmission: facture.dateEmission,
      echeance: facture.echeance,
      clientNom: facture.clientNom,
      clientEmail: facture.clientEmail,
      montantHtCentimes: facture.montantHtCentimes,
      tvaCentimes: facture.tvaCentimes,
      taxeSejourCentimes: facture.taxeSejourCentimes,
      montantTtcCentimes: facture.montantTtcCentimes,
      lignes: facture.lignes.map((ligne) => ({
        id: ligne.id,
        designation: ligne.designation,
        quantite: ligne.quantite,
        prixUnitaireCentimes: ligne.prixUnitaireCentimes,
        totalCentimes: ligne.totalCentimes,
      })),
    },
    tenant: {
      nom: tenant?.nom ?? "LCD Parc",
      siren: tenant?.siren ?? null,
      adresse: tenant?.adresse ?? logement?.adresse ?? null,
      mentionsLegales: fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
      mediation: mentionMediation(
        mediateurDepuisEnv({
          nom: env.MEDIATEUR_NOM,
          url: env.MEDIATEUR_URL,
          adresse: env.MEDIATEUR_ADRESSE,
        }),
      ),
    },
    paiements: paiements.map((paiement) => ({
      id: paiement.id,
      date: paiement.datePaiement,
      mode: LIBELLES_MODE_PAIEMENT[paiement.mode],
      reference: paiement.reference,
      montantCentimes: paiement.montantCentimes,
    })),
    totalPaye,
    reste,
    stripeConfigured: Boolean(
      env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET,
    ),
  };
};

export const actions = {
  payer: async ({ params }) => {
    const payload = verifierTokenFacture(params.token);
    if (!payload) redirect(303, "/");

    const baseUrl = env.APP_URL.replace(/\/$/, "");
    const retour = `${baseUrl}/facture/${encodeURIComponent(params.token)}`;
    try {
      const resultat = await new CreerSessionPaiement(
        new DrizzleFactureRepository(),
        new DrizzlePaiementRepository(),
        creerPaiementStripe(),
      ).executer({
        tenantId: payload.tenantId,
        factureId: payload.factureId,
        successUrl: `${retour}?paiement=ok`,
        cancelUrl: `${retour}?paiement=annule`,
      });
      redirect(303, resultat.session.url);
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (!(error instanceof ErreurMetier)) {
        logErreur("facture.payer", error, { tenantId: payload.tenantId });
      }
      redirect(303, `${retour}?paiement=erreur`);
    }
  },
} satisfies Actions;
