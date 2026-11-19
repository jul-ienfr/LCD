import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import { executerImportPricing } from "@/lib/server/planificateur-pricing";
import type { RequestHandler } from "@sveltejs/kit";

/**
 * Importe les recommandations de prix de tous les logements actifs.
 * `?simulation=1` compte sans écrire ; `?debut=`/`?fin=` cadrent la plage.
 * Aucun prix n'est appliqué par ce cron : les recommandations restent des
 * propositions à valider sur `/hote/prix/recommandations`.
 */
async function executer(request: Request, url: URL) {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }
  if (!env.PRICING_IMPORT_ENABLED) {
    return json(
      {
        ok: false,
        erreur: "Import pricing désactivé (PRICING_IMPORT_ENABLED=false).",
      },
      { status: 503 },
    );
  }

  const debut = url.searchParams.get("debut") ?? undefined;
  const fin = url.searchParams.get("fin") ?? undefined;
  for (const [nom, valeur] of [
    ["debut", debut],
    ["fin", fin],
  ] as const) {
    if (valeur && !/^\d{4}-\d{2}-\d{2}$/.test(valeur)) {
      return json(
        { ok: false, erreur: `${nom} invalide (AAAA-MM-JJ).` },
        { status: 400 },
      );
    }
  }
  const simulation = url.searchParams.get("simulation") === "1";
  const resultat = await executerImportPricing({
    ...(debut ? { debut } : {}),
    ...(fin ? { fin } : {}),
    simulation,
  });
  return json({ ok: true, simulation, ...resultat });
}

export const GET: RequestHandler = cronAvecJournal(
  "pricing",
  ({ request, url }) => executer(request, url),
  { statutsIgnores: [503] },
);
export const POST: RequestHandler = cronAvecJournal(
  "pricing",
  ({ request, url }) => executer(request, url),
  { statutsIgnores: [503] },
);
