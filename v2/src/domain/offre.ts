export type OffreId = string;
export type StatutOffre = "brouillon" | "envoyee" | "acceptee" | "refusee";

export interface Offre {
  id: OffreId;
  tenantId: string;
  prospectId: string;
  logementId: string | null;
  titre: string;
  montantCentimes: number;
  statut: StatutOffre;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSITIONS_OFFRE: Record<StatutOffre, StatutOffre[]> = {
  brouillon: ["envoyee", "refusee"],
  envoyee: ["acceptee", "refusee"],
  acceptee: [],
  refusee: [],
};

export function offreValide(input: {
  titre: string;
  montantCentimes: number;
  notes?: string | null;
}): boolean {
  return (
    input.titre.trim().length >= 2 &&
    input.titre.trim().length <= 120 &&
    Number.isInteger(input.montantCentimes) &&
    input.montantCentimes >= 0 &&
    (!input.notes || input.notes.length <= 2000)
  );
}
