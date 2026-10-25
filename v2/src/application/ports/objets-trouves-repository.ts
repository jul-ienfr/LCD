import type {
  ObjetTrouve,
  StatutObjetTrouve,
} from "@/domain/objet-trouve";

export interface CreerObjetTrouveData {
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  description: string;
  lieu: string;
  trouveLe: string;
  voyageurNom: string | null;
  contact: string | null;
}

export interface MiseAJourObjetTrouveData {
  statut?: StatutObjetTrouve;
  voyageurNom?: string | null;
  contact?: string | null;
  fraisCentimes?: number;
  envoyeLe?: string | null;
}

export interface ObjetsTrouvesRepository {
  creer(data: CreerObjetTrouveData): Promise<ObjetTrouve>;
  trouverParRef(tenantId: string, ref: string): Promise<ObjetTrouve | null>;
  trouverParId(tenantId: string, id: string): Promise<ObjetTrouve | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<ObjetTrouve[]>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MiseAJourObjetTrouveData,
  ): Promise<ObjetTrouve | null>;
}
