import type {
  AutomatisationsRepository,
  CreerAutomatisationData,
  CreerExecutionData,
  ExecutionAutomatisation,
  ModifierAutomatisationData,
} from "@/application/ports/automatisations-repository";
import type {
  Automatisation,
  DeclencheurAutomatisation,
} from "@/domain/automatisation-message";

let compteur = 0;
function id(): string {
  compteur += 1;
  return `11111111-1111-4111-8111-${String(compteur).padStart(12, "0")}`;
}

export class AutomatisationsRepositoryMemoire implements AutomatisationsRepository {
  readonly automatisations: Automatisation[] = [];
  readonly executions: ExecutionAutomatisation[] = [];

  async creer(data: CreerAutomatisationData): Promise<Automatisation> {
    const automatisation: Automatisation = {
      id: id(),
      tenantId: data.tenantId,
      code: data.code,
      libelle: data.libelle,
      declencheur: data.declencheur,
      canal: data.canal,
      sujet: data.sujet ?? null,
      modele: data.modele,
      conditions: data.conditions ?? {},
      actif: data.actif ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.automatisations.push(automatisation);
    return automatisation;
  }

  async trouverParId(
    tenantId: string,
    automatisationId: string,
  ): Promise<Automatisation | null> {
    return (
      this.automatisations.find(
        (entree) =>
          entree.tenantId === tenantId && entree.id === automatisationId,
      ) ?? null
    );
  }

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Automatisation | null> {
    return (
      this.automatisations.find(
        (entree) => entree.tenantId === tenantId && entree.code === code,
      ) ?? null
    );
  }

  async listerParTenant(tenantId: string): Promise<Automatisation[]> {
    return this.automatisations.filter((entree) => entree.tenantId === tenantId);
  }

  async listerActivesParDeclencheur(
    tenantId: string,
    declencheur: DeclencheurAutomatisation,
  ): Promise<Automatisation[]> {
    return this.automatisations.filter(
      (entree) =>
        entree.tenantId === tenantId &&
        entree.declencheur === declencheur &&
        entree.actif,
    );
  }

  async modifier(
    tenantId: string,
    automatisationId: string,
    data: ModifierAutomatisationData,
  ): Promise<Automatisation | null> {
    const automatisation = await this.trouverParId(tenantId, automatisationId);
    if (!automatisation) return null;
    Object.assign(automatisation, data, { updatedAt: new Date() });
    return automatisation;
  }

  async supprimer(tenantId: string, automatisationId: string): Promise<boolean> {
    const index = this.automatisations.findIndex(
      (entree) => entree.tenantId === tenantId && entree.id === automatisationId,
    );
    if (index < 0) return false;
    this.automatisations.splice(index, 1);
    return true;
  }

  async creerExecution(
    data: CreerExecutionData,
  ): Promise<ExecutionAutomatisation> {
    const execution: ExecutionAutomatisation = {
      id: id(),
      tenantId: data.tenantId,
      automatisationId: data.automatisationId,
      reservationId: data.reservationId,
      filId: data.filId ?? null,
      messageId: data.messageId ?? null,
      ref: data.ref,
      statut: data.statut,
      details: data.details ?? {},
      createdAt: new Date(),
    };
    this.executions.push(execution);
    return execution;
  }

  async trouverExecutionParRef(
    tenantId: string,
    ref: string,
  ): Promise<ExecutionAutomatisation | null> {
    return (
      this.executions.find(
        (execution) => execution.tenantId === tenantId && execution.ref === ref,
      ) ?? null
    );
  }

  async listerExecutions(
    tenantId: string,
    automatisationId?: string,
  ): Promise<ExecutionAutomatisation[]> {
    return this.executions.filter(
      (execution) =>
        execution.tenantId === tenantId &&
        (!automatisationId || execution.automatisationId === automatisationId),
    );
  }
}
