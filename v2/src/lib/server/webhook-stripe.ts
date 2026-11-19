/**
 * Traitement métier d'un événement Stripe (spec 006, FR-024).
 *
 * Extrait de la route webhook pour être partagé avec le rejeu : la même
 * fonction traite la première livraison et une reprise. Elle est idempotente
 * de bout en bout (paiement dédupliqué par ref, échéance par statut).
 */

import { ErreurMetier } from "@/domain/erreurs";
import type { EvenementPaiement } from "@/application/ports/paiement";
import { TraiterPaiementStripe } from "@/application/use-cases/traiter-paiement-stripe";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleEcheancesPaiementRepository } from "@/infrastructure/db/repositories/echeances-paiement-repository";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { emettreEvenement } from "@/lib/evenements";

export interface ResultatTraitementStripe {
  /** false = événement volontairement ignoré (type non géré, doublon). */
  traite: boolean;
  /** Champs ajoutés à la réponse JSON du webhook. */
  reponse: Record<string, unknown>;
}

async function journaliserLitige(evenement: Extract<EvenementPaiement, { type: "litige" }>): Promise<void> {
  const tenantId = evenement.litige.metadata.tenant_id;
  if (!tenantId) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Litige Stripe sans tenant_id.",
    );
  }
  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: "stripe",
      action: "facture.litige_stripe",
      cible: evenement.litige.metadata.facture_id ?? evenement.litige.id,
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
}

export async function traiterEvenementStripe(
  evenement: EvenementPaiement,
): Promise<ResultatTraitementStripe> {
  if (evenement.type === "litige") {
    await journaliserLitige(evenement);
    return { traite: true, reponse: { litige: true } };
  }
  if (evenement.type !== "paiement_reussi") {
    return { traite: false, reponse: { ignored: true } };
  }

  const tenantId = evenement.metadata.tenant_id;
  if (!tenantId) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      "Webhook Stripe sans tenant_id.",
    );
  }

  const resultat = await new TraiterPaiementStripe(
    new DrizzlePaiementRepository(),
    new DrizzleFactureRepository(),
    // Sans ce dépôt, un paiement d'échéance de réservation échoue en
    // « Échéancier indisponible » et l'encaissement est perdu en silence.
    new DrizzleEcheancesPaiementRepository(),
  ).executer(evenement);

  if (resultat.ignore) {
    return { traite: false, reponse: { ignored: true } };
  }

  await withTenant(tenantId, (tx) =>
    tx.insert(auditLogs).values({
      tenantId,
      qui: "stripe",
      action: "paiement.stripe",
      cible: resultat.paiement.id,
      ref: evenement.sessionId,
      payload: {
        factureId: evenement.metadata.facture_id ?? null,
        echeanceId: evenement.metadata.echeance_id ?? null,
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

  return { traite: true, reponse: { ignored: false } };
}
