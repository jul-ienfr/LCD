import { dateIsoValide } from "./calendrier";
import { sejourValide } from "./planning";
import type { StatutReservation } from "./reservation";

/**
 * Réconciliation en lecture seule entre les réservations d'un fournisseur et
 * les réservations locales. Aucune écriture : le rapport sert à alerter, pas à
 * corriger automatiquement.
 */

export type StatutReservationExterneReconciliation =
  | "confirmee"
  | "annulee"
  | "en_attente";

export interface ReservationExterneReconciliation {
  externalId: string;
  /** Référence locale stable, calculée par le cas d'usage. */
  ref: string;
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  reference: string;
  arrivee: string;
  depart: string;
  statut: StatutReservationExterneReconciliation;
}

export interface ReservationLocaleReconciliation {
  ref: string;
  logementId: string;
  debut: string;
  fin: string;
  statut: StatutReservation;
  source: string;
}

export type TypeEcartReconciliation =
  | "manquante"
  | "orpheline"
  | "dates"
  | "statut";

export interface EcartReconciliation {
  type: TypeEcartReconciliation;
  ref: string;
  externalId: string | null;
  message: string;
  local: {
    debut: string;
    fin: string;
    statut: StatutReservation;
  } | null;
  externe: {
    arrivee: string;
    depart: string;
    statut: StatutReservationExterneReconciliation;
  } | null;
}

export interface ResultatReconciliation {
  totalExternes: number;
  totalLocales: number;
  ecarts: EcartReconciliation[];
  manquantes: number;
  orphelines: number;
  dates: number;
  statuts: number;
}

export interface ReconcilierReservationsInput {
  code: string;
  logementId: string;
  externalPropertyId: string;
  externalRoomTypeId?: string | null;
  externes: readonly ReservationExterneReconciliation[];
  locales: readonly ReservationLocaleReconciliation[];
  depuis: string;
  jusqua: string;
}

const SOURCE_PREFIXE = "fournisseur:";

export function statutLocalDepuisExterne(
  statut: StatutReservationExterneReconciliation,
): StatutReservation {
  if (statut === "annulee") return "annulee";
  if (statut === "en_attente") return "brouillon";
  return "confirmee";
}

function chevauchePeriode(
  debut: string,
  fin: string,
  depuis: string,
  jusqua: string,
): boolean {
  return debut < jusqua && fin > depuis;
}

export function reconcilierReservationsFournisseur(
  input: ReconcilierReservationsInput,
): ResultatReconciliation {
  const externes = input.externes.filter(
    (externe) =>
      externe.externalPropertyId === input.externalPropertyId &&
      (!input.externalRoomTypeId ||
        !externe.externalRoomTypeId ||
        externe.externalRoomTypeId === input.externalRoomTypeId) &&
      Boolean(externe.externalId) &&
      dateIsoValide(externe.arrivee) &&
      dateIsoValide(externe.depart) &&
      sejourValide(externe.arrivee, externe.depart),
  );

  const locales = input.locales.filter(
    (locale) =>
      locale.logementId === input.logementId &&
      chevauchePeriode(locale.debut, locale.fin, input.depuis, input.jusqua),
  );

  const externesParRef = new Map(
    externes.map((externe) => [externe.ref, externe]),
  );
  const localesParRef = new Map(locales.map((locale) => [locale.ref, locale]));
  const ecarts: EcartReconciliation[] = [];
  const dejaSignale = new Set<string>();

  const ajouter = (ecart: EcartReconciliation) => {
    if (dejaSignale.has(ecart.ref)) return;
    dejaSignale.add(ecart.ref);
    ecarts.push(ecart);
  };

  // 1. Réservation active chez le fournisseur, absente ou divergente en local.
  for (const externe of externes) {
    if (externe.statut === "annulee") continue;
    const locale = localesParRef.get(externe.ref);
    if (!locale) {
      ajouter({
        type: "manquante",
        ref: externe.ref,
        externalId: externe.externalId,
        message: `Réservation ${externe.externalId} absente localement (${externe.arrivee} → ${externe.depart}).`,
        local: null,
        externe: {
          arrivee: externe.arrivee,
          depart: externe.depart,
          statut: externe.statut,
        },
      });
      continue;
    }
    if (locale.debut !== externe.arrivee || locale.fin !== externe.depart) {
      ajouter({
        type: "dates",
        ref: locale.ref,
        externalId: externe.externalId,
        message: `Dates divergentes : local ${locale.debut} → ${locale.fin}, externe ${externe.arrivee} → ${externe.depart}.`,
        local: {
          debut: locale.debut,
          fin: locale.fin,
          statut: locale.statut,
        },
        externe: {
          arrivee: externe.arrivee,
          depart: externe.depart,
          statut: externe.statut,
        },
      });
      continue;
    }
    const statutAttendu = statutLocalDepuisExterne(externe.statut);
    if (locale.statut !== statutAttendu) {
      ajouter({
        type: "statut",
        ref: locale.ref,
        externalId: externe.externalId,
        message: `Statut divergent : local ${locale.statut}, externe ${externe.statut}.`,
        local: {
          debut: locale.debut,
          fin: locale.fin,
          statut: locale.statut,
        },
        externe: {
          arrivee: externe.arrivee,
          depart: externe.depart,
          statut: externe.statut,
        },
      });
    }
  }

  // 2. Réservation locale OTA active qui n'existe plus chez le fournisseur,
  //    ou dont l'annulation n'a pas été appliquée.
  for (const locale of locales) {
    if (
      locale.statut === "annulee" ||
      locale.source !== `${SOURCE_PREFIXE}${input.code}`
    ) {
      continue;
    }
    const externe = externesParRef.get(locale.ref);
    if (!externe) {
      ajouter({
        type: "orpheline",
        ref: locale.ref,
        externalId: null,
        message: `Réservation locale ${locale.ref} absente chez ${input.code} (possible annulation non reçue).`,
        local: {
          debut: locale.debut,
          fin: locale.fin,
          statut: locale.statut,
        },
        externe: null,
      });
      continue;
    }
    if (externe.statut === "annulee") {
      ajouter({
        type: "statut",
        ref: locale.ref,
        externalId: externe.externalId,
        message: `Annulation externe non appliquée : local ${locale.statut}, externe annulee.`,
        local: {
          debut: locale.debut,
          fin: locale.fin,
          statut: locale.statut,
        },
        externe: {
          arrivee: externe.arrivee,
          depart: externe.depart,
          statut: externe.statut,
        },
      });
    }
  }

  return {
    totalExternes: externes.length,
    totalLocales: locales.length,
    ecarts,
    manquantes: ecarts.filter((ecart) => ecart.type === "manquante").length,
    orphelines: ecarts.filter((ecart) => ecart.type === "orpheline").length,
    dates: ecarts.filter((ecart) => ecart.type === "dates").length,
    statuts: ecarts.filter((ecart) => ecart.type === "statut").length,
  };
}
