import { ErreurMetier } from "@/domain/erreurs";
import { sejourValide } from "@/domain/planning";
import type { BlocageRepository } from "../ports/blocage-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface CreerReservationInput {
  tenantId: string;
  logementId: string;
  ref: string;
  clientNom?: string;
  voyageurs: number;
  debut: string;
  fin: string;
  montantCentimes: number;
}

/** Cas d'usage : créer une réservation après contrôle d'anti-chevauchement. */
export class CreerReservation {
  constructor(
    private readonly repo: ReservationRepository,
    private readonly blocages: BlocageRepository,
  ) {}

  async executer(input: CreerReservationInput) {
    const ref = input.ref.trim();
    const clientNom = input.clientNom?.trim() || undefined;

    if (!input.tenantId || !input.logementId) {
      throw new ErreurMetier("TENANT_INVALIDE", "Tenant et logement requis.");
    }
    if (ref.length < 2 || ref.length > 64) {
      throw new ErreurMetier(
        "REF_INVALIDE",
        "La référence doit faire 2 à 64 caractères.",
      );
    }
    if (!sejourValide(input.debut, input.fin)) {
      throw new ErreurMetier(
        "DATE_INVALIDE",
        "Les dates du séjour sont invalides (fin exclusive).",
      );
    }
    if (
      !Number.isInteger(input.voyageurs) ||
      input.voyageurs < 1 ||
      input.voyageurs > 20
    ) {
      throw new ErreurMetier(
        "VOYAGEURS_INVALIDE",
        "Le nombre de voyageurs doit être entre 1 et 20.",
      );
    }
    if (
      !Number.isInteger(input.montantCentimes) ||
      input.montantCentimes < 0
    ) {
      throw new ErreurMetier(
        "PRIX_INVALIDE",
        "Le montant doit être un entier positif en centimes.",
      );
    }

    const chevauche =
      (await this.repo.chevauche(
        input.tenantId,
        input.logementId,
        input.debut,
        input.fin,
      )) ||
      (await this.blocages.chevauche(
        input.tenantId,
        input.logementId,
        input.debut,
        input.fin,
      ));
    if (chevauche) {
      throw new ErreurMetier(
        "RESERVATION_CHEVAUCHE",
        "Ce logement est déjà occupé sur cette période.",
      );
    }

    return this.repo.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref,
      clientNom,
      voyageurs: input.voyageurs,
      debut: input.debut,
      fin: input.fin,
      montantCentimes: input.montantCentimes,
      source: "direct",
    });
  }
}
