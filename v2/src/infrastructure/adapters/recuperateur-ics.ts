import { Buffer } from "node:buffer";
import type {
  OptionsRecuperationIcs,
  RecuperateurIcs,
  ReponseIcs,
} from "@/application/ports/flux-ics-repository";
import { urlIcsValide } from "@/domain/flux-ics";
import { estCalendrierIcs } from "@/domain/ics";

const TAILLE_MAX = 2_000_000;
const TENTATIVES_MAX = 3;
const TIMEOUT_MS = 12_000;
const REDIRECTIONS_MAX = 3;
const ATTENTE_MAX_MS = 4_000;

interface OptionsRecuperateur {
  timeoutMs?: number;
  tentatives?: number;
}

function attendre(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function delaiRetry(reponse: Response, tentative: number): number {
  const entete = reponse.headers.get("retry-after");
  if (entete) {
    const secondes = Number(entete);
    if (Number.isFinite(secondes) && secondes >= 0) {
      return Math.min(secondes * 1_000, ATTENTE_MAX_MS);
    }
    const date = Date.parse(entete);
    if (Number.isFinite(date)) {
      return Math.min(Math.max(0, date - Date.now()), ATTENTE_MAX_MS);
    }
  }
  return Math.min(500 * 2 ** (tentative - 1), ATTENTE_MAX_MS);
}

function doitReessayer(statut: number): boolean {
  return statut === 408 || statut === 425 || statut === 429 || statut >= 500;
}

async function lireTexteLimite(
  reponse: Response,
  tailleMax: number,
): Promise<string> {
  const longueur = Number(reponse.headers.get("content-length") ?? 0);
  if (Number.isFinite(longueur) && longueur > tailleMax) {
    throw new Error("Flux ICS trop volumineux (max 2 Mo).");
  }
  if (!reponse.body) return "";
  const lecteur = reponse.body.getReader();
  const morceaux: Uint8Array[] = [];
  let recu = 0;
  try {
    for (;;) {
      const { done, value } = await lecteur.read();
      if (done) break;
      recu += value.byteLength;
      if (recu > tailleMax) {
        await lecteur.cancel();
        throw new Error("Flux ICS trop volumineux (max 2 Mo).");
      }
      morceaux.push(value);
    }
  } finally {
    lecteur.releaseLock();
  }
  return Buffer.concat(morceaux.map((morceau) => Buffer.from(morceau))).toString(
    "utf8",
  );
}

async function suivreRedirections(
  urlInitiale: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  let url = urlInitiale;
  for (let redirection = 0; redirection <= REDIRECTIONS_MAX; redirection += 1) {
    if (!urlIcsValide(url)) {
      throw new Error("Flux ICS : URL non autorisée.");
    }
    const reponse = await fetch(url, {
      ...init,
      redirect: "manual",
      signal: AbortSignal.timeout(timeoutMs),
    });

    if ([301, 302, 303, 307, 308].includes(reponse.status)) {
      const location = reponse.headers.get("location");
      if (!location) throw new Error("Flux ICS : redirection sans destination.");
      if (redirection === REDIRECTIONS_MAX) {
        throw new Error("Flux ICS : trop de redirections.");
      }
      url = new URL(location, url).toString();
      await reponse.body?.cancel();
      continue;
    }
    return reponse;
  }
  throw new Error("Flux ICS : trop de redirections.");
}

export function creerRecuperateurIcs(
  options: OptionsRecuperateur = {},
): RecuperateurIcs {
  const timeoutMs = options.timeoutMs ?? TIMEOUT_MS;
  const tentatives = options.tentatives ?? TENTATIVES_MAX;

  return {
    async recuperer(
      url: string,
      conditions: OptionsRecuperationIcs = {},
    ): Promise<ReponseIcs> {
      const entetes: Record<string, string> = {
        Accept: "text/calendar, text/plain;q=0.9, */*;q=0.5",
        "User-Agent": "LCD-Parc/2.0 (+https://lcd-parc.netlify.app)",
        "Cache-Control": "no-cache",
      };
      if (conditions.etag) entetes["If-None-Match"] = conditions.etag;
      if (conditions.derniereModification) {
        entetes["If-Modified-Since"] = conditions.derniereModification;
      }

      let derniereErreur: unknown = null;
      for (let tentative = 1; tentative <= tentatives; tentative += 1) {
        try {
          const reponse = await suivreRedirections(
            url,
            { method: "GET", headers: entetes },
            timeoutMs,
          );

          const etag = reponse.headers.get("etag") ?? conditions.etag ?? null;
          const derniereModification =
            reponse.headers.get("last-modified") ??
            conditions.derniereModification ??
            null;

          if (reponse.status === 304) {
            await reponse.body?.cancel();
            return {
              nonModifie: true,
              texte: null,
              etag,
              derniereModification,
              statutHttp: 304,
            };
          }

          if (!reponse.ok) {
            if (doitReessayer(reponse.status) && tentative < tentatives) {
              const delai = delaiRetry(reponse, tentative);
              await reponse.body?.cancel();
              await attendre(delai);
              continue;
            }
            await reponse.body?.cancel();
            throw new Error(`Flux ICS : HTTP ${reponse.status}`);
          }

          const typeContenu = (reponse.headers.get("content-type") ?? "").toLowerCase();
          if (typeContenu.includes("text/html")) {
            await reponse.body?.cancel();
            throw new Error("Flux ICS : le serveur a renvoyé une page HTML.");
          }

          const texte = await lireTexteLimite(reponse, TAILLE_MAX);
          if (!estCalendrierIcs(texte)) {
            throw new Error(
              "Flux ICS : contenu invalide (BEGIN/END:VCALENDAR absent).",
            );
          }

          return {
            nonModifie: false,
            texte,
            etag,
            derniereModification,
            statutHttp: reponse.status,
          };
        } catch (erreur) {
          derniereErreur = erreur;
          if (tentative >= tentatives) break;
          const message = erreur instanceof Error ? erreur.message : "";
          const reessayable =
            erreur instanceof TypeError ||
            (erreur instanceof DOMException &&
              (erreur.name === "TimeoutError" || erreur.name === "AbortError")) ||
            message.includes("délai") ||
            message.includes("fetch failed") ||
            /HTTP (?:408|425|429|5\d\d)/u.test(message);
          if (!reessayable) break;
          await attendre(500 * 2 ** (tentative - 1));
        }
      }

      if (derniereErreur instanceof Error) throw derniereErreur;
      throw new Error("Flux ICS : échec de récupération.");
    },
  };
}
