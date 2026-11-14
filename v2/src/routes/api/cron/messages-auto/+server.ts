import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { executerPlanificationMessages } from "@/lib/server/planificateur-messages";
import type { RequestHandler } from "./$types";

/**
 * Prépare les brouillons de messages de séjour dus aujourd'hui
 * (J-7, J-1, arrivée, départ, J+1) pour tous les tenants actifs.
 * `?simulation=1` compte les candidats sans écrire ; `?date=AAAA-MM-JJ`
 * rejoue une date. Aucun message n'est envoyé par ce cron.
 */
async function executer(request: Request, url: URL) {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }
  if (!env.MESSAGES_AUTO_ENABLED) {
    return json(
      {
        ok: false,
        erreur: "Messages automatiques désactivés (MESSAGES_AUTO_ENABLED=false).",
      },
      { status: 503 },
    );
  }

  const date = url.searchParams.get("date") ?? undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return json({ ok: false, erreur: "Date invalide (AAAA-MM-JJ)." }, { status: 400 });
  }
  const simulation = url.searchParams.get("simulation") === "1";
  const resultat = await executerPlanificationMessages({
    ...(date ? { date } : {}),
    ...(simulation ? { simulation: true } : {}),
  });
  return json({ ok: true, date: date ?? "aujourd'hui", simulation, ...resultat });
}

export const GET: RequestHandler = async ({ request, url }) => executer(request, url);
export const POST: RequestHandler = async ({ request, url }) => executer(request, url);
