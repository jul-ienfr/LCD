import type {
  DemandesExtraRepository,
  FiltreDemandesExtra,
} from "@/application/ports/demandes-extra-repository";
import type {
  DemandeExtra,
  StatutDemandeExtra,
} from "@/domain/demande-extra";

export type DemandeExtraEnregistree = DemandeExtra & { tenantId: string };

/**
 * Double en mémoire du port `DemandesExtraRepository` pour les tests
 * d'application : mêmes règles que la version Drizzle (unicité par
 * (tenant, ref), décision tracée) sans base de données.
 */
export class DemandesExtraRepositoryMemoire
  implements DemandesExtraRepository
{
  readonly rows: DemandeExtraEnregistree[] = [];

  private trouver(
    tenantId: string,
    predicat: (row: DemandeExtraEnregistree) => boolean,
  ): DemandeExtraEnregistree | null {
    return this.rows.find((row) => row.tenantId === tenantId && predicat(row)) ?? null;
  }

  async enregistrer(
    tenantId: string,
    demande: DemandeExtra,
  ): Promise<{ id: string; cree: boolean }> {
    const existante = this.trouver(tenantId, (row) => row.ref === demande.ref);
    if (existante) return { id: existante.id, cree: false };
    this.rows.push({ ...demande, tenantId });
    return { id: demande.id, cree: true };
  }

  async trouverParId(tenantId: string, id: string): Promise<DemandeExtra | null> {
    return this.trouver(tenantId, (row) => row.id === id);
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<DemandeExtra | null> {
    return this.trouver(tenantId, (row) => row.ref === ref);
  }

  async lister(
    tenantId: string,
    filtre?: FiltreDemandesExtra,
  ): Promise<DemandeExtra[]> {
    return this.rows.filter(
      (row) =>
        row.tenantId === tenantId &&
        (!filtre?.logementId || row.logementId === filtre.logementId) &&
        (!filtre?.reservationId || row.reservationId === filtre.reservationId) &&
        (!filtre?.statut || row.statut === filtre.statut),
    );
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<DemandeExtra[]> {
    return this.lister(tenantId, { reservationId });
  }

  async marquerStatut(
    tenantId: string,
    id: string,
    statut: StatutDemandeExtra,
    options: { par: string; motifRefus?: string | null; maintenant?: string },
  ): Promise<DemandeExtra | null> {
    const row = await this.trouverParId(tenantId, id);
    if (!row) return null;
    row.statut = statut;
    row.decideeLe = options.maintenant ?? new Date().toISOString();
    row.decideePar = options.par;
    row.motifRefus = statut === "refusee" ? (options.motifRefus ?? null) : null;
    return row;
  }
}
