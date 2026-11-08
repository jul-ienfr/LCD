import { ErreurMetier } from "@/domain/erreurs";
import {
  cleRegroupement,
  validerFilVoyageur,
  type FilVoyageur,
} from "@/domain/fil-voyageur";
import type { FilsVoyageurRepository } from "../ports/fils-voyageur-repository";

export interface OuvrirFilInput {
  tenantId: string;
  logementId?: string | null;
  reservationId?: string | null;
  voyageurNom: string;
  voyageurEmail?: string | null;
  voyageurTelephone?: string | null;
  langue?: string;
  externalId?: string | null;
}

export interface ResultatOuvertureFil {
  fil: FilVoyageur;
  cree: boolean;
  regroupe: boolean;
}

/**
 * Ouvre (ou retrouve) le fil d'un voyageur. Le rattachement est
 * déterministe : réservation, puis clé de regroupement, puis email ou
 * téléphone — quel que soit le canal d'origine du message.
 */
export class OuvrirFil {
  constructor(private readonly fils: FilsVoyageurRepository) {}

  async executer(input: OuvrirFilInput): Promise<ResultatOuvertureFil> {
    validerFilVoyageur(input);

    if (input.reservationId) {
      const parReservation = await this.fils.trouverParReservation(
        input.tenantId,
        input.reservationId,
      );
      if (parReservation) {
        const fil = await this.completer(parReservation, input);
        return { fil, cree: false, regroupe: true };
      }
    }

    const cle = cleRegroupement(input);
    const parCle = await this.fils.trouverParCle(input.tenantId, cle);
    if (parCle) {
      const fil = await this.completer(parCle, input);
      return { fil, cree: false, regroupe: true };
    }

    const email = input.voyageurEmail?.trim().toLowerCase() ?? "";
    const telephone =
      input.voyageurTelephone?.replace(/[\s.\-()]/g, "") ?? "";
    if (email || telephone) {
      const parContact = await this.fils.trouverParContact(input.tenantId, {
        email,
        telephone,
      });
      if (parContact) {
        const fil = await this.completer(parContact, input);
        return { fil, cree: false, regroupe: true };
      }
    }

    const fil = await this.fils.creer({
      tenantId: input.tenantId,
      logementId: input.logementId ?? null,
      reservationId: input.reservationId ?? null,
      voyageurNom: input.voyageurNom,
      voyageurEmail: email || null,
      voyageurTelephone: telephone || null,
      langue: input.langue ?? "fr",
      cleRegroupement: cle,
    });
    return { fil, cree: true, regroupe: false };
  }

  /** Complète un fil existant sans jamais écraser une donnée déjà connue. */
  private async completer(
    fil: FilVoyageur,
    input: OuvrirFilInput,
  ): Promise<FilVoyageur> {
    const email = input.voyageurEmail?.trim().toLowerCase() ?? "";
    const telephone =
      input.voyageurTelephone?.replace(/[\s.\-()]/g, "") ?? "";
    const modifications: Parameters<FilsVoyageurRepository["mettreAJour"]>[2] = {};
    let change = false;

    if (!fil.voyageurEmail && email) {
      modifications.voyageurEmail = email;
      change = true;
    }
    if (!fil.voyageurTelephone && telephone) {
      modifications.voyageurTelephone = telephone;
      change = true;
    }
    if (!fil.logementId && input.logementId) {
      modifications.logementId = input.logementId;
      change = true;
    }
    if (!fil.reservationId && input.reservationId) {
      modifications.reservationId = input.reservationId;
      change = true;
    }
    if (fil.langue === "fr" && input.langue && input.langue !== "fr") {
      modifications.langue = input.langue;
      change = true;
    }

    if (!change) return fil;
    const misAJour = await this.fils.mettreAJour(fil.tenantId, fil.id, modifications);
    if (!misAJour) {
      throw new ErreurMetier("MESSAGE_INVALIDE", "Le fil voyageur est introuvable.");
    }
    return misAJour;
  }
}
