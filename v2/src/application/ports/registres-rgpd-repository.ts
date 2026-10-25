import type { EntreeRegistre, RegistreRgpd } from "@/domain/rgpd";

export interface EnregistrerRegistreData {
  tenantId: string;
  dpoNom: string | null;
  dpoContact: string | null;
  hebergement: string;
  entrees: Record<string, EntreeRegistre>;
}

export interface RegistresRgpdRepository {
  trouver(tenantId: string): Promise<RegistreRgpd | null>;
  enregistrer(data: EnregistrerRegistreData): Promise<RegistreRgpd>;
}
