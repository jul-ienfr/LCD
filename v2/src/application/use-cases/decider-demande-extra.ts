/**
 * T608 — Décision du staff sur une demande d'extra.
 *
 * Le domaine `demande-extra.ts` porte les règles (`deciderDemandeExtra`,
 * `marquerFacturee`) ; ce use case les orchestre avec la persistance et
 * l'audit. Une demande déjà décidée lève une `ErreurMetier`
 * (`DEMANDE_EXTRA_INVALIDE`) : on ne rejoue pas silencieusement une décision.
 *
 * Un refus exige un motif d'au moins dix caractères (`MOTIF_REFUS_MIN`) et
 * toute décision exige un auteur — la décision est une action tracée.
 */
import {
  type DemandeExtra,
  type StatutDemandeExtra,
  deciderDemandeExtra,
  marquerFacturee,
} from "@/domain/demande-extra";
import { ErreurMetier } from "@/domain/erreurs";
import type { DemandesExtraRepository } from "../ports/demandes-extra-repository";

export interface DeciderDemandeExtraInput {
  tenantId: string;
  demandeId: string;
  decision: "validee" | "refusee" | "facturee";
  /** Auteur de la décision (session staff). */
  par: string;
  motif?: string | null;
  maintenant?: string;
}

export interface ResultatDeciderDemandeExtra {
  demande: DemandeExtra;
  /** Faux quand la demande était déjà dans le statut demandé. */
  modifiee: boolean;
}

export interface DependancesDeciderDemandeExtra {
  demandes: DemandesExtraRepository;
  /** Journalisation d'audit (facultative, injectée par l'appelant). */
  tracer?: (entree: {
    action: string;
    cible: string;
    details: Record<string, unknown>;
  }) => Promise<void>;
  horloge?: () => string;
}

export class DeciderDemandeExtra {
  constructor(private readonly deps: DependancesDeciderDemandeExtra) {}

  async executer(
    input: DeciderDemandeExtraInput,
  ): Promise<ResultatDeciderDemandeExtra> {
    if (
      input.decision !== "validee" &&
      input.decision !== "refusee" &&
      input.decision !== "facturee"
    ) {
      throw new ErreurMetier(
        "DEMANDE_EXTRA_INVALIDE",
        "Décision inconnue : attendu « validee », « refusee » ou « facturee ».",
      );
    }

    const demande = await this.deps.demandes.trouverParId(
      input.tenantId,
      input.demandeId,
    );
    if (!demande) {
      throw new ErreurMetier(
        "DEMANDE_EXTRA_INVALIDE",
        "Demande d'extra introuvable.",
      );
    }

    // Capturé avant la persistance : un dépôt qui mute la ligne en place (ou
    // retourne le même objet) ne doit pas fausser la détection de changement.
    const statutAvant = demande.statut;
    const maintenant = input.maintenant ?? this.deps.horloge?.();

    // Le domaine tranche : déjà décidée, motif de refus trop court, auteur
    // manquant… tout écart lève et remonte tel quel à l'appelant.
    const decidee: DemandeExtra =
      input.decision === "facturee"
        ? marquerFacturee(demande, maintenant)
        : deciderDemandeExtra(demande, input.decision, {
            par: input.par,
            motif: input.motif ?? null,
            maintenant,
          });

    const statut: StatutDemandeExtra = decidee.statut;
    const misAJour = await this.deps.demandes.marquerStatut(
      input.tenantId,
      demande.id,
      statut,
      {
        par: decidee.decideePar ?? input.par,
        motifRefus: decidee.motifRefus,
        maintenant: decidee.decideeLe ?? maintenant,
      },
    );
    if (!misAJour) {
      throw new ErreurMetier(
        "DEMANDE_EXTRA_INVALIDE",
        "La demande d'extra n'a pas pu être mise à jour.",
      );
    }

    await this.deps.tracer?.({
      action: "extra.decision",
      cible: misAJour.ref,
      details: {
        demandeId: misAJour.id,
        reservationId: misAJour.reservationId,
        statut: misAJour.statut,
        par: misAJour.decideePar,
        motifRefus: misAJour.motifRefus,
      },
    });

    return { demande: misAJour, modifiee: misAJour.statut !== statutAvant };
  }
}

/** Raccourci fonctionnel (style `deciderDemandeExtra(input, deps)`). */
export function deciderDemandeExtraApplication(
  input: DeciderDemandeExtraInput,
  deps: DependancesDeciderDemandeExtra,
): Promise<ResultatDeciderDemandeExtra> {
  return new DeciderDemandeExtra(deps).executer(input);
}
