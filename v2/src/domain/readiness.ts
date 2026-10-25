export interface EtatSchema {
  cautions: string | null;
  webhooks: string | null;
  webhookDeliveries: string | null;
  commissionBp: boolean;
  tenantNature: boolean;
  mandatMode: boolean;
}

/**
 * Liste les migrations minimales manquantes pour servir l'application.
 * Le schéma attendu correspond aux migrations 0026 à 0030.
 */
export function manquantsSchema(etat: EtatSchema | undefined): string[] {
  const manquants: string[] = [];
  if (!etat?.cautions) manquants.push("cautions");
  if (!etat?.webhooks) manquants.push("webhooks");
  if (!etat?.webhookDeliveries) manquants.push("webhook_deliveries");
  if (!etat?.commissionBp) {
    manquants.push("logement_proprietaires.commission_bp");
  }
  if (!etat?.tenantNature) manquants.push("tenants.nature");
  if (!etat?.mandatMode) manquants.push("logement_proprietaires.mode");
  return manquants;
}
