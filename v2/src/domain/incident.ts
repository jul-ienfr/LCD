export type IncidentId = string;
export type StatutIncident = "ouvert" | "en_cours" | "resolu" | "annule";

export interface Incident {
  id: IncidentId;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  message: string;
  statut: StatutIncident;
  createdAt: Date;
}

export function messageIncidentValide(message: string): boolean {
  const m = message.trim();
  return m.length >= 5 && m.length <= 2000;
}

export function refIncidentValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{8,64}$/.test(ref);
}
