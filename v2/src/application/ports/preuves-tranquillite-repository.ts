import type {
  MomentPreuve,
  PreuveTranquillite,
  TypePreuve,
} from "@/domain/preuve-tranquillite";

export interface CreerPreuveData {
  tenantId: string;
  logementId: string;
  ref: string;
  type: TypePreuve;
  date: string;
  moment: MomentPreuve | null;
  valeurDb: number | null;
  note: string;
}

export interface PreuvesTranquilliteRepository {
  creer(data: CreerPreuveData): Promise<PreuveTranquillite>;
  trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<PreuveTranquillite | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<PreuveTranquillite[]>;
  supprimer(tenantId: string, id: string): Promise<void>;
}
