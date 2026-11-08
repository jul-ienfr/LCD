import type {
  AffectationFournisseur,
  AffecterFournisseurData,
  ActivationFournisseur,
  EtatSyncFournisseur,
  FournisseurRepository,
  LogementAvecFournisseur,
} from "@/application/ports/fournisseur-repository";
import {
  CATALOGUE_FOURNISSEURS,
  type CodeFournisseur,
} from "@/domain/fournisseur";

export class FournisseurRepositoryMemoire implements FournisseurRepository {
  readonly activations = new Map<CodeFournisseur, ActivationFournisseur>();
  readonly affectations: AffectationFournisseur[] = [];
  readonly logements: LogementAvecFournisseur[] = [];

  constructor() {
    for (const fiche of CATALOGUE_FOURNISSEURS) {
      this.activations.set(fiche.code, {
        code: fiche.code,
        actif: false,
        ordre: 0,
        updatedAt: new Date(),
        updatedBy: null,
      });
    }
  }

  async listerActivations(): Promise<ActivationFournisseur[]> {
    return [...this.activations.values()];
  }

  async listerLogementsAvecFournisseur(): Promise<
    LogementAvecFournisseur[]
  > {
    return this.logements;
  }

  async definirActivation(
    code: CodeFournisseur,
    actif: boolean,
    acteur: string,
  ): Promise<void> {
    const activation = this.activations.get(code);
    if (!activation) throw new Error("Fournisseur inconnu.");
    activation.actif = actif;
    activation.updatedBy = acteur;
    activation.updatedAt = new Date();
  }

  async affecter(
    data: AffecterFournisseurData,
  ): Promise<AffectationFournisseur> {
    const maintenant = new Date();
    const existante = this.affectations.find(
      (affectation) => affectation.logementId === data.logementId,
    );
    const affectation: AffectationFournisseur = {
      id: existante?.id ?? crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      fournisseurCode: data.fournisseurCode,
      externalPropertyId: data.externalPropertyId,
      externalRoomTypeId: data.externalRoomTypeId,
      externalRatePlanId: data.externalRatePlanId,
      actif: true,
      derniereSync: null,
      dernierStatut: null,
      dernierMessage: null,
      derniereEmpreinte: null,
      createdAt: existante?.createdAt ?? maintenant,
      updatedAt: maintenant,
    };
    if (existante) {
      Object.assign(existante, affectation);
      return existante;
    }
    this.affectations.push(affectation);
    return affectation;
  }

  async basculerActivation(
    tenantId: string,
    logementId: string,
    actif: boolean,
  ): Promise<AffectationFournisseur | null> {
    const affectation = await this.trouverAffectation(tenantId, logementId);
    if (!affectation) return null;
    affectation.actif = actif;
    affectation.updatedAt = new Date();
    return affectation;
  }

  async retirer(tenantId: string, logementId: string): Promise<void> {
    const index = this.affectations.findIndex(
      (affectation) =>
        affectation.tenantId === tenantId &&
        affectation.logementId === logementId,
    );
    if (index >= 0) this.affectations.splice(index, 1);
  }

  async trouverAffectation(
    tenantId: string,
    logementId: string,
  ): Promise<AffectationFournisseur | null> {
    return (
      this.affectations.find(
        (affectation) =>
          affectation.tenantId === tenantId &&
          affectation.logementId === logementId,
      ) ?? null
    );
  }

  async listerAffectationsActives(
    code?: CodeFournisseur,
  ): Promise<AffectationFournisseur[]> {
    return this.affectations.filter(
      (affectation) =>
        affectation.actif &&
        (!code || affectation.fournisseurCode === code),
    );
  }

  async trouverParProprieteExterne(
    code: CodeFournisseur,
    externalPropertyId: string,
  ): Promise<AffectationFournisseur | null> {
    return (
      this.affectations.find(
        (affectation) =>
          affectation.actif &&
          affectation.fournisseurCode === code &&
          affectation.externalPropertyId === externalPropertyId,
      ) ?? null
    );
  }

  async enregistrerSync(
    tenantId: string,
    logementId: string,
    etat: EtatSyncFournisseur,
  ): Promise<void> {
    const affectation = await this.trouverAffectation(tenantId, logementId);
    if (!affectation) return;
    affectation.derniereSync = new Date();
    affectation.dernierStatut = etat.statut;
    affectation.dernierMessage = etat.message;
    affectation.derniereEmpreinte = etat.empreinte;
  }
}
