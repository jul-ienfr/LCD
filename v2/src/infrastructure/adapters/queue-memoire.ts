import type { JobOptions, Queue } from "@/application/ports/queue";

interface JobMemoire {
  id: string;
  nom: string;
  payload: Record<string, unknown>;
  options?: JobOptions;
  executeLe: Date;
}

/**
 * File mémoire : développement et tests uniquement.
 * En production : Inngest/QStash (beta) ou BullMQ/Redis (VPS).
 */
export class QueueMemoire implements Queue {
  private readonly jobs: JobMemoire[] = [];

  async enqueue<T extends Record<string, unknown>>(
    nom: string,
    payload: T,
    options?: JobOptions,
  ): Promise<string> {
    const id = options?.idempotencyKey ?? crypto.randomUUID();
    this.jobs.push({
      id,
      nom,
      payload,
      options,
      executeLe: options?.runAt ?? new Date(),
    });
    return id;
  }

  /** Utilisé par les tests : vide la file et retourne les jobs. */
  vider(): JobMemoire[] {
    return this.jobs.splice(0, this.jobs.length);
  }
}
