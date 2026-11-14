/**
 * Instrumentation des parcours P1 (T089–T092).
 *
 * Contrat : `specs/004-ergonomie-experience-client/contracts/mesure.md`.
 *
 * Module **pur** : il transforme une intention de mesure (« étape vue »,
 * « recherche sans résultat »...) en entrée `suivi_evenements`. Il ne connaît
 * ni SvelteKit, ni Drizzle, ni cookie.
 *
 * Règles opposables :
 * - les propriétés écrites sont **fermées** : identifiant de parcours, étape,
 *   surface, résultat, durée, nombre de résultats, rôle — jamais de texte
 *   libre, donc aucune donnée personnelle possible ;
 * - un rôle hors des rôles mesurés est ramené au rôle le plus proche, jamais
 *   écrit tel quel ;
 * - `nombreResultats` est borné et arrondi : c'est un compte, pas une requête.
 */
import {
  creerEvenement,
  typeSuiviPour,
  type EvenementErgonomie,
  type NomEvenementErgonomie,
  type ResultatMesure,
  type RoleMesure,
  type SurfaceMesure,
} from "./evenements";
import type { RoleUtilisateur } from "@/domain/utilisateur";

/** Entrée `suivi_evenements` prête à être enregistrée. */
export interface EntreeSuiviErgonomie {
  type: string;
  nom: string;
  page: string;
  metadata: Record<string, string | number | boolean>;
}

/** Intention de mesure, exprimée par une route. */
export interface MesureEntree {
  nom: NomEvenementErgonomie;
  parcoursId: string;
  surface: SurfaceMesure;
  route: string;
  etape?: string;
  resultat?: ResultatMesure;
  dureeMs?: number;
  role?: RoleUtilisateur | string;
  nombreResultats?: number;
  maintenant?: Date;
}

/**
 * Rôles mesurés : `comptable` et `operateur` agissent dans l'espace hôte, un
 * rôle inconnu est ramené à `hote` (jamais écrit tel quel dans la mesure).
 */
export const ROLES_MESURE_PAR_ROLE: Record<string, RoleMesure> = {
  super_admin: "super_admin",
  admin: "admin",
  hote: "hote",
  operateur: "hote",
  comptable: "hote",
  presta: "presta",
  proprietaire: "proprietaire",
  commercial: "commercial",
};

export function roleMesure(role?: string | null): RoleMesure {
  return ROLES_MESURE_PAR_ROLE[role ?? ""] ?? "hote";
}

/** Compte borné : entier ≥ 0, jamais négatif ni démesuré. */
export function nombreResultatsBorne(nombre: number): number {
  if (!Number.isFinite(nombre)) return 0;
  return Math.min(Math.max(Math.trunc(nombre), 0), 100000);
}

export function evenementDepuisMesure(entree: MesureEntree): EvenementErgonomie {
  return creerEvenement({
    nom: entree.nom,
    parcoursId: entree.parcoursId,
    surface: entree.surface,
    route: entree.route,
    role: roleMesure(entree.role),
    ...(entree.etape === undefined ? {} : { etape: entree.etape }),
    ...(entree.resultat === undefined ? {} : { resultat: entree.resultat }),
    ...(entree.dureeMs === undefined ? {} : { dureeMs: entree.dureeMs }),
    ...(entree.maintenant === undefined ? {} : { date: entree.maintenant }),
  });
}

/**
 * Traduit une intention de mesure en entrée `suivi_evenements`. Le nom
 * d'ergonomie voyage à la fois dans la colonne `nom` (indexé, utilisé par la
 * purge à 90 jours) et dans `metadata.evenement` (contrat de mesure).
 */
export function entreeSuiviDepuisMesure(
  entree: MesureEntree,
): EntreeSuiviErgonomie {
  const evenement = evenementDepuisMesure(entree);
  const metadata: Record<string, string | number | boolean> = {
    version: evenement.version,
    evenement: evenement.nom,
    parcoursId: evenement.parcoursId,
    surface: evenement.surface,
    date: evenement.date,
    role: evenement.role ?? roleMesure(entree.role),
  };
  if (evenement.etape) metadata.etape = evenement.etape;
  if (evenement.resultat) metadata.resultat = evenement.resultat;
  if (evenement.dureeMs !== undefined) metadata.dureeMs = evenement.dureeMs;
  if (entree.nombreResultats !== undefined) {
    metadata.nombreResultats = nombreResultatsBorne(entree.nombreResultats);
  }
  return {
    type: typeSuiviPour(evenement.nom),
    nom: evenement.nom,
    page: evenement.route,
    metadata,
  };
}
