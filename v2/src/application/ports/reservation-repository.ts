import type { Reservation } from "@/domain/reservation";

export interface CreerReservationData {
  tenantId: string;
  logementId: string;
  ref: string;
  clientNom?: string;
  clientEmail?: string;
  voyageurs: number;
  debut: string;
  fin: string;
  montantCentimes: number;
  source?: string;
  statut?: Reservation["statut"];
}

/** Critères SQL partagés par les listes et les compteurs (FR-026). */
export interface FiltreReservations {
  logementId?: string;
  /** Chevauchement avec la période [debut, fin). */
  periode?: { debut: string; fin: string };
  /** Séjours dont la fin est postérieure ou égale à cette date. */
  finMin?: string;
  /** Séjours dont le début est antérieur ou égal à cette date. */
  debutMax?: string;
  statut?: Reservation["statut"];
  /** Recherche ref / client / email / logement, appliquée en SQL. */
  recherche?: string;
}

export type OrdreReservations = "debut-asc" | "debut-desc" | "fin-asc";

export interface OptionsListeReservations extends FiltreReservations {
  limite: number;
  decalage: number;
  ordre?: OrdreReservations;
}

export interface ReservationRepository {
  creer(data: CreerReservationData): Promise<Reservation>;
  listerParMois(
    tenantId: string,
    debut: string,
    fin: string,
  ): Promise<Reservation[]>;
  /** Liste paginée côté SQL : aucun écran ne charge tout le tenant. */
  listerPage(
    tenantId: string,
    options: OptionsListeReservations,
  ): Promise<Reservation[]>;
  /** Total correspondant au même filtre, pour la pagination. */
  compter(tenantId: string, filtre?: FiltreReservations): Promise<number>;
  /** Recherche bornée, appliquée en SQL (tableau de bord). */
  rechercher(tenantId: string, terme: string, limite: number): Promise<Reservation[]>;
  /** Charge uniquement les réservations référencées (jointures d'écran). */
  listerParIds(tenantId: string, ids: readonly string[]): Promise<Reservation[]>;
  chevauche(
    tenantId: string,
    logementId: string,
    debut: string,
    fin: string,
  ): Promise<boolean>;
  trouverParId(
    tenantId: string,
    id: string,
  ): Promise<Reservation | null>;
  trouverParRef(tenantId: string, ref: string): Promise<Reservation | null>;
  listerTous(tenantId: string): Promise<Reservation[]>;
  confirmerDepart(
    tenantId: string,
    id: string,
    note: string | null,
  ): Promise<Reservation | null>;
  annuler(tenantId: string, id: string): Promise<Reservation | null>;
}
