import type {
  EnregistrementCalendrier,
  PlanReconciliationIcs,
} from "@/domain/reconciliation-ics";

export interface InstantaneCalendrierIcs {
  enregistrements: EnregistrementCalendrier[];
}

export interface ImportIcsRepository {
  /** Toutes les réservations et blocages du logement, pour détecter les conflits. */
  instantane(
    tenantId: string,
    logementId: string,
  ): Promise<InstantaneCalendrierIcs>;
  /** Applique le plan dans une transaction unique. */
  appliquer(
    tenantId: string,
    logementId: string,
    fluxIcsId: string | null,
    plan: PlanReconciliationIcs,
  ): Promise<void>;
}
