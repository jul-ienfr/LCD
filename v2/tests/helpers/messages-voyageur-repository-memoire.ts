import type {
  CreerMessageData,
  MessagesVoyageurRepository,
} from "@/application/ports/messages-voyageur-repository";
import type { MessageVoyageur } from "@/domain/message-voyageur";

export class MessagesVoyageurRepositoryMemoire
  implements MessagesVoyageurRepository
{
  items: MessageVoyageur[] = [];

  async creer(data: CreerMessageData): Promise<MessageVoyageur> {
    const message: MessageVoyageur = {
      id: crypto.randomUUID(),
      ...data,
      statut: "brouillon",
      envoyeAt: null,
      createdAt: new Date(),
    };
    this.items.push(message);
    return message;
  }
  async trouverParRef(tenantId: string, ref: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.ref === ref) ?? null
    );
  }
  async trouverParId(tenantId: string, id: string) {
    return (
      this.items.find((m) => m.tenantId === tenantId && m.id === id) ?? null
    );
  }
  async listerParLogement(tenantId: string, logementId: string) {
    return this.items.filter(
      (m) => m.tenantId === tenantId && m.logementId === logementId,
    );
  }
  async marquerEnvoye(tenantId: string, id: string): Promise<MessageVoyageur> {
    const message = await this.trouverParId(tenantId, id);
    if (!message) throw new Error("introuvable");
    message.statut = "envoye";
    message.envoyeAt = new Date();
    return message;
  }
}
