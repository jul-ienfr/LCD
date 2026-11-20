import { capturerErreur } from "./telemetry";

type Contexte = Record<string, unknown>;

export type NiveauJournal = "info" | "error";

/** Persistance branchée par le serveur (FR-016) : stdout reste la source. */
export type PersistanceJournal = (
  niveau: NiveauJournal,
  message: string,
  contexte: Record<string, unknown>,
) => void;

let persistance: PersistanceJournal | null = null;

/**
 * Branche la persistance des lignes de journal (table `journaux_applicatifs`,
 * FR-016). Appelé par `hooks.server.ts` au démarrage : le logger lui-même
 * reste isomorphe (aucun import base de données, donc importable partout).
 * `null` débranche (tests).
 */
export function configurerPersistanceJournal(
  fn: PersistanceJournal | null,
): void {
  persistance = fn;
}

function serialiserErreur(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { nom: error.name, message: error.message, stack: error.stack };
  }
  return { valeur: String(error) };
}

function ecrire(
  niveau: NiveauJournal,
  message: string,
  contexte: Contexte = {},
): void {
  const ligne = JSON.stringify({
    ts: new Date().toISOString(),
    niveau,
    message,
    ...contexte,
  });

  if (niveau === "error") console.error(ligne);
  else console.log(ligne);

  // Persistance best-effort : une panne d'écriture ne doit jamais faire
  // échouer l'appelant, et l'appelant n'attend pas (fire-and-forget).
  if (persistance) {
    try {
      persistance(niveau, message, contexte);
    } catch {
      // Silencieux par construction : journaliser l'échec du journal serait
      // récursif ; stdout reste la trace brute.
    }
  }
}

export function logInfo(message: string, contexte?: Contexte): void {
  ecrire("info", message, contexte);
}

export function logErreur(
  message: string,
  error: unknown,
  contexte?: Contexte,
): void {
  ecrire("error", message, { ...contexte, erreur: serialiserErreur(error) });
  void capturerErreur(message, error, contexte);
}
