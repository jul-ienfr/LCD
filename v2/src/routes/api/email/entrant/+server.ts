import { json } from "@sveltejs/kit";
import { slugTenantDepuisDestinataire } from "@/domain/email-entrant";
import { RecevoirEmailEntrant } from "@/application/use-cases/recevoir-email-entrant";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleTenantRepository } from "@/infrastructure/db/repositories/tenant-repository";
import {
  lireEmailWebhook,
  signatureEmailValide,
} from "@/infrastructure/adapters/email-webhook";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { logErreur } from "@/lib/logger";
import { stockageFichiers } from "@/lib/server/stockage";
import type { RequestHandler } from "./$types";

const TAILLE_WEBHOOK_EMAIL_MAX = 16 * 1024 * 1024;

/**
 * T307 — entrée e-mail générique par webhook signé.
 *
 * Adresse de réponse : `reponses+<slug>@EMAIL_INBOUND_DOMAIN`. Le corps brut
 * est authentifié avant tout parsing ; un e-mail dont l'expéditeur ne
 * correspond à aucun fil est accepté puis ignoré, sans créer de contact.
 */
export const POST: RequestHandler = async ({ request }) => {
  if (!env.EMAIL_WEBHOOK_SECRET || !env.EMAIL_INBOUND_DOMAIN) {
    return json(
      { ok: false, erreur: "Entrée e-mail non configurée." },
      { status: 503 },
    );
  }
  if (Number(request.headers.get("content-length") ?? 0) > TAILLE_WEBHOOK_EMAIL_MAX) {
    return json({ ok: false, erreur: "Message trop volumineux." }, { status: 413 });
  }

  let corps: string;
  try {
    corps = await request.text();
  } catch {
    return json({ ok: false, erreur: "Corps illisible." }, { status: 400 });
  }
  if (corps.length > TAILLE_WEBHOOK_EMAIL_MAX) {
    return json({ ok: false, erreur: "Message trop volumineux." }, { status: 413 });
  }
  if (
    !signatureEmailValide(
      corps,
      request.headers.get("x-lcd-signature"),
      env.EMAIL_WEBHOOK_SECRET,
    )
  ) {
    return json({ ok: false, erreur: "Signature invalide." }, { status: 401 });
  }

  const email = lireEmailWebhook(corps);
  if (!email) {
    return json({ ok: false, erreur: "Message e-mail invalide." }, { status: 422 });
  }
  const slug = slugTenantDepuisDestinataire(
    email.vers,
    env.EMAIL_INBOUND_DOMAIN,
  );
  if (!slug) {
    return json({ ok: false, erreur: "Destinataire inconnu." }, { status: 422 });
  }

  const tenant = await new DrizzleTenantRepository().trouverParSlug(slug);
  if (!tenant || tenant.statut !== "actif") {
    return json({ ok: false, erreur: "Tenant inconnu." }, { status: 404 });
  }

  try {
    const resultat = await new RecevoirEmailEntrant(
      new DrizzleFilsVoyageurRepository(),
      stockageFichiers(),
    ).executer(tenant.id, email);

    if (resultat.type === "ignore") {
      return json(
        { ok: true, ignore: resultat.motif, messageId: email.messageId },
        { status: 202 },
      );
    }

    await withTenant(tenant.id, (tx) =>
      tx.insert(auditLogs).values({
        tenantId: tenant.id,
        qui: "webhook-email",
        action: "email.entrant",
        cible: resultat.message.id,
        ref: resultat.message.ref,
        payload: {
          messageId: email.messageId,
          dejaRecu: resultat.dejaRecu,
          piecesJointes: email.piecesJointes.length,
        },
      }),
    );

    return json(
      {
        ok: true,
        messageId: resultat.message.id,
        dejaRecu: resultat.dejaRecu,
      },
      { status: resultat.dejaRecu ? 200 : 202 },
    );
  } catch (error) {
    logErreur("email.entrant", error, { tenantId: tenant.id });
    return json(
      { ok: false, erreur: "Traitement impossible." },
      { status: 500 },
    );
  }
};
