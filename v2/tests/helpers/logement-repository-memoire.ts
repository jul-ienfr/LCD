import type {
  CreerLogementData,
  LogementRepository,
} from "@/application/ports/logement-repository";
import type { Logement } from "@/domain/logement";

export class LogementRepositoryMemoire implements LogementRepository {
  private readonly logements: Logement[] = [];

  async creer(data: CreerLogementData): Promise<Logement> {
    const maintenant = new Date();
    const logement: Logement = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      code: data.code,
      nom: data.nom,
      adresse: data.adresse,
      statut: "actif",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.logements.push(logement);
    return logement;
  }

  async listerParTenant(tenantId: string): Promise<Logement[]> {
    return this.logements.filter((l) => l.tenantId === tenantId);
  }

  async trouverParCode(
    tenantId: string,
    code: string,
  ): Promise<Logement | null> {
    return (
      this.logements.find(
        (l) => l.tenantId === tenantId && l.code === code,
      ) ?? null
    );
  }

  async trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Logement | null> {
    return (
      this.logements.find((l) => l.tenantId === tenantId && l.id === id) ??
      null
    );
  }
}
