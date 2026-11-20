/**
 * Spec 006, US1 — contrôle d'absence des tâches planifiées (FR-002).
 *
 * Relit le référentiel, évalue chaque tâche (dernière exécution vs 2× la
 * cadence), ouvre/referme les alertes et envoie les notifications dues.
 * Aussi déclenchable par le planificateur in-process (cadence
 * VERIF_TACHES_INTERVALLE_MINUTES) — le verrou système évite le doublon.
 *
 * Aucune erreur ici n'est un échec de la tâche « verifier-taches » : c'est
 * une alerte qui ne partira pas, donc on répond 500 et le journal trace.
 */
import { json } from "@sveltejs/kit";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import {
  verifierAbsencesTaches,
  verifierBriquesSupervision,
} from "@/lib/server/alertes-exploitation";
import { cronAvecJournal } from "@/lib/server/cron-journal";
import {
  purgerEvenementsStripe,
  verifierEchecsEvenementsStripe,
} from "@/lib/server/evenements-stripe";
import { purgerJournalExecutions } from "@/lib/server/journal-execution";
import { purgerRetentions } from "@/lib/server/retention";
import type { RequestHandler } from "@sveltejs/kit";

const handler: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json(
      { ok: false, erreur: "CRON_SECRET non configuré." },
      { status: 503 },
    );
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  try {
    const [controle, briques, stripe] = await Promise.all([
      verifierAbsencesTaches(),
      verifierBriquesSupervision(),
      verifierEchecsEvenementsStripe(),
    ]);
    const purges = await purgerJournalExecutions();
    const purgesStripe = await purgerEvenementsStripe();
    // Rétention bornée des cinq familles de traces (FR-015). Une famille en
    // échec n'empêche pas les autres : elle est listée dans `echecs`.
    const retentions = await purgerRetentions();
    return json({
      ok: true,
      ...controle,
      briquesManquantes: briques,
      evenementsStripe: stripe,
      executionsPurgees: purges,
      evenementsStripePurges: purgesStripe,
      retentionsPurgees: retentions,
    });
  } catch (error) {
    logErreur("cronVerifierTaches", error);
    return json(
      { ok: false, erreur: "Erreur pendant le contrôle des tâches." },
      { status: 500 },
    );
  }
};

export const GET = cronAvecJournal("verifier-taches", handler);
export const POST = GET;
