import type { Reservation } from "./reservation";
import type { StrategiePrix } from "./strategie-prix";
import type { TenantId } from "./tenant";

export type LogementId = string;
export type StatutLogement = "actif" | "inactif" | "archive";
export type PublicationLogement = "brouillon" | "publiee";

export interface Logement {
  id: LogementId;
  tenantId: TenantId;
  code: string;
  nom: string;
  adresse?: string;
  checkinHeure?: string;
  checkinInstructions?: string;
  wifiSsid?: string;
  wifiPassword?: string;
  regles?: string;
  urgenceTel?: string;
  guideTexte?: string;
  coproVerifiee: boolean;
  coproVerifieeLe?: Date;
  cutoffJours?: number;
  bufferJours?: number;
  strategiePrix: StrategiePrix;
  publication: PublicationLogement;
  statut: StatutLogement;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Code logement : 2 à 32 caractères, minuscules, chiffres, tirets.
 * Il est stable : il sert dans les URLs, les exports et les refs idempotentes.
 */
export function codeLogementValide(code: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,30}[a-z0-9])?$/.test(code);
}

export function nomLogementValide(nom: string): boolean {
  return nom.trim().length >= 2 && nom.trim().length <= 120;
}

/**
 * Un logement n'est proposé aux voyageurs que s'il est actif, si le règlement
 * de copropriété / l'accord du syndic a été vérifié, et si l'hôte l'a
 * explicitement publié. La publication est une décision distincte de la
 * création : un logement neuf reste en brouillon.
 */
export function logementPubliable(
  logement: Pick<Logement, "statut" | "coproVerifiee" | "publication">,
): boolean {
  return (
    logement.statut === "actif" &&
    logement.coproVerifiee &&
    logement.publication === "publiee"
  );
}

export function peutPublierLogement(
  logement: Pick<Logement, "statut" | "coproVerifiee">,
): boolean {
  return logement.statut === "actif" && logement.coproVerifiee;
}

/**
 * L'archivage est doux : le logement et son historique restent en base, mais
 * il disparaît de la réservation publique. Toute réservation non annulée et
 * non terminée qui n'est pas finie bloque l'archivage (brouillon compris),
 * pour ne jamais casser un séjour à venir.
 */
export function reservationsBloquantArchivage(
  reservations: Pick<
    Reservation,
    "logementId" | "debut" | "fin" | "statut" | "ref"
  >[],
  logementId: string,
  aujourdHui: string,
): Pick<Reservation, "logementId" | "debut" | "fin" | "statut" | "ref">[] {
  return reservations.filter(
    (reservation) =>
      reservation.logementId === logementId &&
      reservation.statut !== "annulee" &&
      reservation.statut !== "terminee" &&
      reservation.fin > aujourdHui,
  );
}

export function logementArchive(logement: Pick<Logement, "statut">): boolean {
  return logement.statut === "archive";
}
