import type { LlmProvider } from "@/application/ports/llm";
import type { DemandeTraduction, Traducteur, Traduction } from "@/application/ports/traducteur";
import { construireInviteTraduction, verifierTraduction } from "@/domain/traduction";
import { ErreurMetier } from "@/domain/erreurs";

const SYSTEME =
  "Tu es un traducteur professionnel pour une conciergerie de location courte durée. Tu ne modifies jamais le sens du message.";

export class TraducteurLlm implements Traducteur {
  constructor(private readonly llm: LlmProvider) {}

  async traduire(demande: DemandeTraduction): Promise<Traduction> {
    const invite = construireInviteTraduction(demande);
    const reponse = await this.llm.completer(
      [
        { role: "system", content: SYSTEME },
        { role: "user", content: invite },
      ],
      { maxTokens: 1_200 },
    );
    const texte = reponse.texte.trim();
    const alertes = verifierTraduction(texte);
    if (alertes.length > 0) {
      throw new ErreurMetier("TRADUCTION_INVALIDE", alertes[0]!);
    }
    return {
      texte,
      modele: reponse.modele.trim() || "llm",
    };
  }
}
