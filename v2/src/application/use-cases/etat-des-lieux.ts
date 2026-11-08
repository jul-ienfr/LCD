import {
  estBrouillon,
  refEtatDesLieuxValide,
  validerConstat,
  validerEtatDesLieux,
} from "@/domain/etat-des-lieux";
import { ErreurMetier } from "@/domain/erreurs";
import type { BiensRepository } from "../ports/biens-repository";
import type { EtatsDesLieuxRepository } from "../ports/etats-des-lieux-repository";
import type { ReservationRepository } from "../ports/reservation-repository";

export interface ConstatEtatDesLieux {
  etat: number | null;
  manquant: boolean;
  commentaire?: string;
}

export interface EnregistrerEtatDesLieuxInput {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  type: string;
  date: string;
  notes?: string;
  constats: Record<string, ConstatEtatDesLieux>;
}

export class EnregistrerEtatDesLieux {
  constructor(
    private readonly etats: EtatsDesLieuxRepository,
    private readonly biens: BiensRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: EnregistrerEtatDesLieuxInput) {
    if (!refEtatDesLieuxValide(input.ref)) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "La référence est invalide.",
      );
    }
    const existant = await this.etats.trouverParRef(input.tenantId, input.ref);
    if (existant) return existant;

    if (input.reservationId) {
      const reservation = await this.reservations.trouverParId(
        input.tenantId,
        input.reservationId,
      );
      if (!reservation || reservation.logementId !== input.logementId) {
        throw new ErreurMetier(
          "ETAT_DES_LIEUX_INVALIDE",
          "Séjour introuvable pour ce logement.",
        );
      }
    }

    const biens = await this.biens.listerParLogement(
      input.tenantId,
      input.logementId,
    );
    if (biens.length === 0) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "Aucun bien inventorié pour ce logement.",
      );
    }

    const valide = validerEtatDesLieux({
      type: input.type,
      date: input.date,
      notes: input.notes,
    });

    const lignes = biens.map((bien) => {
      const constat = input.constats[bien.qr] ?? {
        etat: bien.etat,
        manquant: false,
      };
      const constate = validerConstat({
        etatReference: bien.etat,
        etatConstate: constat.etat,
        manquant: constat.manquant,
        commentaire: constat.commentaire,
      });
      return {
        bienId: bien.id,
        qr: bien.qr,
        libelle: bien.label,
        etatReference: bien.etat,
        prixReferenceCentimes: bien.prixAchatCentimes,
        ...constate,
      };
    });

    return this.etats.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId,
      ref: input.ref,
      ...valide,
      lignes,
    });
  }
}

export interface CreerBrouillonInput {
  tenantId: string;
  logementId: string;
  reservationId: string;
  ref: string;
  date: string;
  notes?: string;
}

/**
 * Crée un état des lieux de sortie non renseigné : chaque ligne reste
 * explicitement « non constatée » jusqu'à la saisie du staff.
 */
export class CreerBrouillonEtatDesLieux {
  constructor(
    private readonly etats: EtatsDesLieuxRepository,
    private readonly biens: BiensRepository,
    private readonly reservations: ReservationRepository,
  ) {}

  async executer(input: CreerBrouillonInput) {
    if (!refEtatDesLieuxValide(input.ref)) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "La référence est invalide.",
      );
    }
    const existant = await this.etats.trouverParRef(input.tenantId, input.ref);
    if (existant) return existant;

    const reservation = await this.reservations.trouverParId(
      input.tenantId,
      input.reservationId,
    );
    if (!reservation || reservation.logementId !== input.logementId) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "Séjour introuvable pour ce logement.",
      );
    }

    const biens = await this.biens.listerParLogement(
      input.tenantId,
      input.logementId,
    );
    if (biens.length === 0) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "Aucun bien inventorié pour ce logement.",
      );
    }

    const valide = validerEtatDesLieux({
      type: "sortie",
      date: input.date,
      notes: input.notes,
    });

    return this.etats.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId,
      ref: input.ref,
      ...valide,
      lignes: biens.map((bien) => ({
        bienId: bien.id,
        qr: bien.qr,
        libelle: bien.label,
        etatReference: bien.etat,
        prixReferenceCentimes: bien.prixAchatCentimes,
        etatConstate: null,
        manquant: false,
        commentaire: "",
      })),
    });
  }
}

export interface CompleterEtatDesLieuxInput {
  tenantId: string;
  id: string;
  notes?: string;
  constats: Record<string, ConstatEtatDesLieux>;
}

export class CompleterEtatDesLieux {
  constructor(private readonly etats: EtatsDesLieuxRepository) {}

  async executer(input: CompleterEtatDesLieuxInput) {
    const etat = await this.etats.trouverParId(input.tenantId, input.id);
    if (!etat) return null;
    if (!estBrouillon(etat)) {
      throw new ErreurMetier(
        "ETAT_DES_LIEUX_INVALIDE",
        "Cet état des lieux est déjà complet.",
      );
    }

    const valide = validerEtatDesLieux({
      type: etat.type,
      date: etat.date,
      notes: input.notes,
    });

    const lignes = etat.lignes.map((ligne) => {
      const constat = input.constats[ligne.qr];
      if (!constat) {
        throw new ErreurMetier(
          "ETAT_DES_LIEUX_INVALIDE",
          `Constat manquant pour « ${ligne.libelle} ».`,
        );
      }
      const constate = validerConstat({
        etatReference: ligne.etatReference,
        etatConstate: constat.etat,
        manquant: constat.manquant,
        commentaire: constat.commentaire,
      });
      return { qr: ligne.qr, ...constate };
    });

    return this.etats.mettreAJour(input.tenantId, etat.id, {
      notes: valide.notes,
      lignes,
    });
  }
}
