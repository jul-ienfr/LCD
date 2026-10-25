export const EVENEMENTS_WEBHOOK = [
  "reservation.created",
  "paiement.created",
  "mission.status",
  "ticket.created",
] as const;

export type TypeEvenementWebhook = (typeof EVENEMENTS_WEBHOOK)[number];

export const LIBELLES_EVENEMENT_WEBHOOK: Record<
  TypeEvenementWebhook,
  string
> = {
  "reservation.created": "Réservation créée",
  "paiement.created": "Paiement reçu",
  "mission.status": "Mission changée",
  "ticket.created": "Ticket créé",
};

export type StatutLivraisonWebhook =
  | "pending"
  | "success"
  | "failed";

export interface Webhook {
  id: string;
  tenantId: string;
  libelle: string;
  url: string;
  secret: string;
  events: TypeEvenementWebhook[];
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookDelivery {
  id: string;
  tenantId: string;
  webhookId: string;
  eventType: TypeEvenementWebhook;
  payload: Record<string, unknown>;
  statut: StatutLivraisonWebhook;
  tentatives: number;
  prochaineTentative: Date;
  dernierCode: number | null;
  dernierMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export function evenementWebhookValide(
  type: string,
): type is TypeEvenementWebhook {
  return (EVENEMENTS_WEBHOOK as readonly string[]).includes(type);
}

export function urlWebhookValide(url: string): boolean {
  if (!url || url.length > 2_000) return false;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  if (parsed.protocol !== "https:") return false;
  if (parsed.username || parsed.password) return false;
  const host = parsed.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host === "0.0.0.0" ||
    host === "[::1]" ||
    host.endsWith(".local")
  ) {
    return false;
  }
  if (
    host.startsWith("127.") ||
    host.startsWith("10.") ||
    host.startsWith("192.168.") ||
    host.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(host)
  ) {
    return false;
  }
  return host.includes(".");
}

export function secretWebhookValide(secret: string): boolean {
  return secret.trim().length >= 16 && secret.length <= 200;
}

export function libelleWebhookValide(libelle: string): boolean {
  const valeur = libelle.trim();
  return valeur.length >= 2 && valeur.length <= 60;
}
