import { json } from "@sveltejs/kit";
import { DrizzleSuiviRepository } from "@/infrastructure/db/repositories/suivi-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import { creerRateLimiter } from "@/lib/server/rate-limit";
import {
  empreinteIp,
  enregistrerEvenementSuivi,
  lireConsentementRequete,
} from "@/lib/server/suivi";
import type { RequestHandler } from "./$types";

const limiteur = creerRateLimiter({ max: 120, fenetreMs: 60_000 });
const TAILLE_MAX = 8_192;

export const POST: RequestHandler = async (event) => {
  const { request, url } = event;
  const origine = request.headers.get("origin");
  if (origine && origine !== url.origin) {
    return json({ ok: false, erreur: "Origine refusée." }, { status: 403 });
  }
  if (Number(request.headers.get("content-length") ?? 0) > TAILLE_MAX) {
    return json({ ok: false, erreur: "Charge trop grande." }, { status: 413 });
  }
  const cleLimite = empreinteIp(event);
  if (!limiteur.autoriser(cleLimite)) {
    return json({ ok: false, erreur: "Trop d’événements." }, { status: 429 });
  }

  const consentement = lireConsentementRequete(event);
  if (!consentement?.mesure) {
    return json({ ok: false, erreur: "Consentement requis." }, { status: 403 });
  }

  let corps: unknown;
  try {
    const texte = await request.text();
    if (texte.length > TAILLE_MAX) {
      return json({ ok: false, erreur: "Charge trop grande." }, { status: 413 });
    }
    corps = JSON.parse(texte);
  } catch {
    return json({ ok: false, erreur: "JSON invalide." }, { status: 400 });
  }
  const donnees = corps as {
    tenantSlug?: unknown;
    evenement?: unknown;
  };
  if (typeof donnees.tenantSlug !== "string" || !donnees.evenement) {
    return json({ ok: false, erreur: "Requête invalide." }, { status: 400 });
  }
  const tenant = await new DrizzleTenantRepository().trouverParSlug(
    donnees.tenantSlug,
  );
  if (!tenant) {
    return json({ ok: false, erreur: "Site introuvable." }, { status: 404 });
  }
  const configuration =
    await new DrizzleSuiviRepository().lireConfiguration(tenant.id);
  if (!configuration?.actif) {
    return json({ ok: false, erreur: "Suivi inactif." }, { status: 404 });
  }

  await enregistrerEvenementSuivi(
    event,
    tenant.id,
    consentement,
    donnees.evenement,
  );
  return json({ ok: true }, { status: 202 });
};
