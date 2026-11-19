/**
 * Journal d'exécution des tâches planifiées (spec 006, FR-001/FR-002).
 *
 * `executerTache` enveloppe toute exécution : une ligne ouverte au début,
 * close au statut `ok` / `ignore` / `erreur`, compteurs libres. Le journal
 * ne doit jamais faire échouer la tâche : si l'écriture échoue, elle est
 * tracée dans les logs et la tâche continue.
 *
 * `santeDesTaches` relit le référentiel et la dernière exécution de chaque
 * tâche : toute absence au-delà de 2× la cadence produit l'état « retard »,
 * que `alertes-exploitation.ts` transforme en alerte.
 */

import { desc, eq, sql } from "drizzle-orm";
import { seuilAbsenceMinutes, type SanteTache } from "@/domain/exploitation";
import { db } from "@/infrastructure/db/client";
import { executionsTaches } from "@/infrastructure/db/schema";
import { logErreur, logInfo } from "@/lib/logger";
import {
  RETENTION_EXECUTIONS_JOURS,
  TACHES_PLANIFIEES,
  type TachePlanifiee,
} from "./registre-taches";

export type StatutExecution = "ok" | "ignore";

export interface ResultatTache<T> {
  valeur: T;
  compteurs?: Record<string, number>;
  /** `ignore` = le déclencheur a tourné mais la tâche n'avait rien à faire
   *  (module désactivé, verrou tenu ailleurs). Ni succès métier ni échec. */
  statut?: StatutExecution;
}

interface LigneDerniere {
  tache: string;
  debut: Date;
  statut: string;
}

/**
 * Exécute une tâche planifiée en tenant son journal. Le retour de `fn` peut
 * porter des compteurs et un statut `ignore` ; l'erreur est journalisée,
 * tracée dans le journal d'exécution, puis relancée — le déclencheur garde
 * sa sémantique HTTP.
 */
export async function executerTache<T>(
  nom: string,
  declencheur: string,
  fn: () => Promise<ResultatTache<T>>,
): Promise<T> {
  let ligneId: string | null = null;
  try {
    const [ligne] = await db
      .insert(executionsTaches)
      .values({ tache: nom, declencheur, statut: "en_cours" })
      .returning({ id: executionsTaches.id });
    ligneId = ligne?.id ?? null;
  } catch (erreur) {
    // Le journal ne bloque jamais la tâche : on trace et on continue.
    logErreur("exploitation.journal.ouverture", erreur, { tache: nom });
  }

  const clore = async (
    valeurs: Partial<typeof executionsTaches.$inferInsert>,
  ): Promise<void> => {
    if (!ligneId) return;
    try {
      await db
        .update(executionsTaches)
        .set(valeurs)
        .where(eq(executionsTaches.id, ligneId));
    } catch (erreur) {
      logErreur("exploitation.journal.cloture", erreur, { tache: nom });
    }
  };

  try {
    const resultat = await fn();
    await clore({
      fin: new Date(),
      statut: resultat.statut ?? "ok",
      compteurs: resultat.compteurs ?? {},
    });
    return resultat.valeur;
  } catch (erreur) {
    const message = erreur instanceof Error ? erreur.message : String(erreur);
    await clore({
      fin: new Date(),
      statut: "erreur",
      erreur: message.slice(0, 2000),
    });
    logErreur(`tache.${nom}.echec`, erreur, { declencheur });
    throw erreur;
  }
}

export interface LigneTacheSupervision {
  nom: string;
  libelle: string;
  cadenceMinutes: number;
  runbook: string;
  critique: boolean;
  derniereExecution: Date | null;
  dernierStatut: string | null;
  sante: SanteTache;
}

async function derniereExecutionParTache(): Promise<Map<string, LigneDerniere>> {
  const lignes = await db.execute<LigneDerniere & Record<string, unknown>>(sql`
    select distinct on (tache) tache, debut, statut
    from executions_taches
    order by tache, debut desc
  `);
  const map = new Map<string, LigneDerniere>();
  for (const ligne of lignes as unknown as LigneDerniere[]) {
    map.set(ligne.tache, ligne);
  }
  return map;
}

/**
 * Santé de toutes les tâches déclarées, pour /supervision et les alertes.
 * Une tâche jamais exécutée est « jamais » (avertissement), pas silencieuse.
 */
export async function santeDesTaches(
  maintenant: Date = new Date(),
): Promise<LigneTacheSupervision[]> {
  const dernieres = await derniereExecutionParTache();
  return TACHES_PLANIFIEES.map((tache) => {
    const derniere = dernieres.get(tache.nom) ?? null;
    return {
      nom: tache.nom,
      libelle: tache.libelle,
      cadenceMinutes: tache.cadenceMinutes,
      runbook: tache.runbook,
      critique: tache.critique,
      derniereExecution: derniere?.debut ?? null,
      dernierStatut: derniere?.statut ?? null,
      sante: evaluerTache(tache, derniere, maintenant),
    };
  });
}

function evaluerTache(
  tache: TachePlanifiee,
  derniere: LigneDerniere | null,
  maintenant: Date,
): SanteTache {
  const seuilMinutes = seuilAbsenceMinutes(tache.cadenceMinutes);
  if (!derniere) {
    return { etat: "jamais", ageMinutes: null, seuilMinutes };
  }
  const ageMinutes = Math.max(
    0,
    Math.floor((maintenant.getTime() - derniere.debut.getTime()) / 60_000),
  );
  if (derniere.statut === "erreur") {
    return { etat: "erreur", ageMinutes, seuilMinutes };
  }
  // « en_cours » et « ignore » comptent comme une exécution vivante : une
  // exécution en cours depuis plus de 2× la cadence est bloquée (retard).
  if (ageMinutes > seuilMinutes) {
    return { etat: "retard", ageMinutes, seuilMinutes };
  }
  return { etat: "ok", ageMinutes, seuilMinutes };
}

/** Dernières exécutions d'une tâche, du plus récent au plus ancien. */
export async function historiqueTache(
  nom: string,
  limite = 20,
): Promise<
  {
    id: string;
    declencheur: string;
    debut: Date;
    fin: Date | null;
    statut: string;
    compteurs: Record<string, number>;
    erreur: string | null;
  }[]
> {
  return db
    .select({
      id: executionsTaches.id,
      declencheur: executionsTaches.declencheur,
      debut: executionsTaches.debut,
      fin: executionsTaches.fin,
      statut: executionsTaches.statut,
      compteurs: executionsTaches.compteurs,
      erreur: executionsTaches.erreur,
    })
    .from(executionsTaches)
    .where(eq(executionsTaches.tache, nom))
    .orderBy(desc(executionsTaches.debut))
    .limit(Math.max(1, Math.min(limite, 200)));
}

/**
 * Purge le journal d'exécution au-delà de la rétention (FR-015).
 * Utilise la fonction SQL bornée posée par la migration 0105.
 */
export async function purgerJournalExecutions(
  retentionJours: number = RETENTION_EXECUTIONS_JOURS,
): Promise<number> {
  const lignes = await db.execute<{ supprimees: number }>(
    sql`select purger_executions_taches(${retentionJours}) as supprimees`,
  );
  const supprimees = Number(
    (lignes as unknown as { supprimees: number }[])[0]?.supprimees ?? 0,
  );
  if (supprimees > 0) {
    logInfo("exploitation.journal.purge", { supprimees, retentionJours });
  }
  return supprimees;
}
