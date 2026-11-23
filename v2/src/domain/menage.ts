import { dateIsoValide } from "./calendrier";
import { ErreurMetier } from "./erreurs";

export type StatutMenage = "planifie" | "fait";

export const STATUTS_MENAGE: readonly StatutMenage[] = ["planifie", "fait"];

export const LIBELLES_STATUT_MENAGE: Record<StatutMenage, string> = {
  planifie: "Planifié",
  fait: "Fait",
};

/** Une ligne de checklist de ménage : une pièce, un libellé, coché ou non. */
export interface TacheMenage {
  /** Pièce du logement (`""` pour les lignes héritées, sans découpage). */
  piece: string;
  libelle: string;
  fait: boolean;
}

/** Référentiel d'un logement : ses pièces et les tâches de chacune. */
export interface PieceReferentiel {
  piece: string;
  taches: string[];
}

/** Checklist d'un ménage, regroupée par pièce pour un cochage pièce à pièce. */
export interface PieceChecklist {
  piece: string;
  taches: TacheMenage[];
}

export const LIBELLE_PIECE_MAX = 60;
export const PIECES_MENAGE_MAX = 15;
export const TACHES_PAR_PIECE_MAX = 20;
/** Plafond global : une checklist de ménage ne dépasse pas 300 tâches. */
export const TACHES_MENAGE_MAX = PIECES_MENAGE_MAX * TACHES_PAR_PIECE_MAX;
export const LIBELLE_TACHE_MAX = 120;
export const NOTES_MENAGE_MAX = 2000;

/**
 * Modèle de checklist livré avec LCD Parc : un découpage par pièce
 * raisonnable pour une remise en état de location courte durée. Il sert de
 * point de départ au référentiel d'un logement, que la gérante ajuste
 * ensuite logement par logement.
 */
export const REFERENTIEL_MENAGE_DEFAUT: readonly PieceReferentiel[] = [
  {
    piece: "Entrée",
    taches: ["Sols", "Poussière", "Vitres et miroirs", "Réassort consommables"],
  },
  {
    piece: "Séjour",
    taches: ["Sols", "Poussière", "Canapé et coussins", "Vitres"],
  },
  {
    piece: "Cuisine",
    taches: [
      "Plan de travail",
      "Électroménager",
      "Vaisselle et rangement",
      "Poubelles",
      "Réassort consommables",
    ],
  },
  {
    piece: "Chambres",
    taches: ["Sols", "Poussière", "Literie et linge", "Rangement"],
  },
  {
    piece: "Sanitaires",
    taches: [
      "Douche et baignoire",
      "WC",
      "Lavabo et miroir",
      "Serviettes",
      "Réassort consommables",
    ],
  },
  {
    piece: "Extérieur",
    taches: ["Balcon ou terrasse", "Mobilier extérieur"],
  },
];

/** Tâches du modèle par défaut, toutes pièces confondues. */
export const TACHES_MENAGE_DEFAUT: readonly string[] =
  REFERENTIEL_MENAGE_DEFAUT.flatMap((piece) => piece.taches);

export interface Menage {
  id: string;
  tenantId: string;
  logementId: string;
  reservationId: string | null;
  ref: string;
  date: string;
  statut: StatutMenage;
  notes: string;
  score: number | null;
  coutCentimes: number | null;
  dureeMinutes: number | null;
  taches: TacheMenage[];
  createdAt: Date;
  updatedAt: Date;
}

export const SCORE_MENAGE_MIN = 1;
export const SCORE_MENAGE_MAX = 5;
export const SCORE_ALERTE = 3.5;
export const COUT_MENAGE_MAX_CENTIMES = 100_000;
export const DUREE_MENAGE_MAX_MINUTES = 600;

export function refMenageValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function statutMenageValide(statut: string): statut is StatutMenage {
  return (STATUTS_MENAGE as readonly string[]).includes(statut);
}

function cle(valeur: string): string {
  return valeur.toLocaleLowerCase("fr");
}

/** Copie modifiable du modèle par défaut, prête à être enregistrée. */
export function referentielParDefaut(): PieceReferentiel[] {
  return REFERENTIEL_MENAGE_DEFAUT.map((piece) => ({
    piece: piece.piece,
    taches: [...piece.taches],
  }));
}

/**
 * Valide un référentiel de logement : 1 à 15 pièces, chacune nommée et
 * portant 1 à 20 tâches, sans doublon de libellé (ni de pièce, ni de tâche
 * dans une pièce). Retourne la copie normalisée qui part en base.
 */
export function validerReferentiel(
  pieces: readonly { piece: string; taches: readonly string[] }[],
): PieceReferentiel[] {
  if (pieces.length === 0 || pieces.length > PIECES_MENAGE_MAX) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      `Le référentiel doit contenir 1 à ${PIECES_MENAGE_MAX} pièces.`,
    );
  }
  const piecesVues = new Set<string>();
  return pieces.map((entree) => {
    const piece = entree.piece.trim();
    if (piece.length === 0 || piece.length > LIBELLE_PIECE_MAX) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `Chaque pièce doit être nommée en ${LIBELLE_PIECE_MAX} caractères au plus.`,
      );
    }
    if (piecesVues.has(cle(piece))) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `La pièce « ${piece} » est présente deux fois.`,
      );
    }
    piecesVues.add(cle(piece));
    if (entree.taches.length === 0 || entree.taches.length > TACHES_PAR_PIECE_MAX) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `La pièce « ${piece} » doit contenir 1 à ${TACHES_PAR_PIECE_MAX} tâches.`,
      );
    }
    const tachesVues = new Set<string>();
    const taches = entree.taches.map((brut) => {
      const libelle = brut.trim();
      if (libelle.length < 2 || libelle.length > LIBELLE_TACHE_MAX) {
        throw new ErreurMetier(
          "MENAGE_INVALIDE",
          `Chaque tâche doit contenir 2 à ${LIBELLE_TACHE_MAX} caractères.`,
        );
      }
      if (tachesVues.has(cle(libelle))) {
        throw new ErreurMetier(
          "MENAGE_INVALIDE",
          `La tâche « ${libelle} » est présente deux fois dans « ${piece} ».`,
        );
      }
      tachesVues.add(cle(libelle));
      return libelle;
    });
    return { piece, taches };
  });
}

/** Checklist non cochée construite depuis un référentiel. */
export function checklistDepuisReferentiel(
  referentiel: readonly PieceReferentiel[],
): PieceChecklist[] {
  return referentiel.map((entree) => ({
    piece: entree.piece,
    taches: entree.taches.map((libelle) => ({
      piece: entree.piece,
      libelle,
      fait: false,
    })),
  }));
}

/** Checklist aplatie, dans l'ordre des pièces puis des tâches. */
export function aplatirPieces(pieces: readonly PieceChecklist[]): TacheMenage[] {
  return pieces.flatMap((entree) =>
    entree.taches.map((tache) => ({ ...tache, piece: entree.piece })),
  );
}

/**
 * Regroupe des lignes plates par pièce, dans l'ordre d'apparition. Les lignes
 * héritées sans pièce (`""`) sont regroupées en fin de liste.
 */
export function piecesDepuisTaches(
  taches: readonly TacheMenage[],
): PieceChecklist[] {
  const ordre: string[] = [];
  const parPiece = new Map<string, TacheMenage[]>();
  for (const tache of taches) {
    const lignes = parPiece.get(tache.piece);
    if (lignes) {
      lignes.push(tache);
    } else {
      parPiece.set(tache.piece, [tache]);
      ordre.push(tache.piece);
    }
  }
  const rangees = [
    ...ordre.filter((piece) => piece !== ""),
    ...ordre.filter((piece) => piece === ""),
  ];
  return rangees.map((piece) => ({
    piece,
    taches: parPiece.get(piece) ?? [],
  }));
}

export interface AvancementPiece {
  piece: string;
  faites: number;
  total: number;
  pourcentage: number;
  complete: boolean;
}

/**
 * Avancement global et pièce par pièce : une pièce est complète quand toutes
 * ses tâches sont cochées — c'est le repère du cochage pièce à pièce.
 */
export function avancementPieces(pieces: readonly PieceChecklist[]): {
  faites: number;
  total: number;
  pourcentage: number;
  pieces: AvancementPiece[];
} {
  const detail = pieces.map((entree) => {
    const avancement = avancementMenage(entree.taches);
    return {
      piece: entree.piece,
      ...avancement,
      complete: avancement.total > 0 && avancement.faites === avancement.total,
    };
  });
  const faites = detail.reduce((total, piece) => total + piece.faites, 0);
  const total = detail.reduce((total, piece) => total + piece.total, 0);
  return {
    faites,
    total,
    pourcentage: total === 0 ? 0 : Math.round((faites / total) * 100),
    pieces: detail,
  };
}

export function tachesParDefaut(): TacheMenage[] {
  return aplatirPieces(checklistDepuisReferentiel(referentielParDefaut()));
}

export function validerTaches(
  taches: readonly { piece?: string; libelle: string; fait?: boolean }[],
): TacheMenage[] {
  if (taches.length === 0 || taches.length > TACHES_MENAGE_MAX) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      `La checklist doit contenir 1 à ${TACHES_MENAGE_MAX} tâches.`,
    );
  }
  return taches.map((tache) => {
    const piece = (tache.piece ?? "").trim();
    if (piece.length > LIBELLE_PIECE_MAX) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `Le nom de la pièce est limité à ${LIBELLE_PIECE_MAX} caractères.`,
      );
    }
    const libelle = tache.libelle.trim();
    if (libelle.length < 2 || libelle.length > LIBELLE_TACHE_MAX) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `Chaque tâche doit contenir 2 à ${LIBELLE_TACHE_MAX} caractères.`,
      );
    }
    return { piece, libelle, fait: tache.fait === true };
  });
}

export function validerMenage(input: {
  date: string;
  notes?: string;
  taches?: readonly { piece?: string; libelle: string; fait?: boolean }[];
}): { date: string; notes: string; taches: TacheMenage[] } {
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier("MENAGE_INVALIDE", "La date du ménage est invalide.");
  }
  const notes = (input.notes ?? "").trim();
  if (notes.length > NOTES_MENAGE_MAX) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      `Les notes sont limitées à ${NOTES_MENAGE_MAX} caractères.`,
    );
  }
  const taches = validerTaches(input.taches ?? tachesParDefaut());
  return { date: input.date, notes, taches };
}

export function avancementMenage(taches: readonly TacheMenage[]): {
  faites: number;
  total: number;
  pourcentage: number;
} {
  const total = taches.length;
  const faites = taches.filter((t) => t.fait).length;
  return {
    faites,
    total,
    pourcentage: total === 0 ? 0 : Math.round((faites / total) * 100),
  };
}

export function validerEvaluationMenage(input: {
  score: number | null;
  coutCentimes: number | null;
  dureeMinutes: number | null;
}): {
  score: number | null;
  coutCentimes: number | null;
  dureeMinutes: number | null;
} {
  if (input.score !== null) {
    if (
      !Number.isInteger(input.score) ||
      input.score < SCORE_MENAGE_MIN ||
      input.score > SCORE_MENAGE_MAX
    ) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `Le score doit être compris entre ${SCORE_MENAGE_MIN} et ${SCORE_MENAGE_MAX}.`,
      );
    }
  }
  if (input.coutCentimes !== null) {
    if (
      !Number.isInteger(input.coutCentimes) ||
      input.coutCentimes < 0 ||
      input.coutCentimes > COUT_MENAGE_MAX_CENTIMES
    ) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        "Le coût de rotation est invalide.",
      );
    }
  }
  if (input.dureeMinutes !== null) {
    if (
      !Number.isInteger(input.dureeMinutes) ||
      input.dureeMinutes <= 0 ||
      input.dureeMinutes > DUREE_MENAGE_MAX_MINUTES
    ) {
      throw new ErreurMetier(
        "MENAGE_INVALIDE",
        `La durée doit être comprise entre 1 et ${DUREE_MENAGE_MAX_MINUTES} minutes.`,
      );
    }
  }
  if (
    input.score === null &&
    input.coutCentimes === null &&
    input.dureeMinutes === null
  ) {
    throw new ErreurMetier(
      "MENAGE_INVALIDE",
      "Renseignez au moins un indicateur (score, coût ou durée).",
    );
  }
  return input;
}

function moyenne(values: readonly number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function statistiquesMenage(menages: readonly Menage[]): {
  scoreMoyen: number | null;
  coutMoyenCentimes: number | null;
  dureeMoyenneMinutes: number | null;
  alerteQualite: boolean;
} {
  const scores = menages
    .map((m) => m.score)
    .filter((v): v is number => v !== null);
  const couts = menages
    .map((m) => m.coutCentimes)
    .filter((v): v is number => v !== null);
  const durees = menages
    .map((m) => m.dureeMinutes)
    .filter((v): v is number => v !== null);
  const scoreMoyen = moyenne(scores);
  return {
    scoreMoyen,
    coutMoyenCentimes: moyenne(couts),
    dureeMoyenneMinutes: moyenne(durees),
    alerteQualite: scoreMoyen !== null && scoreMoyen < SCORE_ALERTE,
  };
}
