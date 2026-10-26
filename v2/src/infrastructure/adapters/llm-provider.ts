import type { LlmMessage, LlmProvider, LlmReponse } from "@/application/ports/llm";
import { env } from "@/lib/env";

interface ReponseChat {
  model?: string;
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

/**
 * Adapter LLM OpenAI-compatible (OpenAI, Mistral, Groq, Ollama, LM Studio…).
 * La clé reste côté serveur ; aucun SDK fournisseur n’entre dans le domaine.
 */
export function creerLlmProvider(): LlmProvider {
  return {
    async completer(
      messages: LlmMessage[],
      options?: { maxTokens?: number; modele?: string },
    ): Promise<LlmReponse> {
      if (!env.LLM_API_URL || !env.LLM_API_KEY) {
        throw new Error("LLM non configuré (LLM_API_URL / LLM_API_KEY).");
      }
      const modele = options?.modele ?? env.LLM_MODEL;
      const reponse = await fetch(env.LLM_API_URL, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${env.LLM_API_KEY}`,
        },
        body: JSON.stringify({
          model: modele,
          messages,
          max_tokens: options?.maxTokens ?? 300,
          temperature: 0.4,
        }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!reponse.ok) {
        throw new Error(`LLM : réponse HTTP ${reponse.status}.`);
      }
      const data = (await reponse.json()) as ReponseChat;
      const texte = data.choices?.[0]?.message?.content?.trim();
      if (!texte) {
        throw new Error("LLM : réponse vide.");
      }
      return {
        texte,
        modele: data.model?.trim() || modele,
        tokensEntree: data.usage?.prompt_tokens,
        tokensSortie: data.usage?.completion_tokens,
      };
    },
  };
}

export function llmConfigured(): boolean {
  return Boolean(env.LLM_API_URL && env.LLM_API_KEY);
}
