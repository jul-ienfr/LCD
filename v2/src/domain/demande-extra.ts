// Demandes d'extras du voyageur : domaine pur, sans dépendance externe.
// Une demande est *proposée* par le voyageur ; un humain du staff la valide ou
// la refuse, puis la facturation est marquée explicitement.
import { ErreurMetier } from "./erreurs";
import {
  PLANCHER_ABSOLU_CENTIMES,
  PLAFOND_ABSOLU_CENTIMES,
  bornerPrix,
} from "./recommandation-prix";

export const TYPES_EXTRA = [
  "depart-tardif",
  "arrivee-anticipee",
  "lit-bebe",
  "menage-supplementaire",
  "transfert",
  "autre",
] as const;
export type TypeExtra = (typeof TYPES_EXTRA)[number];

/** Libellés français affichés au voyageur et au staff. */
export const LIBELLES_EXTRA: Record<TypeExtra, string> = {
  "depart-tardif": "Départ tardif",
  "arrivee-anticipee": "Arrivée anticipée",
  "lit-bebe": "Lit bébé",
  "menage-supplementaire": "Ménage supplémentaire",
  transfert: "Transfert",
  autre: "Autre demande",
};

export type StatutDemandeExtra = "demande" | "validee" | "refusee" | "facturee";

/** Plafond d'un extra : 1 000 €. */
export const PRIX_EXTRA_MAX_CENTIMES = 100_000;

/** Longueur maximale du message du voyageur. */
export const MESSAGE_EXTRA_MAX = 1000;

/** Longueur minimale d'un motif de refus. */
export const MOTIF_REFUS_MIN = 10;

/** Arrondi commercial des suppléments : multiples de 50 centimes. */
export const PAS_ARRONDI_EXTRA_CENTIMES = 50;

/** Supplément par défaut d'un départ tardif : 50 % d'une nuit. */
export const POURCENTAGE_DEPART_TARDIF = 50;

/** Supplément par défaut d'une arrivée anticipée : 30 % d'une nuit. */
export const POURCENTAGE_ARRIVEE_ANTICIPEE = 30;

export interface DemandeExtra {
  id: string;
  ref: string;
  reservationId: string;
  logementId: string;
  type: TypeExtra;
  prixCentimes: number;
  message: string | null;
  statut: StatutDemandeExtra;
  creeLe: string;
  decideeLe: string | null;
  decideePar: string | null;
  motifRefus: string | null;
}

/** Vrai si la valeur est un type d'extra connu. */
export function typeExtraValide(valeur: string): valeur is TypeExtra {
  return (TYPES_EXTRA as readonly string[]).includes(valeur);
}

function entierPositif(valeur: number): boolean {
  return Number.isInteger(valeur) && valeur > 0;
}

function texteRenseigne(valeur: string | null): boolean {
  return typeof valeur === "string" && valeur.trim().length > 0;
}

/** Arrondit au multiple de 50 centimes supérieur ou égal. */
function arrondirAuMultipleSuperieur(valeur: number): number {
  return Math.ceil(valeur / PAS_ARRONDI_EXTRA_CENTIMES) * PAS_ARRONDI_EXTRA_CENTIMES;
}

/**
 * Supplément d'un départ tardif : part du prix d'une nuit, arrondie au
 * multiple de 50 centimes supérieur ou égal puis bornée par le cadre absolu.
 */
export function prixDepartTardif(
  prixNuitCentimes: number,
  pourcentage = POURCENTAGE_DEPART_TARDIF,
): number {
  if (!entierPositif(prixNuitCentimes)) {
    throw new ErreurMetier(
      "PRIX_INVALIDE",
      "Le prix d'une nuit doit être un entier de centimes positif.",
    );
  }
  if (!Number.isFinite(pourcentage) || pourcentage <= 0 || pourcentage > 200) {
    throw new ErreurMetier(
      "PRIX_INVALIDE",
      "Le pourcentage doit être strictement positif et au plus égal à 200.",
    );
  }
  return bornerPrix(
    arrondirAuMultipleSuperieur((prixNuitCentimes * pourcentage) / 100),
    {
      minCentimes: PLANCHER_ABSOLU_CENTIMES,
      maxCentimes: PLAFOND_ABSOLU_CENTIMES,
    },
  );
}

/** Supplément d'une arrivée anticipée : même logique que le départ tardif. */
export function prixArriveeAnticipee(
  prixNuitCentimes: number,
  pourcentage = POURCENTAGE_ARRIVEE_ANTICIPEE,
): number {
  if (!entierPositif(prixNuitCentimes)) {
    throw new ErreurMetier(
      "PRIX_INVALIDE",
      "Le prix d'une nuit doit être un entier de centimes positif.",
    );
  }
  if (!Number.isFinite(pourcentage) || pourcentage <= 0 || pourcentage > 200) {
    throw new ErreurMetier(
      "PRIX_INVALIDE",
      "Le pourcentage doit être strictement positif et au plus égal à 200.",
    );
  }
  return bornerPrix(
    arrondirAuMultipleSuperieur((prixNuitCentimes * pourcentage) / 100),
    {
      minCentimes: PLANCHER_ABSOLU_CENTIMES,
      maxCentimes: PLAFOND_ABSOLU_CENTIMES,
    },
  );
}

/** Valide une demande d'extra telle que créée par le voyageur, ou lève. */
export function validerDemandeExtra(demande: DemandeExtra): DemandeExtra {
  if (!typeExtraValide(demande.type)) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Type d'extra inconnu.",
    );
  }
  if (!entierPositif(demande.prixCentimes)) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Le prix de l'extra doit être un entier de centimes positif.",
    );
  }
  if (demande.prixCentimes > PRIX_EXTRA_MAX_CENTIMES) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Le prix de l'extra dépasse le plafond autorisé.",
    );
  }
  if (
    demande.message !== null &&
    (typeof demande.message !== "string" ||
      demande.message.length > MESSAGE_EXTRA_MAX)
  ) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Le message de la demande dépasse la longueur autorisée.",
    );
  }
  if (!texteRenseigne(demande.ref) || !texteRenseigne(demande.reservationId)) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "La référence et la réservation sont obligatoires.",
    );
  }
  if (demande.statut !== "demande") {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Une demande doit être créée au statut « demande ».",
    );
  }
  return { ...demande };
}

/**
 * Décide une demande (`validee` ou `refusee`) depuis le statut `demande`.
 * Un refus exige un motif d'au moins dix caractères.
 */
export function deciderDemandeExtra(
  demande: DemandeExtra,
  decision: "validee" | "refusee",
  options: { par: string; motif?: string | null; maintenant?: string },
): DemandeExtra {
  if (demande.statut !== "demande") {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Demande déjà décidée.",
    );
  }
  validerDemandeExtra(demande);
  if (!texteRenseigne(options.par)) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "L'auteur de la décision est obligatoire.",
    );
  }
  const motif = options.motif?.trim() ?? "";
  if (decision === "refusee" && motif.length < MOTIF_REFUS_MIN) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Un refus exige un motif d'au moins dix caractères.",
    );
  }
  return {
    ...demande,
    statut: decision,
    decideeLe: options.maintenant ?? new Date().toISOString(),
    decideePar: options.par.trim(),
    motifRefus: decision === "refusee" ? motif : null,
  };
}

/** Marque une demande validée comme facturée : seule transition depuis `validee`. */
export function marquerFacturee(
  demande: DemandeExtra,
  maintenant?: string,
): DemandeExtra {
  if (demande.statut !== "validee") {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "Seule une demande validée peut être facturée.",
    );
  }
  return {
    ...demande,
    statut: "facturee",
    decideeLe: maintenant ?? new Date().toISOString(),
  };
}

/**
 * Référence stable et rejouable : `EXT-<8 premiers caractères>-<TYPE>` en
 * majuscules, où la réservation est tronquée à huit caractères.
 */
export function refDemandeExtra(
  reservationId: string,
  type: TypeExtra,
): string {
  if (!texteRenseigne(reservationId)) {
    throw new ErreurMetier(
      "DEMANDE_EXTRA_INVALIDE",
      "La réservation est obligatoire pour une référence d'extra.",
    );
  }
  const prefixe = reservationId.trim().slice(0, 8).toUpperCase();
  return `EXT-${prefixe}-${type.toUpperCase()}`;
}
