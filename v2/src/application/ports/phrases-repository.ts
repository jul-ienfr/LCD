import type { CategoriePhrase, Phrase } from "@/domain/phrase";

export interface EnregistrerPhraseData {
  tenantId: string;
  logementId: string | null;
  ref: string;
  categorie: CategoriePhrase;
  titre: string;
  contenu: string;
}

export interface MettreAJourPhraseData {
  categorie: CategoriePhrase;
  titre: string;
  contenu: string;
}

export interface PhrasesRepository {
  enregistrer(data: EnregistrerPhraseData): Promise<Phrase>;
  mettreAJour(
    tenantId: string,
    id: string,
    data: MettreAJourPhraseData,
  ): Promise<Phrase | null>;
  trouverParRef(tenantId: string, ref: string): Promise<Phrase | null>;
  trouverParId(tenantId: string, id: string): Promise<Phrase | null>;
  listerParLogement(
    tenantId: string,
    logementId: string,
  ): Promise<Phrase[]>;
  supprimer(tenantId: string, id: string): Promise<void>;
}
