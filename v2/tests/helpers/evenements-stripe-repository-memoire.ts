import type {
  CreerEvenementStripeData,
  EvenementStripeTrace,
  EvenementsStripeRepository,
  MarquerStatutEvenementStripeData,
  ResultatEnregistrementEvenementStripe,
} from "@/application/ports/evenements-stripe-repository";
import type { StatutEvenementStripe } from "@/domain/evenement-stripe";

const DELAI_BLOCAGE_MINUTES = 10;

/** Repo mémoire des traces Stripe, aligné sur le dépôt Drizzle. */
export class EvenementsStripeRepositoryMemoire
  implements EvenementsStripeRepository
{
  readonly traces: EvenementStripeTrace[] = [];
  private compteur = 0;

  async enregistrer(
    data: CreerEvenementStripeData,
  ): Promise<ResultatEnregistrementEvenementStripe> {
    const existante = await this.trouverParEvenementId(data.evenementId);
    if (existante) return { trace: existante, cree: false };
    this.compteur += 1;
    const trace: EvenementStripeTrace = {
      id: `trace-${this.compteur}`,
      evenementId: data.evenementId,
      type: data.type,
      objetId: data.objetId ?? null,
      statut: "recu",
      evenement: data.evenement,
      erreur: null,
      tentatives: 1,
      recuLe: new Date(),
      derniereTentativeLe: new Date(),
      traiteLe: null,
      rejoueLe: null,
    };
    this.traces.push(trace);
    return { trace, cree: true };
  }

  async trouverParEvenementId(
    evenementId: string,
  ): Promise<EvenementStripeTrace | null> {
    return (
      this.traces.find((trace) => trace.evenementId === evenementId) ?? null
    );
  }

  async marquerStatut(
    evenementId: string,
    data: MarquerStatutEvenementStripeData,
  ): Promise<EvenementStripeTrace | null> {
    const trace = await this.trouverParEvenementId(evenementId);
    if (!trace) return null;
    trace.statut = data.statut as StatutEvenementStripe;
    trace.derniereTentativeLe = new Date();
    if (data.erreur !== undefined) trace.erreur = data.erreur;
    if (data.statut === "traite" || data.statut === "ignore") {
      trace.traiteLe = new Date();
      if (data.erreur === undefined) trace.erreur = null;
    }
    if (data.rejoue) trace.rejoueLe = new Date();
    if (data.retentative) trace.tentatives += 1;
    return trace;
  }

  async listerRecents(limite: number): Promise<EvenementStripeTrace[]> {
    return [...this.traces].reverse().slice(0, limite);
  }

  async listerEchoues(limite: number): Promise<EvenementStripeTrace[]> {
    return (await this.aRejouer()).slice(0, limite);
  }

  async compterEchoues(): Promise<number> {
    return (await this.aRejouer()).length;
  }

  private async aRejouer(): Promise<EvenementStripeTrace[]> {
    const seuil = Date.now() - DELAI_BLOCAGE_MINUTES * 60_000;
    return this.traces.filter(
      (trace) =>
        trace.statut === "echec" ||
        (trace.statut === "recu" &&
          trace.derniereTentativeLe.getTime() < seuil),
    );
  }

  /** Simule un événement « recu » bloqué depuis longtemps (crash). */
  bloquer(evenementId: string, minutes: number): void {
    const trace = this.traces.find((t) => t.evenementId === evenementId);
    if (!trace) return;
    trace.statut = "recu";
    trace.derniereTentativeLe = new Date(Date.now() - minutes * 60_000);
  }
}
