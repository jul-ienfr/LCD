export const ROLES_UTILISATEUR = [
  "admin",
  "hote",
  "comptable",
  "presta",
  "proprietaire",
  "commercial",
] as const;

export type RoleUtilisateur = (typeof ROLES_UTILISATEUR)[number];

export const LIBELLES_ROLE: Record<RoleUtilisateur, string> = {
  admin: "Administrateur",
  hote: "Hôte",
  comptable: "Comptable",
  presta: "Prestataire",
  proprietaire: "Propriétaire",
  commercial: "Commercial",
};

export function roleUtilisateurValide(
  role: string,
): role is RoleUtilisateur {
  return (ROLES_UTILISATEUR as readonly string[]).includes(role);
}

export function libelleRole(role: string): string {
  return (LIBELLES_ROLE as Record<string, string>)[role] ?? role;
}

export function emailUtilisateurValide(email: string): boolean {
  const valeur = email.trim();
  return (
    valeur.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur)
  );
}

export function motDePasseValide(motDePasse: string): boolean {
  return motDePasse.length >= 12 && motDePasse.length <= 128;
}

export function nomUtilisateurValide(nom: string): boolean {
  const valeur = nom.trim();
  return valeur.length >= 2 && valeur.length <= 120;
}
