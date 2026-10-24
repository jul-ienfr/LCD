export type ProspectId = string;
export type StatutProspect =
  | "nouveau"
  | "qualifie"
  | "visite"
  | "offre"
  | "gagne"
  | "perdu";

export interface Prospect {
  id: ProspectId;
  tenantId: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  source: string;
  statut: StatutProspect;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export const TRANSITIONS_PROSPECT: Record<
  StatutProspect,
  StatutProspect[]
> = {
  nouveau: ["qualifie", "perdu"],
  qualifie: ["visite", "offre", "perdu"],
  visite: ["offre", "perdu"],
  offre: ["gagne", "perdu"],
  gagne: [],
  perdu: [],
};

export function emailValide(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function prospectValide(input: {
  nom: string;
  email?: string | null;
  telephone?: string | null;
  notes?: string | null;
}): boolean {
  if (input.nom.trim().length < 2 || input.nom.trim().length > 120) {
    return false;
  }
  if (input.email && !emailValide(input.email)) return false;
  if (input.telephone && input.telephone.trim().length > 40) return false;
  if (input.notes && input.notes.length > 2000) return false;
  return true;
}
