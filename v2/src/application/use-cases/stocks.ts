import { ErreurMetier } from "@/domain/erreurs";
import {
  appliquerConsommation,
  appliquerReassort,
  codeConsommableValide,
  listeCourses,
  validerNombreEntier,
  type Consommable,
  type LigneCourse,
} from "@/domain/stocks";
import type { ConsommablesRepository } from "../ports/consommables-repository";

export class ListerConsommables {
  constructor(private readonly repo: ConsommablesRepository) {}

  async executer(
    tenantId: string,
    logementId: string,
  ): Promise<Consommable[]> {
    return this.repo.listerParLogement(tenantId, logementId);
  }
}

export interface EnregistrerConsommableInput {
  id?: string;
  tenantId: string;
  logementId: string;
  code: string;
  label: string;
  stock: number;
  unite: string;
  seuil: number;
  cible: number;
  consoRotation: number;
}

export class EnregistrerConsommable {
  constructor(private readonly repo: ConsommablesRepository) {}

  async executer(input: EnregistrerConsommableInput): Promise<Consommable> {
    const code = input.code.trim().toLowerCase();
    const label = input.label.trim();
    const unite = input.unite.trim() || "unité";

    if (!codeConsommableValide(code)) {
      throw new ErreurMetier(
        "STOCK_INVALIDE",
        "Code invalide : 2 à 64 caractères a-z, 0-9, point, tiret ou underscore.",
      );
    }
    if (label.length < 1 || label.length > 120) {
      throw new ErreurMetier(
        "STOCK_INVALIDE",
        "Le libellé doit contenir 1 à 120 caractères.",
      );
    }
    if (unite.length > 20) {
      throw new ErreurMetier(
        "STOCK_INVALIDE",
        "L’unité est limitée à 20 caractères.",
      );
    }

    const stock = validerNombreEntier(input.stock, "Le stock");
    const seuil = validerNombreEntier(input.seuil, "Le seuil");
    const cible = validerNombreEntier(input.cible, "La cible");
    const consoRotation = validerNombreEntier(
      input.consoRotation,
      "La consommation par rotation",
    );
    if (cible < seuil) {
      throw new ErreurMetier(
        "STOCK_INVALIDE",
        "La cible doit être supérieure ou égale au seuil.",
      );
    }

    return this.repo.enregistrer({
      id: input.id,
      tenantId: input.tenantId,
      logementId: input.logementId,
      code,
      label,
      stock,
      unite,
      seuil,
      cible,
      consoRotation,
    });
  }
}

export interface RotationInput {
  tenantId: string;
  logementId: string;
  code?: string;
  qui: string;
  ref: string;
}

function referenceMouvement(ref: string, item: Consommable): string {
  return `${ref}:${item.code}`;
}

export class ConsommerRotation {
  constructor(private readonly repo: ConsommablesRepository) {}

  async executer(input: RotationInput): Promise<Consommable[]> {
    const items = await this.cibler(input);
    const qui = input.qui.trim() || "inconnu";

    for (const item of items) {
      if (item.consoRotation <= 0) continue;
      const ref = referenceMouvement(input.ref, item);
      if (await this.repo.mouvementExiste(input.tenantId, ref)) continue;

      const apres = appliquerConsommation(item.stock, item.consoRotation);
      if (apres === item.stock) continue;

      await this.repo.mettreAJourStock(input.tenantId, item.id, apres);
      await this.repo.enregistrerMouvement({
        tenantId: input.tenantId,
        logementId: input.logementId,
        consommableId: item.id,
        type: "conso",
        quantite: item.stock - apres,
        avant: item.stock,
        apres,
        qui,
        ref,
      });
    }

    return this.repo.listerParLogement(input.tenantId, input.logementId);
  }

  private async cibler(input: RotationInput): Promise<Consommable[]> {
    if (!input.code) {
      return this.repo.listerParLogement(input.tenantId, input.logementId);
    }
    const item = await this.repo.trouverParCode(
      input.tenantId,
      input.logementId,
      input.code,
    );
    if (!item) {
      throw new ErreurMetier("STOCK_INVALIDE", "Consommable introuvable.");
    }
    return [item];
  }
}

export class ReassortirConsommables {
  constructor(private readonly repo: ConsommablesRepository) {}

  async executer(input: RotationInput): Promise<Consommable[]> {
    const items = await this.cibler(input);
    const qui = input.qui.trim() || "inconnu";

    for (const item of items) {
      const ref = referenceMouvement(input.ref, item);
      if (await this.repo.mouvementExiste(input.tenantId, ref)) continue;

      const apres = appliquerReassort(item.stock, item.cible);
      if (apres === item.stock) continue;

      await this.repo.mettreAJourStock(input.tenantId, item.id, apres);
      await this.repo.enregistrerMouvement({
        tenantId: input.tenantId,
        logementId: input.logementId,
        consommableId: item.id,
        type: "reassort",
        quantite: apres - item.stock,
        avant: item.stock,
        apres,
        qui,
        ref,
      });
    }

    return this.repo.listerParLogement(input.tenantId, input.logementId);
  }

  private async cibler(input: RotationInput): Promise<Consommable[]> {
    if (!input.code) {
      return this.repo.listerParLogement(input.tenantId, input.logementId);
    }
    const item = await this.repo.trouverParCode(
      input.tenantId,
      input.logementId,
      input.code,
    );
    if (!item) {
      throw new ErreurMetier("STOCK_INVALIDE", "Consommable introuvable.");
    }
    return [item];
  }
}

export type Courses = {
  ruptures: LigneCourse[];
  bas: LigneCourse[];
  totalArticles: number;
};

export class CalculerCourses {
  constructor(private readonly repo: ConsommablesRepository) {}

  async executer(tenantId: string, logementId: string): Promise<Courses> {
    const items = await this.repo.listerParLogement(tenantId, logementId);
    return listeCourses(items);
  }
}
