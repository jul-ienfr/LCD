/**
 * Domaine disjoncteur fournisseur (spec 006, FR-023) : compteur d'échecs
 * consécutifs par affectation et décision d'ouverture. Pur : aucun accès
 * base, réseau ou horloge implicite — le seuil et l'effet sont injectés.
 */

export const SEUIL_DISJONCTEUR_DEFAUT = 5;

/**
 * Effet d'une synchronisation sur le compteur :
 * - « echec » : défaillance transitoire côté fournisseur (erreur franche,
 *   lecture des réservations impossible) → incrémente ;
 * - « succes » : la synchronisation a abouti → réinitialise ;
 * - « neutre » : problème de configuration ou de donnée locale (mapping
 *   manquant, capacité non supportée, conflit d'import) — rejouer ne le
 *   résoudrait pas, donc ni incrément ni remise à zéro.
 */
export type EffetDisjoncteur = "echec" | "succes" | "neutre";

export function effetDisjoncteur(
  statut: string,
  options: { lectureEnEchec?: boolean } = {},
): EffetDisjoncteur {
  if (statut === "erreur") return "echec";
  if (statut === "partiel" && options.lectureEnEchec === true) return "echec";
  if (
    statut === "ok" ||
    statut === "inchange" ||
    statut === "lecture_seule"
  ) {
    return "succes";
  }
  return "neutre";
}

export interface DecisionDisjoncteur {
  echecsConsecutifs: number;
  /** Le seuil est atteint : l'affectation doit être mise en pause. */
  ouvrir: boolean;
  /** Le compteur repasse à zéro après un succès (une ligne à écrire). */
  reinitialise: boolean;
}

export function deciderDisjoncteur(input: {
  echecsConsecutifs: number;
  effet: EffetDisjoncteur;
  seuil: number;
}): DecisionDisjoncteur {
  if (input.effet === "neutre") {
    return {
      echecsConsecutifs: Math.max(0, input.echecsConsecutifs),
      ouvrir: false,
      reinitialise: false,
    };
  }
  if (input.effet === "succes") {
    return {
      echecsConsecutifs: 0,
      ouvrir: false,
      reinitialise: input.echecsConsecutifs > 0,
    };
  }
  const seuil = Math.max(1, Math.floor(input.seuil));
  const echecs = Math.max(0, input.echecsConsecutifs) + 1;
  return {
    echecsConsecutifs: echecs,
    ouvrir: echecs >= seuil,
    reinitialise: false,
  };
}

/** Clé stable de l'alerte d'une affectation (une seule alerte ouverte). */
export function cleAlerteDisjoncteur(
  tenantId: string,
  logementId: string,
): string {
  return `fournisseur:${tenantId}:${logementId}`;
}

export function messageAlerteDisjoncteur(input: {
  logementNom: string | null;
  fournisseurCode: string;
  echecsConsecutifs: number;
  derniereErreur: string | null;
}): string {
  const logement = input.logementNom
    ? ` du logement « ${input.logementNom} »`
    : "";
  const erreur = input.derniereErreur
    ? ` Dernière erreur : ${input.derniereErreur}`
    : "";
  return (
    `Intégration ${input.fournisseurCode}${logement} mise en pause ` +
    `automatiquement après ${input.echecsConsecutifs} échecs consécutifs. ` +
    `Reprise manuelle depuis /supervision/fournisseurs.${erreur}`
  );
}
