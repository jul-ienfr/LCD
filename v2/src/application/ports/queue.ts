export interface JobOptions {
  /** Clé idempotente : un même job ne doit pas s'exécuter deux fois. */
  idempotencyKey?: string;
  runAt?: Date;
  maxAttempts?: number;
}

/**
 * Port de file de jobs. Implémentations : Inngest, QStash, BullMQ/Redis,
 * ou une file mémoire en test. Le métier ne connaît que `enqueue`.
 */
export interface Queue {
  enqueue<T extends Record<string, unknown>>(
    nom: string,
    payload: T,
    options?: JobOptions,
  ): Promise<string>;
}
