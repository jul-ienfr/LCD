import {
  PHRASES_DEFAUT,
  refPhraseValide,
  validerPhrase,
  type CategoriePhrase,
  type Phrase,
} from "@/domain/phrase";
import { ErreurMetier } from "@/domain/erreurs";
import type { PhrasesRepository } from "../ports/phrases-repository";

export interface EnregistrerPhraseInput {
  tenantId: string;
  logementId: string | null;
  id?: string;
  ref: string;
  categorie: string;
  titre: string;
  contenu: string;
}

export class EnregistrerPhrase {
  constructor(private readonly phrases: PhrasesRepository) {}

  async executer(input: EnregistrerPhraseInput): Promise<Phrase> {
    const valide = validerPhrase({
      categorie: input.categorie,
      titre: input.titre,
      contenu: input.contenu,
    });

    if (input.id) {
      const existante = await this.phrases.trouverParId(
        input.tenantId,
        input.id,
      );
      if (!existante) {
        throw new ErreurMetier("PHRASE_INVALIDE", "Phrase introuvable.");
      }
      const misAJour = await this.phrases.mettreAJour(
        input.tenantId,
        input.id,
        valide,
      );
      if (!misAJour) {
        throw new ErreurMetier("PHRASE_INVALIDE", "Phrase introuvable.");
      }
      return misAJour;
    }

    if (!refPhraseValide(input.ref)) {
      throw new ErreurMetier("PHRASE_INVALIDE", "La référence est invalide.");
    }

    const existante = await this.phrases.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existante) {
      return (
        (await this.phrases.mettreAJour(
          input.tenantId,
          existante.id,
          valide,
        )) ?? existante
      );
    }

    return this.phrases.enregistrer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ref: input.ref,
      ...valide,
    });
  }
}

export interface InstallerPhrasesDefautInput {
  tenantId: string;
  logementId: string;
}

export class InstallerPhrasesDefaut {
  constructor(private readonly phrases: PhrasesRepository) {}

  async executer(input: InstallerPhrasesDefautInput): Promise<Phrase[]> {
    const creees: Phrase[] = [];
    for (const modele of PHRASES_DEFAUT) {
      const ref = `phrase-${input.logementId.slice(0, 8)}-${modele.code}`;
      const existante = await this.phrases.trouverParRef(input.tenantId, ref);
      if (existante) continue;
      creees.push(
        await this.phrases.enregistrer({
          tenantId: input.tenantId,
          logementId: input.logementId,
          ref,
          categorie: modele.categorie as CategoriePhrase,
          titre: modele.titre,
          contenu: modele.contenu,
        }),
      );
    }
    return creees;
  }
}

export class SupprimerPhrase {
  constructor(private readonly phrases: PhrasesRepository) {}

  async executer(tenantId: string, id: string): Promise<void> {
    await this.phrases.supprimer(tenantId, id);
  }
}
