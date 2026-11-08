import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import type { RequestHandler } from "./$types";

function echapper(valeur: string): string {
  return valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

/** Reprend les paramètres d'attribution de la page hôte dans l'iframe. */
function lireAttribution(params: URLSearchParams): Record<string, string> {
  const attribution: Record<string, string> = {};
  for (const cle of ["utm_source", "utm_medium", "utm_campaign", "code"]) {
    const valeur = (params.get(cle) ?? "").trim().slice(0, 60);
    if (valeur) attribution[cle] = valeur;
  }
  return attribution;
}

export const GET: RequestHandler = async ({ url }) => {
  const slug = (url.searchParams.get("tenant") ?? "").trim();
  if (!slug) {
    return new Response("Paramètre tenant manquant.", { status: 400 });
  }

  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant || tenant.statut !== "actif" || tenant.ventesSuspendues) {
    return new Response("Ce site n'est pas disponible.", { status: 404 });
  }

  const aujourdHui = new Date().toISOString().slice(0, 10);
  const nom = echapper(tenant.nom);
  const slugSur = echapper(tenant.slug);
  const attribution = lireAttribution(url.searchParams);
  const champsAttribution = Object.entries(attribution)
    .map(([cle, valeur]) => `<input type="hidden" name="${cle}" value="${echapper(valeur)}">`)
    .join("\n    ");

  const html = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Réserver — ${nom}</title>
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, -apple-system, "Segoe UI", sans-serif; background: #f7f7f5; color: #1d2524; }
  main { max-width: 560px; margin: 0 auto; padding: 28px 20px; }
  h1 { font-size: 1.45rem; margin: 0 0 4px; }
  p { color: #5f6b69; margin: 0 0 20px; }
  form { display: grid; gap: 14px; background: #fff; border: 1px solid #e3e7e5; border-radius: 18px; padding: 20px; }
  label { display: grid; gap: 5px; font-size: .85rem; font-weight: 600; }
  input, select { width: 100%; min-height: 44px; border: 1px solid #cfd8d5; border-radius: 10px; padding: 8px 10px; font: inherit; background: #fff; }
  button { min-height: 46px; border: 0; border-radius: 999px; background: #0e7c6b; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
  small { color: #6b7774; }
</style>
</head>
<body>
<main>
  <h1>Réserver chez ${nom}</h1>
  <p>Choisissez vos dates, nous vérifions les disponibilités en direct.</p>
  <form action="/reserver" method="GET" target="_top">
    <input type="hidden" name="tenant" value="${slugSur}">
    <input type="hidden" name="widget" value="1">
    ${champsAttribution}
    <label>Arrivée<input type="date" name="debut" min="${aujourdHui}" required></label>
    <label>Départ<input type="date" name="fin" min="${aujourdHui}" required></label>
    <label>Voyageurs<input type="number" name="voyageurs" min="1" max="20" value="2"></label>
    <button type="submit">Voir les disponibilités</button>
    <small>Sans paiement immédiat. Vous verrez le prix avant de confirmer.</small>
  </form>
</main>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=60",
    },
  });
};
