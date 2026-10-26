import type { ConsommationMois } from "@/domain/assistant";

export interface ConsommationAssistant {
  id: string;
  tenantId: string;
  messageId: string;
  modele: string;
  coutCentimes: number;
  createdAt: Date;
}

export interface EnregistrerConsommationData {
  tenantId: string;
  messageId: string;
  modele: string;
  coutCentimes: number;
}

export interface ConsommationsAssistantRepository {
  enregistrer(data: EnregistrerConsommationData): Promise<void>;
  totalMois(tenantId: string, depuis: Date): Promise<ConsommationMois>;
}
