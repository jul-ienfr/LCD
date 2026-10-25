import { ErreurMetier } from "@/domain/erreurs";
import {
  dateExpiration,
  memoireValide,
  nomMemoireValide,
  preferencesNormalisees,
} from "@/domain/memoire";
import { hashEmail } from "@/lib/memoire";
import type {
  MemoireRepository,
  MemoireVoyageur as MemoireLigne,
} from "../ports/memoire-repository";

export interface MemoriserVoyageurInput {
  tenantId: string;
  email: string;
  nom: string;
  preferences: string;
  consentement: boolean;
}

export class MemoriserVoyageur {
  constructor(private readonly repo: MemoireRepository) {}

  async executer(input: MemoriserVoyageurInput): Promise<MemoireLigne> {
    if (!input.consentement) {
      throw new ErreurMetier(
        "MEMOIRE_INVALIDE",
        "Le consentement est requis pour mémoriser vos préférences.",
      );
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.email.trim())) {
      throw new ErreurMetier("EMAIL_INVALIDE", "L’adresse email est invalide.");
    }
    if (!nomMemoireValide(input.nom)) {
      throw new ErreurMetier(
        "NOM_INVALIDE",
        "Le nom doit contenir 2 à 120 caractères.",
      );
    }
    const consentementAt = new Date();
    return this.repo.enregistrer({
      tenantId: input.tenantId,
      emailHash: hashEmail(input.email),
      nom: input.nom.trim(),
      preferences: preferencesNormalisees(input.preferences),
      consentementAt,
      expireAt: dateExpiration(consentementAt),
    });
  }
}

export class OublierVoyageur {
  constructor(private readonly repo: MemoireRepository) {}

  async executer(tenantId: string, email: string): Promise<boolean> {
    if (!tenantId || !email.trim()) {
      throw new ErreurMetier("MEMOIRE_INVALIDE", "Email requis.");
    }
    return this.repo.supprimer(tenantId, hashEmail(email));
  }
}

export class LireMemoireVoyageur {
  constructor(private readonly repo: MemoireRepository) {}

  async executer(
    tenantId: string,
    email: string | null,
  ): Promise<MemoireLigne | null> {
    if (!email) return null;
    const memoire = await this.repo.trouverParHash(
      tenantId,
      hashEmail(email),
    );
    if (!memoire) return null;
    if (!memoireValide(memoire.expireAt)) {
      await this.repo.supprimer(tenantId, memoire.emailHash);
      return null;
    }
    return memoire;
  }
}
