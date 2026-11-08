import { ErreurMetier } from "@/domain/erreurs";
import {
  montantCautionValide,
  montantRetenuValide,
  type Caution,
} from "@/domain/caution";
import type { CautionRepository } from "../ports/caution-repository";
import type { Paiement } from "../ports/paiement";

export interface PrendreEmpreinteInput {
  tenantId: string;
  reservationId: string;
  montantCentimes: number;
  emailClient?: string;
}

export interface CapturerCautionInput {
  tenantId: string;
  cautionId: string;
  montantRetenuCentimes: number;
  motif?: string | null;
}

/**
 * Cycle de vie de la caution par empreinte bancaire :
 * autorisation (aucun débit), capture partielle ou totale, libération.
 */
export class GererCaution {
  constructor(
    private readonly cautions: CautionRepository,
    private readonly paiement: Paiement,
  ) {}

  async prendreEmpreinte(input: PrendreEmpreinteInput): Promise<Caution> {
    if (!montantCautionValide(input.montantCentimes)) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Le montant de la caution est invalide.",
      );
    }
    if (!this.paiement.creerEmpreinte) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "L'empreinte bancaire n'est pas disponible.",
      );
    }

    const { caution, cree } = await this.cautions.creer({
      tenantId: input.tenantId,
      reservationId: input.reservationId,
      montantCentimes: input.montantCentimes,
      mode: "empreinte",
    });
    if (!cree && caution.empreinteId) return caution;

    const empreinte = await this.paiement.creerEmpreinte({
      ref: caution.id,
      montantCentimes: input.montantCentimes,
      devise: "EUR",
      emailClient: input.emailClient,
      metadata: {
        tenant_id: input.tenantId,
        reservation_id: input.reservationId,
        caution_id: caution.id,
      },
    });

    const enregistree = await this.cautions.enregistrerEmpreinte(
      input.tenantId,
      caution.id,
      { empreinteId: empreinte.id, empreinteStatut: empreinte.statut },
    );
    if (!enregistree) {
      throw new ErreurMetier("CAUTION_INVALIDE", "Caution introuvable.");
    }

    return (
      (await this.cautions.changerStatut(input.tenantId, caution.id, {
        statut: "recue",
        dateReception: new Date().toISOString().slice(0, 10),
      })) ?? enregistree
    );
  }

  async capturer(input: CapturerCautionInput): Promise<Caution> {
    const caution = await this.chargerAutorisation(input.tenantId, input.cautionId);

    if (
      input.montantRetenuCentimes > 0 &&
      !montantRetenuValide(input.montantRetenuCentimes, caution.montantCentimes)
    ) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Le montant retenu dépasse la caution.",
      );
    }
    if (!this.paiement.capturerEmpreinte) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "La capture d'empreinte n'est pas disponible.",
      );
    }

    const capture = await this.paiement.capturerEmpreinte(
      caution.empreinteId as string,
      input.montantRetenuCentimes > 0
        ? input.montantRetenuCentimes
        : undefined,
    );
    await this.cautions.enregistrerCapture(input.tenantId, caution.id, {
      montantCaptureCentimes: capture.montantCentimes,
      empreinteStatut: capture.statut,
    });

    const statut = input.montantRetenuCentimes > 0 ? "retenue" : "restituee";
    return (
      (await this.cautions.changerStatut(input.tenantId, caution.id, {
        statut,
        dateRestitution:
          statut === "restituee" ? new Date().toISOString().slice(0, 10) : null,
        montantRetenuCentimes: input.montantRetenuCentimes,
        motifRetenue: input.motif ?? null,
      })) ?? caution
    );
  }

  async liberer(tenantId: string, cautionId: string): Promise<Caution> {
    const caution = await this.chargerAutorisation(tenantId, cautionId);

    if (this.paiement.annulerEmpreinte && caution.empreinteId) {
      await this.paiement.annulerEmpreinte(caution.empreinteId);
    }
    await this.cautions.enregistrerCapture(tenantId, caution.id, {
      montantCaptureCentimes: 0,
      empreinteStatut: "annulee",
    });
    return (
      (await this.cautions.changerStatut(tenantId, caution.id, {
        statut: "restituee",
        dateRestitution: new Date().toISOString().slice(0, 10),
        montantRetenuCentimes: 0,
      })) ?? caution
    );
  }

  private async chargerAutorisation(
    tenantId: string,
    cautionId: string,
  ): Promise<Caution> {
    const caution = await this.cautions.trouverParId(tenantId, cautionId);
    if (!caution) {
      throw new ErreurMetier("CAUTION_INVALIDE", "Cette caution n'existe pas.");
    }
    if (caution.statut !== "recue" || !caution.empreinteId) {
      throw new ErreurMetier(
        "CAUTION_INVALIDE",
        "Aucune empreinte active pour cette caution.",
      );
    }
    return caution;
  }
}
