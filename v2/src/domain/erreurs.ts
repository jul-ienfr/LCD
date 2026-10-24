export type CodeErreurMetier =
  | "CODE_INVALIDE"
  | "NOM_INVALIDE"
  | "LOGEMENT_DEJA_EXISTANT"
  | "TENANT_INVALIDE"
  | "NON_AUTORISE";

/**
 * Erreur métier : porte un code stable, indépendant du framework HTTP.
 * L'app Next la traduit en 400/403/409 sans que le domaine connaisse HTTP.
 */
export class ErreurMetier extends Error {
  constructor(
    public readonly code: CodeErreurMetier,
    message: string,
  ) {
    super(message);
    this.name = "ErreurMetier";
  }
}
