import { json } from "@sveltejs/kit";
import { codeFournisseurValide } from "@/domain/fournisseur";
import { extraireProprieteExterne } from "@/domain/webhook-fournisseur";
import {
  creerFournisseur,
  fournisseurConfigure,
  webhookFournisseurConfigure,
} from "@/infrastructure/adapters/fournisseurs";
import { DrizzleFournisseurRepository } from "@/infrastructure/db/repositories/fournisseur-repository";
import { DrizzleEvenementCanalRepository } from "@/infrastructure/db/repositories/evenement-canal-repository";
import { DrizzleDemandeSyncRepository } from "@/infrastructure/db/repositories/demande-sync-repository";
import { env } from "@/lib/env";
import { logErreur, logInfo } from "@/lib/logger";
import { journaliserWebhookCanal } from "@/lib/server/evenement-canal";
import type { RequestHandler } from "./$types";

const TAILLE_MAX_CORPS = 512 * 1024;

export const POST: RequestHandler = async ({ params, request }) => {
  const code = params.code;
  if (!code || !codeFournisseurValide(code)) {
    return json({ ok: false, erreur: "Fournisseur inconnu." }, { status: 404 });
  }
  if (!fournisseurConfigure(code) || !webhookFournisseurConfigure(code)) {
    return json(
      { ok: false, erreur: "Webhook fournisseur non configuré." },
      { status: 503 },
    );
  }

  const longueurAnnoncee = Number(request.headers.get("content-length"));
  if (Number.isFinite(longueurAnnoncee) && longueurAnnoncee > TAILLE_MAX_CORPS) {
    return json(
      { ok: false, erreur: "Payload trop volumineux." },
      { status: 413 },
    );
  }
  const corps = await request.text();
  if (corps.length > TAILLE_MAX_CORPS) {
    return json(
      { ok: false, erreur: "Payload trop volumineux." },
      { status: 413 },
    );
  }

  const fournisseur = creerFournisseur(code);
  try {
    if (!(await fournisseur.verifierWebhook({ headers: request.headers, corps }))) {
      return json({ ok: false, erreur: "Signature invalide." }, { status: 401 });
    }
  } catch (erreur) {
    logErreur("fournisseur.webhook.signature", erreur);
    return json({ ok: false, erreur: "Signature invalide." }, { status: 401 });
  }

  const repo = new DrizzleFournisseurRepository();
  const [affectations, activations] = await Promise.all([
    repo.listerAffectationsActives(code),
    repo.listerActivations(),
  ]);
  if (affectations === null || activations === null) {
    return json(
      { ok: false, erreur: "Connexion owner absente." },
      { status: 503 },
    );
  }
  if (
    !activations.some(
      (activation) => activation.code === code && activation.actif,
    )
  ) {
    return json({
      ok: true,
      fournisseur: code,
      traites: 0,
      erreurs: 0,
      message: "Fournisseur désactivé par le super-admin.",
      details: [],
    });
  }

  const propriete = extraireProprieteExterne(corps);
  const correspondantes = propriete
    ? affectations.filter(
        (affectation) => affectation.externalPropertyId === propriete,
      )
    : affectations;
  if (propriete && correspondantes.length === 0) {
    return json({
      ok: true,
      fournisseur: code,
      propriete,
      traites: 0,
      erreurs: 0,
      message: "Propriété non affectée dans la V2 ; cron de secours actif.",
      details: [],
    });
  }
  const file = correspondantes.slice(
    0,
    env.FOURNISSEUR_WEBHOOK_MAX_LOGEMENTS,
  );

  const journal = new DrizzleEvenementCanalRepository();
  const evenements = new Map<string, string>();
  for (const affectation of file) {
    const evenement = await journaliserWebhookCanal({
      tenantId: affectation.tenantId,
      logementFournisseurId: affectation.id,
      fournisseurCode: code,
      corps,
      propriete,
      headers: request.headers,
    });
    if (evenement) {
      evenements.set(
        `${affectation.tenantId}:${affectation.logementId}`,
        evenement.id,
      );
    }
  }

  const marquerEvenement = async (
    tenantId: string,
    logementId: string,
    statut: "traite" | "erreur",
    message: string | null,
  ) => {
    const id = evenements.get(`${tenantId}:${logementId}`);
    if (!id) return;
    try {
      await journal.marquerTraite(tenantId, id, statut, message);
    } catch (erreur) {
      logErreur("fournisseur.webhook.journal.marque", erreur);
    }
  };

  const demandes = new DrizzleDemandeSyncRepository();
  const details: Array<{
    tenantId: string;
    logementId: string;
    statut: "en_file" | "erreur";
    message: string | null;
  }> = [];
  let erreurs = 0;

  for (const affectation of file) {
    try {
      await demandes.enregistrer(affectation.tenantId, affectation.logementId);
      details.push({
        tenantId: affectation.tenantId,
        logementId: affectation.logementId,
        statut: "en_file",
        message: null,
      });
      await marquerEvenement(
        affectation.tenantId,
        affectation.logementId,
        "traite",
        "En file de synchronisation.",
      );
    } catch (erreur) {
      erreurs += 1;
      logErreur("fournisseur.webhook.enfile", erreur);
      const message =
        erreur instanceof Error ? erreur.message : "Erreur inconnue.";
      details.push({
        tenantId: affectation.tenantId,
        logementId: affectation.logementId,
        statut: "erreur",
        message,
      });
      await marquerEvenement(
        affectation.tenantId,
        affectation.logementId,
        "erreur",
        message,
      );
    }
  }

  logInfo("fournisseur.webhook.enfile", {
    fournisseur: code,
    propriete,
    total: file.length,
    en_file: file.length - erreurs,
    erreurs,
  });
  return json(
    {
      ok: erreurs === 0,
      fournisseur: code,
      propriete,
      statut: "en_file",
      total: file.length,
      traites: file.length - erreurs,
      erreurs,
      details,
    },
    { status: erreurs === 0 ? 202 : 503 },
  );
};
