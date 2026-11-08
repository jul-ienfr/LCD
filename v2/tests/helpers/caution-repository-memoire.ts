import type {
  CautionRepository,
  ChangerStatutCautionData,
  CreerCautionData,
  ResultatCaution,
} from "@/application/ports/caution-repository";
import type { Caution } from "@/domain/caution";

export class CautionRepositoryMemoire implements CautionRepository {
  readonly rows: Caution[] = [];

  async creer(data: CreerCautionData): Promise<ResultatCaution> {
    const existante = await this.trouverParReservation(
      data.tenantId,
      data.reservationId,
    );
    if (existante) return { caution: existante, cree: false };

    const maintenant = new Date();
    const caution: Caution = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      reservationId: data.reservationId,
      montantCentimes: data.montantCentimes,
      mode: data.mode ?? "virement",
      empreinteId: data.empreinteId ?? null,
      empreinteStatut: data.empreinteStatut ?? null,
      montantCaptureCentimes: 0,
      statut: "attendue",
      dateReception: null,
      dateRestitution: null,
      montantRetenuCentimes: 0,
      motifRetenue: null,
      notes: data.notes ?? null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(caution);
    return { caution, cree: true };
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<Caution | null> {
    return (
      this.rows.find(
        (caution) =>
          caution.tenantId === tenantId &&
          caution.reservationId === reservationId,
      ) ?? null
    );
  }

  async trouverParId(tenantId: string, id: string): Promise<Caution | null> {
    return (
      this.rows.find(
        (caution) => caution.tenantId === tenantId && caution.id === id,
      ) ?? null
    );
  }

  async listerParTenant(tenantId: string): Promise<Caution[]> {
    return this.rows.filter((caution) => caution.tenantId === tenantId);
  }

  async changerStatut(
    tenantId: string,
    id: string,
    data: ChangerStatutCautionData,
  ): Promise<Caution | null> {
    const caution = await this.trouverParId(tenantId, id);
    if (!caution) return null;
    caution.statut = data.statut;
    if (data.dateReception !== undefined) {
      caution.dateReception = data.dateReception;
    }
    if (data.dateRestitution !== undefined) {
      caution.dateRestitution = data.dateRestitution;
    }
    if (data.montantRetenuCentimes !== undefined) {
      caution.montantRetenuCentimes = data.montantRetenuCentimes;
    }
    if (data.motifRetenue !== undefined) {
      caution.motifRetenue = data.motifRetenue;
    }
    caution.updatedAt = new Date();
    return caution;
  }

  async enregistrerEmpreinte(
    tenantId: string,
    id: string,
    data: { empreinteId: string; empreinteStatut: string },
  ): Promise<Caution | null> {
    const caution = await this.trouverParId(tenantId, id);
    if (!caution) return null;
    caution.mode = "empreinte";
    caution.empreinteId = data.empreinteId;
    caution.empreinteStatut = data.empreinteStatut;
    caution.updatedAt = new Date();
    return caution;
  }

  async enregistrerCapture(
    tenantId: string,
    id: string,
    data: { montantCaptureCentimes: number; empreinteStatut: string },
  ): Promise<Caution | null> {
    const caution = await this.trouverParId(tenantId, id);
    if (!caution) return null;
    caution.montantCaptureCentimes = data.montantCaptureCentimes;
    caution.empreinteStatut = data.empreinteStatut;
    caution.updatedAt = new Date();
    return caution;
  }
}
