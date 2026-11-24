export interface ArtefactSauvegarde {
  name?: string | null;
  created_at?: string | null;
  expires_at?: string | null;
}

export interface EtatCopieHorsSite {
  present: boolean;
  ageHeures: number | null;
  nom: string | null;
  expireLe: string | null;
  conforme: boolean;
}

export const PREFIXE_ARTEFACT: string;
export function artefactsSauvegarde(artefacts: ArtefactSauvegarde[]): ArtefactSauvegarde[];
export function etatCopieHorsSite(
  artefacts: ArtefactSauvegarde[],
  maintenant: Date,
  ageMaxHeures?: number,
): EtatCopieHorsSite;
