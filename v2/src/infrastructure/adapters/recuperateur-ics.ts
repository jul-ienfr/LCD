import type { RecuperateurIcs } from "@/application/ports/flux-ics-repository";
import { urlIcsValide } from "@/domain/flux-ics";

const TAILLE_MAX = 2_000_000;

export function creerRecuperateurIcs(): RecuperateurIcs {
  return {
    async recuperer(url: string): Promise<string> {
      const reponse = await fetch(url, {
        headers: {
          Accept: "text/calendar,text/plain,*/*",
          "User-Agent": "LCD-Parc/1.0 (+https://lcd-parc.netlify.app)",
        },
        redirect: "follow",
        signal: AbortSignal.timeout(10_000),
      });

      if (!reponse.ok) {
        throw new Error(`Flux ICS : HTTP ${reponse.status}`);
      }
      if (reponse.url && !urlIcsValide(reponse.url)) {
        throw new Error("Flux ICS : redirection vers une URL non autorisée.");
      }

      const longueur = Number(reponse.headers.get("content-length") ?? 0);
      if (Number.isFinite(longueur) && longueur > TAILLE_MAX) {
        throw new Error("Flux ICS trop volumineux (max 2 Mo).");
      }

      const texte = await reponse.text();
      if (texte.length > TAILLE_MAX) {
        throw new Error("Flux ICS trop volumineux (max 2 Mo).");
      }
      return texte;
    },
  };
}
