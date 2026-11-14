/**
 * T608 — Demande d'extra déposée par le voyageur.
 *
 * Le voyageur ne fixe pas le prix : il *propose*. Le prix indicatif vient du
 * domaine `demande-extra.ts` :
 * - extras liés au temps de séjour (`depart-tardif`, `arrivee-anticipee`) :
 *   supplément dérivé du prix de la nuit ;
 * - extras forfaitaires (`lit-bebe`, `menage-supplementaire`, `transfert`,
 *   `autre`) : prix fourni par l'appelant, sinon plancher tarifaire absolu —
 *   la demande reste une proposition, un humain du staff l'ajuste en décidant.
 *
 * Idempotence (règle 7) : `refDemandeExtra(reservationId, type)` est stable ;
 * un rejeu (double clic, retour arrière, formulaire renvoyé) retourne la
 * demande existante sans en créer une seconde.
 *
 * Aucune exception n'est avalée : les `ErreurMetier` du domaine remontent à
 * l'appelant, qui décide de l'affichage.
 */
import {
  type DemandeExtra,
  type StatutDemandeExtra,
  type TypeExtra,
  prixArriveeAnticipee,
  prixDepartTardif,
  refDemandeExtra,
  typeExtraValide,
  validerDemandeExtra,
} from "@/domain/demande-extra";
import { ErreurMetier } from "@/domain/erreurs";
import { PLANCHER_ABSOLU_CENTIMES } from "@/domain/recommandation-prix";
import type { DemandesExtraRepository } from "../ports/demandes-extra-repository";

export interface DemanderExtraInput {
  tenantId: string;
  logementId: string;
  reservationId: string;
  /** Type d'extra, validé par le domaine (`typeExtraValide`). */
  type: string;
  message?: string | null;
  /** Prix d'une nuit du logement, base des suppléments temporaires. */
  prixNuitCentimes: number;
  /** Prix imposé pour un extra forfaitaire (facultatif). */
  prixCentimes?: number;
  /** Identifiant imposé (rejeu d'un formulaire). */
  id?: string;
  /** Horodatage d'injection (tests). */
  maintenant?: string;
}

export interface ResultatDemanderExtra {
  id: string;
  ref: string;
  type: TypeExtra;
  prixCentimes: number;
  statut: StatutDemandeExtra;
  /** Faux quand la demande existait déjà (rejeu idempotent). */
  cree: boolean;
}

export interface DependancesDemanderExtra {
  demandes: DemandesExtraRepository;
  /** Journalisation d'audit (facultative, injectée par l'appelant). */
  tracer?: (entree: {
    action: string;
    cible: string;
    details: Record<string, unknown>;
  }) => Promise<void>;
  /** Générateur d'identifiant (injectable en test). */
  identifiant?: () => string;
  /** Horloge (injectable en test). */
  horloge?: () => string;
}

/** Message du voyageur : espaces rognés, vide ramené à `null`. */
export function messageDemande(message?: string | null): string | null {
  const texte = (message ?? "").trim();
  return texte.length === 0 ? null : texte;
}

/**
 * Prix indicatif d'une demande d'extra. Lève `PRIX_INVALIDE` si le prix de la
 * nuit est invalide pour un extra temporaire (erreur du domaine, non avalée).
 */
export function prixIndicatifExtra(input: {
  type: TypeExtra;
  prixNuitCentimes: number;
  prixCentimes?: number;
}): number {
  switch (input.type) {
    case "depart-tardif":
      return prixDepartTardif(input.prixNuitCentimes);
    case "arrivee-anticipee":
      return prixArriveeAnticipee(input.prixNuitCentimes);
    default:
      return input.prixCentimes ?? PLANCHER_ABSOLU_CENTIMES;
  }
}

export class DemanderExtra {
  constructor(private readonly deps: DependancesDemanderExtra) {}

  async executer(input: DemanderExtraInput): Promise<ResultatDemanderExtra> {
    if (!typeExtraValide(input.type)) {
      throw new ErreurMetier("DEMANDE_EXTRA_INVALIDE", "Type d'extra inconnu.");
    }
    const type = input.type;
    const ref = refDemandeExtra(input.reservationId, type);

    // Rejeu : la référence stable existe déjà → on ne duplique pas.
    const existante = await this.deps.demandes.trouverParRef(
      input.tenantId,
      ref,
    );
    if (existante) {
      return {
        id: existante.id,
        ref: existante.ref,
        type: existante.type,
        prixCentimes: existante.prixCentimes,
        statut: existante.statut,
        cree: false,
      };
    }

    const demande = validerDemandeExtra({
      id: input.id ?? this.deps.identifiant?.() ?? crypto.randomUUID(),
      ref,
      reservationId: input.reservationId,
      logementId: input.logementId,
      type,
      prixCentimes: prixIndicatifExtra({
        type,
        prixNuitCentimes: input.prixNuitCentimes,
        prixCentimes: input.prixCentimes,
      }),
      message: messageDemande(input.message),
      statut: "demande",
      creeLe:
        input.maintenant ?? this.deps.horloge?.() ?? new Date().toISOString(),
      decideeLe: null,
      decideePar: null,
      motifRefus: null,
    });

    const { id, cree } = await this.deps.demandes.enregistrer(
      input.tenantId,
      demande,
    );

    await this.deps.tracer?.({
      action: "extra.demande",
      cible: demande.ref,
      details: {
        reservationId: demande.reservationId,
        logementId: demande.logementId,
        type: demande.type,
        prixCentimes: demande.prixCentimes,
        cree,
      },
    });

    return {
      id,
      ref: demande.ref,
      type: demande.type,
      prixCentimes: demande.prixCentimes,
      statut: demande.statut,
      cree,
    };
  }
}

/** Raccourci fonctionnel (style `demanderExtra(input, deps)`). */
export function demanderExtra(
  input: DemanderExtraInput,
  deps: DependancesDemanderExtra,
): Promise<ResultatDemanderExtra> {
  return new DemanderExtra(deps).executer(input);
}

export type { DemandeExtra };
