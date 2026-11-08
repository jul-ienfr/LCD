import type {
  DefinirTarifData,
  TarifRepository,
} from "@/application/ports/tarif-repository";
import type { Tarif } from "@/domain/tarif";

export class TarifRepositoryMemoire implements TarifRepository {
  private readonly rows: Tarif[] = [];

  async definir(data: DefinirTarifData): Promise<Tarif> {
    const planTarifaireId = data.planTarifaireId ?? null;
    const existant = this.rows.find(
      (t) =>
        t.tenantId === data.tenantId &&
        t.logementId === data.logementId &&
        (t.planTarifaireId ?? null) === planTarifaireId &&
        t.date === data.date,
    );
    if (existant) {
      existant.prixCentimes = data.prixCentimes;
      existant.prixParPersonneCentimes = data.prixParPersonneCentimes ?? null;
      existant.personnesIncluses = data.personnesIncluses ?? 2;
      existant.source = data.source ?? "manuel";
      existant.updatedAt = new Date();
      return existant;
    }

    const maintenant = new Date();
    const tarif: Tarif = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      planTarifaireId,
      date: data.date,
      prixCentimes: data.prixCentimes,
      prixParPersonneCentimes: data.prixParPersonneCentimes ?? null,
      personnesIncluses: data.personnesIncluses ?? 2,
      source: data.source ?? "manuel",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(tarif);
    return tarif;
  }

  async definirPlusieurs(
    data: readonly DefinirTarifData[],
  ): Promise<Tarif[]> {
    const resultats: Tarif[] = [];
    for (const entree of data) {
      resultats.push(await this.definir(entree));
    }
    return resultats;
  }

  async listerParMois(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId: string | null = null,
  ): Promise<Tarif[]> {
    return this.rows.filter(
      (t) =>
        t.tenantId === tenantId &&
        t.logementId === logementId &&
        (t.planTarifaireId ?? null) === planTarifaireId &&
        t.date >= debut &&
        t.date <= fin,
    );
  }

  async trouver(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId: string | null = null,
  ): Promise<Tarif | null> {
    return (
      this.rows.find(
        (t) =>
          t.tenantId === tenantId &&
          t.logementId === logementId &&
          (t.planTarifaireId ?? null) === planTarifaireId &&
          t.date === date,
      ) ?? null
    );
  }
}
