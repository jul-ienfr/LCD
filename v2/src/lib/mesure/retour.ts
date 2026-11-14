/**
 * Retour qualitatif sans donnée personnelle (T094).
 *
 * Contrat : `specs/004-ergonomie-experience-client/contracts/mesure.md`.
 *
 * Le formulaire de retour n'accepte **aucun texte libre** : un commentaire
 * ouvert peut contenir un nom, une adresse ou un numéro de réservation, donc
 * une donnée permettant de réidentifier une personne. Le qualitatif est donc
 * capturé par des choix fermés :
 *
 * - le parcours concerné (`P-RESA`, `P-SEJOUR`, ...) ;
 * - la note SEQ (1 = très difficile, 7 = très facile) ;
 * - les obstacles rencontrés, parmi une liste fixe ;
 * - le support utilisé (téléphone, tablette, ordinateur).
 *
 * Ce module est pur : ni SvelteKit, ni Drizzle, ni HTTP.
 */

export const PARCOURS_RETOUR = [
  "P-RESA",
  "P-SEJOUR",
  "P-INCIDENT",
  "P-HOTE-5",
  "P-RECHERCHE",
  "P-PRESTA",
] as const;

export type ParcoursRetour = (typeof PARCOURS_RETOUR)[number];

export const OBSTACLES_RETOUR = [
  "information_introuvable",
  "formulaire_long",
  "affichage",
  "langue",
  "erreur_bloquante",
  "lenteur",
  "autre",
] as const;

export type ObstacleRetour = (typeof OBSTACLES_RETOUR)[number];

export const SUPPORTS_RETOUR = ["telephone", "tablette", "ordinateur"] as const;

export type SupportRetour = (typeof SUPPORTS_RETOUR)[number];

export interface RetourValide {
  parcours: ParcoursRetour;
  note: number;
  obstacles: ObstacleRetour[];
  support: SupportRetour | null;
}

export interface ErreursRetour {
  parcours?: "requis" | "inconnu";
  note?: "requise" | "hors_bornes";
}

export type ResultatRetour =
  | { ok: true; valeur: RetourValide }
  | { ok: false; erreurs: ErreursRetour };

export function estParcoursRetour(valeur: unknown): valeur is ParcoursRetour {
  return (
    typeof valeur === "string" &&
    (PARCOURS_RETOUR as readonly string[]).includes(valeur)
  );
}

export function estObstacleRetour(valeur: unknown): valeur is ObstacleRetour {
  return (
    typeof valeur === "string" &&
    (OBSTACLES_RETOUR as readonly string[]).includes(valeur)
  );
}

export function estSupportRetour(valeur: unknown): valeur is SupportRetour {
  return (
    typeof valeur === "string" &&
    (SUPPORTS_RETOUR as readonly string[]).includes(valeur)
  );
}

/**
 * Valide les données brutes d'un formulaire de retour.
 *
 * Ne lève jamais : renvoie les erreurs pour que l'appelant conserve les
 * valeurs saisies et affiche un message actionnable.
 */
export function validerRetour(donnees: {
  parcours?: unknown;
  note?: unknown;
  obstacles?: unknown;
  support?: unknown;
}): ResultatRetour {
  const erreurs: ErreursRetour = {};

  const parcoursBrut =
    typeof donnees.parcours === "string" ? donnees.parcours.trim() : "";
  if (!parcoursBrut) {
    erreurs.parcours = "requis";
  } else if (!estParcoursRetour(parcoursBrut)) {
    erreurs.parcours = "inconnu";
  }

  const noteBrute =
    typeof donnees.note === "number"
      ? donnees.note
      : String(donnees.note ?? "").trim() === ""
        ? Number.NaN
        : Number(String(donnees.note).trim());
  if (!Number.isFinite(noteBrute)) {
    erreurs.note = "requise";
  } else if (noteBrute < 1 || noteBrute > 7 || !Number.isInteger(noteBrute)) {
    erreurs.note = "hors_bornes";
  }

  if (Object.keys(erreurs).length > 0) {
    return { ok: false, erreurs };
  }

  const obstaclesBruts = Array.isArray(donnees.obstacles)
    ? donnees.obstacles
    : donnees.obstacles === undefined || donnees.obstacles === null
      ? []
      : [donnees.obstacles];
  const obstacles = [
    ...new Set(obstaclesBruts.filter(estObstacleRetour)),
  ] as ObstacleRetour[];

  return {
    ok: true,
    valeur: {
      parcours: parcoursBrut as ParcoursRetour,
      note: noteBrute,
      obstacles,
      support: estSupportRetour(donnees.support) ? donnees.support : null,
    },
  };
}

/**
 * Métadonnées stockées pour un retour : uniquement des valeurs fermées et des
 * comptes, jamais de texte libre.
 */
export function metadonneesRetour(retour: RetourValide): Record<
  string,
  string | number | boolean
> {
  return {
    parcoursId: retour.parcours,
    note: retour.note,
    obstacles: retour.obstacles.join(","),
    nombreObstacles: retour.obstacles.length,
    ...(retour.support ? { support: retour.support } : {}),
  };
}
