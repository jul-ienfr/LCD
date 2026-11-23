import { and, eq } from "drizzle-orm";
import type { JobOptions, Queue } from "@/application/ports/queue";
import { TENTATIVES_MAX_DEFAUT } from "@/domain/jobs-outbox";
import { db } from "@/infrastructure/db/client";
import { jobsOutbox } from "@/infrastructure/db/schema";

/**
 * File de jobs persistante (spec 006, FR-025). Écrit dans `jobs_outbox` avant
 * exécution : un redémarrage ne perd pas les actions acceptées.
 *
 * `enqueue` est idempotent sur `cleIdempotence` : un rejeu (debounce fournisseur,
 * webhook) met la même ligne à jour au lieu d'en créer une seconde.
 */
export class QueueOutbox implements Queue {
  async enqueue<T extends Record<string, unknown>>(
    nom: string,
    payload: T,
    options?: JobOptions,
  ): Promise<string> {
    const maintenant = new Date();
    const disponibleA = options?.runAt ?? maintenant;
    const tentativesMax = options?.maxAttempts ?? TENTATIVES_MAX_DEFAUT;
    const cle = options?.idempotencyKey ?? null;
    const valeurs = {
      nom,
      payload: payload as Record<string, unknown>,
      statut: "en_attente" as const,
      tentatives: 0,
      tentativesMax,
      disponibleA,
    };

    if (cle) {
      // Upsert par clé : on réarme la ligne, même si elle était réussie, pour
      // qu'une nouvelle action relance le traitement.
      const [ligne] = await db
        .insert(jobsOutbox)
        .values({ ...valeurs, cleIdempotence: cle })
        .onConflictDoUpdate({
          target: jobsOutbox.cleIdempotence,
          set: {
            ...valeurs,
            verrouilleJusqua: null,
            derniereErreur: null,
            termineLe: null,
            updatedAt: maintenant,
          },
        })
        .returning({ id: jobsOutbox.id });
      if (!ligne) throw new Error("Insertion du job sans identifiant retourné.");
      return ligne.id;
    }

    const [ligne] = await db
      .insert(jobsOutbox)
      .values(valeurs)
      .returning({ id: jobsOutbox.id });
    if (!ligne) throw new Error("Insertion du job sans identifiant retourné.");
    return ligne.id;
  }

  /** Compte les jobs en attente (vide pour l'instant via le worker). */
  async compterEnAttente(nom?: string): Promise<number> {
    const conditions = [eq(jobsOutbox.statut, "en_attente")];
    if (nom) conditions.push(eq(jobsOutbox.nom, nom));
    const rows = await db
      .select({ id: jobsOutbox.id })
      .from(jobsOutbox)
      .where(and(...conditions));
    return rows.length;
  }
}
