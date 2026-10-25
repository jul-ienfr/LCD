import { randomUUID } from "node:crypto";
import { env } from "./env";
import { APP_VERSION } from "./version";

const CLES_SENSIBLES =
  /pass|secret|token|cookie|authorization|api[-_]?key|session/i;

export interface CibleSentry {
  endpoint: string;
  clePublique: string;
  projet: string;
}

/** Parse une DSN Sentry `https://<key>@<host>/<project>`. */
export function parserDsnSentry(dsn: string): CibleSentry | null {
  try {
    const parsed = new URL(dsn);
    const clePublique = decodeURIComponent(parsed.username);
    const projet =
      parsed.pathname.replace(/^\//, "").split("/").filter(Boolean).at(-1) ??
      "";
    if (!clePublique || !projet || !parsed.hostname) return null;
    return {
      endpoint: `${parsed.protocol}//${parsed.host}/api/${projet}/store/`,
      clePublique,
      projet,
    };
  } catch {
    return null;
  }
}

function assainir(valeur: unknown, profondeur = 0): unknown {
  if (profondeur > 3) return "[…]";
  if (valeur instanceof Error) {
    return { nom: valeur.name, message: valeur.message };
  }
  if (Array.isArray(valeur)) {
    return valeur.slice(0, 20).map((item) => assainir(item, profondeur + 1));
  }
  if (valeur && typeof valeur === "object") {
    const resultat: Record<string, unknown> = {};
    for (const [cle, contenu] of Object.entries(valeur)) {
      resultat[cle] = CLES_SENSIBLES.test(cle)
        ? "[masqué]"
        : assainir(contenu, profondeur + 1);
    }
    return resultat;
  }
  if (typeof valeur === "string") return valeur.slice(0, 1_000);
  return valeur;
}

export function construireEvenementSentry(
  message: string,
  error: unknown,
  contexte: Record<string, unknown> = {},
): Record<string, unknown> {
  const erreur =
    error instanceof Error
      ? { type: error.name, value: error.message, stack: error.stack }
      : { type: "Erreur", value: String(error) };

  return {
    event_id: randomUUID().replaceAll("-", ""),
    timestamp: new Date().toISOString(),
    platform: "node",
    level: "error",
    logger: "lcd-v2",
    environment: env.SENTRY_ENVIRONMENT ?? env.NODE_ENV,
    release: `lcd-v2@${APP_VERSION}`,
    server_name: "lcd-parc",
    message,
    exception: {
      values: [{ type: erreur.type, value: erreur.value }],
    },
    extra: {
      ...(assainir(contexte) as Record<string, unknown>),
      stack: erreur.stack,
    },
    tags: { service: "lcd-v2" },
  };
}

export async function envoyerEvenementSentry(
  dsn: string,
  evenement: Record<string, unknown>,
): Promise<void> {
  const cible = parserDsnSentry(dsn);
  if (!cible) return;

  try {
    const reponse = await fetch(cible.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Sentry-Auth": `Sentry sentry_version=7, sentry_key=${cible.clePublique}, sentry_client=lcd-v2/${APP_VERSION}`,
      },
      body: JSON.stringify(evenement),
      signal: AbortSignal.timeout(3_000),
    });
    if (!reponse.ok) {
      console.error(`[sentry] envoi refusé (${reponse.status})`);
    }
  } catch (error) {
    console.error("[sentry] envoi impossible", error);
  }
}

export async function capturerErreur(
  message: string,
  error: unknown,
  contexte: Record<string, unknown> = {},
): Promise<void> {
  const dsn = env.SENTRY_DSN;
  if (!dsn) return;
  await envoyerEvenementSentry(dsn, construireEvenementSentry(message, error, contexte));
}
