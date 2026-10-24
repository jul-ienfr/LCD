import type {
  CommandeExtraRepository,
  CreerCommandeExtraData,
  ResultatCommandeExtra,
} from "@/application/ports/extra-repository";
import type { CommandeExtra } from "@/domain/extra";

export class CommandeExtraRepositoryMemoire
  implements CommandeExtraRepository
{
  private readonly rows: CommandeExtra[] = [];

  async creer(
    data: CreerCommandeExtraData,
  ): Promise<ResultatCommandeExtra> {
    const existant = this.rows.find(
      (c) => c.tenantId === data.tenantId && c.ref === data.ref,
    );
    if (existant) return { commande: existant, cree: false };

    const maintenant = new Date();
    const commande: CommandeExtra = {
      id: crypto.randomUUID(),
      tenantId: data.tenantId,
      reservationId: data.reservationId,
      extraId: data.extraId,
      quantite: data.quantite,
      prixUnitaireCentimes: data.prixUnitaireCentimes,
      totalCentimes: data.totalCentimes,
      ref: data.ref,
      statut: "demandee",
      createdAt: maintenant,
      updatedAt: maintenant,
    };
    this.rows.push(commande);
    return { commande, cree: true };
  }

  async listerParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<CommandeExtra[]> {
    return this.rows.filter(
      (c) => c.tenantId === tenantId && c.reservationId === reservationId,
    );
  }

  async listerParTenant(tenantId: string): Promise<CommandeExtra[]> {
    return this.rows.filter((c) => c.tenantId === tenantId);
  }

  async changerStatut(
    tenantId: string,
    id: string,
    statut: CommandeExtra["statut"],
  ): Promise<CommandeExtra | null> {
    const commande = this.rows.find(
      (c) => c.tenantId === tenantId && c.id === id,
    );
    if (!commande) return null;
    commande.statut = statut;
    return commande;
  }
}
