/**
 * Persistance des journaux applicatifs (spec 006, FR-016).
 *
 * `logInfo`/`logErreur` écrivent toujours la ligne JSON sur stdout ; ce module
 * la persiste en plus dans `journaux_applicatifs` (table plateforme bornée,
 * migration 0109) pour que la supervision les lise sans SSH.
 *
 * Règles :
 * - jamais bloquant : l'insertion part en tâche de fond et toute erreur est
 *   avalée (une panne de journalisation ne doit pas casser une requête) ;
 * - jamais une fuite : le contexte est masqué (mêmes règles que Sentry) et
 *   les tailles sont bornées avant insertion ;
 * - jamais récursif : ce module n'utilise pas le logger (il écrirait une
 *   ligne de journal par ligne de journal).
 */

import { and, desc, eq, ilike, type SQL } from "drizzle-orm";
import { db } from "@/infrastructure/db/client";
import { journauxApplicatifs } from "@/infrastructure/db/schema";
import { env } from "@/lib/env";
import { configurerPersistanceJournal, type NiveauJournal } from "@/lib/logger";
import { assainirContexte } from "@/lib/telemetry";

/** Bornes de stockage : un journal est une trace, pas un document. */
export const TAILLE_MAX_MESSAGE = 500;
export const TAILLE_MAX_CONTEXTE = 4_000;

export interface LigneJournalPreparee {
  niveau: NiveauJournal;
  message: string;
  contexte: Record<string, unknown>;
  requestId: string | null;
}

/**
 * Prépare une ligne persistable : message et contexte bornés, contexte
 * masqué (clés sensibles remplacées, profondeur et tailles bornées),
 * `requestId` extrait du contexte s'il existe.
 */
export function preparerLigneJournal(
  niveau: NiveauJournal,
  message: string,
  contexte: Record<string, unknown> = {},
): LigneJournalPreparee {
  const masque = assainirContexte(contexte);
  const requestId =
    typeof masque.requestId === "string" ? masque.requestId.slice(0, 64) : null;
  let contexteBorne = masque;
  try {
    if (JSON.stringify(masque).length > TAILLE_MAX_CONTEXTE) {
      // Le contexte dépasse la borne : on tronque sa sérialisation plutôt que
      // de perdre la ligne entière.
      contexteBorne = {
        tronque: true,
        resume: JSON.stringify(masque).slice(0, TAILLE_MAX_CONTEXTE),
      };
    }
  } catch {
    // Valeur non sérialisable (ex. BigInt) : la trace reste lisible.
    contexteBorne = { tronque: true, resume: "[contexte non sérialisable]" };
  }
  return {
    niveau,
    message: message.slice(0, TAILLE_MAX_MESSAGE),
    contexte: contexteBorne,
    requestId,
  };
}

/** Écrit une ligne en base (exporté pour les tests). */
export async function ecrireJournal(
  niveau: NiveauJournal,
  message: string,
  contexte: Record<string, unknown> = {},
): Promise<void> {
  await db
    .insert(journauxApplicatifs)
    .values(preparerLigneJournal(niveau, message, contexte));
}

/**
 * Fabrique la fonction de persistance branchée sur le logger : elle délègue
 * à `ecrire` (injectable pour les tests) et avale toute erreur — une panne de
 * journalisation ne casse jamais l'appelant, et l'appelant n'attend pas.
 */
export function creerPersistanceJournal(
  ecrire: (
    niveau: NiveauJournal,
    message: string,
    contexte: Record<string, unknown>,
  ) => Promise<void> = ecrireJournal,
): (niveau: NiveauJournal, message: string, contexte: Record<string, unknown>) => void {
  return (niveau, message, contexte) => {
    void ecrire(niveau, message, contexte).catch(() => {
      // Silencieux : stdout reste la source brute.
    });
  };
}

/**
 * Branche la persistance sur le logger : appelé par `hooks.server.ts` au
 * démarrage, avant les planificateurs (leurs lignes de démarrage doivent
 * être persistées). Idempotent : un second appel remplace le précédent.
 * `actif` est paramétrable pour les tests ; par défaut la variable
 * `JOURNAUX_PERSISTANCE_ENABLED`.
 */
export function brancherPersistanceJournaux(
  actif: boolean = env.JOURNAUX_PERSISTANCE_ENABLED,
): void {
  configurerPersistanceJournal(actif ? creerPersistanceJournal() : null);
}

export interface EntreeJournalApplicatif {
  id: string;
  niveau: string;
  message: string;
  contexte: Record<string, unknown>;
  requestId: string | null;
  createdAt: Date;
}

/** Filtres de lecture (page /supervision/journaux). */
export interface FiltresJournaux {
  niveau?: "info" | "error";
  recherche?: string;
  limite?: number;
}

/**
 * Dernières lignes persistées, du plus récent au plus ancien. Lecture via la
 * connexion applicative : la table est plateforme (pas de RLS), le filtre est
 * posé par la page (super-admin uniquement).
 */
export async function listerJournaux(
  filtres: FiltresJournaux = {},
): Promise<EntreeJournalApplicatif[]> {
  const conditions: SQL[] = [];
  if (filtres.niveau) {
    conditions.push(eq(journauxApplicatifs.niveau, filtres.niveau));
  }
  const recherche = filtres.recherche?.trim();
  if (recherche) {
    conditions.push(
      ilike(
        journauxApplicatifs.message,
        `%${recherche.replace(/[%_\\]/g, "\\$&")}%`,
      ),
    );
  }
  return db
    .select({
      id: journauxApplicatifs.id,
      niveau: journauxApplicatifs.niveau,
      message: journauxApplicatifs.message,
      contexte: journauxApplicatifs.contexte,
      requestId: journauxApplicatifs.requestId,
      createdAt: journauxApplicatifs.createdAt,
    })
    .from(journauxApplicatifs)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(journauxApplicatifs.createdAt))
    .limit(Math.max(1, Math.min(filtres.limite ?? 200, 500)));
}
