export type CategorieRecherche =
  | "logement"
  | "reservation"
  | "facture"
  | "paiement"
  | "mission"
  | "menage"
  | "etat-des-lieux"
  | "ticket"
  | "sinistre"
  | "objet-trouve"
  | "commande-extra";

export interface ResultatRecherche {
  id: string;
  categorie: CategorieRecherche;
  ref: string;
  titre: string;
  detail: string;
  date: string | null;
  href: string;
}

export interface RechercheRepository {
  chercher(
    tenantId: string,
    motif: string,
    limite: number,
  ): Promise<ResultatRecherche[]>;
}
