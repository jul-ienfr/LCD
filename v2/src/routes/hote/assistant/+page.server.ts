import { isRedirect, redirect } from "@sveltejs/kit";
import {
  BUDGET_ASSISTANT_MENSUEL_CENTIMES,
  compterMots,
  debutMois,
  INTENTIONS_ASSISTANT,
  LIBELLES_INTENTION,
  LIBELLES_TON,
  MOTS_BROUILLON_MAX,
  QUOTA_ASSISTANT_MENSUEL,
  TONS_ASSISTANT,
  intentionValide,
  tonValide,
  type TonAssistant,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import { EnregistrerBrouillonAssistant } from "@/application/use-cases/enregistrer-brouillon";
import { PreparerMessageVoyageur } from "@/application/use-cases/message-voyageur";
import { RedigerBrouillon } from "@/application/use-cases/assistant";
import { lireConfigurationAssistant } from "@/application/use-cases/configuration-assistant";
import { creerGenerateurBrouillon } from "@/infrastructure/adapters/generateur-brouillon";
import { withTenant } from "@/infrastructure/db/client";
import { DrizzleConsommationsAssistantRepository } from "@/infrastructure/db/repositories/consommations-assistant-repository";
import { DrizzleLogementRepository } from "@/infrastructure/db/repositories/logement-repository";
import { DrizzleMessagesVoyageurRepository } from "@/infrastructure/db/repositories/messages-voyageur-repository";
import { DrizzleParametresSiteRepository } from "@/infrastructure/db/repositories/parametres-site-repository";
import { auditLogs } from "@/infrastructure/db/schema";
import { formaterEuros } from "@/lib/format";
import { traductionsCommunication } from "@/lib/i18n-communication";
import { logErreur } from "@/lib/logger";
import { requireRole, tenantIdDeSession } from "@/lib/server/session";
import type { Actions, PageServerLoad } from "./$types";

function coutLibelle(centimes: number): string {
  return centimes === 0 ? "Gratuit (local)" : formaterEuros(centimes);
}

export const load: PageServerLoad = async (event) => {
  const session = requireRole(event, ["admin", "hote"]);
  const tenantId = tenantIdDeSession(session);
  const params = event.url.searchParams;
  const logements = await new DrizzleLogementRepository().listerParTenant(tenantId);
  const logement = logements.find((entree) => entree.id === params.get("logement")) ?? logements[0];
  const consomme = await new DrizzleConsommationsAssistantRepository().totalMois(
    tenantId,
    debutMois(new Date()),
  );
  const configuration = await lireConfigurationAssistant(
    new DrizzleParametresSiteRepository(),
  );

  const intention = params.get("intention") ?? "arrivee";
  const tonDemande = params.get("ton") ?? "chaleureux";
  const voyageur = params.get("voyageur") ?? "";
  const details = params.get("details") ?? "";
  const comparaison = params.get("comparer") === "1";
  const cartes: {
    ton: TonAssistant;
    tonLibelle: string;
    texte: string;
    modele: string;
    cout: string;
    mots: number;
    invite: string;
    alertes: string[];
  }[] = [];
  let erreur = params.get("erreur");

  if (logement && params.has("intention")) {
    if (!configuration.actif) {
      erreur =
        "L’assistant est temporairement désactivé par le super-administrateur.";
    } else if (!intentionValide(intention)) {
      erreur = "L’intention est invalide.";
    } else {
      const tons: TonAssistant[] = comparaison
        ? [...TONS_ASSISTANT]
        : tonValide(tonDemande)
          ? [tonDemande]
          : [];
      try {
        for (const ton of tons) {
          const brouillon = await new RedigerBrouillon(
            creerGenerateurBrouillon({
              modeleStandard: configuration.modeleStandard,
              modelePremium: configuration.modelePremium,
            }),
            new DrizzleLogementRepository(),
          ).executer({
            tenantId,
            logementId: logement.id,
            intention,
            ton,
            voyageur,
            details,
          });
          cartes.push({
            ton,
            tonLibelle: LIBELLES_TON[ton],
            texte: brouillon.texte,
            modele: brouillon.modele,
            cout: coutLibelle(brouillon.coutEstimeCentimes),
            mots: compterMots(brouillon.texte),
            invite: brouillon.invite,
            alertes: brouillon.alertes,
          });
        }
      } catch (error) {
        if (isRedirect(error)) throw error;
        if (error instanceof ErreurMetier) {
          erreur = error.message;
          cartes.length = 0;
        } else {
          throw error;
        }
      }
    }
  }

  const quotaAtteint =
    consomme.nombre >= QUOTA_ASSISTANT_MENSUEL ||
    consomme.coutCentimes >= BUDGET_ASSISTANT_MENSUEL_CENTIMES;

  return {
    t: traductionsCommunication(event.cookies.get("lcd_langue") ?? "fr"),
    logements: logements.map((entree) => ({ id: entree.id, nom: entree.nom })),
    logement: logement ? { id: logement.id, nom: logement.nom } : null,
    intentions: INTENTIONS_ASSISTANT.map((valeur) => ({
      valeur,
      libelle: LIBELLES_INTENTION[valeur],
    })),
    tons: TONS_ASSISTANT.map((valeur) => ({ valeur, libelle: LIBELLES_TON[valeur] })),
    intention: intentionValide(intention) ? intention : "arrivee",
    ton: tonValide(tonDemande) ? tonDemande : "chaleureux",
    voyageur,
    details,
    comparaison,
    cartes,
    erreur,
    quotaAtteint,
    assistantActif: configuration.actif,
    consommation: {
      nombre: consomme.nombre,
      quota: QUOTA_ASSISTANT_MENSUEL,
      cout: formaterEuros(consomme.coutCentimes),
      budget: formaterEuros(BUDGET_ASSISTANT_MENSUEL_CENTIMES),
    },
    maxMots: MOTS_BROUILLON_MAX,
  };
};

export const actions = {
  enregistrer: async (event) => {
    const session = requireRole(event, ["admin", "hote"]);
    const tenantId = tenantIdDeSession(session);
    const donnees = await event.request.formData();
    const logementId = String(donnees.get("logementId") ?? "");
    const intention = String(donnees.get("intention") ?? "");
    const ton = String(donnees.get("ton") ?? "");
    const canal = String(donnees.get("canal") ?? "");
    const destinataire = String(donnees.get("destinataire") ?? "");
    const telephone = String(donnees.get("telephone") ?? "");
    const voyageur = String(donnees.get("voyageur") ?? "");
    const details = String(donnees.get("details") ?? "");
    const texte = String(donnees.get("texte") ?? "");

    function retour(erreur: string): never {
      const query = new URLSearchParams({ logement: logementId, intention, ton, voyageur, details, erreur });
      redirect(303, `/hote/assistant?${query.toString()}`);
    }

    try {
      const brouillon = new EnregistrerBrouillonAssistant(
        new PreparerMessageVoyageur(
          new DrizzleMessagesVoyageurRepository(),
          new DrizzleLogementRepository(),
        ),
        new DrizzleMessagesVoyageurRepository(),
        new DrizzleConsommationsAssistantRepository(),
      );
      const message = await brouillon.executer({
        tenantId,
        logementId,
        intention,
        ton,
        canal,
        destinataire: canal === "sms" ? telephone : destinataire,
        voyageur,
        details,
        texte,
      });

      await withTenant(tenantId, (tx) =>
        tx.insert(auditLogs).values({
          tenantId,
          qui: session.user.id,
          action: "assistant.enregistrer",
          cible: message.id,
          ref: message.ref,
          payload: { intention, ton, canal, type: message.type },
        }),
      );
    } catch (error) {
      if (isRedirect(error)) throw error;
      if (error instanceof ErreurMetier) {
        retour(error.message);
      }
      logErreur("assistant.enregistrer", error, { tenantId, logementId });
      retour("Erreur inattendue. Réessayez.");
    }

    redirect(303, `/hote/messages?logement=${encodeURIComponent(logementId)}&ok=prepare`);
  },
} satisfies Actions;
