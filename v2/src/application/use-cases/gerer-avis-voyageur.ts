/**
 * T609 — Cas d'usage des avis voyageur.
 *
 * Orchestration hexagonale : le domaine `avis-voyageur` porte les règles
 * (cycle de vie invite → recu → publie → masque, validation de note, motif de
 * masquage), le repository porte la persistance. Ici on ne fait que composer.
 *
 * Idempotence (règle 7) : l'invitation J+1 est rejouable — la référence est
 * stable (`refAvisVoyageur`) et le repository est unique par (tenant,
 * reservation_id). Un rejeu retrouve l'avis existant sans le réécrire.
 */
import { randomUUID } from "node:crypto";
import type { AvisVoyageurRepository } from "@/application/ports/avis-voyageur-repository";
import {
  enregistrerAvis,
  inviterAvis,
  masquerAvis,
  publierAvis,
  refAvisVoyageur,
  repondreAvis,
  type AvisVoyageur,
} from "@/domain/avis-voyageur";
import { ErreurMetier } from "@/domain/erreurs";

export interface InviterAvisInput {
  tenantId: string;
  reservationId: string;
  logementId: string;
  /** Date de départ du séjour (`AAAA-MM-JJ`), l'invitation part à J+1. */
  depart: string;
  maintenant?: string;
}

/** Crée (ou retrouve) l'invitation à laisser un avis, à J+1. */
export class InviterAvisVoyageur {
  constructor(private readonly avis: AvisVoyageurRepository) {}

  async executer(
    input: InviterAvisInput,
  ): Promise<{ avis: AvisVoyageur; cree: boolean }> {
    const existant = await this.avis.trouverParReservation(
      input.tenantId,
      input.reservationId,
    );
    if (existant) return { avis: existant, cree: false };

    const invitation = inviterAvis({
      id: randomUUID(),
      ref: refAvisVoyageur(input.reservationId),
      reservationId: input.reservationId,
      logementId: input.logementId,
      depart: input.depart,
      maintenant: input.maintenant,
    });
    const { id, cree } = await this.avis.enregistrer(
      input.tenantId,
      invitation,
    );
    if (cree) return { avis: { ...invitation, id }, cree: true };

    // Course concurrente : une invitation a été insérée entre-temps.
    const relu = await this.avis.trouverParId(input.tenantId, id);
    if (!relu) {
      throw new ErreurMetier(
        "AVIS_INVALIDE",
        "L'invitation à un avis n'a pas pu être enregistrée.",
      );
    }
    return { avis: relu, cree: false };
  }
}

export interface DeposerAvisInput {
  tenantId: string;
  reservationId: string;
  note: number;
  commentaire?: string | null;
  maintenant?: string;
}

/** Enregistre la note et le commentaire d'un voyageur invité. */
export class DeposerAvisVoyageur {
  constructor(private readonly avis: AvisVoyageurRepository) {}

  async executer(input: DeposerAvisInput): Promise<AvisVoyageur> {
    const existant = await this.avis.trouverParReservation(
      input.tenantId,
      input.reservationId,
    );
    if (!existant) {
      throw new ErreurMetier(
        "AVIS_INVALIDE",
        "Aucune invitation à laisser un avis pour ce séjour.",
      );
    }

    const misAJour = enregistrerAvis(existant, {
      note: input.note,
      commentaire: input.commentaire,
      maintenant: input.maintenant,
    });
    const enregistre = await this.avis.mettreAJour(input.tenantId, misAJour);
    if (!enregistre) {
      throw new ErreurMetier(
        "AVIS_INVALIDE",
        "L'avis n'a pas pu être enregistré.",
      );
    }
    return enregistre;
  }
}

export type ActionModerationAvis = "publier" | "masquer" | "repondre";

export interface ModererAvisInput {
  tenantId: string;
  avisId: string;
  action: ActionModerationAvis;
  motif?: string;
  reponse?: string;
  maintenant?: string;
}

/** Publication, masquage motivé ou réponse publique de l'hôte. */
export class ModererAvisVoyageur {
  constructor(private readonly avis: AvisVoyageurRepository) {}

  async executer(input: ModererAvisInput): Promise<AvisVoyageur> {
    const existant = await this.avis.trouverParId(input.tenantId, input.avisId);
    if (!existant) {
      throw new ErreurMetier("AVIS_INVALIDE", "Avis introuvable.");
    }

    let modifie: AvisVoyageur;
    if (input.action === "publier") {
      modifie = publierAvis(existant, input.maintenant);
    } else if (input.action === "masquer") {
      modifie = masquerAvis(existant, {
        motif: input.motif ?? "",
        maintenant: input.maintenant,
      });
    } else if (input.action === "repondre") {
      modifie = repondreAvis(existant, input.reponse ?? "");
    } else {
      throw new ErreurMetier("AVIS_INVALIDE", "Action de modération inconnue.");
    }

    const enregistre = await this.avis.mettreAJour(input.tenantId, modifie);
    if (!enregistre) {
      throw new ErreurMetier(
        "AVIS_INVALIDE",
        "La modération n'a pas pu être enregistrée.",
      );
    }
    return enregistre;
  }
}
