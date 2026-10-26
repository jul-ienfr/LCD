import type {
  ConsommationsAssistantRepository,
  EnregistrerConsommationData,
} from "@/application/ports/consommations-assistant-repository";
import type { ConsommationMois } from "@/domain/assistant";

export class ConsommationsAssistantRepositoryMemoire
  implements ConsommationsAssistantRepository
{
  items: EnregistrerConsommationData[] = [];
  force: ConsommationMois | null = null;

  async enregistrer(data: EnregistrerConsommationData): Promise<void> {
    if (this.items.some((item) => item.messageId === data.messageId)) return;
    this.items.push(data);
  }

  async totalMois(): Promise<ConsommationMois> {
    if (this.force) return this.force;
    return {
      nombre: this.items.length,
      coutCentimes: this.items.reduce(
        (total, item) => total + item.coutCentimes,
        0,
      ),
    };
  }
}
