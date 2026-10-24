import type { LlmProvider } from "@/application/ports/llm";

/** Adapter LLM : la clé et le fournisseur restent côté serveur. */
export function creerLlmProvider(): LlmProvider {
  return {
    async completer() {
      throw new Error(
        "LLM non configuré : implémenter l'appel fournisseur dans cet adapter.",
      );
    },
  };
}
