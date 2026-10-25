import type { EtatBox, RuntimeBox } from "@/application/ports/runtime-box";

export interface BoxRuntimeConfig {
  baseUrl: string;
  token?: string;
  type?: "home_assistant" | "generic";
  statusPath?: string;
  commandPath?: string;
}

export type BoxesRuntimeConfig = Record<string, BoxRuntimeConfig>;

const TAILLE_MAX = 100_000;

function parserConfig(valeur?: string): BoxesRuntimeConfig {
  if (!valeur?.trim()) {
    throw new Error(
      "Runtime box non configuré : renseignez BOX_RUNTIME_CONFIG.",
    );
  }
  let config: unknown;
  try {
    config = JSON.parse(valeur);
  } catch {
    throw new Error("BOX_RUNTIME_CONFIG n’est pas un JSON valide.");
  }
  if (typeof config !== "object" || config === null) {
    throw new Error("BOX_RUNTIME_CONFIG doit être un objet.");
  }
  return config as BoxesRuntimeConfig;
}

function configBox(
  config: BoxesRuntimeConfig,
  boxId: string,
): BoxRuntimeConfig {
  const box = config[boxId];
  if (!box?.baseUrl) {
    throw new Error(`Box inconnue ou sans baseUrl : ${boxId}.`);
  }
  const url = new URL(box.baseUrl);
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("BOX_RUNTIME_CONFIG : baseUrl doit être HTTP(S).");
  }
  return box;
}

function entetes(box: BoxRuntimeConfig): HeadersInit {
  return {
    Accept: "application/json,text/plain",
    ...(box.token ? { Authorization: `Bearer ${box.token}` } : {}),
  };
}

async function lireJson(reponse: Response): Promise<Record<string, unknown>> {
  const texte = await reponse.text();
  if (texte.length > TAILLE_MAX) return {};
  try {
    const valeur = JSON.parse(texte) as unknown;
    return typeof valeur === "object" && valeur !== null
      ? (valeur as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function creerRuntimeBox(valeurConfig?: string): RuntimeBox {
  let config: BoxesRuntimeConfig | null = null;

  function charger(): BoxesRuntimeConfig {
    config ??= parserConfig(valeurConfig);
    return config;
  }

  return {
    async etat(boxId: string): Promise<EtatBox> {
      const box = configBox(charger(), boxId);
      const chemin =
        box.statusPath ?? (box.type === "home_assistant" ? "/api/" : "/health");
      const url = new URL(chemin, box.baseUrl);

      try {
        const reponse = await fetch(url, {
          headers: entetes(box),
          signal: AbortSignal.timeout(5_000),
        });
        const corps = await lireJson(reponse);
        return {
          boxId,
          enLigne: reponse.ok,
          derniereVue: reponse.ok ? new Date() : null,
          version:
            typeof corps.version === "string" ? corps.version : undefined,
        };
      } catch {
        return {
          boxId,
          enLigne: false,
          derniereVue: null,
        };
      }
    },

    async executer(
      boxId: string,
      commande: string,
      payload: Record<string, unknown>,
    ): Promise<void> {
      const box = configBox(charger(), boxId);
      let chemin = box.commandPath ?? "/api/commands";
      let corps: Record<string, unknown> = { commande, payload };

      if (box.type === "home_assistant" && !box.commandPath) {
        const [domaine, service] = commande.split(".");
        if (!domaine || !service) {
          throw new Error(
            "Commande Home Assistant attendue au format domaine.service.",
          );
        }
        chemin = `/api/services/${encodeURIComponent(domaine)}/${encodeURIComponent(service)}`;
        corps = payload;
      }

      const reponse = await fetch(new URL(chemin, box.baseUrl), {
        method: "POST",
        headers: {
          ...entetes(box),
          "Content-Type": "application/json",
        },
        body: JSON.stringify(corps),
        signal: AbortSignal.timeout(10_000),
      });

      if (!reponse.ok) {
        throw new Error(
          `Runtime box ${boxId} : HTTP ${reponse.status} sur ${commande}.`,
        );
      }
    },
  };
}
