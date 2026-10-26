import type {
  IntentionAssistant,
  NiveauModele,
  TonAssistant,
} from "@/domain/assistant";

export interface RequeteBrouillon {
  invite: string;
  intention: IntentionAssistant;
  ton: TonAssistant;
  niveau: NiveauModele;
  logement: string;
  voyageur: string;
  details: string;
}

export interface BrouillonGenere {
  texte: string;
  modele: string;
  coutEstimeCentimes: number;
}

export interface GenerateurBrouillon {
  generer(requete: RequeteBrouillon): Promise<BrouillonGenere>;
}
