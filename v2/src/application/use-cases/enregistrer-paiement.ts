import { dateIsoValide } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import type { Facture } from "@/domain/facture";
import {
  modePaiementValide,
  montantPaiementValide,
  refPaiementValide,
  resteAPayer,
  type ModePaiement,
  type Paiement,
} from "@/domain/paiement";
import type { FactureRepository } from "../ports/facture-repository";
import type { PaiementRepository } from "../ports/paiement-repository";

export interface EnregistrerPaiementInput {
  tenantId: string;
  factureId: string;
  ref: string;
  montantCentimes: number;
  mode: ModePaiement;
  datePaiement: string;
  reference?: string | null;
  notes?: string | null;
}

export interface ResultatEnregistrementPaiement {
  paiement: Paiement;
  facture: Facture;
  resteCentimes: number;
  cree: boolean;
}

export class EnregistrerPaiement {
  constructor(
    private readonly paiements: PaiementRepository,
    private readonly factures: FactureRepository,
  ) {}

  async executer(
    input: EnregistrerPaiementInput,
  ): Promise<ResultatEnregistrementPaiement> {
    const ref = input.ref.trim();
    if (!refPaiementValide(ref)) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Référence invalide.");
    }

    const facture = await this.factures.trouver(
      input.tenantId,
      input.factureId,
    );
    if (!facture) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Facture introuvable.");
    }

    const existant = await this.paiements.trouverParRef(input.tenantId, ref);
    if (existant) {
      if (existant.factureId !== facture.id) {
        throw new ErreurMetier(
          "PAIEMENT_INVALIDE",
          "Cette référence appartient à une autre facture.",
        );
      }
      const paiements = await this.paiements.listerParFacture(
        input.tenantId,
        facture.id,
      );
      return {
        paiement: existant,
        facture,
        resteCentimes: resteAPayer(
          facture.montantTtcCentimes,
          paiements,
        ),
        cree: false,
      };
    }

    if (!montantPaiementValide(input.montantCentimes)) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le montant doit être un entier strictement positif.",
      );
    }
    if (!modePaiementValide(input.mode)) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Mode de paiement invalide.");
    }
    if (!dateIsoValide(input.datePaiement)) {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Date de paiement invalide.");
    }
    if (facture.statut === "brouillon") {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Émettez la facture avant d'enregistrer un paiement.",
      );
    }
    if (facture.statut === "annulee") {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Impossible d'encaisser une facture annulée.",
      );
    }
    if (facture.statut === "payee") {
      throw new ErreurMetier("PAIEMENT_INVALIDE", "Cette facture est déjà payée.");
    }

    const paiements = await this.paiements.listerParFacture(
      input.tenantId,
      facture.id,
    );
    const reste = resteAPayer(facture.montantTtcCentimes, paiements);
    if (input.montantCentimes > reste) {
      throw new ErreurMetier(
        "PAIEMENT_INVALIDE",
        "Le montant dépasse le reste à payer.",
      );
    }

    const resultat = await this.paiements.creer({
      tenantId: input.tenantId,
      factureId: facture.id,
      ref,
      montantCentimes: input.montantCentimes,
      mode: input.mode,
      datePaiement: input.datePaiement,
      reference: input.reference?.trim() || null,
      notes: input.notes?.trim() || null,
    });

    const tous = resultat.cree ? [...paiements, resultat.paiement] : paiements;
    let factureAJour = facture;
    const nouveauReste = resteAPayer(facture.montantTtcCentimes, tous);
    if (resultat.cree && nouveauReste === 0 && facture.statut === "emise") {
      factureAJour =
        (await this.factures.changerStatut(
          input.tenantId,
          facture.id,
          "payee",
        )) ?? facture;
    }

    return {
      paiement: resultat.paiement,
      facture: factureAJour,
      resteCentimes: nouveauReste,
      cree: resultat.cree,
    };
  }
}
