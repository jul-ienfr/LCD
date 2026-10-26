import { ErreurMetier } from "@/domain/erreurs";
import {
  parseCsvBanque,
  periodeReleve,
  rapprocher,
} from "@/domain/rapprochement";
import type { ImportsBanqueRepository } from "../ports/imports-banque-repository";
import type { PaiementRepository } from "../ports/paiement-repository";

export interface ImporterReleveBancaireInput {
  tenantId: string;
  ref: string;
  nomFichier: string;
  texte: string;
}

function decalerJours(dateIso: string, jours: number): string {
  const date = new Date(`${dateIso}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + jours);
  return date.toISOString().slice(0, 10);
}

export class ImporterReleveBancaire {
  constructor(
    private readonly imports: ImportsBanqueRepository,
    private readonly paiements: PaiementRepository,
  ) {}

  async executer(input: ImporterReleveBancaireInput) {
    if (input.nomFichier.trim().length === 0) {
      throw new ErreurMetier(
        "RAPPROCHEMENT_INVALIDE",
        "Nom de fichier manquant.",
      );
    }
    const { lignes, erreurs } = parseCsvBanque(input.texte);
    if (erreurs.length > 0) {
      const premiere = erreurs[0]!;
      throw new ErreurMetier(
        "RAPPROCHEMENT_INVALIDE",
        `Ligne ${premiere.ligne} : ${premiere.message}`,
      );
    }
    const periode = periodeReleve(lignes);
    if (!periode) {
      throw new ErreurMetier(
        "RAPPROCHEMENT_INVALIDE",
        "Aucune opération lisible.",
      );
    }

    const paiements = await this.paiements.listerParMois(
      input.tenantId,
      decalerJours(periode.debut, -3),
      decalerJours(periode.fin, 3),
    );
    const resultat = rapprocher(lignes, paiements);

    return this.imports.enregistrer({
      tenantId: input.tenantId,
      ref: input.ref,
      nomFichier: input.nomFichier,
      resultat,
    });
  }
}
