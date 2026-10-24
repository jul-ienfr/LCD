import type { Prospect } from "@/domain/prospect";

export interface CreerProspectData {
  tenantId: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  source: string;
  notes: string | null;
}

export interface ProspectRepository {
  creer(data: CreerProspectData): Promise<Prospect>;
  lister(tenantId: string): Promise<Prospect[]>;
  trouverParId(tenantId: string, id: string): Promise<Prospect | null>;
  changerStatut(
    tenantId: string,
    id: string,
    statut: Prospect["statut"],
  ): Promise<Prospect | null>;
}
