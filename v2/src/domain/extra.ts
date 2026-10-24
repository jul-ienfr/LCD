export type ExtraId = string;
export type StatutCommandeExtra =
  | "demandee"
  | "confirmee"
  | "refusee"
  | "livree";

export interface Extra {
  id: ExtraId;
  tenantId: string;
  logementId: string | null;
  code: string;
  nom: string;
  description: string | null;
  prixCentimes: number;
  actif: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommandeExtra {
  id: string;
  tenantId: string;
  reservationId: string;
  extraId: string;
  quantite: number;
  prixUnitaireCentimes: number;
  totalCentimes: number;
  ref: string;
  statut: StatutCommandeExtra;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSITIONS_COMMANDE_EXTRA: Record<
  StatutCommandeExtra,
  StatutCommandeExtra[]
> = {
  demandee: ["confirmee", "refusee"],
  confirmee: ["livree", "refusee"],
  refusee: [],
  livree: [],
};

export function codeExtraValide(code: string): boolean {
  return /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/.test(code);
}

export function extraValide(input: {
  nom: string;
  prixCentimes: number;
  description?: string | null;
}): boolean {
  return (
    input.nom.trim().length >= 2 &&
    input.nom.trim().length <= 120 &&
    Number.isInteger(input.prixCentimes) &&
    input.prixCentimes >= 0 &&
    (!input.description || input.description.length <= 1000)
  );
}

export function quantiteExtraValide(quantite: number): boolean {
  return Number.isInteger(quantite) && quantite >= 1 && quantite <= 20;
}

export function refCommandeExtraValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{8,64}$/.test(ref);
}
