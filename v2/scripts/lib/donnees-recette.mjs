/**
 * Données de recette — ce qui a été créé uniquement pour tester (faux comptes,
 * faux logements) et devra être supprimé **après le déploiement** : voir
 * `v2/DEPLOIEMENT.md` § 8 et la friction R-11.
 *
 * Module **pur** : aucune connexion, aucun effet de bord, aucune écriture. Il
 * porte la définition de « donnée de recette » pour que l'outil de purge et ses
 * tests partagent exactement la même règle.
 */

/** Logements de vitrine : ils restent, ce sont les seuls « vrais » de la démo. */
export const CODES_VITRINE = Object.freeze([
  "villa-santa-severa",
  "mas-des-oliviers",
  "loft-du-port",
]);

/** Même vitrine, reconnue par son nom si le code manque en base. */
export const NOMS_VITRINE = Object.freeze([
  "Villa Santa Severa",
  "Le Mas des Oliviers",
  "Le Loft du Port",
]);

/** Compte conservé : sans lui, la démo n'a plus d'administrateur. */
export const CONSERVER_EMAIL_DEFAUT = "super@lcd.test";

/** Domaines de messagerie qui ne peuvent être que des comptes de test. */
export const DOMAINES_RECETTE = Object.freeze([
  /@lcd\.test$/i,
  /@example\.(test|com|org)$/i,
  /@test$/i,
  /@localhost$/i,
]);

/** Noms de base sur lesquels une purge est légitime sans forçage explicite. */
const BASES_RECETTE = /demo|test|recette|dev|staging|preprod|local/i;

/**
 * Ce logement a-t-il été créé pour tester ?
 * Un logement de vitrine (par code, ou par nom si le code manque) n'est jamais
 * une donnée de recette.
 */
export function estLogementDeRecette(logement) {
  const code = String(logement?.code ?? "").trim().toLowerCase();
  if (code && CODES_VITRINE.includes(code)) return false;
  const nom = String(logement?.nom ?? "").trim();
  if (NOMS_VITRINE.includes(nom)) return false;
  return true;
}

/** Ce compte a-t-il été créé pour tester ? (le compte conservé ne l'est pas) */
export function estCompteDeRecette(email, conserver = CONSERVER_EMAIL_DEFAUT) {
  const adresse = String(email ?? "").trim();
  if (!adresse) return false;
  if (adresse.toLowerCase() === String(conserver).trim().toLowerCase()) return false;
  return DOMAINES_RECETTE.some((domaine) => domaine.test(adresse));
}

/** Le nom de base autorise-t-il une purge sans forçage ? */
export function nomBaseRessembleARecette(nomBase) {
  return BASES_RECETTE.test(String(nomBase ?? ""));
}

/**
 * Ordre de suppression : chaque étape doit passer avant celles qui la
 * référencent en RESTRICT/NO ACTION (mesuré sur le schéma : `factures` et
 * `reservations` bloquent la suppression d'un logement ; `dispatches` et
 * `missions` bloquent celle d'un compte).
 */
export const ETAPES = Object.freeze([
  {
    id: "paiements",
    table: "paiements",
    description: "paiements des recettes (rattachés aux factures supprimées)",
  },
  {
    id: "factures",
    table: "factures",
    description: "factures des recettes (RESTRICT vers logements)",
  },
  {
    id: "reservations",
    table: "reservations",
    description: "réservations des recettes (RESTRICT vers logements)",
  },
  {
    id: "dispatches",
    table: "dispatches",
    description: "dispatchs visant un compte de test (RESTRICT vers users)",
  },
  {
    id: "missions",
    table: "missions",
    description:
      "missions visant un compte ou un logement de test (RESTRICT vers users)",
  },
  {
    id: "comptes",
    table: "users",
    description: "faux comptes (domaines de test), sauf le compte conservé",
  },
  {
    id: "logements",
    table: "logements",
    description: "faux logements, sauf les trois logements de vitrine",
  },
]);

/** Identifiants d'étapes, dans l'ordre : pratique pour vérifier la cohérence. */
export function ordreEtapes() {
  return ETAPES.map((etape) => etape.id);
}