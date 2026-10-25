import { dateIsoValide } from "@/domain/calendrier";
import { ErreurMetier } from "@/domain/erreurs";
import {
  alertesInventaire,
  etatValide,
  statsInventaire,
  validerBien,
  type AlertesInventaire,
  type Bien,
  type EtatBien,
  type StatsInventaire,
} from "@/domain/inventaire";
import type { BiensRepository } from "../ports/biens-repository";

export function aujourdHuiIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export type TableauInventaire = {
  biens: Bien[];
  alertes: AlertesInventaire;
  stats: StatsInventaire;
};

export class LireTableauInventaire {
  constructor(private readonly repo: BiensRepository) {}

  async executer(
    tenantId: string,
    logementId: string,
    aujourdHui = aujourdHuiIso(),
  ): Promise<TableauInventaire> {
    const biens = await this.repo.listerParLogement(tenantId, logementId);
    return {
      biens,
      alertes: alertesInventaire(biens, aujourdHui),
      stats: statsInventaire(biens, aujourdHui),
    };
  }
}

export interface EnregistrerBienInput {
  id?: string;
  tenantId: string;
  logementId: string;
  qr: string;
  categorie: string;
  label: string;
  dateAchat: string | null;
  prixAchatCentimes: number | null;
  fournisseur: string | null;
  garantieFin: string | null;
  etat: number;
  photoUrl: string | null;
  notes: string | null;
}

function dateOuNull(valeur: string | null, nom: string): string | null {
  if (!valeur) return null;
  if (!dateIsoValide(valeur)) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      `${nom} invalide : format AAAA-MM-JJ attendu.`,
    );
  }
  return valeur;
}

function texteOuNull(valeur: string | null, max: number): string | null {
  const propre = valeur?.trim() ?? "";
  if (!propre) return null;
  if (propre.length > max) {
    throw new ErreurMetier(
      "INVENTAIRE_INVALIDE",
      `Texte trop long : ${max} caractères maximum.`,
    );
  }
  return propre;
}

export class EnregistrerBien {
  constructor(private readonly repo: BiensRepository) {}

  async executer(input: EnregistrerBienInput): Promise<Bien> {
    const qr = input.qr.trim();
    const categorie = input.categorie.trim();
    const label = input.label.trim();
    const dateAchat = dateOuNull(input.dateAchat, "La date d’achat");
    const garantieFin = dateOuNull(input.garantieFin, "La fin de garantie");

    validerBien({
      qr,
      categorie,
      label,
      prixAchatCentimes: input.prixAchatCentimes,
      etat: input.etat,
    });

    if (
      dateAchat &&
      garantieFin &&
      Date.parse(`${garantieFin}T00:00:00Z`) <
        Date.parse(`${dateAchat}T00:00:00Z`)
    ) {
      throw new ErreurMetier(
        "INVENTAIRE_INVALIDE",
        "La fin de garantie précède la date d’achat.",
      );
    }

    return this.repo.enregistrer({
      id: input.id,
      tenantId: input.tenantId,
      logementId: input.logementId,
      qr,
      categorie,
      label,
      dateAchat,
      prixAchatCentimes: input.prixAchatCentimes,
      fournisseur: texteOuNull(input.fournisseur, 120),
      garantieFin,
      etat: input.etat as EtatBien,
      photoUrl: texteOuNull(input.photoUrl, 500),
      notes: texteOuNull(input.notes, 1000),
    });
  }
}

export interface UtiliserBienInput {
  tenantId: string;
  logementId: string;
  qr: string;
  laver: boolean;
  qui: string;
  ref: string;
  aujourdHui?: string;
}

export class UtiliserBien {
  constructor(private readonly repo: BiensRepository) {}

  async executer(input: UtiliserBienInput): Promise<Bien> {
    const ref = `${input.ref}:${input.qr}`;
    const bien = await this.repo.trouverParQr(
      input.tenantId,
      input.logementId,
      input.qr,
    );
    if (!bien) {
      throw new ErreurMetier("INVENTAIRE_INVALIDE", "Bien introuvable.");
    }
    if (await this.repo.evenementExiste(input.tenantId, ref)) {
      return bien;
    }

    const date = input.aujourdHui ?? aujourdHuiIso();
    const misAJour = await this.repo.enregistrerUtilisation(
      input.tenantId,
      bien.id,
      input.laver,
      date,
    );
    await this.repo.enregistrerEvenement({
      tenantId: input.tenantId,
      logementId: input.logementId,
      bienId: bien.id,
      type: "utilisation",
      ref,
      payload: {
        qr: bien.qr,
        laver: input.laver,
        qui: input.qui,
        date,
      },
    });
    return misAJour;
  }
}

export interface ChangerEtatBienInput {
  tenantId: string;
  logementId: string;
  qr: string;
  etat: number;
  note: string | null;
  qui: string;
  ref: string;
}

export class ChangerEtatBien {
  constructor(private readonly repo: BiensRepository) {}

  async executer(input: ChangerEtatBienInput): Promise<Bien> {
    if (!etatValide(input.etat)) {
      throw new ErreurMetier(
        "INVENTAIRE_INVALIDE",
        "L’état doit être un entier de 1 à 5.",
      );
    }
    const ref = `${input.ref}:${input.qr}`;
    const bien = await this.repo.trouverParQr(
      input.tenantId,
      input.logementId,
      input.qr,
    );
    if (!bien) {
      throw new ErreurMetier("INVENTAIRE_INVALIDE", "Bien introuvable.");
    }
    if (await this.repo.evenementExiste(input.tenantId, ref)) {
      return bien;
    }

    const misAJour = await this.repo.changerEtat(
      input.tenantId,
      bien.id,
      input.etat,
      texteOuNull(input.note, 1000),
    );
    await this.repo.enregistrerEvenement({
      tenantId: input.tenantId,
      logementId: input.logementId,
      bienId: bien.id,
      type: "etat",
      ref,
      payload: {
        qr: bien.qr,
        etat: input.etat,
        note: input.note,
        qui: input.qui,
      },
    });
    return misAJour;
  }
}
