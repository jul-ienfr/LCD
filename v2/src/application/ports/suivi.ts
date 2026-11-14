import type {
  ConfigurationSuivi,
  Consentement,
  EvenementSuivi,
} from "@/domain/suivi";

export interface EnregistrerEvenementSuiviInput {
  tenantId: string;
  visiteurId: string;
  sessionId: string;
  evenement: EvenementSuivi;
  consentement: Consentement;
  ipHash: string | null;
  userAgent: string | null;
}

export interface EvenementSuiviStocke extends EvenementSuivi {
  id: string;
  tenantId: string;
  visiteurId: string;
  sessionId: string;
  consentement: Consentement;
  creeLe: string;
}

export interface ResumeSuivi {
  total: number;
  parType: Record<string, number>;
  visiteurs: number;
  conversions: number;
  revenuCentimes: number;
}

export interface SuiviRepository {
  lireConfiguration(tenantId: string): Promise<ConfigurationSuivi | null>;
  enregistrerConfiguration(
    tenantId: string,
    configuration: ConfigurationSuivi,
  ): Promise<void>;
  enregistrerEvenement(
    input: EnregistrerEvenementSuiviInput,
  ): Promise<EvenementSuiviStocke>;
  listerEvenements(
    tenantId: string,
    options?: { limite?: number; type?: string | null },
  ): Promise<EvenementSuiviStocke[]>;
  resume(tenantId: string, depuis: string): Promise<ResumeSuivi>;
  purgerAvant(tenantId: string, avant: string): Promise<number>;
}
