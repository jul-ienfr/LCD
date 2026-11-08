import { isRedirect, redirect } from "@sveltejs/kit";
import {
  EnvoyerMessageVoyageur,
  PreparerMessageVoyageur,
} from "@/application/use-cases/message-voyageur";
import { ErreurMetier } from "@/domain/erreurs";
import {
  CANAUX_MESSAGE,
  LIBELLES_CANAL,
  LIBELLES_TYPE_MESSAGE,
} from "@/domain/message-voyageur";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { creerSmsBrevo, smsConfigured } from "@/infrastructure/adapters/sms-brevo";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMessagesVoyageurRepository } from "@/infrastructure/db/repositories/messages-voyageur-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { traductionsVoyageurs } from "@/lib/i18n-voyageurs";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

function retour(logementId: string, suffixe: string): never {
  redirect(
    303,
    `/hote/messages?logement=${encodeURIComponent(logementId)}&${suffixe}`,
  );
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const logements = await new DrizzleLogementRepository().listerParTenant(
    tenantId,
  );
  const logement =
    logements.find((entree) => entree.id === event.url.searchParams.get("logement")) ??
    logements[0];

  const messages = logement
    ? await new DrizzleMessagesVoyageurRepository().listerParLogement(
        tenantId,
        logement.id,
      )
    : [];

  const langue = event.cookies.get("lcd_langue") ?? "fr";
  return {
    langue,
    t: traductionsVoyageurs(langue),
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    messages: messages.map((message) => ({
      id: message.id,
      ref: message.ref,
      type: LIBELLES_TYPE_MESSAGE[message.type],
      canal: LIBELLES_CANAL[message.canal],
      destinataire: message.destinataire,
      contenu: message.contenu,
      statut: message.statut,
      date: new Intl.DateTimeFormat("fr-FR", {
        dateStyle: "short",
        timeStyle: "short",
      }).format(message.envoyeAt ?? message.createdAt),
    })),
    brouillons: messages.filter((message) => message.statut === "brouillon")
      .length,
    envoyes: messages.filter((message) => message.statut === "envoye").length,
    canaux: CANAUX_MESSAGE.map((canal) => ({
      id: canal,
      label: LIBELLES_CANAL[canal],
    })),
    types: Object.entries(LIBELLES_TYPE_MESSAGE).map(([id, label]) => ({
      id,
      label,
    })),
    emailConfigured: env.EMAIL_ENABLED,
    smsConfigured: smsConfigured(),
    ref: `MSG-${crypto.randomUUID()}`,
    ok: event.url.searchParams.get("ok"),
    erreur: event.url.searchParams.get("erreur"),
  };
};

export const actions = {
  preparer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");

    try {
      const canal = texte(donnees, "canal");
      const message = await new PreparerMessageVoyageur(
        new DrizzleMessagesVoyageurRepository(),
        new DrizzleLogementRepository(),
      ).executer({
        tenantId,
        logementId,
        ref: texte(donnees, "ref") || `MSG-${crypto.randomUUID()}`,
        canal,
        destinataire:
          canal === "sms"
            ? texte(donnees, "telephone")
            : texte(donnees, "destinataire"),
        type: texte(donnees, "type"),
        contenu: texte(donnees, "contenu"),
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "message.preparer",
          cible: message.id,
          ref: message.ref,
          payload: { canal: message.canal, type: message.type, logementId },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("messages.preparer", error, { tenantId, logementId });
      retour(logementId, "erreur=inattendu");
    }
    retour(logementId, "ok=prepare");
  },

  envoyer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = texte(donnees, "logementId");
    const id = texte(donnees, "id");

    try {
      const message = await new EnvoyerMessageVoyageur(
        new DrizzleMessagesVoyageurRepository(),
        env.EMAIL_ENABLED ? creerEmailSmtp() : null,
        smsConfigured() ? creerSmsBrevo() : null,
      ).executer(tenantId, id);

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "message.envoyer",
          cible: message.id,
          ref: message.ref,
          payload: { canal: message.canal, type: message.type },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(logementId, `erreur=${encodeURIComponent(error.message)}`);
      }
      logErreur("messages.envoyer", error, { tenantId, cible: id });
      retour(logementId, "erreur=inattendu");
    }
    retour(logementId, "ok=envoi");
  },
} satisfies Actions;
