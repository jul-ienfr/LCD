import type { Facture } from "@/domain/facture";
import { genererFacturXXml } from "@/domain/factur-x";
import { resteAPayer, totalPaiements } from "@/domain/paiement";
import { ObtenirParametresFiscaux } from "@/application/use-cases/parametres-fiscaux";
import { DrizzleFactureRepository } from "@/infrastructure/db/repositories/facture-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzlePaiementRepository } from "@/infrastructure/db/repositories/paiement-repository";
import { DrizzleParametresFiscauxRepository } from "@/infrastructure/db/repositories/parametres-fiscaux-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { genererPdfFacture } from "./pdf-facture";

export interface DocumentFacture {
  facture: Facture;
  pdf: Uint8Array;
}

/**
 * Compose le PDF Factur-X d'une facture (mêmes données que la page publique
 * et l'envoi email) : source unique pour éviter toute divergence.
 */
export async function chargerDocumentFacture(
  tenantId: string,
  factureId: string,
): Promise<DocumentFacture | null> {
  const facture = await new DrizzleFactureRepository().trouver(
    tenantId,
    factureId,
  );
  if (!facture) return null;

  const [logement, tenant, fiscal, paiements] = await Promise.all([
    new DrizzleLogementRepository().trouverParId(
      tenantId,
      facture.logementId,
    ),
    new DrizzleTenantRepository().trouver(tenantId),
    new ObtenirParametresFiscaux(
      new DrizzleParametresFiscauxRepository(),
    ).executer(tenantId),
    new DrizzlePaiementRepository().listerParFacture(tenantId, factureId),
  ]);

  const xml = genererFacturXXml(facture, {
    vendeurNom: tenant?.nom ?? "LCD Parc",
    vendeurAdresse: tenant?.adresse ?? logement?.adresse ?? null,
    vendeurSiren: tenant?.siren ?? null,
    tauxTvaBp: fiscal.tauxTvaBp,
    mentionsLegales: fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
  });

  const pdf = await genererPdfFacture(facture, {
    vendeurNom: tenant?.nom ?? "LCD Parc",
    vendeurAdresse: tenant?.adresse ?? logement?.adresse ?? null,
    vendeurSiren: tenant?.siren ?? null,
    logementNom: logement?.nom ?? null,
    xmlFacturX: xml,
    montantPayeCentimes: totalPaiements(paiements),
    resteCentimes:
      facture.statut === "payee"
        ? 0
        : resteAPayer(facture.montantTtcCentimes, paiements),
    mentionsLegales: fiscal.mentionsLegales ?? tenant?.mentionsLegales ?? null,
  });

  return { facture, pdf };
}
