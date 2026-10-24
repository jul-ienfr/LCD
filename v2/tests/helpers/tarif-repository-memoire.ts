import type {
  DefinirTarifData,
  TarifRepository,
} from "@/application/ports/tarif-repository";
import type { Tarif } from "@/domain/tarif";

export class TarifRepositoryMemoire implements TarifRepository {
  private readonly rows: Tarif[] = [];

  async definir(data: DefinirTarifData): Promise<Tarif> {
    const existant = this.rows.find(
      (t) =>
        t.tenantId === data.tenantId &&
        t.logementId === data.logementId &&
        t.date === data.date,
    );
    if (existant) {
      existant.prixCentimes = data.prixCentimes;
      existant.source = data.source ?? "manuel";
      existant.updatedAt = new Date();
      return existant;
    }

    const maintenant = new Date();
    const tarif: Tarif = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      date: data.date,
      prixCentimes: data.prixCentimes,
      source: data.source ?? "manuel",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(tarif);
    return tarif;
  }

  async listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<Tarif[]> {
    return this.rows.filter(
      (t) =>
        t.tenantId === tenantId &&
        t.logementId === logementId &&
        t.date >= debut &&
        t.date <= fin,
    );
  }

  async trouver(
    tenantId: string,
    logementId: string,
    date: string,
  ): Promise<Tarif | null> {
    return (
      this.rows.find(
        (t) =>
          t.tenantId === tenantId &&
          t.logementId === logementId &&
          t.date === date,
      ) ?? null
    );
  }
}
