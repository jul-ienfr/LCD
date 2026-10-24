import type {
  CreerPaiementData,
  PaiementRepository,
  ResultatPaiement,
} from "@/application/ports/paiement-repository";
import type { Paiement } from "@/domain/paiement";

export class PaiementRepositoryMemoire implements PaiementRepository {
  private readonly rows: Paiement[] = [];

  async creer(data: CreerPaiementData): Promise<ResultatPaiement> {
    const existant = await this.trouverParRef(data.tenantId, data.ref);
    if (existant) return { paiement: existant, cree: false };

    const maintenant = new Date();
    const paiement: Paiement = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      factureId: data.factureId,
      ref: data.ref,
      montantCentimes: data.montantCentimes,
      mode: data.mode,
      datePaiement: data.datePaiement,
      reference: data.reference ?? null,
      notes: data.notes ?? null,
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(paiement);
    return { paiement, cree: true };
  }

  async trouverParRef(tenantId: string, ref: string): Promise<Paiement | null> {
    return (
      this.rows.find((p) => p.tenantId === tenantId && p.ref === ref) ?? null
    );
  }

  async listerParFacture(
    tenantId: string,
    factureId: string,
  ): Promise<Paiement[]> {
    return this.rows.filter(
      (p) => p.tenantId === tenantId && p.factureId === factureId,
    );
  }

  async listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Paiement[]> {
    return this.rows.filter(
      (p) =>
        p.tenantId === tenantId &&
        p.datePaiement >= debut &&
        p.datePaiement <= fin,
    );
  }
}
