/**
 * Modèle pur des événements d'ergonomie (T095).

 * Contrat : `specs/004-ergonomie-experience-client/contracts/mesure.md`.
 *
 * Ce module ne connaît ni SvelteKit, ni Drizzle, ni HTTP : il décrit les
 * parcours mesurés, les noms d'événements et les surfaces, et valide la forme
 * d'un événement (durées, bornes, nom de route).
 *
 * Règles opposables :
 * - aucun champ ne transporte de donnée personnelle (e-mail, nom, téléphone,
 *   token, contenu de message, référence nominative) ;
 * - les rapports ne montrent que des comptes et des médianes ;
 * - les événements critiques sont émis côté serveur pour mesurer aussi les
 *   parcours sans JS.
 */
import type { TypeEvenementSuivi } from "@/domain/suivi";

export const VERSION_MESURE = "2026-11";

export type SurfaceMesure =
  | "public"
  | "reservation"
  | "voyageur"
  | "staff"
  | "token"
  | "auth";

export const SURFACES_MESURE = [
  "public",
  "reservation",
  "voyageur",
  "staff",
  "token",
  "auth",
] as const satisfies readonly SurfaceMesure[];

export type NomEvenementErgonomie =
  | "parcours_demarre"
  | "etape_vue"
  | "etape_validee"
  | "erreur_formulaire"
  | "parcours_abandonne"
  | "parcours_reussi"
  | "recherche_effectuee"
  | "recherche_sans_resultat"
  | "retour_utilisateur";

export const NOMS_EVENEMENT_ERGONOMIE = [
  "parcours_demarre",
  "etape_vue",
  "etape_validee",
  "erreur_formulaire",
  "parcours_abandonne",
  "parcours_reussi",
  "recherche_effectuee",
  "recherche_sans_resultat",
  "retour_utilisateur",
] as const satisfies readonly NomEvenementErgonomie[];

export type ResultatMesure = "succes" | "erreur" | "abandon";

export type RoleMesure =
  | "visiteur"
  | "voyageur"
  | "hote"
  | "admin"
  | "presta"
  | "proprietaire"
  | "commercial"
  | "super_admin";

export const ROLES_MESURE = [
  "visiteur",
  "voyageur",
  "hote",
  "admin",
  "presta",
  "proprietaire",
  "commercial",
  "super_admin",
] as const satisfies readonly RoleMesure[];

export interface EvenementErgonomie {
  nom: NomEvenementErgonomie;
  /** Identifiant de parcours : `P-RESA`, `P-SEJOUR`, `P-HOTE-5`… */
  parcoursId: string;
  surface: SurfaceMesure;
  /** Route normalisée (sans identifiant ni token) : `/reserver`. */
  route: string;
  etape?: string;
  resultat?: ResultatMesure;
  dureeMs?: number;
  role?: RoleMesure;
  /** Version du contrat de mesure appliqué. */
  version: string;
  /** Horodatage ISO 8601, arrondi à la seconde. */
  date: string;
}

// --- Parcours mesurés -------------------------------------------------------

export interface ParcoursMesure {
  id: string;
  libelle: string;
  surface: SurfaceMesure;
  debut: string;
  fin: string;
  cible: string;
  /** Étapes ordonnées qui composent le parcours. */
  etapes: readonly string[];
}

export const PARCOURS_MESURES = [
  {
    id: "P-RESA",
    libelle: "Demande de réservation",
    surface: "reservation",
    debut: "/",
    fin: "demande envoyée",
    cible: "< 180 s, ≥ 80 %",
    etapes: ["accueil", "recherche", "logement", "prix", "voyageurs", "demande"],
  },
  {
    id: "P-SEJOUR",
    libelle: "Séjour voyageur",
    surface: "voyageur",
    debut: "ouverture du lien",
    fin: "Wi-Fi + accès + départ vus",
    cible: "< 10 s, ≥ 90 %",
    etapes: ["ouverture", "wifi", "acces", "depart", "urgence"],
  },
  {
    id: "P-INCIDENT",
    libelle: "Signalement d'incident",
    surface: "voyageur",
    debut: "clic « Signaler »",
    fin: "incident envoyé",
    cible: "< 60 s",
    etapes: ["ouverture", "description", "envoi"],
  },
  {
    id: "P-HOTE-5",
    libelle: "Cinq tâches hôte",
    surface: "staff",
    debut: "/hote",
    fin: "5 tâches réalisées",
    cible: "−30 %",
    etapes: [
      "arrivee",
      "menage",
      "facture",
      "reponse_voyageur",
      "incident",
    ],
  },
  {
    id: "P-RECHERCHE",
    libelle: "Recherche staff",
    surface: "staff",
    debut: "recherche",
    fin: "résultat ouvert",
    cible: "< 20 s",
    etapes: ["saisie", "resultats", "ouverture"],
  },
  {
    id: "P-PRESTA",
    libelle: "Mission prestataire",
    surface: "staff",
    debut: "/presta",
    fin: "mission clôturée",
    cible: "< 3 min",
    etapes: ["ouverture", "acceptation", "execution", "cloture"],
  },
] as const satisfies readonly ParcoursMesure[];

export type IdParcoursMesure = (typeof PARCOURS_MESURES)[number]["id"];

export function parcoursParId(
  id: string | null | undefined,
): ParcoursMesure | undefined {
  if (!id) return undefined;
  return PARCOURS_MESURES.find((parcours) => parcours.id === id);
}

// --- Raccourcis de construction --------------------------------------------

export const ROUTE_MESURE_MAX = 120;
export const DUREE_MESURE_MAX_MS = 30 * 60 * 1000;

/** Normalise une route : chemin seul, sans requête, ni token, ni identifiant. */
export function normaliserRoute(brut: string): string | null {
  if (typeof brut !== "string") return null;
  const chemin = brut.trim().split(/[?#]/)[0] ?? "";
  if (!chemin.startsWith("/")) return null;
  if (chemin.length > ROUTE_MESURE_MAX) return null;
  return chemin;
}

/**
 * Construit et valide un événement d'ergonomie.
 *
 * @throws Error si un champ est invalide (nom, surface, route, durée).
 */
export function creerEvenement(
  entree: Omit<EvenementErgonomie, "version" | "date"> & {
    version?: string;
    date?: Date | string;
    maintenant?: Date;
  },
): EvenementErgonomie {
  const {
    nom,
    parcoursId,
    surface,
    route,
    etape,
    resultat,
    dureeMs,
    role,
    version,
    date,
    maintenant,
  } = entree;

  if (!NOMS_EVENEMENT_ERGONOMIE.includes(nom)) {
    throw new Error(`Nom d'événement inconnu : ${String(nom)}`);
  }
  if (!SURFACES_MESURE.includes(surface)) {
    throw new Error(`Surface inconnue : ${String(surface)}`);
  }
  if (!parcoursId || !parcoursParId(parcoursId)) {
    throw new Error(`Parcours inconnu : ${String(parcoursId)}`);
  }
  const routePropre = normaliserRoute(route);
  if (!routePropre) {
    throw new Error(`Route invalide : ${String(route)}`);
  }
  if (dureeMs !== undefined) {
    if (
      !Number.isFinite(dureeMs) ||
      dureeMs < 0 ||
      dureeMs > DUREE_MESURE_MAX_MS
    ) {
      throw new Error(`Durée invalide : ${String(dureeMs)} ms`);
    }
  }
  if (role !== undefined && !ROLES_MESURE.includes(role)) {
    throw new Error(`Rôle inconnu : ${String(role)}`);
  }
  if (
    resultat !== undefined &&
    !["succes", "erreur", "abandon"].includes(resultat)
  ) {
    throw new Error(`Résultat inconnu : ${String(resultat)}`);
  }

  const horodatage = date ?? maintenant ?? new Date();
  const iso =
    horodatage instanceof Date
      ? horodatage.toISOString()
      : new Date(horodatage).toISOString();

  return {
    nom,
    parcoursId,
    surface,
    route: routePropre,
    ...(etape ? { etape: etape.slice(0, 60) } : {}),
    ...(resultat ? { resultat } : {}),
    ...(dureeMs !== undefined ? { dureeMs: Math.round(dureeMs) } : {}),
    ...(role ? { role } : {}),
    version: version ?? VERSION_MESURE,
    date: iso,
  };
}

/**
 * Nom d'événement de suivi first-party (`suivi_evenements.type`) correspondant
 * à un événement d'ergonomie. La table `suivi_evenements` est réutilisée : le
 * nom d'ergonomie voyage dans `metadata.evenement`.
 */
export function typeSuiviPour(nom: NomEvenementErgonomie): TypeEvenementSuivi {
  switch (nom) {
    case "parcours_demarre":
    case "etape_vue":
      return "page_vue";
    case "etape_validee":
      return "clic";
    case "erreur_formulaire":
      return "autre";
    case "parcours_reussi":
      return "conversion";
    case "parcours_abandonne":
      return "autre";
    case "recherche_effectuee":
    case "recherche_sans_resultat":
      return "autre";
    case "retour_utilisateur":
      return "autre";
    default:
      return "autre";
  }
}
