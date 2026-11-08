import type {
  CanalFilInterne,
  StatutFilInterne,
} from "@/domain/fil-interne";

export interface FilInterne {
  id: string;
  tenantId: string;
  logementId: string | null;
  logementNom: string | null;
  canal: CanalFilInterne;
  sujet: string;
  statut: StatutFilInterne;
  creePar: string;
  dernierMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageFilInterne {
  id: string;
  tenantId: string;
  filId: string;
  auteurEmail: string;
  auteurRole: string;
  corps: string;
  createdAt: Date;
}

export interface FilInterneDetail extends FilInterne {
  messages: MessageFilInterne[];
}

export interface CreerFilInterneInput {
  tenantId: string;
  logementId: string | null;
  canal: CanalFilInterne;
  sujet: string;
  creePar: string;
}

export interface AjouterMessageFilInput {
  tenantId: string;
  filId: string;
  auteurEmail: string;
  auteurRole: string;
  corps: string;
}

export interface FilsInternesRepository {
  lister(tenantId: string, canal?: CanalFilInterne): Promise<FilInterne[]>;
  trouver(tenantId: string, id: string): Promise<FilInterneDetail | null>;
  creer(input: CreerFilInterneInput): Promise<FilInterne>;
  ajouterMessage(input: AjouterMessageFilInput): Promise<MessageFilInterne | null>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: StatutFilInterne,
  ): Promise<boolean>;
}
