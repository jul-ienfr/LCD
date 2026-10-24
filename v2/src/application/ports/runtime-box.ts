export interface EtatBox {
  boxId: string;
  enLigne: boolean;
  derniereVue: Date | null;
  version?: string;
}

/**
 * Port runtime box (Home Assistant, Moli, autre). Implémentations HTTP.
 * Le métier ne connaît que des objets logiques, jamais l'API HA/Moli.
 */
export interface RuntimeBox {
  etat(boxId: string): Promise<EtatBox>;
  executer(boxId: string, commande: string, payload: Record<string, unknown>): Promise<void>;
}
