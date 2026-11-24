/**
 * Alerte d'exploitation envoyée depuis un script ou un workflow externe
 * (spec 006, FR-005/FR-006/FR-008/FR-010).
 *
 * Les sauvegardes, le moniteur externe et le déploiement tournent hors du
 * processus web : scripts shell et GitHub Actions postent ici, avec le secret
 * cron, et l'alerte suit le même cycle que celles du produit (ouverture
 * idempotente par `source`, anti-tempête, runbook, e-mail T-11).
 */
import { json } from "@sveltejs/kit";
import { SEVERITES_ALERTE, type SeveriteAlerte } from "@/domain/exploitation";
import { cronSecretValide } from "@/lib/cron-secret";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { notifierAlerte, ouvrirAlerte } from "@/lib/server/alertes-exploitation";
import type { RequestHandler } from "@sveltejs/kit";

const TAILLE_MAX = 8_000;

export const POST: RequestHandler = async ({ request }) => {
  if (!env.CRON_SECRET) {
    return json({ ok: false, erreur: "CRON_SECRET non configuré." }, { status: 503 });
  }
  if (!cronSecretValide(request.headers.get("authorization"), env.CRON_SECRET)) {
    return json({ ok: false, erreur: "Non autorisé." }, { status: 401 });
  }

  const longueur = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(longueur) && longueur > TAILLE_MAX) {
    return json({ ok: false, erreur: "Payload trop volumineux." }, { status: 413 });
  }

  let corps: unknown;
  try {
    corps = await request.json();
  } catch {
    return json({ ok: false, erreur: "JSON invalide." }, { status: 400 });
  }
  if (typeof corps !== "object" || corps === null) {
    return json({ ok: false, erreur: "Corps invalide." }, { status: 400 });
  }

  const { source, severite, message, runbook } = corps as {
    source?: unknown;
    severite?: unknown;
    message?: unknown;
    runbook?: unknown;
  };
  if (typeof source !== "string" || !source.trim()) {
    return json({ ok: false, erreur: "Source manquante." }, { status: 422 });
  }
  if (typeof message !== "string" || !message.trim()) {
    return json({ ok: false, erreur: "Message manquant." }, { status: 422 });
  }
  const niveau: SeveriteAlerte = SEVERITES_ALERTE.includes(severite as SeveriteAlerte)
    ? (severite as SeveriteAlerte)
    : "critique";

  try {
    const ligne = await ouvrirAlerte({
      cle: `externe:${source.trim()}`,
      source: source.trim(),
      severite: niveau,
      message: message.trim().slice(0, 500),
      runbook: typeof runbook === "string" ? runbook.trim() || null : null,
      details: { canal: "script-externe" },
    });
    const notification = ligne ? await notifierAlerte(ligne) : { envoye: false };
    return json({ ok: true, notification });
  } catch (error) {
    logErreur("api.cron.alerte", error, { source });
    return json({ ok: false, erreur: "Erreur inattendue." }, { status: 500 });
  }
};
