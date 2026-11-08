import { ErreurMetier } from "./erreurs";

/** Tous les canaux qu'un fil peut contenir. */
export type CanalFil = "email" | "sms" | "ota" | "whatsapp" | "interne";

export const CANAUX_FIL: readonly CanalFil[] = [
  "email",
  "sms",
  "ota",
  "whatsapp",
  "interne",
];

export const LIBELLES_CANAL_FIL: Record<CanalFil, string> = {
  email: "E-mail",
  sms: "SMS",
  ota: "Plateforme (OTA)",
  whatsapp: "WhatsApp",
  interne: "Interne",
};

/** Canaux pour lesquels un consentement du voyageur est requis. */
export const CANAUX_SOUMIS_CONSENTEMENT: readonly CanalFil[] = [
  "sms",
  "whatsapp",
];

export type StatutFil = "ouvert" | "en_attente" | "clos";

export const STATUTS_FIL: readonly StatutFil[] = [
  "ouvert",
  "en_attente",
  "clos",
];

export const LIBELLES_STATUT_FIL: Record<StatutFil, string> = {
  ouvert: "Ouvert",
  en_attente: "En attente du voyageur",
  clos: "Clos",
};

export type SensMessage = "entrant" | "sortant";

export interface ConsentementsFil {
  email: boolean;
  sms: boolean;
  whatsapp: boolean;
}

export const CONSENTEMENTS_DEFAUT: ConsentementsFil = {
  email: true,
  sms: false,
  whatsapp: false,
};

export interface FilVoyageur {
  id: string;
  tenantId: string;
  logementId: string | null;
  reservationId: string | null;
  voyageurNom: string;
  voyageurEmail: string | null;
  voyageurTelephone: string | null;
  langue: string;
  cleRegroupement: string;
  consentements: ConsentementsFil;
  statut: StatutFil;
  dernierMessageAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApercuFil {
  fil: FilVoyageur;
  dernierContenu: string | null;
  dernierCanal: CanalFil | null;
  nombreMessages: number;
  nonLus: number;
}

export const APERCU_MAX = 140;

/** Clé de regroupement canonique d'un contact, quel que soit le canal. */
export function cleRegroupement(contact: {
  email?: string | null;
  telephone?: string | null;
  externalId?: string | null;
}): string {
  if (contact.externalId?.trim()) {
    return `ext:${contact.externalId.trim().toLowerCase().slice(0, 80)}`;
  }
  const email = contact.email?.trim().toLowerCase() ?? "";
  if (email) return `email:${email.slice(0, 120)}`;
  const telephone = (contact.telephone ?? "").replace(/[\s.\-()]/g, "");
  if (telephone) return `tel:${telephone.slice(0, 20)}`;
  return "";
}

/**
 * Regroupe un message entrant dans un fil existant : même clé, ou même email
 * ou même téléphone. Un contact sans clé exploitable ne rejoint jamais un fil.
 */
export function memeContact(
  fil: FilVoyageur,
  contact: {
    email?: string | null;
    telephone?: string | null;
    externalId?: string | null;
  },
): boolean {
  const cle = cleRegroupement(contact);
  if (!cle) return false;
  if (fil.cleRegroupement === cle) return true;
  const email = contact.email?.trim().toLowerCase() ?? "";
  if (email && fil.voyageurEmail?.toLowerCase() === email) return true;
  const telephone = (contact.telephone ?? "").replace(/[\s.\-()]/g, "");
  if (telephone && fil.voyageurTelephone === telephone) return true;
  return false;
}

export function apercu(contenu: string): string {
  const propre = contenu.replace(/\s+/g, " ").trim();
  return propre.length > APERCU_MAX ? `${propre.slice(0, APERCU_MAX - 1)}…` : propre;
}

export function consentementAutorise(
  consentements: ConsentementsFil,
  canal: CanalFil,
): boolean {
  if (!CANAUX_SOUMIS_CONSENTEMENT.includes(canal)) return true;
  if (canal === "sms") return consentements.sms;
  if (canal === "whatsapp") return consentements.whatsapp;
  return true;
}

const MOTIFS_OPTOUT = [
  /\bstop\b/i,
  /\barr[êe]t(e|ez)?\b/i,
  /\bd[ée]sabonn/i,
  /\bunsubscribe\b/i,
  /\bopt[\s-]?out\b/i,
];

/** Détecte un refus explicite du voyageur (SMS entrant). */
export function messageEstOptout(contenu: string): boolean {
  return MOTIFS_OPTOUT.some((motif) => motif.test(contenu));
}

/**
 * Applique un opt-out : le canal concerné est refusé, l'email de service
 * reste permis (transactions de la réservation).
 */
export function appliquerOptout(
  consentements: ConsentementsFil,
  canal: CanalFil,
): ConsentementsFil {
  return {
    ...consentements,
    sms: canal === "sms" ? false : consentements.sms,
    whatsapp: canal === "whatsapp" ? false : consentements.whatsapp,
  };
}

export function canalValide(canal: string): canal is CanalFil {
  return (CANAUX_FIL as readonly string[]).includes(canal);
}

export function statutFilValide(statut: string): statut is StatutFil {
  return (STATUTS_FIL as readonly string[]).includes(statut);
}

export function validerFilVoyageur(input: {
  voyageurNom: string;
  voyageurEmail?: string | null;
  voyageurTelephone?: string | null;
  externalId?: string | null;
  langue?: string;
}): void {
  const nom = input.voyageurNom.trim();
  if (nom.length < 2 || nom.length > 120) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Le nom du voyageur doit contenir 2 à 120 caractères.",
    );
  }
  const email = input.voyageurEmail?.trim() ?? "";
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ErreurMetier("MESSAGE_INVALIDE", "Adresse email du voyageur invalide.");
  }
  const telephone = (input.voyageurTelephone ?? "").replace(/[\s.\-()]/g, "");
  if (telephone && !/^\+?\d{6,15}$/.test(telephone)) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Numéro de téléphone du voyageur invalide.",
    );
  }
  if (!cleRegroupement({ email, telephone, externalId: input.externalId })) {
    throw new ErreurMetier(
      "MESSAGE_INVALIDE",
      "Un fil exige un email, un téléphone ou un identifiant externe.",
    );
  }
  const langue = input.langue?.trim() ?? "";
  if (langue && !/^[a-z]{2}$/.test(langue)) {
    throw new ErreurMetier("MESSAGE_INVALIDE", "Langue du fil invalide.");
  }
}
