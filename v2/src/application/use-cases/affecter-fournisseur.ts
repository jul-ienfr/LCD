import {
  codeFournisseurValide,
  externalPropertyIdValide,
  ficheFournisseur,
  type CodeFournisseur,
} from "@/domain/fournisseur";
import { ErreurMetier } from "@/domain/erreurs";
import type {
  AffectationFournisseur,
  FournisseurRepository,
} from "../ports/fournisseur-repository";

export interface AffecterFournisseurInput {
  tenantId: string;
  logementId: string;
  fournisseurCode: string;
  externalPropertyId?: string | null;
  externalRoomTypeId?: string | null;
  externalRatePlanId?: string | null;
}

export class AffecterFournisseur {
  constructor(private readonly repo: FournisseurRepository) {}

  async executer(
    input: AffecterFournisseurInput,
  ): Promise<AffectationFournisseur> {
    if (
      !codeFournisseurValide(input.fournisseurCode) ||
      !ficheFournisseur(input.fournisseurCode)
    ) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Choisissez un fournisseur reconnu.",
      );
    }
    const externalPropertyId =
      input.externalPropertyId?.trim() || null;
    const externalRoomTypeId =
      input.externalRoomTypeId?.trim() || null;
    const externalRatePlanId =
      input.externalRatePlanId?.trim() || null;
    if (!externalPropertyIdValide(externalPropertyId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L’identifiant de logement externe est invalide.",
      );
    }
    if (!externalPropertyIdValide(externalRoomTypeId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L’identifiant de type de chambre est invalide.",
      );
    }
    if (!externalPropertyIdValide(externalRatePlanId)) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "L’identifiant de plan tarifaire est invalide.",
      );
    }
    const activations = await this.repo.listerActivations();
    const activation = activations?.find(
      (entree) => entree.code === input.fournisseurCode,
    );
    if (!activation?.actif) {
      throw new ErreurMetier(
        "FOURNISSEUR_INVALIDE",
        "Ce fournisseur n’est pas activé par le super-admin.",
      );
    }
    return this.repo.affecter({
      tenantId: input.tenantId,
      logementId: input.logementId,
      fournisseurCode: input.fournisseurCode as CodeFournisseur,
      externalPropertyId,
      externalRoomTypeId,
      externalRatePlanId,
    });
  }
}
