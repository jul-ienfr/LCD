/**
 * Trace et rejeu des événements Stripe (spec 006, FR-024).
 *
 * Chaque événement reçu par le webhook est enregistré par son identifiant
 * Stripe (`evt_...`) avant traitement : un échec laisse une trace visible et
 * rejouable, un retry Stripe ne crée jamais de doublon, et un événement déjà
 * traité n'est jamais retraité.
 *
 * Le traitement lui-même vit dans `webhook-stripe.ts` et est idempotent de
 * bout en bout : le rejeu repasse exactement par le même chemin.
 */

import { sql } from "drizzle-orm";
import type { EvenementPaiement } from "@/application/ports/paiement";
import type {
  EvenementStripeTrace,
  EvenementsStripeRepository,
} from "@/application/ports/evenements-stripe-repository";
import { ErreurMetier } from "@/domain/erreurs";
import {
  cleAlerteEvenementsStripe,
  evenementDejaTraite,
  identifiantEvenementStripeValide,
  messageAlerteEvenementsStripe,
  RETENTION_EVENEMENTS_STRIPE_JOURS,
} from "@/domain/evenement-stripe";
import { db } from "@/infrastructure/db/client";
import { DrizzleEvenementsStripeRepository } from "@/infrastructure/db/repositories/evenements-stripe-repository";
import { logErreur, logInfo } from "@/lib/logger";
import { notifierAlerte, ouvrirAlerte, resoudreAlerte } from "./alertes-exploitation";
import {
  traiterEvenementStripe,
  type ResultatTraitementStripe,
} from "./webhook-stripe";

export interface OptionsTraitementStripe {
  repo?: EvenementsStripeRepository;
  traiter?: (evenement: EvenementPaiement) => Promise<ResultatTraitementStripe>;
}

export interface ResultatTraceStripe {
  /** Trace persistée, null si l'événement n'avait pas d'identifiant exploitable. */
  trace: EvenementStripeTrace | null;
  /** true = déjà traité (ou ignoré) lors d'une livraison précédente. */
  deja: boolean;
  traitement: ResultatTraitementStripe | null;
}

function objetIdDepuis(evenement: EvenementPaiement): string | null {
  if (evenement.type === "litige") return evenement.litige.id;
  return evenement.sessionId || null;
}

function messageErreur(erreur: unknown): string {
  return (erreur instanceof Error ? erreur.message : String(erreur)).slice(0, 1000);
}

/**
 * Enregistre l'événement (idempotent par `evt_...`), le traite s'il n'a pas
 * déjà été traité, et met la trace à jour. En cas d'échec, la trace passe en
 * `echec` avec le message d'erreur, puis l'erreur est relancée pour que le
 * webhook décide de sa réponse HTTP.
 */
export async function traiterAvecTrace(
  evenement: EvenementPaiement,
  options: OptionsTraitementStripe = {},
): Promise<ResultatTraceStripe> {
  const repo = options.repo ?? new DrizzleEvenementsStripeRepository();
  const traiter = options.traiter ?? traiterEvenementStripe;

  if (!identifiantEvenementStripeValide(evenement.evenementId)) {
    // Sans identifiant Stripe, aucune trace possible : on traite comme avant
    // (best-effort) et on signale l'anomalie dans les logs.
    logErreur(
      "stripe.trace.identifiant",
      new Error("Événement Stripe sans identifiant evt_... : non tracé."),
      { type: evenement.type },
    );
    const traitement = await traiter(evenement);
    return { trace: null, deja: false, traitement };
  }

  const { trace, cree } = await repo.enregistrer({
    evenementId: evenement.evenementId,
    type: evenement.type,
    objetId: objetIdDepuis(evenement),
    evenement: evenement as unknown as Record<string, unknown>,
  });

  if (!cree && evenementDejaTraite(trace.statut)) {
    logInfo("stripe.trace.doublon", {
      evenementId: trace.evenementId,
      statut: trace.statut,
    });
    return { trace, deja: true, traitement: null };
  }

  try {
    const traitement = await traiter(evenement);
    const aJour = await repo.marquerStatut(evenement.evenementId, {
      statut: traitement.traite ? "traite" : "ignore",
      erreur: null,
      retentative: !cree,
    });
    return { trace: aJour ?? trace, deja: false, traitement };
  } catch (erreur) {
    await repo
      .marquerStatut(evenement.evenementId, {
        statut: "echec",
        erreur: messageErreur(erreur),
        retentative: !cree,
      })
      .catch((echecTrace) => {
        logErreur("stripe.trace.maj", echecTrace, {
          evenementId: evenement.evenementId,
        });
      });
    throw erreur;
  }
}

/**
 * Rejoue un événement tracé, depuis /supervision ou un script. Idempotent :
 * un événement déjà traité n'est pas retraité, et le traitement métier
 * déduplique par référence de paiement.
 */
export async function rejouerEvenementStripe(
  evenementId: string,
  options: OptionsTraitementStripe = {},
): Promise<ResultatTraceStripe> {
  const repo = options.repo ?? new DrizzleEvenementsStripeRepository();
  const traiter = options.traiter ?? traiterEvenementStripe;

  const trace = await repo.trouverParEvenementId(evenementId);
  if (!trace) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      `Événement Stripe « ${evenementId} » inconnu.`,
    );
  }
  if (evenementDejaTraite(trace.statut)) {
    return { trace, deja: true, traitement: null };
  }

  const evenement = trace.evenement as unknown as EvenementPaiement;
  try {
    const traitement = await traiter(evenement);
    const aJour = await repo.marquerStatut(evenementId, {
      statut: traitement.traite ? "traite" : "ignore",
      erreur: null,
      retentative: true,
      rejoue: true,
    });
    logInfo("stripe.trace.rejeu", {
      evenementId,
      statut: aJour?.statut ?? "traite",
    });
    return { trace: aJour ?? trace, deja: false, traitement };
  } catch (erreur) {
    await repo
      .marquerStatut(evenementId, {
        statut: "echec",
        erreur: messageErreur(erreur),
        retentative: true,
        rejoue: true,
      })
      .catch((echecTrace) => {
        logErreur("stripe.trace.maj", echecTrace, { evenementId });
      });
    throw erreur;
  }
}

/**
 * Marque un événement comme ignoré après vérification de l'exploitant
 * (faux positif, événement de test). Idempotent : un événement déjà traité
 * ou ignoré est renvoyé tel quel.
 */
export async function ignorerEvenementStripe(
  evenementId: string,
  options: { repo?: EvenementsStripeRepository } = {},
): Promise<EvenementStripeTrace> {
  const repo = options.repo ?? new DrizzleEvenementsStripeRepository();
  const trace = await repo.trouverParEvenementId(evenementId);
  if (!trace) {
    throw new ErreurMetier(
      "PAIEMENT_INVALIDE",
      `Événement Stripe « ${evenementId} » inconnu.`,
    );
  }
  if (trace.statut === "traite" || trace.statut === "ignore") return trace;
  const aJour = await repo.marquerStatut(evenementId, {
    statut: "ignore",
    erreur: null,
  });
  logInfo("stripe.trace.ignore", { evenementId });
  return aJour ?? trace;
}

export interface ResultatControleEvenementsStripe {
  /** Événements à rejouer (échecs + « recu » bloqués). */
  echecs: number;
  alerteOuverte: boolean;
}

export interface OptionsControleEvenementsStripe {
  repo?: EvenementsStripeRepository;
  ouvrir?: typeof ouvrirAlerte;
  resoudre?: typeof resoudreAlerte;
  notifier?: typeof notifierAlerte;
}

/**
 * Ouvre (ou referme) l'alerte agrégée des événements Stripe en échec. Appelé
 * par le cron `verifier-taches` et le planificateur : un encaissement reçu
 * mais non enregistré ne doit jamais rester silencieux.
 */
export async function verifierEchecsEvenementsStripe(
  options: OptionsControleEvenementsStripe = {},
): Promise<ResultatControleEvenementsStripe> {
  const repo = options.repo ?? new DrizzleEvenementsStripeRepository();
  const ouvrir = options.ouvrir ?? ouvrirAlerte;
  const resoudre = options.resoudre ?? resoudreAlerte;
  const notifier = options.notifier ?? notifierAlerte;

  const cle = cleAlerteEvenementsStripe();
  const echecs = await repo.compterEchoues();
  if (echecs > 0) {
    const alerte = await ouvrir({
      cle,
      source: "stripe",
      severite: "critique",
      message: messageAlerteEvenementsStripe(echecs),
      runbook: "v2/MONITORING.md",
      details: { echecs },
    });
    if (alerte) await notifier(alerte);
    return { echecs, alerteOuverte: true };
  }
  await resoudre(cle);
  return { echecs: 0, alerteOuverte: false };
}

/**
 * Purge les traces au-delà de la rétention (FR-015). Les échecs ne sont
 * jamais purgés automatiquement : ils attendent une décision humaine.
 */
export async function purgerEvenementsStripe(
  retentionJours: number = RETENTION_EVENEMENTS_STRIPE_JOURS,
): Promise<number> {
  const lignes = await db.execute<{ supprimees: number }>(
    sql`select purger_evenements_stripe(${retentionJours}) as supprimees`,
  );
  const supprimees = Number(
    (lignes as unknown as { supprimees: number }[])[0]?.supprimees ?? 0,
  );
  if (supprimees > 0) {
    logInfo("stripe.trace.purge", { supprimees, retentionJours });
  }
  return supprimees;
}
