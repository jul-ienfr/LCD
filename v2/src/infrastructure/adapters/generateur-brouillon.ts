import type { GenerateurBrouillon } from "@/application/ports/generateur-brouillon";
import { env } from "@/lib/env";
import { GenerateurBrouillonLocal } from "./generateur-brouillon-local";
import {
  GenerateurBrouillonAvecRepli,
  GenerateurBrouillonLlm,
} from "./generateur-brouillon-llm";
import { creerLlmProvider, llmConfigured } from "./llm-provider";

export function creerGenerateurBrouillon(options?: {
  modeleStandard?: string;
  modelePremium?: string;
}): GenerateurBrouillon {
  const local = new GenerateurBrouillonLocal();
  if (!llmConfigured()) return local;

  return new GenerateurBrouillonAvecRepli(
    new GenerateurBrouillonLlm(
      creerLlmProvider(),
      options?.modelePremium || env.LLM_MODEL_PREMIUM,
      options?.modeleStandard || undefined,
    ),
    local,
  );
}
