import type { CanalFil } from "@/domain/fil-voyageur";

export interface EnvoyerViaCanalInput {
  canal: Extract<CanalFil, "email" | "sms" | "whatsapp" | "ota">;
  destinataire: string;
  sujet?: string | null;
  contenu: string;
  /** Clé d'idempotence transmise au fournisseur quand il la supporte. */
  ref: string;
  expediteur?: string | null;
}

export interface EnvoiCanal {
  /** Identifiant chez le fournisseur, pour rapprocher les statuts. */
  externalId: string | null;
  statut: string;
}

/**
 * Port d'envoi d'un message voyageur vers un canal externe.
 * Les connecteurs réels (e-mail, SMS, OTA, WhatsApp) vivent dans
 * `src/infrastructure/adapters/` et sont injectés ici.
 */
export interface CanalMessagePort {
  envoyer(input: EnvoyerViaCanalInput): Promise<EnvoiCanal>;
}
