import { ErreurMetier } from "./erreurs";

export type CanalMessage = "email" | "sms";
export type TypeMessageVoyageur = "j1" | "arrivee" | "depart" | "autre";
export type StatutMessageVoyageur = "brouillon" | "envoye";

export const CANAUX_MESSAGE: readonly CanalMessage[] = ["email", "sms"];

export const LIBELLES_CANAL: Record<CanalMessage, string> = {
  email: "E-mail",
  sms: "SMS",
};

export const TYPES_MESSAGE_VOYAGEUR: readonly TypeMessageVoyageur[] = [
  "j1",
  "arrivee",
  "depart",
  "autre",
];

export const LIBELLES_TYPE_MESSAGE: Record<TypeMessageVoyageur, string> = {
  j1: "J-1",
  arrivee: "Arrivée",
  depart: "Départ",
  autre: "Autre",
};

export const CONTENU_MESSAGE_MIN = 10;
export const CONTENU_MESSAGE_MAX = 1200;
export const DESTINATAIRE_MAX = 254;

export interface MessageVoyageur {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  canal: CanalMessage;
  destinataire: string | null;
  type: TypeMessageVoyageur;
  contenu: string;
  statut: StatutMessageVoyageur;
  envoyeAt: Date | null;
  createdAt: Date;
}

export function refMessageValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function emailValide(email: string): boolean {
  return (
    email.length <= DESTINATAIRE_MAX &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  );
}

export function sujetMessage(type: TypeMessageVoyageur): string {
  return `Votre séjour — ${LIBELLES_TYPE_MESSAGE[type]}`;
}

export function canalValide(canal: string): canal is CanalMessage {
  return (CANAUX_MESSAGE as readonly string[]).includes(canal);
}

export function typeMessageValide(
  type: string,
): type is TypeMessageVoyageur {
  return (TYPES_MESSAGE_VOYAGEUR as readonly string[]).includes(type);
}

/**
 * Un code d’accès ne doit jamais partir par message : il est communiqué par un
 * canal vérifié, jamais par SMS ou e-mail J-1. On cible les mentions explicites
 * (code, PIN, accès, boîte, clé) suivies de 4 à 8 chiffres, sans bloquer les
 * dates, montants ou numéros d’enregistrement.
 */
export function contientCodeSensible(texte: string): boolean {
  return /(?:code|pin|acc[èe]s|bo[îi]te|cl[ée])[^\d]{0,20}\d{4,8}(?!\d)/i.test(
    texte,
  );
}

export function validerMessage(input: {
  canal: string;
  type: string;
  contenu: string;
  destinataire?: string;
}): {
  canal: CanalMessage;
  type: TypeMessageVoyageur;
  contenu: string;
  destinataire: string | null;
} {
  if (!canalValide(input.canal)) {
    throw new ErreurMetier("MESSAGE_INVALIDE", "Le canal est invalide.");
  }
  if (!typeMessageValide(input.type)) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Le type de message est invalide.",
    );
  }
  const contenu = input.contenu.trim();
  if (
    contenu.length < CONTENU_MESSAGE_MIN ||
    contenu.length > CONTENU_MESSAGE_MAX
  ) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      `Le message doit contenir ${CONTENU_MESSAGE_MIN} à ${CONTENU_MESSAGE_MAX} caractères.`,
    );
  }
  if (contientCodeSensible(contenu)) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Ne jamais inclure de code d’accès (PIN) dans un message voyageur.",
    );
  }
  const destinataire = (input.destinataire ?? "").trim();
  if (destinataire && !emailValide(destinataire)) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "L’adresse e-mail du voyageur est invalide.",
    );
  }
  return {
    canal: input.canal,
    type: input.type,
    contenu,
    destinataire: destinataire || null,
  };
}

export function envoyerMessage(statut: StatutMessageVoyageur): {
  statut: "envoye";
  envoyeAt: Date;
} {
  if (statut !== "brouillon") {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Ce message a déjà été envoyé.",
    );
  }
  return { statut: "envoye", envoyeAt: new Date() };
}
