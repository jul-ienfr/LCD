// Avis voyageur : domaine pur, sans dépendance externe.
// Cycle de vie : invitation à J+1, réception de l'avis, publication, masquage
// éventuel, réponse publique de l'hôte.
import { ErreurMetier } from "./erreurs";

export type StatutAvis = "invite" | "recu" | "publie" | "masque";

export const NOTE_MIN = 1;
export const NOTE_MAX = 5;

/** Longueur maximale d'un commentaire ou d'une réponse d'hôte. */
export const COMMENTAIRE_AVIS_MAX = 2000;

/** Longueur minimale d'un motif de masquage. */
export const MOTIF_MODERATION_MIN = 10;

export interface AvisVoyageur {
  id: string;
  ref: string;
  reservationId: string;
  logementId: string;
  note: number | null;
  commentaire: string | null;
  statut: StatutAvis;
  inviteLe: string;
  recuLe: string | null;
  publieLe: string | null;
  reponseHote: string | null;
}

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function texteRenseigne(valeur: string | null): boolean {
  return typeof valeur === "string" && valeur.trim().length > 0;
}

function instantCourant(): string {
  return new Date().toISOString();
}

/** Vérifie qu'une date `AAAA-MM-JJ` désigne un jour réel du calendrier. */
function dateValide(date: string): boolean {
  if (typeof date !== "string" || !DATE.test(date)) return false;
  const jour = new Date(`${date}T00:00:00.000Z`);
  return !Number.isNaN(jour.getTime()) && jour.toISOString().slice(0, 10) === date;
}

/**
 * Date d'invitation à laisser un avis : le lendemain du départ. Le jour de
 * départ est exclu du séjour, l'invitation part donc à J+1.
 */
export function dateInvitationAvis(depart: string): string {
  if (!dateValide(depart)) {
    throw new ErreurMetier(
      "DATE_INVALIDE",
      "La date de départ doit être au format AAAA-MM-JJ.",
    );
  }
  const jour = new Date(`${depart}T00:00:00.000Z`);
  jour.setUTCDate(jour.getUTCDate() + 1);
  return jour.toISOString().slice(0, 10);
}

/** Crée l'invitation à laisser un avis, au statut `invite`. */
export function inviterAvis(input: {
  id: string;
  ref: string;
  reservationId: string;
  logementId: string;
  depart: string;
  maintenant?: string;
}): AvisVoyageur {
  if (
    !texteRenseigne(input.id) ||
    !texteRenseigne(input.ref) ||
    !texteRenseigne(input.reservationId) ||
    !texteRenseigne(input.logementId)
  ) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Identifiant, référence, réservation et logement sont obligatoires.",
    );
  }
  // L'invitation ne part qu'à partir du lendemain du départ.
  dateInvitationAvis(input.depart);
  return {
    id: input.id,
    ref: input.ref,
    reservationId: input.reservationId,
    logementId: input.logementId,
    note: null,
    commentaire: null,
    statut: "invite",
    inviteLe: input.maintenant ?? instantCourant(),
    recuLe: null,
    publieLe: null,
    reponseHote: null,
  };
}

/** Valide une note d'avis : entier entre 1 et 5. */
export function validerNote(note: number): number {
  if (!Number.isInteger(note) || note < NOTE_MIN || note > NOTE_MAX) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "La note doit être un entier entre 1 et 5.",
    );
  }
  return note;
}

/** Enregistre la note et le commentaire reçus : transition `invite` → `recu`. */
export function enregistrerAvis(
  avis: AvisVoyageur,
  input: { note: number; commentaire?: string | null; maintenant?: string },
): AvisVoyageur {
  if (avis.statut !== "invite") {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Un avis ne peut être enregistré que depuis le statut « invité ».",
    );
  }
  const note = validerNote(input.note);
  const commentaire = input.commentaire?.trim() ?? "";
  if (commentaire.length > COMMENTAIRE_AVIS_MAX) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Le commentaire dépasse la longueur autorisée.",
    );
  }
  return {
    ...avis,
    note,
    commentaire: commentaire.length > 0 ? commentaire : null,
    statut: "recu",
    recuLe: input.maintenant ?? instantCourant(),
  };
}

/**
 * Publie un avis reçu : transition `recu` → `publie`.
 *
 * Aucune note minimale n'est exigée : LCD ne cache jamais un avis négatif, la
 * publication est un acte de transparence et le masquage reste une modération
 * explicite et motivée.
 */
export function publierAvis(avis: AvisVoyageur, maintenant?: string): AvisVoyageur {
  if (avis.statut !== "recu") {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Seul un avis reçu peut être publié.",
    );
  }
  return {
    ...avis,
    statut: "publie",
    publieLe: maintenant ?? instantCourant(),
  };
}

/** Masque un avis publié : la modération exige un motif circonstancié. */
export function masquerAvis(
  avis: AvisVoyageur,
  options: { motif: string; maintenant?: string },
): AvisVoyageur {
  if (avis.statut !== "publie") {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Seul un avis publié peut être masqué.",
    );
  }
  const motif = options.motif?.trim() ?? "";
  if (motif.length < MOTIF_MODERATION_MIN) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Un masquage exige un motif d'au moins dix caractères.",
    );
  }
  return { ...avis, statut: "masque" };
}

/** Ajoute la réponse publique de l'hôte ; impossible sur un avis masqué. */
export function repondreAvis(avis: AvisVoyageur, reponse: string): AvisVoyageur {
  if (avis.statut === "masque") {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "Un avis masqué ne peut pas recevoir de réponse.",
    );
  }
  const texte = reponse?.trim() ?? "";
  if (texte.length === 0) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "La réponse de l'hôte ne peut pas être vide.",
    );
  }
  if (texte.length > COMMENTAIRE_AVIS_MAX) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "La réponse dépasse la longueur autorisée.",
    );
  }
  return { ...avis, reponseHote: texte };
}

/** Avis effectivement publiés, du plus récent au plus ancien. */
export function avisPublies(avis: readonly AvisVoyageur[]): AvisVoyageur[] {
  return avis
    .filter((entree) => entree.statut === "publie")
    .sort((a, b) => {
      const dateA = a.publieLe ?? "";
      const dateB = b.publieLe ?? "";
      if (dateA !== dateB) return dateA < dateB ? 1 : -1;
      const recuA = a.recuLe ?? "";
      const recuB = b.recuLe ?? "";
      if (recuA !== recuB) return recuA < recuB ? 1 : -1;
      return 0;
    });
}

/** Moyenne des notes publiées, arrondie à une décimale (`null` si aucune). */
export function noteMoyenne(avis: readonly AvisVoyageur[]): number | null {
  const notes = avis
    .filter((entree) => entree.statut === "publie")
    .map((entree) => entree.note)
    .filter((note): note is number => typeof note === "number");
  if (notes.length === 0) return null;
  const somme = notes.reduce((total, note) => total + note, 0);
  return Math.round((somme / notes.length) * 10) / 10;
}

/**
 * Référence stable et rejouable d'un avis : `AVIS-<8 premiers caractères>` en
 * majuscules, dérivée de la réservation. Un même séjour ne produit qu'une
 * invitation (règle 7).
 */
export function refAvisVoyageur(reservationId: string): string {
  const texte = reservationId?.trim() ?? "";
  if (texte.length === 0) {
    throw new ErreurMetier(
      "AVIS_INVALIDE",
      "La réservation est obligatoire pour une référence d'avis.",
    );
  }
  return `AVIS-${texte.slice(0, 8).toUpperCase()}`;
}

/** Répartition des notes publiées, clés 1 à 5 toujours présentes. */
export function repartitionNotes(
  avis: readonly AvisVoyageur[],
): Record<number, number> {
  const repartition: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  for (const entree of avis) {
    if (entree.statut !== "publie") continue;
    if (typeof entree.note !== "number") continue;
    if (entree.note < NOTE_MIN || entree.note > NOTE_MAX) continue;
    repartition[entree.note] = (repartition[entree.note] ?? 0) + 1;
  }
  return repartition;
}
