import { ErreurMetier } from "@/domain/erreurs";
import { transitionDemandeAutorisee } from "@/domain/demande-sejour";
import type { StatutDemandeSejour } from "@/domain/demande-sejour";
import type { DemandeSejourRepository } from "../ports/demande-sejour-repository";

export interface QualifierDemandeInput {
  tenantId: string;
  demandeId: string;
  statut: Extract<StatutDemandeSejour, "qualifiee" | "refusee">;
  motifRefus?: string | null;
}

/**
 * Cas d'usage : qualifier ou refuser une demande. Une demande déjà convertie
 * n'est plus modifiable : la conversion est terminale.
 */
export class QualifierDemande {
  constructor(private readonly repo: DemandeSejourRepository) {}

  async executer(input: QualifierDemandeInput) {
    const demande = await this.repo.trouverParId(input.tenantId, input.demandeId);
    if (!demande) {
      throw new ErreurMetier("SITE_INVALIDE", "Demande introuvable.");
    }
    if (!transitionDemandeAutorisee(demande.statut, input.statut)) {
      throw new ErreurMetier(
        "SITE_INVALIDE",
        `Transition ${demande.statut} → ${input.statut} impossible.`,
      );
    }
    if (input.statut === "refusee") {
      const motif = input.motifRefus?.trim() ?? "";
      if (motif.length < 3) {
        throw new ErreurMetier(
          "SITE_INVALIDE",
          "Un motif de refus est requis (3 caractères minimum).",
        );
      }
    }

    const misAJour = await this.repo.changerStatut(
      input.tenantId,
      input.demandeId,
      input.statut,
      input.statut === "refusee" ? (input.motifRefus?.trim() ?? null) : null,
    );
    if (!misAJour) {
      throw new ErreurMetier("SITE_INVALIDE", "Demande introuvable.");
    }
    return misAJour;
  }
}
