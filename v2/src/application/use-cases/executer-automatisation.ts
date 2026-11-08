import {
  conditionsRemplies,
  rendreModele,
  type Automatisation,
  type DeclencheurAutomatisation,
} from "@/domain/automatisation-message";
import { ErreurMetier } from "@/domain/erreurs";
import { canalValide, consentementAutorise, type CanalFil } from "@/domain/fil-voyageur";
import type { AutomatisationsRepository } from "../ports/automatisations-repository";
import type { FilsVoyageurRepository } from "../ports/fils-voyageur-repository";
import type { OuvrirFil } from "./ouvrir-fil";

export interface ContexteReservationMessage {
  reservationId: string;
  reference: string;
  logementId: string;
  logementNom: string;
  clientNom: string;
  clientEmail: string | null;
  clientTelephone?: string | null;
  arrivee: string;
  depart: string;
  nuits: number;
  statutReservation: string;
  langue?: string;
}

export interface ExecuterAutomatisationInput {
  tenantId: string;
  automatisation: Automatisation;
  contexte: ContexteReservationMessage;
}

export interface ResultatAutomatisation {
  ref: string;
  statut: "brouillon" | "ignore" | "deja_executee";
  messageId: string | null;
  variablesManquantes: string[];
  contenu: string | null;
}

function refExecution(
  code: string,
  reference: string,
  declencheur: DeclencheurAutomatisation,
): string {
  const propre = (valeur: string) => valeur.replace(/[^A-Za-z0-9]/g, "").slice(0, 24);
  return `auto-${propre(code)}-${propre(reference)}-${declencheur.replace(/[^a-z0-9]/g, "")}`.slice(
    0,
    64,
  );
}

export function variablesAutomatisation(
  contexte: ContexteReservationMessage,
): Record<string, string> {
  return {
    voyageur: contexte.clientNom,
    logement: contexte.logementNom,
    arrivee: contexte.arrivee,
    depart: contexte.depart,
    nuits: String(contexte.nuits),
    reference: contexte.reference,
  };
}

/**
 * Exécute une automatisation pour une réservation : vérifie les conditions,
 * prépare un **brouillon** dans le fil du voyageur et trace l'exécution.
 * Aucun message n'est envoyé automatiquement : l'envoi reste une action humaine.
 */
export class ExecuterAutomatisation {
  constructor(
    private readonly automatisations: AutomatisationsRepository,
    private readonly fils: FilsVoyageurRepository,
    private readonly ouvrirFil: OuvrirFil,
  ) {}

  async executer(
    input: ExecuterAutomatisationInput,
  ): Promise<ResultatAutomatisation | null> {
    const { automatisation, contexte } = input;
    if (!automatisation.actif) {
      throw new ErreurMetier(
        "AUTOMATISATION_INVALIDE",
        "Cette automatisation est désactivée.",
      );
    }
    if (!canalValide(automatisation.canal)) {
      throw new ErreurMetier("AUTOMATISATION_INVALIDE", "Canal inconnu.");
    }
    const canal: CanalFil = automatisation.canal;
    if (
      !conditionsRemplies(automatisation.conditions, {
        logementId: contexte.logementId,
        nuits: contexte.nuits,
        canal,
        statutReservation: contexte.statutReservation,
      })
    ) {
      return null;
    }

    const ref = refExecution(automatisation.code, contexte.reference, automatisation.declencheur);
    const deja = await this.automatisations.trouverExecutionParRef(
      input.tenantId,
      ref,
    );
    if (deja) {
      return {
        ref,
        statut: "deja_executee",
        messageId: deja.messageId,
        variablesManquantes: [],
        contenu: null,
      };
    }

    const { fil } = await this.ouvrirFil.executer({
      tenantId: input.tenantId,
      logementId: contexte.logementId,
      reservationId: contexte.reservationId,
      voyageurNom: contexte.clientNom,
      voyageurEmail: contexte.clientEmail,
      voyageurTelephone: contexte.clientTelephone ?? null,
      langue: contexte.langue ?? "fr",
    });

    const rendu = rendreModele(automatisation.modele, variablesAutomatisation(contexte));

    if (!consentementAutorise(fil.consentements, canal)) {
      await this.automatisations.creerExecution({
        tenantId: input.tenantId,
        automatisationId: automatisation.id,
        reservationId: contexte.reservationId,
        filId: fil.id,
        ref,
        statut: "ignore",
        details: { motif: "opt-out", canal },
      });
      return {
        ref,
        statut: "ignore",
        messageId: null,
        variablesManquantes: rendu.variablesManquantes,
        contenu: null,
      };
    }

    const refMessage = ref;
    const existant = await this.fils.trouverMessageParRef(input.tenantId, refMessage);
    const message =
      existant ??
      (await this.fils.creerMessage({
        tenantId: input.tenantId,
        filId: fil.id,
        ref: refMessage,
        canal,
        sens: "sortant",
        contenu: rendu.texte,
        destinataire:
          canal === "email" ? fil.voyageurEmail : fil.voyageurTelephone,
        statut: "brouillon",
      }));

    await this.automatisations.creerExecution({
      tenantId: input.tenantId,
      automatisationId: automatisation.id,
      reservationId: contexte.reservationId,
      filId: fil.id,
      messageId: message.id,
      ref,
      statut: "brouillon",
      details: {
        canal,
        declencheur: automatisation.declencheur,
        variablesManquantes: rendu.variablesManquantes,
      },
    });

    return {
      ref,
      statut: "brouillon",
      messageId: message.id,
      variablesManquantes: rendu.variablesManquantes,
      contenu: rendu.texte,
    };
  }
}
