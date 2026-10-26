import {
  confirmationPurgeValide,
  CONFIRMATION_PURGE_AUDIT,
  dateLimiteRetention,
  joursRetentionValide,
} from "@/domain/audit";
import { ErreurMetier } from "@/domain/erreurs";
import type { AuditRepository } from "../ports/audit-repository";

export interface PurgerAuditInput {
  tenantId: string;
  jours: number;
  confirmation: string;
  maintenant?: Date;
}

export interface ResultatPurgeAudit {
  limite: Date;
  supprimes: number;
}

export class PurgerAudit {
  constructor(private readonly audit: AuditRepository) {}

  async executer(input: PurgerAuditInput): Promise<ResultatPurgeAudit> {
    if (!joursRetentionValide(input.jours)) {
      throw new ErreurMetier(
        "AUDIT_INVALIDE",
        "La rétention doit être comprise entre 365 et 36500 jours.",
      );
    }
    if (!confirmationPurgeValide(input.confirmation)) {
      throw new ErreurMetier(
        "AUDIT_INVALIDE",
        `Saisissez « ${CONFIRMATION_PURGE_AUDIT} » pour confirmer la purge.`,
      );
    }

    const limite = dateLimiteRetention(
      input.jours,
      input.maintenant ?? new Date(),
    );
    const supprimes = await this.audit.supprimerAvant(input.tenantId, limite);
    return { limite, supprimes };
  }
}
