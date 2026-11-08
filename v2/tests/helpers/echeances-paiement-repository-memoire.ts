import type {
  CreerEcheancePaiementData,
  EcheancePaiement,
  EcheancesPaiementRepository,
} from "@/application/ports/echeances-paiement-repository";

export class EcheancesPaiementRepositoryMemoire
  implements EcheancesPaiementRepository
{
  readonly rows: EcheancePaiement[] = [];

  async creerPlusieurs(
    echeances: CreerEcheancePaiementData[],
  ): Promise<EcheancePaiement[]> {
    const creees: EcheancePaiement[] = [];
    for (const entree of echeances) {
      const existante = this.rows.find(
        (row) =>
          row.tenantId === entree.tenantId &&
          row.reservationId === entree.reservationId &&
          row.type === entree.type,
      );
      if (existante) {
        creees.push(existante);
        continue;
      }
      const echeance: EcheancePaiement = {
        id: crypto.randomUUID(),
        tenantId: entree.tenantId,
        reservationId: entree.reservationId,
        type: entree.type,
        montantCentimes: entree.montantCentimes,
        exigibleLe: entree.exigibleLe,
        statut: entree.statut ?? "a_payer",
        paiementId: null,
      };
      this.rows.push(echeance);
      creees.push(echeance);
    }
    return creees;
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<EcheancePaiement[]> {
    return this.rows.filter(
      (row) => row.tenantId === tenantId && row.reservationId === reservationId,
    );
  }

  async trouverParId(
    tenantId: string,
    echeanceId: string,
  ): Promise<EcheancePaiement | null> {
    return (
      this.rows.find(
        (row) => row.tenantId === tenantId && row.id === echeanceId,
      ) ?? null
    );
  }

  async marquerPaye(
    tenantId: string,
    echeanceId: string,
    paiementId: string,
  ): Promise<void> {
    const echeance = await this.trouverParId(tenantId, echeanceId);
    if (!echeance) return;
    echeance.statut = "paye";
    echeance.paiementId = paiementId;
  }

  async annulerRestantes(
    tenantId: string,
    reservationId: string,
  ): Promise<number> {
    const restantes = this.rows.filter(
      (row) =>
        row.tenantId === tenantId &&
        row.reservationId === reservationId &&
        row.statut === "a_payer",
    );
    for (const echeance of restantes) echeance.statut = "annule";
    return restantes.length;
  }
}
