export interface MemoireVoyageur {
  id: string;
  tenantId: string;
  emailHash: string;
  nom: string;
  preferences: string;
  consentementAt: Date;
  expireAt: Date;
  lastSeenAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EnregistrerMemoireData {
  tenantId: string;
  emailHash: string;
  nom: string;
  preferences: string;
  consentementAt: Date;
  expireAt: Date;
}

/**
 * Port de la mémoire voyageur : uniquement une empreinte d'email, jamais
 * l'adresse en clair. Toute lecture vérifie la date d'expiration.
 */
export interface MemoireRepository {
  enregistrer(data: EnregistrerMemoireData): Promise<MemoireVoyageur>;
  trouverParHash(
    tenantId: string,
    emailHash: string,
  ): Promise<MemoireVoyageur | null>;
  supprimer(tenantId: string, emailHash: string): Promise<boolean>;
  purgerExpires(tenantId: string, maintenant?: Date): Promise<number>;
}
