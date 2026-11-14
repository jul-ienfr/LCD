import {
  budgetAssistantAutorise,
  construireInviteFil,
  debutMois,
  intentionValide,
  quotaHoraireAutorise,
  refBrouillon,
  routerModele,
  tonValide,
  verifierBrouillon,
  type IntentionAssistant,
  type TonAssistant,
} from "@/domain/assistant";
import { ErreurMetier } from "@/domain/erreurs";
import { canalValide, type CanalFil } from "@/domain/fil-voyageur";
import type { ConsommationsAssistantRepository } from "../ports/consommations-assistant-repository";
import type { FilsVoyageurRepository, MessageFil } from "../ports/fils-voyageur-repository";
import type { GenerateurBrouillon } from "../ports/generateur-brouillon";
import type { LogementRepository } from "../ports/logement-repository";

export interface RedigerBrouillonFilInput {
  tenantId: string;
  filId: string;
  intention: string;
  ton: string;
  canal: string;
  details?: string;
}

export interface BrouillonFil {
  message: MessageFil;
  modele: string;
  coutEstimeCentimes: number;
  invite: string;
  alertes: string[];
}

/**
 * Rédige un brouillon contextualisé par le fil voyageur et l'ajoute au fil
 * (jamais envoyé). Le brouillon reste validable par un humain depuis l'inbox.
 */
export class RedigerBrouillonFil {
  constructor(
    private readonly generateur: GenerateurBrouillon,
    private readonly fils: FilsVoyageurRepository,
    private readonly logements: LogementRepository,
    private readonly consommations: ConsommationsAssistantRepository,
  ) {}

  async executer(input: RedigerBrouillonFilInput): Promise<BrouillonFil> {
    if (!intentionValide(input.intention)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "L’intention est invalide.");
    }
    if (!tonValide(input.ton)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "Le ton est invalide.");
    }
    if (!canalValide(input.canal)) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", "Le canal est invalide.");
    }
    if (!["email", "sms", "whatsapp"].includes(input.canal)) {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Le canal de l’assistant est invalide.",
      );
    }
    const intention: IntentionAssistant = input.intention;
    const ton: TonAssistant = input.ton;
    const canal: CanalFil = input.canal as CanalFil;

    const fil = await this.fils.trouverParId(input.tenantId, input.filId);
    if (!fil) {
      throw new ErreurMetier("FIL_INTROUVABLE", "Le fil est introuvable.");
    }
    if (fil.statut === "clos") {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Impossible de rédiger un brouillon sur un fil clos.",
      );
    }
    if (!fil.logementId) {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Le fil doit être rattaché à un logement.",
      );
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      fil.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "ASSISTANT_INVALIDE",
        "Le logement du fil est introuvable.",
      );
    }

    const messages = await this.fils.listerMessages(input.tenantId, fil.id);
    const messagesUtiles = messages.filter(
      (message) => message.statut !== "brouillon",
    );
    const historique = messagesUtiles.map((message) => ({
      sens: message.sens,
      contenu: message.contenu,
    }));
    const details = (input.details ?? "").trim();
    const invite = construireInviteFil({
      intention,
      ton,
      logement: logement.nom,
      voyageur: fil.voyageurNom,
      details,
      historique,
    });
    const routage = routerModele(intention, ton);

    const recentes = await this.consommations.compterDepuis(
      input.tenantId,
      new Date(Date.now() - 60 * 60 * 1_000),
    );
    const horaire = quotaHoraireAutorise(recentes);
    if (!horaire.autorise) {
      throw new ErreurMetier("ASSISTANT_QUOTA", horaire.raison);
    }

    const brouillon = await this.generateur.generer({
      invite,
      intention,
      ton,
      niveau: routage.niveau,
      logement: logement.nom,
      voyageur: fil.voyageurNom,
      details,
    });
    const alertes = verifierBrouillon(brouillon.texte);
    if (alertes.length > 0) {
      throw new ErreurMetier("ASSISTANT_INVALIDE", alertes[0]!);
    }

    const ref = refBrouillon({
      logementId: fil.logementId,
      intention,
      ton,
      canal,
      voyageur: fil.voyageurNom,
      details: `${details}|${messagesUtiles.at(-1)?.id ?? ""}`,
      texte: brouillon.texte,
    });
    const existant = await this.fils.trouverMessageParRef(
      input.tenantId,
      ref,
    );
    if (existant) {
      return {
        message: existant,
        modele: brouillon.modele,
        coutEstimeCentimes: 0,
        invite,
        alertes,
      };
    }

    const consomme = await this.consommations.totalMois(
      input.tenantId,
      debutMois(),
    );
    const verdict = budgetAssistantAutorise(
      consomme,
      routage.coutEstimeCentimes,
    );
    if (!verdict.autorise) {
      throw new ErreurMetier("ASSISTANT_QUOTA", verdict.raison);
    }

    const destinataire =
      canal === "sms" || canal === "whatsapp"
        ? (fil.voyageurTelephone ?? "")
        : (fil.voyageurEmail ?? "");
    const message = await this.fils.creerMessage({
      tenantId: input.tenantId,
      filId: fil.id,
      ref,
      canal,
      sens: "sortant",
      contenu: brouillon.texte,
      destinataire,
      statut: "brouillon",
    });
    await this.consommations.enregistrer({
      tenantId: input.tenantId,
      messageId: message.id,
      modele: routage.modele,
      coutCentimes: routage.coutEstimeCentimes,
    });

    return {
      message,
      modele: brouillon.modele,
      coutEstimeCentimes: routage.coutEstimeCentimes,
      invite,
      alertes,
    };
  }
}
