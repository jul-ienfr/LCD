// lib/langue.ts — langue par requête SANS cookies()/headers().
// ?lang= explicite, sinon fr. (Le header du layout propose le <select> qui
// navigue en ?lang= : aucun JS requis, prerender compatible.)
// L'Accept-Language reste exploité côté gateway (/v1/i18n) ; ici on reste
// déterministe pour que `next build` ne bloque pas sur du dynamique.
import type { Langue } from "./i18n";

const OK = ["fr", "en", "es", "it", "de"] as const;

export function languePage(sp: {
  lang?: string | string[];
}): Langue {
  const q = typeof sp.lang === "string" ? sp.lang.slice(0, 2).toLowerCase() : "";
  if ((OK as readonly string[]).includes(q)) return q as Langue;
  return "fr";
}
