export const ROLES_UTILISATEUR = [
  "super_admin",
  "admin",
  "hote",
  "operateur",
  "comptable",
  "presta",
  "proprietaire",
  "commercial",
] as const;

export type RoleUtilisateur = (typeof ROLES_UTILISATEUR)[number];

export const LIBELLES_ROLE: Record<RoleUtilisateur, string> = {
  super_admin: "Super-administrateur",
  admin: "Administrateur",
  hote: "Hôte",
  operateur: "Opérateur",
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

/**
 * Seul un super-admin peut attribuer ou retirer le rôle super-admin. Un admin
 * ordinaire ne doit jamais pouvoir s'élever ni créer un compte équivalent.
 */
export function peutAttribuerRole(
  acteurRole: string | null | undefined,
  roleCible: string,
): boolean {
  if (roleCible === "super_admin") return acteurRole === "super_admin";
  return true;
}

/** Un super-admin ne peut être administré que par un autre super-admin. */
export function peutAdministrerCompte(
  acteurRole: string | null | undefined,
  roleCible: string,
): boolean {
  if (roleCible === "super_admin") return acteurRole === "super_admin";
  return true;
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

/**
 * RC professionnelle du prestataire : une date absente ou passée bloque le
 * dispatch. La comparaison est textuelle (ISO AAAA-MM-JJ), donc stable.
 */
export function assuranceRcValide(
  rcExpireLe: string | null | undefined,
  aujourdHui: string,
): boolean {
  if (!rcExpireLe) return false;
  return rcExpireLe >= aujourdHui;
}

export function joursAvantExpirationRc(
  rcExpireLe: string | null | undefined,
  aujourdHui: string,
): number | null {
  if (!rcExpireLe) return null;
  const fin = Date.parse(`${rcExpireLe}T00:00:00Z`);
  const debut = Date.parse(`${aujourdHui}T00:00:00Z`);
  if (!Number.isFinite(fin) || !Number.isFinite(debut)) return null;
  return Math.round((fin - debut) / 86_400_000);
}

/**
 * Allowlist d'exploitation : un e-mail listé obtient les pouvoirs
 * super-admin sans modification en base. Comparaison insensible à la casse.
 */
export function emailDansAllowlistSuperAdmin(
  email: string | null | undefined,
  listeCsv: string,
): boolean {
  const cible = (email ?? "").trim().toLowerCase();
  if (!cible) return false;
  return listeCsv
    .split(",")
    .map((entree) => entree.trim().toLowerCase())
    .filter(Boolean)
    .includes(cible);
}
