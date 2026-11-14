import { building } from "$app/env";
import {
  cheminSitePourDomaine,
  estHoteLocal,
  estRouteApplication,
  hoteNormalise,
} from "@/lib/routage-domaine";

const cache = new Map<string, string | null>();

async function slugPourHote(
  hote: string,
  fetchFn: typeof fetch,
): Promise<string | null> {
  if (cache.has(hote)) return cache.get(hote) ?? null;
  try {
    const reponse = await fetchFn(
      `/api/domaine?hote=${encodeURIComponent(hote)}`,
    );
    if (!reponse.ok) {
      if (reponse.status === 404) cache.set(hote, null);
      return null;
    }
    const donnees = (await reponse.json()) as { slug?: unknown };
    const slug = typeof donnees.slug === "string" ? donnees.slug : null;
    if (slug) cache.set(hote, slug);
    return slug;
  } catch {
    return null;
  }
}

/**
 * T209 — un domaine personnalisé actif sert le site public du tenant.
 * Les routes applicatives et l'API ne sont jamais réécrites. Le cache évite
 * un appel de résolution à chaque navigation ; un domaine fraîchement activé
 * est donc visible après au plus une minute ou au redémarrage.
 */
export const reroute = async ({
  url,
  fetch: fetchFn,
}: {
  url: URL;
  fetch: typeof fetch;
}): Promise<string | undefined> => {
  if (building) return;
  if (url.pathname === "/site" || url.pathname.startsWith("/site/")) return;
  // Ne jamais résoudre un domaine pour l'API ou une route applicative :
  // sinon l'appel interne `/api/domaine` se rappellerait lui-même.
  if (estRouteApplication(url.pathname)) return;

  const hote = hoteNormalise(url.hostname);
  if (!hote || estHoteLocal(hote)) return;

  const slug = await slugPourHote(hote, fetchFn);
  if (!slug) return;
  return cheminSitePourDomaine(url.pathname, slug) ?? undefined;
};
