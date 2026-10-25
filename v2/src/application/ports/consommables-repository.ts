import type {
  Consommable,
  ConsommableInput,
  MouvementStock,
} from "@/domain/stocks";

export interface ConsommablesRepository {
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Consommable[]>;
  trouverParCode(
    tenantId: string,
    logementId: string,
    code: string,
  ): Promise<Consommable | null>;
  enregistrer(input: ConsommableInput): Promise<Consommable>;
  mettreAJourStock(
    tenantId: string,
    id: string,
    stock: number,
  ): Promise<Consommable>;
  mouvementExiste(tenantId: string, ref: string): Promise<boolean>;
  enregistrerMouvement(
    mouvement: Omit<MouvementStock, "id">,
  ): Promise<void>;
}
