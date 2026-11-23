import {
  referentielParDefaut,
  validerReferentiel,
  type PieceReferentiel,
} from "@/domain/menage";
import type { MenageReferentielRepository } from "../ports/menage-referentiel-repository";

export interface ReferentielMenageLu {
  pieces: PieceReferentiel[];
  /** `false` tant que rien n'a été enregistré : c'est alors le modèle. */
  personnalise: boolean;
}

/**
 * Référentiel de checklist d'un logement (FR-035). Lire un logement jamais
 * configuré rend le modèle LCD Parc — la page montre alors d'où vient la
 * checklist et l'enregistrement la fige pour ce logement.
 */
export class ConfigurerReferentielMenage {
  constructor(private readonly referentiels: MenageReferentielRepository) {}

  async lister(
    tenantId: string,
    logementId: string,
  ): Promise<ReferentielMenageLu> {
    const enregistre = await this.referentiels.listerParLogement(
      tenantId,
      logementId,
    );
    return enregistre.length > 0
      ? { pieces: enregistre, personnalise: true }
      : { pieces: referentielParDefaut(), personnalise: false };
  }

  async enregistrer(
    tenantId: string,
    logementId: string,
    pieces: readonly { piece: string; taches: readonly string[] }[],
  ): Promise<PieceReferentiel[]> {
    const valide = validerReferentiel(pieces);
    await this.referentiels.remplacer(tenantId, logementId, valide);
    return valide;
  }

  /** Efface la version du logement : il repart du modèle par défaut. */
  async reinitialiser(
    tenantId: string,
    logementId: string,
  ): Promise<PieceReferentiel[]> {
    await this.referentiels.remplacer(tenantId, logementId, []);
    return referentielParDefaut();
  }
}
