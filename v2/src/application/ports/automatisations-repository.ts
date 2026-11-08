import type {
  Automatisation,
  ConditionsAutomatisation,
  DeclencheurAutomatisation,
} from "@/domain/automatisation-message";
import type { CanalFil } from "@/domain/fil-voyageur";

export interface CreerAutomatisationData {
  tenantId: string;
  code: string;
  libelle: string;
  declencheur: DeclencheurAutomatisation;
  canal: CanalFil;
  sujet?: string | null;
  modele: string;
  conditions?: ConditionsAutomatisation;
  actif?: boolean;
}

export interface ModifierAutomatisationData {
  libelle?: string;
  declencheur?: DeclencheurAutomatisation;
  canal?: CanalFil;
  sujet?: string | null;
  modele?: string;
  conditions?: ConditionsAutomatisation;
  actif?: boolean;
}

export interface ExecutionAutomatisation {
  id: string;
  tenantId: string;
  automatisationId: string;
  reservationId: string;
  filId: string | null;
  messageId: string | null;
  ref: string;
  statut: string;
  details: Record<string, unknown>;
  createdAt: Date;
}

export interface CreerExecutionData {
  tenantId: string;
  automatisationId: string;
  reservationId: string;
  filId?: string | null;
  messageId?: string | null;
  ref: string;
  statut: string;
  details?: Record<string, unknown>;
}

export interface AutomatisationsRepository {
  creer(data: CreerAutomatisationData): Promise<Automatisation>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Automatisation | null>;
  trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Automatisation | null>;
  listerParTenant(tenantId: string): Promise<Automatisation[]>;
  listerActivesParDeclencheur(
    tenantId: string,
    declencheur: DeclencheurAutomatisation,
  ): Promise<Automatisation[]>;
  modifier(
    tenantId: string,
    id: string,
    data: ModifierAutomatisationData,
  ): Promise<Automatisation | null>;
  supprimer(tenantId: string, id: string): Promise<boolean>;
  creerExecution(data: CreerExecutionData): Promise<ExecutionAutomatisation>;
  trouverExecutionParRef(
    tenantId: string,
    ref: string,
  ): Promise<ExecutionAutomatisation | null>;
  listerExecutions(
    tenantId: string,
    automatisationId?: string,
  ): Promise<ExecutionAutomatisation[]>;
}
