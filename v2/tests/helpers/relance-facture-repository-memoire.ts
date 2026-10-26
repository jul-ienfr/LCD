import type { RelanceFactureRepository } from "@/application/ports/relance-facture-repository";

export class RelanceFactureRepositoryMemoire
  implements RelanceFactureRepository
{
  private readonly cles = new Set<string>();

  async reserver(input: {
    tenantId: string;
    factureId: string;
    jour: string;
    destinataire: string;
  }): Promise<boolean> {
    const cle = `${input.tenantId}:${input.factureId}:${input.jour}`;
    if (this.cles.has(cle)) return false;
    this.cles.add(cle);
    return true;
  }

  async liberer(
    tenantId: string,
    factureId: string,
    jour: string,
  ): Promise<void> {
    this.cles.delete(`${tenantId}:${factureId}:${jour}`);
  }

  async listerFactureIds(
    tenantId: string,
    jour: string,
  ): Promise<string[]> {
    const prefixe = `${tenantId}:`;
    const suffixe = `:${jour}`;
    return [...this.cles]
      .filter((cle) => cle.startsWith(prefixe) && cle.endsWith(suffixe))
      .map((cle) => cle.slice(prefixe.length, -suffixe.length));
  }
}
