import type {
  AvisVoyageurRepository,
  FiltreAvis,
} from "@/application/ports/avis-voyageur-repository";
import type { AvisVoyageur } from "@/domain/avis-voyageur";

let compteur = 0;
function id(): string {
  compteur += 1;
  return `00000000-0000-4000-8000-${String(compteur).padStart(12, "0")}`;
}

/** Repository mémoire des avis voyageur pour les tests applicatifs. */
export class AvisVoyageurRepositoryMemoire implements AvisVoyageurRepository {
  readonly avis: AvisVoyageur[] = [];

  async enregistrer(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<{ id: string; cree: boolean }> {
    void tenantId;
    const existant = this.avis.find(
      (entree) =>
        entree.ref === avis.ref || entree.reservationId === avis.reservationId,
    );
    if (existant) return { id: existant.id, cree: false };
    const cree = { ...avis, id: avis.id || id() };
    this.avis.push(cree);
    return { id: cree.id, cree: true };
  }

  async trouverParId(
    tenantId: string,
    avisId: string,
  ): Promise<AvisVoyageur | null> {
    void tenantId;
    return this.avis.find((entree) => entree.id === avisId) ?? null;
  }

  async trouverParRef(
    tenantId: string,
    ref: string,
  ): Promise<AvisVoyageur | null> {
    void tenantId;
    return this.avis.find((entree) => entree.ref === ref) ?? null;
  }

  async trouverParReservation(
    tenantId: string,
    reservationId: string,
  ): Promise<AvisVoyageur | null> {
    void tenantId;
    return (
      this.avis.find((entree) => entree.reservationId === reservationId) ?? null
    );
  }

  async lister(
    tenantId: string,
    filtre?: FiltreAvis,
  ): Promise<AvisVoyageur[]> {
    void tenantId;
    return this.avis.filter(
      (entree) =>
        (!filtre?.logementId || entree.logementId === filtre.logementId) &&
        (!filtre?.statut || entree.statut === filtre.statut),
    );
  }

  async listerPublies(
    tenantId: string,
    logementId: string,
  ): Promise<AvisVoyageur[]> {
    void tenantId;
    return this.avis.filter(
      (entree) =>
        entree.logementId === logementId && entree.statut === "publie",
    );
  }

  async mettreAJour(
    tenantId: string,
    avis: AvisVoyageur,
  ): Promise<AvisVoyageur | null> {
    void tenantId;
    const index = this.avis.findIndex((entree) => entree.id === avis.id);
    if (index === -1) return null;
    this.avis[index] = avis;
    return avis;
  }
}
