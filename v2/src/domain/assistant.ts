import { contientCodeSensible } from "./message-voyageur";
import type { TypeMessageVoyageur } from "./message-voyageur";
import { ErreurMetier } from "./erreurs";

export type IntentionAssistant =
  | "arrivee"
  | "depart"
  | "retard"
  | "menage"
  | "avis";
export type TonAssistant = "chaleureux" | "neutre" | "concis";
export type NiveauModele = "local" | "standard" | "premium";

export const INTENTIONS_ASSISTANT: readonly IntentionAssistant[] = [
  "arrivee",
  "depart",
  "retard",
  "menage",
  "avis",
];

export const LIBELLES_INTENTION: Record<IntentionAssistant, string> = {
  arrivee: "Message d’arrivée",
  depart: "Consignes de départ",
  retard: "Retard ou imprévu",
  menage: "Ménage et linge",
  avis: "Demande d’avis",
};

export const TONS_ASSISTANT: readonly TonAssistant[] = [
  "chaleureux",
  "neutre",
  "concis",
];

export const LIBELLES_TON: Record<TonAssistant, string> = {
  chaleureux: "Chaleureux",
  neutre: "Neutre",
  concis: "Concis",
};

export const DETAILS_ASSISTANT_MAX = 400;
export const VOYAGEUR_ASSISTANT_MAX = 80;

export const MODELES: Record<NiveauModele, string> = {
  local: "local-léger",
  standard: "standard",
  premium: "premium",
};

export const COUT_ESTIME_CENTIMES: Record<NiveauModele, number> = {
  local: 0,
  standard: 2,
  premium: 8,
};

export function intentionValide(
  valeur: string,
): valeur is IntentionAssistant {
  return (INTENTIONS_ASSISTANT as readonly string[]).includes(valeur);
}

export function tonValide(valeur: string): valeur is TonAssistant {
  return (TONS_ASSISTANT as readonly string[]).includes(valeur);
}

export interface Routage {
  niveau: NiveauModele;
  modele: string;
  raison: string;
  coutEstimeCentimes: number;
}

export function routerModele(
  intention: IntentionAssistant,
  ton: TonAssistant,
): Routage {
  let niveau: NiveauModele = "local";
  let raison = "Message court et factuel : le modèle local suffit.";

  if (intention === "avis" || intention === "retard") {
    niveau = "standard";
    raison = "Message sensible (relation ou imprévu) : ton à soigner.";
  }
  if (ton === "chaleureux" && intention !== "menage") {
    niveau = "standard";
    raison = "Ton chaleureux demandé : passage par le modèle standard.";
  }
  if (intention === "avis" && ton === "chaleureux") {
    niveau = "premium";
    raison = "Relance d’avis personnalisée : modèle premium pour la nuance.";
  }

  return {
    niveau,
    modele: MODELES[niveau],
    raison,
    coutEstimeCentimes: COUT_ESTIME_CENTIMES[niveau],
  };
}

export function construireInvite(input: {
  intention: IntentionAssistant;
  ton: TonAssistant;
  logement: string;
  voyageur: string;
  details: string;
}): string {
  const logement = input.logement.trim();
  if (!logement) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      "Le logement est requis pour rédiger un brouillon.",
    );
  }
  const voyageur = input.voyageur.trim();
  if (voyageur.length > VOYAGEUR_ASSISTANT_MAX) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      `Le prénom du voyageur est limité à ${VOYAGEUR_ASSISTANT_MAX} caractères.`,
    );
  }
  const details = input.details.trim();
  if (details.length > DETAILS_ASSISTANT_MAX) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      `Les détails sont limités à ${DETAILS_ASSISTANT_MAX} caractères.`,
    );
  }
  if (contientCodeSensible(details)) {
    throw new ErreurMetier(
      "ASSISTANT_INVALIDE",
      "Ne jamais inclure de code d’accès (PIN) dans un brouillon.",
    );
  }

  return [
    "Tu rédiges un message pour un voyageur d’une location courte durée.",
    `Intention : ${LIBELLES_INTENTION[input.intention]}.`,
    `Ton : ${LIBELLES_TON[input.ton]}.`,
    `Logement : ${logement}.`,
    voyageur ? `Voyageur : ${voyageur}.` : "",
    details ? `Éléments à intégrer : ${details}.` : "",
    "Contraintes : français, 80 mots maximum, aucune donnée sensible,",
    "aucun code d’accès, aucun prix non confirmé, pas d’emoji.",
    "Réponds uniquement par le message final.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function typeMessageDepuisIntention(
  intention: IntentionAssistant,
): TypeMessageVoyageur {
  if (intention === "arrivee") return "arrivee";
  if (intention === "depart") return "depart";
  return "autre";
}

function empreinte(texte: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < texte.length; index += 1) {
    hash ^= texte.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Référence stable : ré-enregistrer un brouillon identique renvoie le message
 * existant au lieu de créer un doublon dans l’outbox.
 */
export function refBrouillon(input: {
  logementId: string;
  intention: IntentionAssistant;
  ton: TonAssistant;
  canal: string;
  voyageur: string;
  details: string;
  texte: string;
}): string {
  const signature = [
    input.logementId,
    input.intention,
    input.ton,
    input.canal,
    input.voyageur.trim(),
    input.details.trim(),
    input.texte.trim(),
  ].join("|");
  return `assist-${input.intention}-${empreinte(signature)}`;
}
