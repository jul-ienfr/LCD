import { error, fail, redirect } from "@sveltejs/kit";
import { AjouterPieceJointe } from "@/application/use-cases/ajouter-piece-jointe";
import { EnvoyerMessageFil } from "@/application/use-cases/envoyer-message";
import { RedigerBrouillonFil } from "@/application/use-cases/rediger-brouillon-fil";
import { TraduireMessageFil } from "@/application/use-cases/traduire-message-fil";
import { lireConfigurationAssistant } from "@/application/use-cases/configuration-assistant";
import { creerLlmProvider, llmConfigured } from "@/infrastructure/adapters/llm-provider";
import { TraducteurLlm } from "@/infrastructure/adapters/traducteur-llm";
import {
  INTENTIONS_ASSISTANT,
  LIBELLES_INTENTION,
  LIBELLES_TON,
  TONS_ASSISTANT,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import {
  appliquerOptout,
  canalValide,
  type ConsentementsFil,
} from "@/domain/fil-voyageur";
import { creerGenerateurBrouillon } from "@/infrastructure/adapters/generateur-brouillon";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommationsAssistantRepository } from "@/infrastructure/db/repositories/consommations-assistant-repository";
import { DrizzleFilsVoyageurRepository } from "@/infrastructure/db/repositories/fils-voyageur-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { traductionsFils } from "@/lib/i18n-fils";
import { logErreur } from "@/lib/logger";
import { env } from "@/lib/env";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import { stockageFichiers } from "@/lib/server/stockage";
import { creerCanalMessage } from "@/infrastructure/adapters/canal-message";
import { creerEmailSmtp } from "@/infrastructure/adapters/email-smtp";
import { creerSmsBrevo, smsConfigured } from "@/infrastructure/adapters/sms-brevo";
import { creerWhatsAppCloud, whatsappConfigured } from "@/infrastructure/adapters/whatsapp-cloud";
import type { Actions, PageServerLoad } from "./$types";

function texte(donnees: FormData, nom: string): string {
  return String(donnees.get(nom) ?? "").trim();
}

const OK: Record<string, string> = {
  messageEnvoye: "messageEnvoye",
  pieceJointeAjoutee: "pieceJointeAjoutee",
  optoutFait: "optoutFait",
  brouillonAssistant: "brouillonAssistant",
};

function canalMessage() {
  const depuis = /<([^>]+)>/.exec(env.EMAIL_FROM);
  return creerCanalMessage({
    email: env.EMAIL_ENABLED ? creerEmailSmtp() : null,
    sms: smsConfigured() ? creerSmsBrevo() : null,
    whatsapp: whatsappConfigured() ? creerWhatsAppCloud() : null,
    expediteurEmail: depuis ? depuis[1]!.trim() : null,
  });
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote", "operateur"]);
  const tenantId = tenantIdDeSession(session);
  const langue = event.cookies.get("lcd_langue") ?? "fr";
  const depot = new DrizzleFilsVoyageurRepository();
  const fil = await depot.trouverParId(tenantId, event.params.id);
  if (!fil) throw error(404, "Fil introuvable.");

  const messages = await depot.listerMessages(tenantId, fil.id);
  const pieces = [];
  for (const message of messages) {
    pieces.push({
      messageId: message.id,
      elements: await depot.listerPiecesJointes(tenantId, message.id),
    });
  }
  const logement = fil.logementId
    ? ((await new DrizzleLogementRepository().listerParTenant(tenantId)).find(
        (l) => l.id === fil.logementId,
      ) ?? null)
    : null;
  const configuration = await lireConfigurationAssistant(
    new DrizzleParametresSiteRepository(),
  );

  return {
    t: traductionsFils(langue),
    fil,
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    messages,
    pieces,
    envoiActif: env.MESSAGES_AUTO_ENABLED,
    assistantActif: configuration.actif,
    traductionActive: env.TRADUCTION_ENABLED && llmConfigured(),
    langueInterface: langue,
    intentions: INTENTIONS_ASSISTANT.map((valeur) => ({
      valeur,
      libelle: LIBELLES_INTENTION[valeur],
    })),
    tons: TONS_ASSISTANT.map((valeur) => ({
      valeur,
      libelle: LIBELLES_TON[valeur],
    })),
    ok: OK[event.url.searchParams.get("ok") ?? ""] ?? null,
  };
};

export const actions: Actions = {
  repondre: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = event.params.id;
    const canal = texte(donnees, "canal") || "email";
    const contenu = texte(donnees, "contenu");
    const sujet = texte(donnees, "sujet");
    const ref = texte(donnees, "ref") || `MSG-${Date.now()}`;
    const brouillonId = texte(donnees, "brouillonId");

    if (!canalValide(canal)) {
      return fail(400, { erreur: "Canal inconnu." });
    }

    const depot = new DrizzleFilsVoyageurRepository();
    const envoyer = new EnvoyerMessageFil(depot, canalMessage());
    const expediteur = session.user?.email ?? null;
    try {
      const resultat = brouillonId
        ? await envoyer.envoyerBrouillon({
            tenantId,
            filId,
            messageId: brouillonId,
            expediteur,
          })
        : await envoyer.executer({
            tenantId,
            filId,
            ref,
            canal,
            contenu,
            ...(sujet ? { sujet } : {}),
            expediteur,
          });
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: brouillonId ? "fil.envoyer-brouillon" : "fil.repondre",
          cible: filId,
          payload: { canal, messageId: resultat.message.id, ref },
        });
      });
      redirect(303, `/hote/messages/fils/${filId}?ok=messageEnvoye`);
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        logErreur("fils.repondre", erreur, { filId, canal });
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }
  },

  pieceJointe: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const messageId = texte(donnees, "messageId");
    const fichier = donnees.get("fichier");
    if (!(fichier instanceof File) || fichier.size === 0) {
      return fail(400, { erreur: "Aucun fichier reçu." });
    }
    const ajouter = new AjouterPieceJointe(
      new DrizzleFilsVoyageurRepository(),
      stockageFichiers(),
    );
    try {
      const piece = await ajouter.executer({
        tenantId,
        messageId,
        nomFichier: fichier.name,
        contentType: fichier.type,
        octets: new Uint8Array(await fichier.arrayBuffer()),
      });
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: "fil.piece-jointe",
          cible: piece.messageId,
          payload: { nomFichier: piece.nomFichier, taille: piece.tailleOctets },
        });
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }
    redirect(303, `/hote/messages/fils/${event.params.id}?ok=pieceJointeAjoutee`);
  },

  assistant: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = event.params.id;
    const intention = texte(donnees, "intention");
    const ton = texte(donnees, "ton");
    const canal = texte(donnees, "canal") || "email";
    const details = texte(donnees, "details");

    const configuration = await lireConfigurationAssistant(
      new DrizzleParametresSiteRepository(),
    );
    if (!configuration.actif) {
      return fail(400, {
        erreur:
          "L’assistant est temporairement désactivé par le super-administrateur.",
      });
    }

    try {
      const resultat = await new RedigerBrouillonFil(
        creerGenerateurBrouillon({
          modeleStandard: configuration.modeleStandard,
          modelePremium: configuration.modelePremium,
        }),
        new DrizzleFilsVoyageurRepository(),
        new DrizzleLogementRepository(),
        new DrizzleConsommationsAssistantRepository(),
      ).executer({
        tenantId,
        filId,
        intention,
        ton,
        canal,
        details,
      });
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: "assistant.fil",
          cible: filId,
          ref: resultat.message.ref,
          payload: {
            messageId: resultat.message.id,
            intention,
            ton,
            canal,
            modele: resultat.modele,
            coutEstimeCentimes: resultat.coutEstimeCentimes,
          },
        });
      });
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        logErreur("fils.assistant", erreur, { filId, intention, ton, canal });
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }
    redirect(
      303,
      `/hote/messages/fils/${filId}?ok=brouillonAssistant`,
    );
  },

  traduire: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    if (!env.TRADUCTION_ENABLED || !llmConfigured()) {
      return fail(400, { erreur: "La traduction n’est pas configurée." });
    }
    const donnees = await event.request.formData();
    const messageId = texte(donnees, "messageId");
    const vers =
      texte(donnees, "vers") ||
      event.cookies.get("lcd_langue") ||
      "fr";
    try {
      const resultat = await new TraduireMessageFil(
        new DrizzleFilsVoyageurRepository(),
        new TraducteurLlm(creerLlmProvider()),
      ).executerMessage({
        tenantId,
        filId: event.params.id,
        messageId,
        vers,
      });
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: "assistant.traduction",
          cible: messageId,
          payload: {
            sens: "entrant",
            langueSource: resultat.langueSource,
            langueCible: resultat.langueCible,
            modele: resultat.modele,
          },
        });
      });
      return { traduction: resultat, contenu: null, erreur: null };
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        logErreur("fils.traduire", erreur, { messageId, vers });
        return fail(400, { erreur: erreur.message });
      }
      throw erreur;
    }
  },

  traduireReponse: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    if (!env.TRADUCTION_ENABLED || !llmConfigured()) {
      return fail(400, { erreur: "La traduction n’est pas configurée." });
    }
    const donnees = await event.request.formData();
    const contenu = texte(donnees, "contenu");
    const de = event.cookies.get("lcd_langue") ?? "fr";
    try {
      const resultat = await new TraduireMessageFil(
        new DrizzleFilsVoyageurRepository(),
        new TraducteurLlm(creerLlmProvider()),
      ).executerBrouillon({
        tenantId,
        filId: event.params.id,
        texte: contenu,
        de,
      });
      await withTenant(tenantId, async (tx) => {
        await tx.insert(auditLogs).values({
          tenantId,
          qui: session.user?.email ?? "inconnu",
          action: "assistant.traduction",
          cible: event.params.id,
          payload: {
            sens: "sortant",
            langueSource: resultat.langueSource,
            langueCible: resultat.langueCible,
            modele: resultat.modele,
          },
        });
      });
      return {
        traductionReponse: resultat,
        contenu,
        erreur: null,
      };
    } catch (erreur) {
      if (erreur instanceof ErreurMetier) {
        logErreur("fils.traduireReponse", erreur, {});
        return fail(400, { erreur: erreur.message, contenu });
      }
      throw erreur;
    }
  },

  consentement: async (event) => {
    const session = requireRole(event, ["admin", "hote", "operateur"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const filId = event.params.id;
    const canal = texte(donnees, "canal") === "whatsapp" ? "whatsapp" : "sms";
    const valeur = texte(donnees, "valeur");
    const depot = new DrizzleFilsVoyageurRepository();
    const fil = await depot.trouverParId(tenantId, filId);
    if (!fil) throw error(404, "Fil introuvable.");
    const consentements: ConsentementsFil =
      valeur === "accorde"
        ? { ...fil.consentements, [canal]: true }
        : appliquerOptout(fil.consentements, canal);
    await depot.mettreAJour(tenantId, filId, { consentements });
    await withTenant(tenantId, async (tx) => {
      await tx.insert(auditLogs).values({
        tenantId,
        qui: session.user?.email ?? "inconnu",
        action: "fil.consentement",
        cible: filId,
        payload: { canal, valeur },
      });
    });
    redirect(303, `/hote/messages/fils/${filId}?ok=optoutFait`);
  },
};
