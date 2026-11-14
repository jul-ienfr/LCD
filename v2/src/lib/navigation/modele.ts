import type { RoleUtilisateur } from "@/domain/utilisateur";
import type { TraductionsNavigation } from "@/lib/i18n-nav";

/**
 * Modèle pur de navigation staff.
 * Aucun import SvelteKit : testable et réutilisable côté serveur comme client.
 */

/** Contrat : au plus 7 entrées dans la navigation principale. */
export const MAX_ENTREES_PRINCIPALES = 7;

type ClesTexte = {
  [K in keyof TraductionsNavigation]: TraductionsNavigation[K] extends string
    ? K
    : never;
}[keyof TraductionsNavigation];

export type CleNavigation = ClesTexte;

export interface LienNavigation {
  href: string;
  cle: CleNavigation;
  /** Rôles autorisés ; absent = tous les rôles staff. */
  roles?: readonly RoleUtilisateur[];
}

export interface GroupeNavigation {
  id: string;
  /** Clé de libellé du groupe dans le dictionnaire de navigation. */
  cle: CleNavigation;
  liens: readonly LienNavigation[];
}

export interface DomaineNavigation {
  id: string;
  cle: CleNavigation;
  href?: string;
  groupes: readonly GroupeNavigation[];
}

export interface NavigationStaff {
  principal: readonly LienNavigation[];
  domaines: readonly DomaineNavigation[];
}

export const ROLES_STAFF: readonly RoleUtilisateur[] = [
  "super_admin",
  "admin",
  "hote",
  "operateur",
  "comptable",
  "presta",
  "proprietaire",
  "commercial",
] as const;

/** Normalise un chemin : sans query, sans hash, sans slash final. */
export const normaliserChemin = (chemin: string): string => {
  const sansQuery = chemin.split("?")[0]?.split("#")[0] ?? "";
  if (sansQuery.length > 1 && sansQuery.endsWith("/")) {
    return sansQuery.slice(0, -1);
  }
  return sansQuery;
};

/**
 * Un lien est actif si le chemin courant est exactement sa cible, ou une
 * sous-route (`/hote/planning/canaux` active `/hote/planning`). La racine
 * `/hote` n'est active que par correspondance exacte.
 */
export const lienActif = (chemin: string, href: string): boolean => {
  const courant = normaliserChemin(chemin);
  const cible = normaliserChemin(href);
  if (courant === cible) return true;
  if (cible === "/hote" || cible === "/supervision") return false;
  return courant.startsWith(`${cible}/`);
};

export const lienVisiblePour = (
  lien: LienNavigation,
  role: string | null | undefined,
): boolean => {
  if (!lien.roles || lien.roles.length === 0) return true;
  if (!role) return false;
  if (role === "super_admin") return true;
  return (lien.roles as readonly string[]).includes(role);
};

export const filtrerNavigation = (
  navigation: NavigationStaff,
  role: string | null | undefined,
): NavigationStaff => ({
  principal: navigation.principal.filter((lien) =>
    lienVisiblePour(lien, role),
  ),
  domaines: navigation.domaines
    .map((domaine) => ({
      ...domaine,
      groupes: domaine.groupes
        .map((groupe) => ({
          ...groupe,
          liens: groupe.liens.filter((lien) => lienVisiblePour(lien, role)),
        }))
        .filter((groupe) => groupe.liens.length > 0),
    }))
    .filter((domaine) => domaine.groupes.length > 0),
});

export const tousLesLiens = (navigation: NavigationStaff): LienNavigation[] => [
  ...navigation.principal,
  ...navigation.domaines.flatMap((domaine) =>
    domaine.groupes.flatMap((groupe) => [...groupe.liens]),
  ),
];

export const libelleNavigation = (
  traductions: TraductionsNavigation,
  cle: CleNavigation,
): string => {
  const valeur = traductions[cle];
  return typeof valeur === "string" ? valeur : cle;
};

/**
 * Invariants du contrat `contracts/navigation.md`.
 * Retourne la liste des violations (vide = navigation conforme).
 */
export const validerNavigation = (navigation: NavigationStaff): string[] => {
  const erreurs: string[] = [];

  if (navigation.principal.length > MAX_ENTREES_PRINCIPALES) {
    erreurs.push(
      `Navigation principale : ${navigation.principal.length} entrées (maximum ${MAX_ENTREES_PRINCIPALES}).`,
    );
  }

  const liens = tousLesLiens(navigation);
  const vus = new Map<string, number>();
  for (const lien of liens) {
    const href = normaliserChemin(lien.href);
    if (!href.startsWith("/")) {
      erreurs.push(`Lien non absolu : ${lien.href}.`);
    }
    if (!href.startsWith("/hote") && !href.startsWith("/supervision")) {
      erreurs.push(`Lien hors espace staff : ${lien.href}.`);
    }
    vus.set(href, (vus.get(href) ?? 0) + 1);
  }
  for (const [href, compte] of vus) {
    if (compte > 1) {
      erreurs.push(`Doublon de navigation : ${href} (${compte} occurrences).`);
    }
  }

  for (const domaine of navigation.domaines) {
    if (domaine.groupes.length === 0) {
      erreurs.push(`Domaine vide : ${domaine.id}.`);
    }
    for (const groupe of domaine.groupes) {
      if (groupe.liens.length === 0) {
        erreurs.push(`Groupe vide : ${domaine.id}/${groupe.id}.`);
      }
    }
  }

  return erreurs;
};
