import { ErreurMetier } from "@/domain/erreurs";
import { envoyerMessage, refMessageValide, validerMessage } from "@/domain/message-voyageur";
import type { MessagesVoyageurRepository } from "../ports/messages-voyageur-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface PreparerMessageInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  ref: string;
  canal: string;
  type: string;
  contenu: string;
}

export class PreparerMessageVoyageur {
  constructor(
    private readonly messages: MessagesVoyageurRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: PreparerMessageInput) {
    if (!refMessageValide(input.ref)) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "La référence est invalide.");
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Le logement est introuvable.");
    }
    const valeurs = validerMessage(input);

    const existant = await this.messages.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    return this.messages.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      ref: input.ref,
      ...valeurs,
    });
  }
}

export class EnvoyerMessageVoyageur {
  constructor(private readonly messages: MessagesVoyageurRepository) {}

  async executer(tenantId: string, id: string) {
    const message = await this.messages.trouverParId(tenantId, id);
    if (!message) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Le message est introuvable.");
    }
    envoyerMessage(message.statut);
    return this.messages.marquerEnvoye(tenantId, id);
  }
}
