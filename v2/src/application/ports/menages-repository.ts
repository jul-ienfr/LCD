import type {
  Menage,
  StatutMenage,
  TacheMenage,
} from "@/domain/menage";

export interface CreerMenageData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  date: string;
  statut: StatutMenage;
  notes: string;
  taches: TacheMenage[];
}

export interface MettreAJourMenageData {
  statut: StatutMenage;
  notes: string;
  taches: TacheMenage[];
}

export interface MenagesRepository {
  creer(data: CreerMenageData): Promise<Menage>;
  trouverParRef(tenantId: string, ref: string): Promise<Menage | null>;
  trouverParId(tenantId: string, id: string): Promise<Menage | null>;
  listerParLogement(tenantId: string, logementId: string): Promise<Menage[]>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourMenageData,
  ): Promise<Menage>;
}
