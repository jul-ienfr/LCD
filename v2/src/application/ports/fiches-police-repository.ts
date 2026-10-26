import type { FichePolice, NouvelleFichePolice } from "@/domain/fiche-police";

export interface FichesPoliceRepository {
  enregistrer(fiche: NouvelleFichePolice): Promise<FichePolice>;
  listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<FichePolice[]>;
  lister(tenantId: string, limite: number): Promise<FichePolice[]>;
  purgerExpirees(tenantId: string, maintenant: Date): Promise<number>;
}
