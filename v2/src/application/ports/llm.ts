export interface LlmMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface LlmReponse {
  texte: string;
  modele: string;
  tokensEntree?: number;
  tokensSortie?: number;
}

/**
 * Port LLM. Implémentations : OpenAI, Anthropic, Mistral, modèle local.
 * Aucune clé ni SDK fournisseur ne doit sortir de l'infrastructure.
 */
export interface LlmProvider {
  completer(
    messages: LlmMessage[],
    options?: { maxTokens?: number; modele?: string },
  ): Promise<LlmReponse>;
}
