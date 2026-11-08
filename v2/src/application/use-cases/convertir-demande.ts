import { ErreurMetier } from "@/domain/erreurs";
import { sourceValide } from "@/domain/attribution";
import { transitionDemandeAutorisee } from "@/domain/demande-sejour";
import { referenceDirecte } from "@/domain/reservation-directe";
import type { DemandeSejourRepository } from "../ports/demande-sejour-repository";
import type { DemanderReservationDirecte } from "./reservation-directe";

export interface ConvertirDemandeInput {
  tenantId: string;
  demandeId: string;
  /** Logement retenu au moment de la conversion (facultatif si ciblé). */
  logementId?: string;
  ref?: string;
  aujourdhui?: string;
}

/**
 * Cas d'usage : convertir une demande qualifiée en réservation, sans
 * ressaisie (FR-068). Les coordonnées, dates et voyageurs viennent de la
 * demande ; l'appelant peut forcer un logement différent de celui demandé.
 */
export class ConvertirDemandeEnReservation {
  constructor(
    private readonly demandes: DemandeSejourRepository,
    private readonly demander: DemanderReservationDirecte,
  ) {}

  async executer(input: ConvertirDemandeInput) {
    const demande = await this.demandes.trouverParId(
      input.tenantId,
      input.demandeId,
    );
    if (!demande) {
      throw new ErreurMetier("SITE_INVALIDE", "Demande introuvable.");
    }
    if (demande.statut === "convertie" && demande.reservationId) {
      return { demande, reservationId: demande.reservationId, dejaConvertie: true };
    }
    if (!transitionDemandeAutorisee(demande.statut, "convertie")) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        `Une demande ${demande.statut} ne peut pas être convertie.`,
      );
    }
    const logementId = input.logementId?.trim() || demande.logementId;
    if (!logementId) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "Précisez le logement avant de convertir la demande.",
      );
    }
    if (!demande.arrivee || !demande.depart) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        "La demande n'a pas de dates : complétez-les avant conversion.",
      );
    }

    const ref =
      input.ref?.trim() ||
      referenceDirecte(demande.ref.replace(/[^a-zA-Z0-9]/g, ""));

    const sourceDemande = `demande:${demande.ref
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24)}`;

    const { reservation } = await this.demander.executer({
      tenantId: input.tenantId,
      logementId,
      ref,
      clientNom: demande.nom,
      clientEmail: demande.email,
      voyageurs: demande.voyageurs,
      debut: demande.arrivee,
      fin: demande.depart,
      aujourdhui: input.aujourdhui,
      source: sourceValide(demande.source) ? demande.source : sourceDemande,
    });

    const convertie = await this.demandes.rattacherReservation(
      input.tenantId,
      demande.id,
      reservation.id,
    );

    return {
      demande: convertie ?? demande,
      reservationId: reservation.id,
      dejaConvertie: false,
    };
  }
}
