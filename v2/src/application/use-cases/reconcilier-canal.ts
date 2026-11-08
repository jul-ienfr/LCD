import { ErreurMetier } from "@/domain/erreurs";
import type { CodeFournisseur } from "@/domain/fournisseur";
import {
  reconcilierReservationsFournisseur,
  type ReservationExterneReconciliation,
  type ResultatReconciliation,
} from "@/domain/reconciliation-fournisseur";
import type {
  FournisseurCanal,
  ReservationExterne,
} from "../ports/fournisseur-canal";
import type { FournisseurRepository } from "../ports/fournisseur-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import { referenceReservationFournisseur } from "./reference-fournisseur";

export interface ReconcilierCanalInput {
  tenantId: string;
  logementId: string;
  /** Début de la fenêtre, AAAA-MM-JJ. */
  depuis: string;
  /** Fin de la fenêtre, AAAA-MM-JJ (exclusive). */
  jusqua: string;
}

export interface ResultatReconciliationCanal extends ResultatReconciliation {
  fournisseurCode: CodeFournisseur;
  externalPropertyId: string;
}

export class ReconcilierCanal {
  constructor(
    private readonly fournisseurs: FournisseurRepository,
    private readonly reservations: ReservationRepository,
    private readonly creerFournisseur: (
      code: CodeFournisseur,
    ) => FournisseurCanal | null,
  ) {}

  async executer(
    input: ReconcilierCanalInput,
  ): Promise<ResultatReconciliationCanal> {
    const affectation = await this.fournisseurs.trouverAffectation(
      input.tenantId,
      input.logementId,
    );
    if (!affectation || !affectation.actif) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Aucun fournisseur actif n’est affecté à ce logement.",
      );
    }
    const externalPropertyId = affectation.externalPropertyId?.trim();
    if (!externalPropertyId) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Identifiant de propriété externe manquant : réconciliation impossible.",
      );
    }
    const fournisseur = this.creerFournisseur(affectation.fournisseurCode);
    if (!fournisseur) {
      throw new ErreurMetier(
        "FOURNISSEUR_INDISPONIBLE",
        `Les clés serveur de ${affectation.fournisseurCode} sont absentes.`,
      );
    }

    const [externesBruts, locales] = await Promise.all([
      fournisseur.recupererReservations(
        input.depuis,
        input.jusqua,
        externalPropertyId,
      ),
      this.reservations.listerParMois(
        input.tenantId,
        input.depuis,
        input.jusqua,
      ),
    ]);

    const externes: ReservationExterneReconciliation[] = externesBruts.map(
      (externe: ReservationExterne) => ({
        externalId: externe.externalId,
        ref: referenceReservationFournisseur(
          affectation.fournisseurCode,
          externe.externalId,
        ),
        externalPropertyId: externe.externalPropertyId,
        externalRoomTypeId: externe.externalRoomTypeId,
        reference: externe.reference,
        arrivee: externe.arrivee,
        depart: externe.depart,
        statut: externe.statut,
      }),
    );

    const resultat = reconcilierReservationsFournisseur({
      code: affectation.fournisseurCode,
      logementId: input.logementId,
      externalPropertyId,
      externalRoomTypeId: affectation.externalRoomTypeId,
      externes,
      locales: locales.map((reservation) => ({
        ref: reservation.ref,
        logementId: reservation.logementId,
        debut: reservation.debut,
        fin: reservation.fin,
        statut: reservation.statut,
        source: reservation.source,
      })),
      depuis: input.depuis,
      jusqua: input.jusqua,
    });

    return {
      ...resultat,
      fournisseurCode: affectation.fournisseurCode,
      externalPropertyId,
    };
  }
}
