import type { Bien, BienInput } from "@/domain/inventaire";

export type EvenementBien = {
  tenantId: string;
  logementId: string;
  bienId: string;
  type: "utilisation" | "etat";
  ref: string;
  payload: Record<string, unknown>;
};

export interface BiensRepository {
  listerParLogement(tenantId: string, logementId: string): Promise<Bien[]>;
  trouverParQr(
    tenantId: string,
    logementId: string,
    qr: string,
  ): Promise<Bien | null>;
  enregistrer(input: BienInput): Promise<Bien>;
  enregistrerUtilisation(
    tenantId: string,
    id: string,
    laver: boolean,
    date: string,
  ): Promise<Bien>;
  changerEtat(
    tenantId: string,
    id: string,
    etat: Bien["etat"],
    notes: string | null,
  ): Promise<Bien>;
  evenementExiste(tenantId: string, ref: string): Promise<boolean>;
  enregistrerEvenement(evenement: EvenementBien): Promise<void>;
}
