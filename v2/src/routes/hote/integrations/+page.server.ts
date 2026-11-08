import { isRedirect, redirect } from "@sveltejs/kit";
import { GererWebhook } from "@/application/use-cases/gerer-webhook";
import { ErreurMetier } from "@/domain/erreurs";
import { EVENEMENTS_WEBHOOK } from "@/domain/webhook";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleWebhookRepository } from "@/infrastructure/db/repositories/webhook-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const repo = new DrizzleWebhookRepository();
  const [webhooks, livraisons] = await Promise.all([
    repo.listerParTenant(tenantId),
    repo.listerLivraisonsParTenant(tenantId, 20),
  ]);
  const langue = event.cookies.get("lcd_langue") ?? "fr";

  return {
    langue,
    webhooks: webhooks.map((webhook) => ({
      id: webhook.id,
      libelle: webhook.libelle,
      url: webhook.url,
      secret: webhook.secret,
      events: webhook.events,
    })),
    livraisons: livraisons.map((livraison) => ({
      id: livraison.id,
      date: livraison.createdAt.toISOString().slice(0, 16).replace("T", " "),
      evenement: livraison.eventType,
      statut: livraison.statut,
      tentatives: livraison.tentatives,
      detail: `${livraison.dernierCode ? `${livraison.dernierCode} ` : ""}${livraison.dernierMessage ?? ""}`.trim(),
    })),
    secretDefaut: `${crypto.randomUUID()}${crypto.randomUUID()}`,
    evenements: EVENEMENTS_WEBHOOK.map((evenement, index) => ({
      id: evenement,
      coche: index < 2,
    })),
    ok: event.url.searchParams.get("ok"),
    libelle: event.url.searchParams.get("libelle"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  creer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    let libelleCree = "";

    try {
      const webhook = await new GererWebhook(
        new DrizzleWebhookRepository(),
      ).enregistrer({
        tenantId,
        libelle: texte(donnees, "libelle"),
        url: texte(donnees, "url"),
        secret: texte(donnees, "secret"),
        events: donnees.getAll("events").map(String),
      });
      libelleCree = webhook.libelle;

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "webhook.enregistrer",
          cible: webhook.id,
          ref: webhook.libelle,
          payload: { url: webhook.url, events: webhook.events },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        redirect(303, `/hote/integrations?erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("integrations.creer", error, { tenantId });
      redirect(303, "/hote/integrations?erreur=inattendu");
    }

    redirect(
      303,
      `/hote/integrations?ok=cree&libelle=${encodeURIComponent(libelleCree)}`,
    );
  },

  supprimer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const webhookId = texte(donnees, "webhookId");
    if (!webhookId) redirect(303, "/hote/integrations");

    try {
      await new GererWebhook(new DrizzleWebhookRepository()).supprimer(tenantId, webhookId);
      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.email,
          action: "webhook.supprimer",
          cible: webhookId,
          payload: {},
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      logErreur("integrations.supprimer", error, { tenantId, webhookId });
      redirect(303, "/hote/integrations?erreur=inattendu");
    }

    redirect(303, "/hote/integrations?ok=supprime");
  },
} satisfies Actions;
