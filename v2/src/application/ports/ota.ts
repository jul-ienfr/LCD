export interface SejourOta {
  ref: string;
  logementCode: string;
  debut: string;
  fin: string;
  voyageurs: number;
  montantCentimes: number;
  source: string;
}

/**
 * Port de synchronisation OTA/ICS. Implémentations : API fournisseur,
 * flux ICS, import manuel. Le domaine ne dépend d'aucun OTA.
 */
export interface OtaSource {
  lireSejours(depuis: Date, jusqua: Date): Promise<SejourOta[]>;
}
