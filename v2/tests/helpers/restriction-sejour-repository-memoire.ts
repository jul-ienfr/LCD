import type { RestrictionSejourRepository } from "@/application/ports/restriction-sejour-repository";
import type {
  RestrictionSejour,
  ValeursRestrictionSejour,
} from "@/domain/restriction-sejour";

export class RestrictionSejourRepositoryMemoire
  implements RestrictionSejourRepository
{
  private readonly rows: RestrictionSejour[] = [];

  async listerParPeriode(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour[]> {
    return this.rows.filter(
      (row) =>
        row.tenantId === tenantId &&
        row.logementId === logementId &&
        (row.planTarifaireId ?? null) === planTarifaireId &&
        row.date >= debut &&
        row.date <= fin,
    );
  }

  async enregistrer(
    tenantId: string,
    logementId: string,
    valeurs: ValeursRestrictionSejour,
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour> {
    const existante = this.rows.find(
      (row) =>
        row.tenantId === tenantId &&
        row.logementId === logementId &&
        (row.planTarifaireId ?? null) === planTarifaireId &&
        row.date === valeurs.date,
    );
    if (existante) {
      existante.sejourMin = valeurs.sejourMin;
      existante.sejourMax = valeurs.sejourMax;
      existante.arriveeAutorisee = valeurs.arriveeAutorisee;
      existante.departAutorisee = valeurs.departAutorisee;
      existante.stopSell = valeurs.stopSell;
      existante.updatedAt = new Date();
      return existante;
    }
    const row: RestrictionSejour = {
      id: crypto.randomUUID(),
      tenantId,
      logementId,
      planTarifaireId,
      date: valeurs.date,
      sejourMin: valeurs.sejourMin,
      sejourMax: valeurs.sejourMax,
      arriveeAutorisee: valeurs.arriveeAutorisee,
      departAutorisee: valeurs.departAutorisee,
      stopSell: valeurs.stopSell,
      updatedAt: new Date(),
    };
    this.rows.push(row);
    return row;
  }

  async enregistrerPlusieurs(
    tenantId: string,
    logementId: string,
    valeurs: readonly ValeursRestrictionSejour[],
    planTarifaireId: string | null = null,
  ): Promise<RestrictionSejour[]> {
    return Promise.all(
      valeurs.map((valeur) =>
        this.enregistrer(tenantId, logementId, valeur, planTarifaireId),
      ),
    );
  }

  async supprimer(
    tenantId: string,
    logementId: string,
    date: string,
    planTarifaireId: string | null = null,
  ): Promise<void> {
    const index = this.rows.findIndex(
      (row) =>
        row.tenantId === tenantId &&
        row.logementId === logementId &&
        (row.planTarifaireId ?? null) === planTarifaireId &&
        row.date === date,
    );
    if (index >= 0) this.rows.splice(index, 1);
  }

  async supprimerPlusieurs(
    tenantId: string,
    logementId: string,
    dates: readonly string[],
    planTarifaireId: string | null = null,
  ): Promise<void> {
    await Promise.all(
      dates.map((date) =>
        this.supprimer(tenantId, logementId, date, planTarifaireId),
      ),
    );
  }
}
