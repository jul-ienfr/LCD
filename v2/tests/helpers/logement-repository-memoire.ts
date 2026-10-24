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

  async mettreAJourGuide(
    tenantId: string,
    id: string,
    data: {
      checkinHeure: string | null;
      checkinInstructions: string | null;
      wifiSsid: string | null;
      wifiPassword: string | null;
      regles: string | null;
      urgenceTel: string | null;
      guideTexte: string | null;
    },
  ): Promise<Logement | null> {
    const logement = await this.trouverParId(tenantId, id);
    if (!logement) return null;
    Object.assign(logement, {
      checkinHeure: data.checkinHeure ?? undefined,
      checkinInstructions: data.checkinInstructions ?? undefined,
      wifiSsid: data.wifiSsid ?? undefined,
      wifiPassword: data.wifiPassword ?? undefined,
      regles: data.regles ?? undefined,
      urgenceTel: data.urgenceTel ?? undefined,
      guideTexte: data.guideTexte ?? undefined,
      updatedAt: new Date(),
    });
    return logement;
  }
}
