/**
 * US7 (T701) — Ports des clés API et des intégrations partenaires.
 *
 * Les implémentations Drizzle vivent dans
 * `infrastructure/db/repositories/cles-api-repository.ts` et
 * `integrations-repository.ts`.
 *
 * `ClesApiRepository.trouverParHash` est volontairement cross-tenant : la clé
 * est présentée avant que le tenant ne soit connu. La migration 0099 expose une
 * fonction `api_cle_par_hash` (SECURITY DEFINER) pour cette seule lecture ;
 * toutes les autres méthodes passent par `withTenant`.
 */
import type { CleApi, ScopeApi } from "@/domain/cle-api";

export interface ClesApiRepository {
  /** Persiste une clé déjà générée (le hash est unique globalement). */
  creer(
    tenantId: string,
    data: {
      nom: string;
      prefixe: string;
      hash: string;
      scopes: ScopeApi[];
      expireLe?: string | null;
    },
  ): Promise<CleApi>;

  /** Retrouve la clé par empreinte, sans contexte tenant (auth API). */
  trouverParHash(hash: string): Promise<CleApi | null>;

  trouverParId(tenantId: string, id: string): Promise<CleApi | null>;

  listerParTenant(tenantId: string): Promise<CleApi[]>;

  /** Trace le dernier usage sans échouer l'appel API. */
  marquerUsage(
    tenantId: string,
    id: string,
    quand?: string,
  ): Promise<void>;

  /** Révocation idempotente ; retourne null si la clé n'existe pas. */
  revoquer(tenantId: string, id: string, quand?: string): Promise<CleApi | null>;
}

/** Fournisseurs d'intégration prévus par l'US7. */
export const FOURNISSEURS_INTEGRATION = [
  "nuki",
  "duve",
  "touchstay",
  "swikly",
  "zapier",
] as const;

export type FournisseurIntegration = (typeof FOURNISSEURS_INTEGRATION)[number];

export const LIBELLES_FOURNISSEUR_INTEGRATION: Record<
  FournisseurIntegration,
  string
> = {
  nuki: "Nuki (serrure)",
  duve: "Duve (guide voyageur)",
  touchstay: "Touch Stay (guide voyageur)",
  swikly: "Swikly (caution)",
  zapier: "Zapier / Make",
};

export interface IntegrationTenant {
  id: string;
  tenantId: string;
  fournisseur: FournisseurIntegration;
  actif: boolean;
  /** Réglages non secrets ; les tokens restent en variables d'environnement. */
  config: Record<string, unknown>;
  creeLe: string;
  majLe: string;
}

export interface IntegrationsRepository {
  lister(tenantId: string): Promise<IntegrationTenant[]>;
  trouver(
    tenantId: string,
    fournisseur: FournisseurIntegration,
  ): Promise<IntegrationTenant | null>;
  /** Upsert idempotent par (tenant, fournisseur). */
  enregistrer(
    tenantId: string,
    fournisseur: FournisseurIntegration,
    data: { actif: boolean; config: Record<string, unknown> },
  ): Promise<IntegrationTenant>;
  supprimer(
    tenantId: string,
    fournisseur: FournisseurIntegration,
  ): Promise<void>;
}

/** Valide un nom de fournisseur reçu d'un formulaire. */
export function fournisseurIntegrationValide(
  valeur: string,
): valeur is FournisseurIntegration {
  return (FOURNISSEURS_INTEGRATION as readonly string[]).includes(valeur);
}
