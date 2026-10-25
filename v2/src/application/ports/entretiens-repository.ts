import type { Entretien, TypeEntretien } from "@/domain/entretien";

export interface CreerEntretienData {
  tenantId: string;
  logementId: string;
  ref: string;
  date: string;
  type: TypeEntretien;
  titre: string;
  description: string;
  prestataire: string | null;
  coutCentimes: number;
}

export interface EntretiensRepository {
  creer(data: CreerEntretienData): Promise<Entretien>;
  trouverParRef(tenantId: string, ref: string): Promise<Entretien | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Entretien[]>;
}
