import { ErreurMetier } from "@/domain/erreurs";
import {
  logementArchive,
  reservationsBloquantArchivage,
  type Logement,
} from "@/domain/logement";
import type { LogementRepository } from "../ports/logement-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export class ChangerCycleVieLogement {
  constructor(
    private readonly logements: LogementRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async archiver(input: {
    tenantId: string;
    logementId: string;
    aujourdHui: string;
  }): Promise<{ logement: Logement; dejaArchive: boolean }> {
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "LOGEMENT_INTROUVABLE",
        "Logement introuvable.",
      );
    }
    if (logementArchive(logement)) {
      return { logement, dejaArchive: true };
    }

    const reservations = await this.reservations.listerTous(input.tenantId);
    const bloquantes = reservationsBloquantArchivage(
      reservations,
      logement.id,
      input.aujourdHui,
    );
    if (bloquantes.length > 0) {
      throw new ErreurMetier(
        "LOGEMENT_ARCHIVAGE_BLOQUE",
        `${bloquantes.length} réservation(s) à venir ou en cours (${bloquantes
          .map((reservation) => reservation.ref)
          .slice(0, 5)
          .join(", ")}) bloquent l’archivage. Annulez-les ou clôturez-les d’abord.`,
      );
    }

    const archive = await this.logements.changerStatut(
      input.tenantId,
      logement.id,
      "archive",
    );
    if (!archive) {
      throw new ErreurMetier(
        "LOGEMENT_INTROUVABLE",
        "Logement introuvable pendant l’archivage.",
      );
    }
    const masque = await this.logements.changerPublication(
      input.tenantId,
      logement.id,
      "brouillon",
    );
    return { logement: masque ?? archive, dejaArchive: false };
  }

  async restaurer(input: {
    tenantId: string;
    logementId: string;
  }): Promise<{ logement: Logement; dejaActif: boolean }> {
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "LOGEMENT_INTROUVABLE",
        "Logement introuvable.",
      );
    }
    if (!logementArchive(logement)) {
      return { logement, dejaActif: true };
    }
    const actif = await this.logements.changerStatut(
      input.tenantId,
      logement.id,
      "actif",
    );
    if (!actif) {
      throw new ErreurMetier(
        "LOGEMENT_INTROUVABLE",
        "Logement introuvable pendant la restauration.",
      );
    }
    // La restauration ne republie jamais automatiquement : la copropriété et
    // la publication doivent être revalidées.
    const brouillon = await this.logements.changerPublication(
      input.tenantId,
      logement.id,
      "brouillon",
    );
    return { logement: brouillon ?? actif, dejaActif: false };
  }
}
