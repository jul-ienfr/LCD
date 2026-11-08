import { fail, isRedirect, redirect } from "@sveltejs/kit";
import {
  INTENTIONS_ASSISTANT,
  LIBELLES_INTENTION,
  LIBELLES_TON,
  TONS_ASSISTANT,
  routerModele,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import {
  enregistrerConfigurationAssistant,
  lireConfigurationAssistant,
} from "@/application/use-cases/configuration-assistant";
import { llmConfigured } from "@/infrastructure/adapters/llm-provider";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { requireSuperAdmin, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function hoteUrl(url: string | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).host;
  } catch {
    return "URL invalide";
  }
}

export const load: PageServerLoad = async (event) => {
  const session = requireSuperAdmin(event);
  const configuration = await lireConfigurationAssistant(
    new DrizzleParametresSiteRepository(),
  );
  const configure = llmConfigured();
  const modeleStandardEffectif =
    configuration.modeleStandard || env.LLM_MODEL;
  const modelePremiumEffectif =
    configuration.modelePremium || env.LLM_MODEL_PREMIUM || env.LLM_MODEL;

  return {
    email: session.user.email ?? null,
    configuration,
    fournisseur: {
      configure,
      hote: hoteUrl(env.LLM_API_URL),
      modeleEnv: env.LLM_MODEL,
      modelePremiumEnv: env.LLM_MODEL_PREMIUM ?? null,
      modeleStandardEffectif,
      modelePremiumEffectif,
    },
    routage: INTENTIONS_ASSISTANT.flatMap((intention) =>
      TONS_ASSISTANT.map((ton) => {
        const routage = routerModele(intention, ton);
        return {
          intention,
          intentionLibelle: LIBELLES_INTENTION[intention],
          ton,
          tonLibelle: LIBELLES_TON[ton],
          niveau: routage.niveau,
          modele: routage.modele,
          modeleEffectif: configure
            ? routage.niveau === "premium"
              ? modelePremiumEffectif
              : modeleStandardEffectif
            : "local",
          raison: routage.raison,
          cout: routage.coutEstimeCentimes,
        };
      }),
    ),
    ok: event.url.searchParams.get("ok"),
  };
};

export const actions = {
  configurer: async (event) => {
    const session = requireSuperAdmin(event);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    try {
      const configuration = await enregistrerConfigurationAssistant(
        new DrizzleParametresSiteRepository(),
        {
          actif: donnees.get("actif") === "on",
          modeleStandard: String(donnees.get("modeleStandard") ?? ""),
          modelePremium: String(donnees.get("modelePremium") ?? ""),
        },
      );
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email ?? "super-admin",
          action: "assistant.configurer",
          cible: "assistant",
          ref: "assistant.config",
          payload: {
            actif: configuration.actif,
            modeleStandard: configuration.modeleStandard || null,
            modelePremium: configuration.modelePremium || null,
          },
        }),
      );
      redirect(303, "/supervision/assistant?ok=config");
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        return fail(400, { ok: false, message: error.message });
      }
      logErreur("supervision.assistant.configurer", error);
      return fail(500, {
        ok: false,
        message: "Erreur inattendue pendant l’enregistrement.",
      });
    }
  },
} satisfies Actions;
