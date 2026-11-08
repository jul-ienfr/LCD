import { ErreurMetier } from "@/domain/erreurs";
import {
  canalValide,
  consentementAutorise,
  type CanalFil,
  type FilVoyageur,
} from "@/domain/fil-voyageur";
import type { CanalMessagePort } from "../ports/canal-message-port";
import type {
  FilsVoyageurRepository,
  MessageFil,
} from "../ports/fils-voyageur-repository";

/** Canaux qu'un envoi direct depuis l'inbox peut emprunter. */
export const CANAUX_ENVOI_DIRECT: readonly CanalFil[] = ["email", "sms", "whatsapp"];

export const CONTENU_FIL_MIN = 10;
export const CONTENU_FIL_MAX = 4000;

export interface EnvoyerMessageFilInput {
  tenantId: string;
  filId: string;
  ref: string;
  canal: string;
  contenu: string;
  sujet?: string | null;
  expediteur?: string | null;
}

export interface ResultatEnvoi {
  message: MessageFil;
  dejaEnvoye: boolean;
}

export function refEnvoiValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function destinataireDuCanal(
  fil: FilVoyageur,
  canal: CanalFil,
): string | null {
  if (canal === "email") return fil.voyageurEmail;
  if (canal === "sms" || canal === "whatsapp") return fil.voyageurTelephone;
  return null;
}

/**
 * Envoie un message dans le fil d'un voyageur : contrôle le consentement du
 * canal, choisit le destinataire, puis délègue l'envoi au connecteur.
 * Le rejeu avec la même `ref` ne renvoie pas le message une seconde fois.
 */
export class EnvoyerMessageFil {
  constructor(
    private readonly fils: FilsVoyageurRepository,
    private readonly canal: CanalMessagePort,
  ) {}

  async executer(input: EnvoyerMessageFilInput): Promise<ResultatEnvoi> {
    if (!refEnvoiValide(input.ref)) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "La référence est invalide.");
    }
    if (!canalValide(input.canal)) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Canal inconnu.");
    }
    const canal = input.canal;
    if (!CANAUX_ENVOI_DIRECT.includes(canal)) {
      throw new ErreurMetier(
        "MESSAGE_INVALIDE",
        "Ce canal ne peut pas être envoyé depuis l'inbox.",
      );
    }
    const contenu = input.contenu.trim();
    if (contenu.length < CONTENU_FIL_MIN || contenu.length > CONTENU_FIL_MAX) {
      throw new ErreurMetier(
        "MESSAGE_INVALIDE",
        `Le message doit contenir ${CONTENU_FIL_MIN} à ${CONTENU_FIL_MAX} caractères.`,
      );
    }

    const fil = await this.fils.trouverParId(input.tenantId, input.filId);
    if (!fil) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Le fil voyageur est introuvable.");
    }
    if (!consentementAutorise(fil.consentements, canal)) {
      throw new ErreurMetier(
        "CONSENTEMENT_REQUIS",
        "Le voyageur n'a pas consenti à ce canal (opt-out).",
      );
    }
    const destinataire = destinataireDuCanal(fil, canal);
    if (!destinataire) {
      throw new ErreurMetier(
        "MESSAGE_INVALIDE",
        canal === "email"
          ? "Le fil n'a pas d'adresse email."
          : "Le fil n'a pas de numéro de téléphone.",
      );
    }

    const existant = await this.fils.trouverMessageParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return { message: existant, dejaEnvoye: true };

    const envoi = await this.canal.envoyer({
      canal: canal as "email" | "sms" | "whatsapp",
      destinataire,
      sujet: input.sujet ?? null,
      contenu,
      ref: input.ref,
      expediteur: input.expediteur ?? null,
    });

    const message = await this.fils.creerMessage({
      tenantId: input.tenantId,
      filId: fil.id,
      ref: input.ref,
      canal,
      sens: "sortant",
      contenu,
      destinataire,
      expediteur: input.expediteur ?? null,
      externalId: envoi.externalId,
      statut: envoi.statut,
      envoyeAt: new Date(),
    });

    await this.fils.mettreAJour(input.tenantId, fil.id, {
      dernierMessageAt: message.createdAt,
      statut: "en_attente",
    });

    return { message, dejaEnvoye: false };
  }
}
