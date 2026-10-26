import {
  datePurgePolice,
  fichePoliceValide,
  type FichePolice,
  type NouvelleFichePolice,
} from "@/domain/fiche-police";
import { ErreurMetier } from "@/domain/erreurs";
import type { FichesPoliceRepository } from "../ports/fiches-police-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface EnregistrerFichePoliceInput {
  tenantId: string;
  reservationId: string;
  ref: string;
  nom: string;
  prenoms: string;
  nationalite: string;
  dateNaissance: string;
  lieuNaissance: string;
  domicile: string;
  telephone: string;
  email?: string;
}

export class EnregistrerFichePolice {
  constructor(
    private readonly fiches: FichesPoliceRepository,
    private readonly reservations: ReservationRepository,
    private readonly maintenant: () => Date = () => new Date(),
  ) {}

  async executer(input: EnregistrerFichePoliceInput): Promise<FichePolice> {
    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation) {
      throw new ErreurMetier(
        "RESERVATION_INTROUVABLE",
        "Séjour introuvable.",
      );
    }

    const champs = {
      nom: input.nom.trim(),
      prenoms: input.prenoms.trim(),
      nationalite: input.nationalite.trim(),
      dateNaissance: input.dateNaissance.trim(),
      lieuNaissance: input.lieuNaissance.trim(),
      domicile: input.domicile.trim(),
      telephone: input.telephone.trim(),
      email: input.email?.trim() || null,
    };
    if (!fichePoliceValide(champs)) {
      throw new ErreurMetier(
        "FICHE_POLICE_INVALIDE",
        "Fiche de police incomplète ou invalide.",
      );
    }

    const creation = this.maintenant();
    const fiche: NouvelleFichePolice = {
      tenantId: input.tenantId,
      reservationId: reservation.id,
      logementId: reservation.logementId,
      ref: input.ref.trim(),
      ...champs,
      createdAt: creation,
      purgeAt: datePurgePolice(creation),
    };
    if (!/^[A-Za-z0-9_-]{8,120}$/.test(fiche.ref)) {
      throw new ErreurMetier(
        "FICHE_POLICE_INVALIDE",
        "Référence de fiche invalide.",
      );
    }
    return this.fiches.enregistrer(fiche);
  }
}
