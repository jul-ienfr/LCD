import {
  budgetAssistantAutorise,
  debutMois,
  intentionValide,
  refBrouillon,
  routerModele,
  tonValide,
  typeMessageDepuisIntention,
  verifierBrouillon,
  type IntentionAssistant,
  type TonAssistant,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import { canalValide, type MessageVoyageur } from "@/domain/message-voyageur";
import type { ConsommationsAssistantRepository } from "../ports/consommations-assistant-repository";
import type { MessagesVoyageurRepository } from "../ports/messages-voyageur-repository";
import type { PreparerMessageVoyageur } from "./message-voyageur";

export interface EnregistrerBrouillonInput {
  tenantId: string;
  logementId: string;
  intention: string;
  ton: string;
  canal: string;
  voyageur?: string;
  details?: string;
  texte: string;
}

export class EnregistrerBrouillonAssistant {
  constructor(
    private readonly preparer: PreparerMessageVoyageur,
    private readonly messages: MessagesVoyageurRepository,
    private readonly consommations: ConsommationsAssistantRepository,
  ) {}

  async executer(input: EnregistrerBrouillonInput): Promise<MessageVoyageur> {
    if (!intentionValide(input.intention)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "L’intention est invalide.");
    }
    if (!tonValide(input.ton)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "Le ton est invalide.");
    }
    if (!canalValide(input.canal)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "Le canal est invalide.");
    }
    const intention: IntentionAssistant = input.intention;
    const ton: TonAssistant = input.ton;
    const texte = input.texte.trim();
    const voyageur = (input.voyageur ?? "").trim();
    const details = (input.details ?? "").trim();

    if (!texte) {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Le brouillon est vide : rien à enregistrer.",
      );
    }
    const alertes = verifierBrouillon(texte);
    if (alertes.length > 0) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", alertes[0]!);
    }

    const ref = refBrouillon({
      logementId: input.logementId,
      intention,
      ton,
      canal: input.canal,
      voyageur,
      details,
      texte,
    });
    const existant = await this.messages.trouverParRef(input.tenantId, ref);
    if (existant) return existant;

    const routage = routerModele(intention, ton);
    const consomme = await this.consommations.totalMois(
      input.tenantId,
      debutMois(),
    );
    const verdict = budgetAssistantAutorise(
      consomme,
      routage.coutEstimeCentimes,
    );
    if (!verdict.autorise) {
      throw new ErreurMetier("ASSISTANT_QUOTA", verdict.raison);
    }

    const message = await this.preparer.executer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref,
      canal: input.canal,
      type: typeMessageDepuisIntention(intention),
      contenu: texte,
    });
    await this.consommations.enregistrer({
      tenantId: input.tenantId,
      messageId: message.id,
      modele: routage.modele,
      coutCentimes: routage.coutEstimeCentimes,
    });
    return message;
  }
}
