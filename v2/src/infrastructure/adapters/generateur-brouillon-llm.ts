import type {
  BrouillonGenere,
  GenerateurBrouillon,
  RequeteBrouillon,
} from "@/application/ports/generateur-brouillon";
import type { LlmProvider } from "@/application/ports/llm";
import {
  COUT_ESTIME_CENTIMES,
  MODELES,
} from "@/domain/assistant";

const SYSTEME =
  "Tu rédiges des messages courts et fiables pour une conciergerie de location courte durée. Respecte strictement les contraintes de l’invite.";

export class GenerateurBrouillonLlm implements GenerateurBrouillon {
  constructor(
    private readonly llm: LlmProvider,
    private readonly modelePremium?: string,
  ) {}

  async generer(requete: RequeteBrouillon): Promise<BrouillonGenere> {
    const modele =
      requete.niveau === "premium" ? this.modelePremium : undefined;
    const reponse = await this.llm.completer(
      [
        { role: "system", content: SYSTEME },
        { role: "user", content: requete.invite },
      ],
      { maxTokens: 300, modele },
    );
    return {
      texte: reponse.texte.trim(),
      modele: reponse.modele.trim() || MODELES[requete.niveau],
      coutEstimeCentimes: COUT_ESTIME_CENTIMES[requete.niveau],
    };
  }
}

/** Repli local si le fournisseur est indisponible : la page reste utilisable. */
export class GenerateurBrouillonAvecRepli implements GenerateurBrouillon {
  constructor(
    private readonly principal: GenerateurBrouillon,
    private readonly repli: GenerateurBrouillon,
  ) {}

  async generer(requete: RequeteBrouillon): Promise<BrouillonGenere> {
    try {
      return await this.principal.generer(requete);
    } catch {
      return this.repli.generer(requete);
    }
  }
}
