import { normaliserConformite } from "@/domain/annonce";
import { ErreurMetier } from "@/domain/erreurs";
import type { AnnoncesConformiteRepository } from "../ports/annonces-conformite-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface EnregistrerConformiteInput {
  tenantId: string;
  logementId: string;
  mentions: Record<string, boolean>;
  dpeClasse?: string | null;
  gesClasse?: string | null;
  classement?: string | null;
  numeroEnregistrement?: string | null;
  numeroCerfa?: string | null;
}

export class EnregistrerConformiteAnnonce {
  constructor(
    private readonly conformites: AnnoncesConformiteRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: EnregistrerConformiteInput) {
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "ANNONCE_INVALIDE",
        "Le logement est introuvable.",
      );
    }
    const valeurs = normaliserConformite(input);
    return this.conformites.enregistrer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      ...valeurs,
    });
  }
}
