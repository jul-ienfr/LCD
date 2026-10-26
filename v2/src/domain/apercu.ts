export const ROLES_APERCU = ["admin", "hote", "comptable"] as const;

export type RoleApercu = (typeof ROLES_APERCU)[number];

export function roleApercuValide(role: string): role is RoleApercu {
  return (ROLES_APERCU as readonly string[]).includes(role);
}

export interface Apercu {
  email: string;
  role: RoleApercu;
  /** Expiration en secondes epoch. */
  exp: number;
}

export const DUREE_APERCU_SECONDES = 2 * 60 * 60;
