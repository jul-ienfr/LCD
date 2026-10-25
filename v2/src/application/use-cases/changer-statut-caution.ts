import { ErreurMetier } from "@/domain/erreurs";
import {
  TRANSITIONS_CAUTION,
  montantRetenuValide,
  type StatutCaution,
} from "@/domain/caution";
import type { CautionRepository } from "../ports/caution-repository";

export class ChangerStatutCaution {
  constructor(private readonly repo: CautionRepository) {}

  async executer(input: {
    tenantId: string;
    cautionId: string;
    statut: StatutCaution;
    montantRetenuCentimes?: number;
    motifRetenue?: string | null;
  }) {
    const caution = await this.repo.trouverParId(
      input.tenantId,
      input.cautionId,
    );
    if (!caution) {
      throw new ErreurMetier("CAUTION_INVALIDE", "Caution introuvable.");
    }
    if (caution.statut === input.statut) return caution;
    if (!TRANSITIONS_CAUTION[caution.statut].includes(input.statut)) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        `Transition ${caution.statut} → ${input.statut} interdite.`,
      );
    }

    const aujourdHui = new Date().toISOString().slice(0, 10);

    if (input.statut === "recue") {
      return this.repo.changerStatut(input.tenantId, caution.id, {
        statut: "recue",
        dateReception: aujourdHui,
      });
    }

    if (input.statut === "restituee") {
      return this.repo.changerStatut(input.tenantId, caution.id, {
        statut: "restituee",
        dateRestitution: aujourdHui,
        montantRetenuCentimes: 0,
        motifRetenue: null,
      });
    }

    const montantRetenu = input.montantRetenuCentimes ?? 0;
    if (!montantRetenuValide(montantRetenu, caution.montantCentimes)) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Le montant retenu doit être compris entre 1 centime et le montant de la caution.",
      );
    }
    const motif = input.motifRetenue?.trim();
    if (!motif || motif.length < 3 || motif.length > 500) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Un motif de retenue est requis (3 à 500 caractères).",
      );
    }

    return this.repo.changerStatut(input.tenantId, caution.id, {
      statut: "retenue",
      dateRestitution: aujourdHui,
      montantRetenuCentimes: montantRetenu,
      motifRetenue: motif,
    });
  }
}
