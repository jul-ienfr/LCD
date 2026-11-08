import {
  canalFilValide,
  statutFilValide,
  validerMessageFil,
  validerSujetFil,
  type CanalFilInterne,
  type StatutFilInterne,
} from "@/domain/fil-interne";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  FilInterne,
  FilsInternesRepository,
  MessageFilInterne,
} from "../ports/fils-internes-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface CreerFilInput {
  tenantId: string;
  logementId: string | null;
  canal: string;
  sujet: string;
  auteurEmail: string;
}

export interface RepondreFilInput {
  tenantId: string;
  filId: string;
  corps: string;
  auteurEmail: string;
  auteurRole: string;
}

export class GererFilsInternes {
  constructor(
    private readonly fils: FilsInternesRepository,
    private readonly logements: LogementRepository,
  ) {}

  async creer(input: CreerFilInput): Promise<FilInterne> {
    if (!canalFilValide(input.canal)) {
      throw new ErreurMetier(
        "FIL_INTERNE_INVALIDE",
        "Le canal du fil est invalide.",
      );
    }
    const canal: CanalFilInterne = input.canal;
    const sujet = validerSujetFil(input.sujet);
    if (input.logementId) {
      const logement = await this.logements.trouverParId(
        input.tenantId,
        input.logementId,
      );
      if (!logement) {
        throw new ErreurMetier(
          "FIL_INTERNE_INVALIDE",
          "Le logement est introuvable.",
        );
      }
    }
    return this.fils.creer({
      tenantId: input.tenantId,
      logementId: input.logementId || null,
      canal,
      sujet,
      creePar: input.auteurEmail,
    });
  }

  async repondre(input: RepondreFilInput): Promise<MessageFilInterne> {
    const corps = validerMessageFil(input.corps);
    const message = await this.fils.ajouterMessage({
      tenantId: input.tenantId,
      filId: input.filId,
      auteurEmail: input.auteurEmail,
      auteurRole: input.auteurRole,
      corps,
    });
    if (!message) {
      throw new ErreurMetier(
        "FIL_INTERNE_INVALIDE",
        "Ce fil est introuvable ou fermé.",
      );
    }
    return message;
  }

  async changerStatut(
    tenantId: string,
    filId: string,
    statut: string,
  ): Promise<StatutFilInterne> {
    if (!statutFilValide(statut)) {
      throw new ErreurMetier(
        "FIL_INTERNE_INVALIDE",
        "Le statut du fil est invalide.",
      );
    }
    const change = await this.fils.changerStatut(tenantId, filId, statut);
    if (!change) {
      throw new ErreurMetier(
        "FIL_INTERNE_INVALIDE",
        "Ce fil est introuvable.",
      );
    }
    return statut;
  }
}
