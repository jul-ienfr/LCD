import type { LanguePublique } from "@/domain/page-publique";

export interface DemandeTraduction {
  texte: string;
  de: LanguePublique;
  vers: LanguePublique;
}

export interface Traduction {
  texte: string;
  modele: string;
}

/** Port de traduction : aucun fournisseur ne fuit dans le domaine. */
export interface Traducteur {
  traduire(demande: DemandeTraduction): Promise<Traduction>;
}
