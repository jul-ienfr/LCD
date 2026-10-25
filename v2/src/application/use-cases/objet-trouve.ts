import {
  CONTACT_OBJET_MAX,
  eligibleAuDon,
  FORFAIT_OBJET_CENTIMES,
  joursRestantsAvantDon,
  NOM_OBJET_MAX,
  refObjetTrouveValide,
  validerObjetTrouve,
  aujourdHuiIso,
} from "@/domain/objet-trouve";
import { ErreurMetier } from "@/domain/erreurs";
import type { ObjetsTrouvesRepository } from "../ports/objets-trouves-repository";
import type { LogementRepository } from "../ports/logement-repository";

export interface EnregistrerObjetTrouveInput {
  tenantId: string;
  logementId: string;
  reservationId?: string | null;
  ref: string;
  description: string;
  lieu: string;
  trouveLe: string;
  voyageurNom?: string | null;
  contact?: string | null;
}

export class EnregistrerObjetTrouve {
  constructor(
    private readonly objets: ObjetsTrouvesRepository,
    private readonly logements: LogementRepository,
  ) {}

  async executer(input: EnregistrerObjetTrouveInput) {
    if (!refObjetTrouveValide(input.ref)) {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "La référence est invalide.",
      );
    }
    const logement = await this.logements.trouverParId(
      input.tenantId,
      input.logementId,
    );
    if (!logement) {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "Le logement est introuvable.",
      );
    }
    const valide = validerObjetTrouve(input);

    const existant = await this.objets.trouverParRef(
      input.tenantId,
      input.ref,
    );
    if (existant) return existant;

    return this.objets.creer({
      tenantId: input.tenantId,
      logementId: input.logementId,
      reservationId: input.reservationId ?? null,
      ref: input.ref,
      ...valide,
    });
  }
}

export class ReclamerObjetTrouve {
  constructor(private readonly objets: ObjetsTrouvesRepository) {}

  async executer(
    tenantId: string,
    id: string,
    input: { voyageurNom: string; contact: string },
  ) {
    const objet = await this.objets.trouverParId(tenantId, id);
    if (!objet) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    if (objet.statut === "envoye" || objet.statut === "donne") {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "Cet objet a déjà été traité.",
      );
    }
    const voyageurNom = input.voyageurNom.trim();
    if (voyageurNom.length < 2 || voyageurNom.length > NOM_OBJET_MAX) {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        `Le nom doit contenir 2 à ${NOM_OBJET_MAX} caractères.`,
      );
    }
    const contact = input.contact.trim();
    if (contact.length < 3 || contact.length > CONTACT_OBJET_MAX) {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        `Le contact doit contenir 3 à ${CONTACT_OBJET_MAX} caractères.`,
      );
    }
    const misAJour = await this.objets.mettreAJour(tenantId, id, {
      statut: "reclame",
      voyageurNom,
      contact,
      fraisCentimes: FORFAIT_OBJET_CENTIMES,
    });
    if (!misAJour) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    return misAJour;
  }
}

export class EnvoyerObjetTrouve {
  constructor(private readonly objets: ObjetsTrouvesRepository) {}

  async executer(tenantId: string, id: string) {
    const objet = await this.objets.trouverParId(tenantId, id);
    if (!objet) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    if (objet.statut === "donne") {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "Cet objet est déjà sorti du stock.",
      );
    }
    if (objet.statut === "envoye") return objet;
    if (objet.statut !== "reclame") {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "Réclamez l’objet avant de l’envoyer.",
      );
    }
    const misAJour = await this.objets.mettreAJour(tenantId, id, {
      statut: "envoye",
      envoyeLe: aujourdHuiIso(),
    });
    if (!misAJour) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    return misAJour;
  }
}

export class CloturerObjetTrouve {
  constructor(private readonly objets: ObjetsTrouvesRepository) {}

  async executer(
    tenantId: string,
    id: string,
    maintenant: Date = new Date(),
  ) {
    const objet = await this.objets.trouverParId(tenantId, id);
    if (!objet) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    if (objet.statut === "envoye" || objet.statut === "donne") {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        "Cet objet a déjà été traité.",
      );
    }
    if (!eligibleAuDon(objet, maintenant)) {
      throw new ErreurMetier(
        "OBJET_TROUVE_INVALIDE",
        `Attendez encore ${joursRestantsAvantDon(objet, maintenant)} jour(s) avant de donner l’objet.`,
      );
    }
    const misAJour = await this.objets.mettreAJour(tenantId, id, {
      statut: "donne",
    });
    if (!misAJour) {
      throw new ErreurMetier("OBJET_TROUVE_INVALIDE", "Objet introuvable.");
    }
    return misAJour;
  }
}
