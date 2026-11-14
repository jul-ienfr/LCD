import type { LanguePublique } from "@/domain/page-publique";
import type { FilsVoyageurRepository } from "../ports/fils-voyageur-repository";
import type { Traducteur } from "../ports/traducteur";
import {
  langueTraductionValide,
  normaliserLangue,
  TRADUCTION_CARACTERES_MAX,
} from "@/domain/traduction";
import { ErreurMetier } from "@/domain/erreurs";

export interface ResultatTraductionFil {
  messageId: string | null;
  texte: string;
  modele: string;
  langueSource: LanguePublique;
  langueCible: LanguePublique;
}

export interface TraduireMessageInput {
  tenantId: string;
  filId: string;
  messageId: string;
  vers: string;
}

export interface TraduireBrouillonInput {
  tenantId: string;
  filId: string;
  texte: string;
  de: string;
  vers?: string;
}

/**
 * Traduction à la demande dans un fil : entrante vers la langue du staff,
 * sortante (brouillon non envoyé) vers la langue du voyageur. Rien n'est
 * persisté ni envoyé : l'humain relit et copie.
 */
export class TraduireMessageFil {
  constructor(
    private readonly fils: FilsVoyageurRepository,
    private readonly traducteur: Traducteur,
  ) {}

  async executerMessage(
    input: TraduireMessageInput,
  ): Promise<ResultatTraductionFil> {
    if (!langueTraductionValide(input.vers)) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "La langue cible est invalide.",
      );
    }
    const fil = await this.fils.trouverParId(input.tenantId, input.filId);
    if (!fil) {
      throw new ErreurMetier("FIL_INTROUVABLE", "Le fil est introuvable.");
    }
    const message = await this.fils.trouverMessageParId(
      input.tenantId,
      input.messageId,
    );
    if (!message || message.filId !== fil.id) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "Le message est introuvable dans ce fil.",
      );
    }
    const source = normaliserLangue(fil.langue);
    if (source === input.vers) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "Le message est déjà dans la langue demandée.",
      );
    }
    const traduction = await this.traducteur.traduire({
      texte: message.contenu,
      de: source,
      vers: input.vers,
    });
    return {
      messageId: message.id,
      texte: traduction.texte,
      modele: traduction.modele,
      langueSource: source,
      langueCible: input.vers,
    };
  }

  async executerBrouillon(
    input: TraduireBrouillonInput,
  ): Promise<ResultatTraductionFil> {
    if (!langueTraductionValide(input.de)) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "La langue source est invalide.",
      );
    }
    const texte = input.texte.trim();
    if (!texte) {
      throw new ErreurMetier("TRADUCTION_INVALIDE", "Le texte est vide.");
    }
    if (texte.length > TRADUCTION_CARACTERES_MAX) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        `Le texte est limité à ${TRADUCTION_CARACTERES_MAX} caractères.`,
      );
    }
    const fil = await this.fils.trouverParId(input.tenantId, input.filId);
    if (!fil) {
      throw new ErreurMetier("FIL_INTROUVABLE", "Le fil est introuvable.");
    }
    const cible = input.vers
      ? langueTraductionValide(input.vers)
        ? input.vers
        : null
      : normaliserLangue(fil.langue);
    if (!cible) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "La langue cible est invalide.",
      );
    }
    if (cible === input.de) {
      throw new ErreurMetier(
        "TRADUCTION_INVALIDE",
        "Le texte est déjà dans la langue demandée.",
      );
    }
    const traduction = await this.traducteur.traduire({
      texte,
      de: input.de,
      vers: cible,
    });
    return {
      messageId: null,
      texte: traduction.texte,
      modele: traduction.modele,
      langueSource: input.de,
      langueCible: cible,
    };
  }
}
