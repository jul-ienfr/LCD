import type {
  CreerFactureData,
  FactureRepository,
} from "@/application/ports/facture-repository";
import type { Facture } from "@/domain/facture";

export class FactureRepositoryMemoire implements FactureRepository {
  private readonly rows: Facture[] = [];

  async creer(data: CreerFactureData): Promise<Facture> {
    const maintenant = new Date();
    const facture: Facture = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      reservationId: data.reservationId ?? null,
      numero: data.numero,
      clientNom: data.clientNom,
      clientEmail: data.clientEmail ?? null,
      dateEmission: data.dateEmission,
      echeance: data.echeance ?? null,
      montantHtCentimes: data.montantHtCentimes,
      tvaCentimes: data.tvaCentimes,
      taxeSejourCentimes: data.taxeSejourCentimes,
      montantTtcCentimes: data.montantTtcCentimes,
      statut: data.statut,
      notes: data.notes ?? null,
      lignes: data.lignes.map((ligne) => ({
        ...ligne,
        id: crypto.randomUUID(),
      })),
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(facture);
    return facture;
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Facture[]> {
    return this.rows.filter(
      (f) =>
        f.tenantId === tenantId &&
        f.dateEmission >= debut &&
        f.dateEmission <= fin,
    );
  }

  async trouver(tenantId: string, id: string): Promise<Facture | null> {
    return (
      this.rows.find((f) => f.tenantId === tenantId && f.id === id) ?? null
    );
  }
}
