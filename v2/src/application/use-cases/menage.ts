import {
  refMenageValide,
  statutMenageValide,
  validerMenage,
  type Menage,
} from "@/domain/menage";
import { ErreurMetier } from "@/domain/erreurs";
import type { ConsommablesRepository } from "../ports/consommables-repository";
import type { LogementRepository } from "../ports/logement-repository";
import type { MenagesRepository } from "../ports/menages-repository";
import type { ReservationRepository } from "../ports/reservation-repository";
import { ConsommerRotation } from "./stocks";

export interface PlanifierMenageInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  ref: string;
  date: string;
  notes?: string;
  taches?: readonly { libelle: string; fait?: boolean }[];
}

export class PlanifierMenage {
  constructor(
    private readonly menages: MenagesRepository,
    private readonly reservations: ReservationRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: PlanifierMenageInput): Promise<Menage> {
    if (!refMenageValide(input.ref)) {
      throw new ErreurMetier("MENAGE_INVALIDE", "La référence est invalide.");
    }
    const existant = await this.menages.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Logement introuvable.");
    }

    const reservationId = input.reservationId?.trim() || null;
    if (reservationId) {
      const reservation = await this.reservations.trouverParId(
        input.tenantId,
        reservationId,
      );
      if (!reservation || reservation.logementId !== input.logementId) {
        throw new ErreurMetier(
          "MENAGE_INVALIDE",
          "Séjour introuvable pour ce logement.",
        );
      }
    }

    const valide = validerMenage({
      date: input.date,
      notes: input.notes,
      taches: input.taches,
    });

    return this.menages.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId,
      ref: input.ref,
      statut: "planifie",
      ...valide,
    });
  }
}

export interface EnregistrerMenageInput {
  tenantId: string;
  id: string;
  statut: string;
  notes?: string;
  taches: readonly { libelle: string; fait?: boolean }[];
  qui: string;
}

export class EnregistrerMenage {
  constructor(
    private readonly menages: MenagesRepository,
    private readonly consommables: ConsommablesRepository,
  ) {}

  async executer(input: EnregistrerMenageInput): Promise<Menage> {
    const menage = await this.menages.trouverParId(input.tenantId, input.id);
    if (!menage) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Ménage introuvable.");
    }
    if (!statutMenageValide(input.statut)) {
      throw new ErreurMetier("MENAGE_INVALIDE", "Le statut est invalide.");
    }

    const valide = validerMenage({
      date: menage.date,
      notes: input.notes ?? menage.notes,
      taches: input.taches,
    });

    const etaitFait = menage.statut === "fait";
    const misAJour = await this.menages.mettreAJour(input.tenantId, menage.id, {
      statut: input.statut,
      notes: valide.notes,
      taches: valide.taches,
    });

    if (input.statut === "fait" && !etaitFait) {
      await new ConsommerRotation(this.consommables).executer({
        tenantId: input.tenantId,
        logementId: menage.logementId,
        qui: input.qui.trim() || "inconnu",
        ref: `menage-${menage.ref}`,
      });
    }

    return misAJour;
  }
}
