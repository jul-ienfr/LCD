import type {
  EvenementCanal,
  StatutEvenementCanal,
  TypeEvenementCanal,
} from "@/domain/canal";
import type { CodeFournisseur } from "@/domain/fournisseur";

export interface CreerEvenementCanalData {
  tenantId: string;
  logementFournisseurId: string;
  fournisseurCode: CodeFournisseur;
  type: TypeEvenementCanal;
  externalId?: string | null;
  cleIdempotence: string;
  payload?: Record<string, unknown>;
}

export interface ResultatEnregistrementEvenement {
  evenement: EvenementCanal;
  cree: boolean;
}

export interface EvenementCanalRepository {
  /**
   * Enregistre un événement une seule fois par `cleIdempotence`.
   * Retourne `cree: false` si l'événement existait déjà.
   */
  enregistrer(
    data: CreerEvenementCanalData,
  ): Promise<ResultatEnregistrementEvenement>;

  marquerTraite(
    tenantId: string,
    id: string,
    statut: StatutEvenementCanal,
    message?: string | null,
  ): Promise<void>;

  listerRecents(tenantId: string, limite: number): Promise<EvenementCanal[]>;
}
