import type {
  DernierStatutFlux,
  FluxIcs,
} from "@/domain/flux-ics";

export interface EnregistrerFluxIcsData {
  tenantId: string;
  logementId: string;
  canalId?: string | null;
  libelle: string;
  url: string;
  intervalleMinutes?: number;
}

export interface MarquerSyncFluxIcsData {
  statut: DernierStatutFlux;
  message: string;
  /** Heure de la tentative (succès ou échec). */
  date: Date;
  etag?: string | null;
  derniereModification?: string | null;
  empreinte?: string | null;
  echecsConsecutifs?: number;
  prochainEssai?: Date | null;
  videsConsecutifs?: number;
}

export interface DetailsRunIcs {
  conflits?: Array<{
    ref: string;
    debut: string;
    fin: string;
    avecRef: string;
    avecType: "reservation" | "blocage";
    message: string;
  }>;
  lignes?: unknown[];
  [cle: string]: unknown;
}

export interface EnregistrerRunIcsData {
  tenantId: string;
  fluxIcsId: string;
  debut: Date;
  fin: Date;
  statut: DernierStatutFlux;
  statutHttp: number | null;
  dureeMs: number;
  evenements: number;
  crees: number;
  misAJour: number;
  annules: number;
  deja: number;
  conflits: number;
  ignores: number;
  message: string;
  details?: DetailsRunIcs | null;
}

export interface RunIcs {
  id: string;
  fluxIcsId: string;
  debut: Date;
  fin: Date | null;
  statut: DernierStatutFlux;
  statutHttp: number | null;
  dureeMs: number | null;
  evenements: number;
  crees: number;
  misAJour: number;
  annules: number;
  deja: number;
  conflits: number;
  ignores: number;
  message: string | null;
  details: DetailsRunIcs | null;
}

export interface ResumeSanteIcs {
  actifs: number;
  enErreur: number;
  enRetard: number;
  jamaisSync: number;
  conflits24h: number;
  dernierCycle: Date | null;
}

export interface FluxIcsRepository {
  enregistrer(data: EnregistrerFluxIcsData): Promise<FluxIcs>;
  listerParLogement(tenantId: string, logementId: string): Promise<FluxIcs[]>;
  listerParTenant(tenantId: string): Promise<FluxIcs[]>;
  listerActifsGlobal(): Promise<FluxIcs[]>;
  /** Flux actifs dont l'échéance est passée, tous tenants confondus. */
  listerDusGlobal(maintenant: Date, limite: number): Promise<FluxIcs[]>;
  trouverParId(tenantId: string, id: string): Promise<FluxIcs | null>;
  marquerSync(
    tenantId: string,
    id: string,
    data: MarquerSyncFluxIcsData,
  ): Promise<FluxIcs | null>;
  enregistrerRun(data: EnregistrerRunIcsData): Promise<void>;
  listerRuns(
    tenantId: string,
    fluxIcsId: string,
    limite: number,
  ): Promise<RunIcs[]>;
  resumeSanteGlobal(
    maintenant: Date,
    toleranceMinutes: number,
  ): Promise<ResumeSanteIcs>;
  /** Supprime les historiques plus anciens que `jours` (rétention). */
  nettoyerRunsGlobal(jours: number): Promise<number>;
  supprimer(tenantId: string, id: string): Promise<void>;
}

export interface OptionsRecuperationIcs {
  etag?: string | null;
  derniereModification?: string | null;
}

export interface ReponseIcs {
  nonModifie: boolean;
  texte: string | null;
  etag: string | null;
  derniereModification: string | null;
  statutHttp: number;
}

export interface RecuperateurIcs {
  recuperer(
    url: string,
    options?: OptionsRecuperationIcs,
  ): Promise<ReponseIcs>;
}
