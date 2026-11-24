export interface EntreePreuvePhotos {
  archive: string;
  sha256: string;
  fichiers: number;
  fichiersArchive: number;
  octets: number;
  prisLe?: string;
}

export interface PreuvePhotos {
  version: number;
  archive: string;
  sha256: string;
  fichiers: number;
  fichiersArchive: number;
  octets: number;
  complet: boolean;
  prisLe: string;
}

export function construirePreuve(entree: EntreePreuvePhotos): PreuvePhotos;
