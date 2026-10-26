import {
  construireInvite,
  intentionValide,
  routerModele,
  tonValide,
  type IntentionAssistant,
  type Routage,
  type TonAssistant,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import type { GenerateurBrouillon } from "../ports/generateur-brouillon";
import type { LogementRepository } from "../ports/logement-repository";

export interface RedigerBrouillonInput {
  tenantId: string;
  logementId: string;
  intention: string;
  ton: string;
  voyageur?: string;
  details?: string;
}

export interface BrouillonAssistant {
  texte: string;
  modele: string;
  coutEstimeCentimes: number;
  routage: Routage;
  invite: string;
}

export class RedigerBrouillon {
  constructor(
    private readonly generateur: GenerateurBrouillon,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: RedigerBrouillonInput): Promise<BrouillonAssistant> {
    if (!intentionValide(input.intention)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "L’intention est invalide.");
    }
    if (!tonValide(input.ton)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "Le ton est invalide.");
    }
    const intention: IntentionAssistant = input.intention;
    const ton: TonAssistant = input.ton;

    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Le logement est introuvable.",
      );
    }

    const invite = construireInvite({
      intention,
      ton,
      logement: logement.nom,
      voyageur: input.voyageur ?? "",
      details: input.details ?? "",
    });
    const routage = routerModele(intention, ton);
    const brouillon = await this.generateur.generer({
      invite,
      intention,
      ton,
      niveau: routage.niveau,
      logement: logement.nom,
      voyageur: (input.voyageur ?? "").trim(),
      details: (input.details ?? "").trim(),
    });

    return {
      texte: brouillon.texte,
      modele: brouillon.modele,
      coutEstimeCentimes: brouillon.coutEstimeCentimes,
      routage,
      invite,
    };
  }
}
