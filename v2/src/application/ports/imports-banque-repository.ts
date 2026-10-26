import type {
  ImportBanque,
  LigneBanque,
  ResultatRapprochement,
} from "@/domain/rapprochement";

export interface EnregistrerImportData {
  tenantId: string;
  ref: string;
  nomFichier: string;
  resultat: ResultatRapprochement;
}

export interface ImportsBanqueRepository {
  enregistrer(data: EnregistrerImportData): Promise<{
    import: ImportBanque;
    lignes: LigneBanque[];
    cree: boolean;
  }>;
  trouver(
    tenantId: string,
    id: string,
  ): Promise<{ import: ImportBanque; lignes: LigneBanque[] } | null>;
  listerRecents(tenantId: string, limite: number): Promise<ImportBanque[]>;
}
