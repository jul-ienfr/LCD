import { capturerErreur } from "./telemetry";

type Contexte = Record<string, unknown>;

function serialiserErreur(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return { nom: error.name, message: error.message, stack: error.stack };
  }
  return { valeur: String(error) };
}

function ecrire(
  niveau: "info" | "error",
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
