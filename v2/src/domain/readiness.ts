export interface EtatSchema {
  cautions?: string | null;
  webhooks?: string | null;
  webhookDeliveries?: string | null;
  commissionBp?: boolean;
  tenantNature?: boolean;
  mandatMode?: boolean;
  migrations?: number;
  migrationsTable?: string | null;
}

export interface EtatRole {
  utilisateur?: string;
  superutilisateur?: boolean;
  bypassRls?: boolean;
  proprietaireTables?: boolean;
}

/**
 * Le RLS n'est réellement appliqué que si la connexion n'est ni superuser,
 * ni BYPASSRLS, ni propriétaire des tables (un owner contourne les policies).
 */
export function rlsEffective(etat: EtatRole | undefined): boolean {
  return Boolean(
    etat?.utilisateur &&
      !etat.superutilisateur &&
      !etat.bypassRls &&
      !etat.proprietaireTables,
  );
}

/**
 * Liste les migrations minimales manquantes pour servir l'application.
 * Le compteur du journal Drizzle détecte aussi les migrations récentes non
 * appliquées, sans maintenir une liste de tables à chaque brique.
 */
export function manquantsSchema(
  etat: EtatSchema | undefined,
  migrationsAttendues = 0,
): string[] {
  const manquants: string[] = [];
  if (!etat?.cautions) manquants.push("cautions");
  if (!etat?.webhooks) manquants.push("webhooks");
  if (!etat?.webhookDeliveries) manquants.push("webhook_deliveries");
  if (!etat?.commissionBp) {
    manquants.push("logement_proprietaires.commission_bp");
  }
  if (!etat?.tenantNature) manquants.push("tenants.nature");
  if (!etat?.mandatMode) manquants.push("logement_proprietaires.mode");
  if (
    migrationsAttendues > 0 &&
    (etat?.migrations ?? 0) < migrationsAttendues
  ) {
    manquants.push(`migrations.${migrationsAttendues}`);
  }
  return manquants;
}
