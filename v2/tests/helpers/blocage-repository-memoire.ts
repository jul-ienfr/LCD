import type {
  BlocageRepository,
  CreerBlocageData,
  ResultatBlocage,
} from "@/application/ports/blocage-repository";
import type { Blocage } from "@/domain/blocage";
import { sejoursSeChevauchent } from "@/domain/planning";

export class BlocageRepositoryMemoire implements BlocageRepository {
  private readonly rows: Blocage[] = [];

  async creer(data: CreerBlocageData): Promise<ResultatBlocage> {
    const existant = await this.trouverParRef(data.tenantId, data.ref);
    if (existant) return { blocage: existant, cree: false };

    const maintenant = new Date();
    const blocage: Blocage = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      logementId: data.logementId,
      ref: data.ref,
      debut: data.debut,
      fin: data.fin,
      source: data.source ?? "import-ics",
      motif: data.motif ?? null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(blocage);
    return { blocage, cree: true };
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<Blocage | null> {
    return (
      this.rows.find((b) => b.tenantId === tenantId && b.ref === ref) ?? null
    );
  }

  async chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean> {
    return this.rows.some(
      (b) =>
        b.tenantId === tenantId &&
        b.logementId === logementId &&
        sejoursSeChevauchent(b.debut, b.fin, debut, fin),
    );
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Blocage[]> {
    return this.rows.filter(
      (b) => b.tenantId === tenantId && b.debut < fin && b.fin > debut,
    );
  }

  async listerTous(tenantId: string): Promise<Blocage[]> {
    return this.rows.filter((b) => b.tenantId === tenantId);
  }
}
