/**
 * T606 — Port des serrures connectées (création / révocation de codes d'accès).
 *
 * L'adapter Nuki vit dans `infrastructure/adapters/serrures/nuki.ts`.
 *
 * Le domaine `acces-serrure.ts` décide du fournisseur (`nuki` ou `manuel`)
 * sans jamais appeler ce port : c'est l'appelant (use case T607) qui orchestre,
 * bascule en repli manuel si `estDisponible()` est faux ou si une méthode lève,
 * persiste l'accès via `AccesSerrureRepository` et audite l'opération.
 *
 * Toute défaillance du fournisseur se traduit par une `ErreurMetier` propre :
 * une panne de partenaire ne doit jamais bloquer l'arrivée d'un voyageur.
 */

export interface SerrureConnecteePort {
  /** Nom affiché du fournisseur (ex. « Nuki »). */
  readonly nom: string;

  /**
   * Vrai si le fournisseur est configuré et utilisable (token présent).
   * Ne lève jamais : une indisponibilité se traduit par un repli manuel.
   */
  estDisponible(): boolean;

  /**
   * Crée un code d'accès sur la serrure pour une fenêtre de validité.
   * Lève une `ErreurMetier` propre en cas d'échec (configuration absente,
   * code invalide, serrure injoignable) : l'appelant bascule alors en repli
   * manuel. Retourne l'identifiant du code chez le fournisseur.
   */
  creerCode(input: {
    /** Identifiant de la serrure chez le fournisseur. */
    serrureId: string;
    /** Code à programmer (6 chiffres pour Nuki). */
    code: string;
    /** Libellé du code chez le fournisseur (ex. référence réservation). */
    nom: string;
    /** Début de validité (ISO 8601). */
    valideDe: string;
    /** Fin de validité (ISO 8601). */
    valideA: string;
  }): Promise<{ externalId: string }>;

  /**
   * Révoque un code. Idempotent : un code déjà supprimé chez le fournisseur
   * (404) ne lève pas. Toute autre erreur lève une `ErreurMetier`.
   */
  revoquerCode(input: {
    /** Identifiant de la serrure chez le fournisseur. */
    serrureId: string;
    /** Identifiant du code chez le fournisseur. */
    externalId: string;
  }): Promise<void>;
}
