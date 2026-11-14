/**
 * Port de mesure first-party anonyme (T095).
 *
 * Contrat : `specs/004-ergonomie-experience-client/contracts/mesure.md`.
 *
 * Ce module ne parle ni HTTP ni SvelteKit : il normalise, filtre et stocke des
 * événements d'ergonomie **anonymes**, et purge les événements bruts au-delà
 * de la rétention de 90 jours. Il s'appuie sur l'infrastructure existante.
 *
 * ## Table réutilisée — aucune migration nécessaire
 *
 * La table `suivi_evenements` (T720, `src/infrastructure/db/schema.ts`) porte
 * déjà toutes les colonnes utiles : `tenant_id`, `visiteur_id`, `session_id`,
 * `type`, `nom`, `page`, `referrer`, `campagne`, `metadata` (JSONB de
 * `string | number | boolean`), `consentement`, `ip_hash`, `user_agent`,
 * `cree_le`. Les événements d'ergonomie y sont écrits avec :
 *
 * - `type` = projection du nom d'ergonomie (`typeSuiviPour`) ;
 * - `nom` = nom d'ergonomie (`etape_vue`, `parcours_reussi`…) ;
 * - `page` = route normalisée sans token ;
 * - `metadata` = propriétés de la liste blanche uniquement.
 *
 * Une migration n'est donc **pas** requise. Si l'on voulait un jour une table
 * dédiée `mesure_evenements` (partitionnement par date, rétention par
 * `pg_cron`), la migration devrait être une migration d'expansion :
 *
 * ```sql
 * -- drizzle/00XX_mesure_evenements.sql  (expand, jamais de modification des
 * -- migrations déjà appliquées : `drizzle/` est immuable)
 * CREATE TABLE mesure_evenements (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
 *   visiteur_id text NOT NULL,
 *   session_id text NOT NULL,
 *   nom text NOT NULL,
 *   parcours_id text NOT NULL,
 *   surface text NOT NULL,
 *   route text NOT NULL,
 *   etape text,
 *   resultat text,
 *   duree_ms integer,
 *   role_mesure text,
 *   version text NOT NULL,
 *   metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
 *   consentement jsonb NOT NULL,
 *   cree_le timestamptz NOT NULL DEFAULT now()
 * );
 * ALTER TABLE mesure_evenements ENABLE ROW LEVEL SECURITY;
 * -- + politique withTenant(), index (tenant_id, cree_le).
 * ```
 *
 * Avant toute bascule, la double écriture puis la suppression de la lecture
 * `suivi_evenements` doivent être testées (`npm run db:test-migrations`).
 */
import { and, eq, inArray, lt } from "drizzle-orm";
import { ErreurMetier } from "@/domain/erreurs";
import type { Consentement, TypeEvenementSuivi } from "@/domain/suivi";
import { normaliserEvenementSuivi } from "@/domain/suivi";
import { withTenant } from "@/infrastructure/db/client";
import { suiviEvenements } from "@/infrastructure/db/schema";
import {
  NOMS_EVENEMENT_ERGONOMIE,
  type EvenementErgonomie,
  type NomEvenementErgonomie,
  typeSuiviPour,
} from "@/lib/mesure/evenements";

/** Rétention des événements bruts, en jours (contrat de mesure). */
export const RETENTION_JOURS = 90;
export const RETENTION_MS = RETENTION_JOURS * 24 * 60 * 60 * 1000;

/**
 * Propriétés acceptées dans `metadata`. Toute autre propriété est **refusée**
 * (pas de perte silencieuse) : la liste blanche est la première barrière
 * contre une fuite de donnée personnelle.
 */
export const PROPRIETES_AUTORISEES = [
  "evenement",
  "surface",
  "parcoursId",
  "etape",
  "resultat",
  "dureeMs",
  "role",
  "version",
  "rechercheSansResultat",
  "nombreResultats",
  "modeLite",
  "sansJs",
] as const;

export type ProprieteAutorisee = (typeof PROPRIETES_AUTORISEES)[number];

export type ProprietesMesure = Partial<
  Record<ProprieteAutorisee, string | number | boolean>
>;

/** Longueur maximale d'une valeur textuelle de `metadata`. */
export const LONGUEUR_VALEUR_MAX = 120;

export type MotifPii =
  | "email"
  | "telephone"
  | "nom_propre"
  | "adresse_ip"
  | "token";

export class ErreurMesure extends ErreurMetier {
  readonly champ: string | null;

  constructor(code: string, message: string, champ: string | null = null) {
    super("SUIVI_INVALIDE", `${message}${code ? ` [${code}]` : ""}`);
    this.name = "ErreurMesure";
    this.champ = champ;
  }
}

// --- Détection de données personnelles -------------------------------------

const MOTIF_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/i;
const MOTIF_TELEPHONE = /(?:\+\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?){2,5}\d{2,4}/;
const MOTIF_NOM_PROPRE = /^\p{Lu}[\p{Ll}'’-]{1,29}(?:\s+\p{Lu}[\p{Ll}'’-]{1,29}){1,2}$/u;
const MOTIF_IPV4 = /\b\d{1,3}(?:\.\d{1,3}){3}\b/;
const MOTIF_IPV6 = /\b(?:[0-9a-f]{1,4}:){2,7}[0-9a-f]{1,4}\b/i;
const MOTIF_TOKEN =
  /(?:\beyJ[\w-]{10,}|[0-9a-f]{32,}|\b[\w-]{24,}\.[\w-]{6,}\.[\w-]{6,}\b)/;

const LONGUEUR_NUMERIQUE_SIGNIFICATIVE = 10;

function chiffres(valeur: string): string {
  return valeur.replace(/\D/g, "");
}

function nomPropreDetecte(valeur: string): boolean {
  const nombres = valeur.match(/\d/g)?.length ?? 0;
  // Une valeur majoritairement numérique n'est pas un nom propre : c'est un
  // identifiant, un compteur ou une date.
  if (nombres > 0 && nombres >= valeur.replace(/\s/g, "").length / 2) {
    return false;
  }
  return MOTIF_NOM_PROPRE.test(valeur.trim());
}

/** Détecte une donnée personnelle dans une valeur de mesure. */
export function motifPii(valeur: unknown): MotifPii | null {
  if (typeof valeur !== "string") return null;
  const texte = valeur.trim();
  if (!texte) return null;

  if (MOTIF_EMAIL.test(texte)) return "email";
  if (MOTIF_IPV4.test(texte) || MOTIF_IPV6.test(texte)) return "adresse_ip";
  if (MOTIF_TOKEN.test(texte)) return "token";

  // Un numéro de téléphone se juge sur ses chiffres : on ignore les
  // horodatages et les identifiants pour limiter les faux positifs.
  const sansContact = texte.replace(
    /\d{4}-\d{2}-\d{2}T[\d:.]+Z?|\b\d{10,}\b|\d+\.\d+/g,
    " ",
  );
  if (MOTIF_TELEPHONE.test(sansContact)) {
    const nombreDeChiffres = chiffres(sansContact).length;
    if (nombreDeChiffres >= 8) return "telephone";
  }

  if (nomPropreDetecte(texte)) return "nom_propre";
  return null;
}

/** Vrai si la valeur transporte une donnée personnelle. */
export function contientPii(valeur: unknown): boolean {
  return motifPii(valeur) !== null;
}

// --- Liste blanche de propriétés -------------------------------------------

/**
 * Filtre les propriétés d'un événement.
 *
 * @throws ErreurMesure si la propriété n'est pas dans la liste blanche, si sa
 * valeur est trop longue ou si elle ressemble à une donnée personnelle.
 */
export function filtrerProprietes(
  entrees: Record<string, unknown> | null | undefined,
): ProprietesMesure {
  if (!entrees) return {};
  const propres: ProprietesMesure = {};
  for (const [cle, valeur] of Object.entries(entrees)) {
    if (!(PROPRIETES_AUTORISEES as readonly string[]).includes(cle)) {
      throw new ErreurMesure(
        "PROPRIETE_INCONNUE",
        `Propriété de mesure non autorisée : « ${cle} ». Ajoutez-la à PROPRIETES_AUTORISEES après revue (contrat de mesure : aucune donnée personnelle).`,
        cle,
      );
    }
    if (
      typeof valeur !== "string" &&
      typeof valeur !== "number" &&
      typeof valeur !== "boolean"
    ) {
      throw new ErreurMesure(
        "VALEUR_INVALIDE",
        `La propriété « ${cle} » doit être un texte, un nombre ou un booléen.`,
        cle,
      );
    }
    if (typeof valeur === "string") {
      if (valeur.length > LONGUEUR_VALEUR_MAX) {
        throw new ErreurMesure(
          "VALEUR_TROP_LONGUE",
          `La propriété « ${cle} » dépasse ${LONGUEUR_VALEUR_MAX} caractères : la mesure ne stocke que des valeurs courtes et anonymes.`,
          cle,
        );
      }
      const pii = motifPii(valeur);
      if (pii) {
        throw new ErreurMesure(
          "PII_REFUSEE",
          `La propriété « ${cle} » ressemble à une donnée personnelle (${pii}) : la mesure est anonyme, l'événement est refusé.`,
          cle,
        );
      }
    }
    if (
      typeof valeur === "number" &&
      (!Number.isFinite(valeur) || Math.abs(valeur) > 1e12)
    ) {
      throw new ErreurMesure(
        "VALEUR_INVALIDE",
        `La propriété « ${cle} » doit être un nombre fini et borné.`,
        cle,
      );
    }
    propres[cle as ProprieteAutorisee] = valeur;
  }
  return propres;
}

// --- Entrée d'enregistrement ------------------------------------------------

export interface EntreeMesure {
  tenantId: string;
  visiteurId: string;
  sessionId: string;
  evenement: EvenementErgonomie;
  consentement: Consentement;
  /** Jamais l'IP brute : uniquement un hachage salé, ou `null`. */
  ipHash?: string | null;
  userAgent?: string | null;
  proprietes?: Record<string, unknown>;
}

export interface MesureStockee {
  id: string;
  tenantId: string;
  visiteurId: string;
  sessionId: string;
  nom: NomEvenementErgonomie;
  type: string;
  page: string;
  metadata: ProprietesMesure;
  creeLe: string;
}

export interface DepotMesure {
  enregistrerEvenement(entree: {
    tenantId: string;
    visiteurId: string;
    sessionId: string;
    type: string;
    nom: string;
    page: string;
    metadata: Record<string, string | number | boolean>;
    consentement: Consentement;
    ipHash: string | null;
    userAgent: string | null;
  }): Promise<{
    id: string;
    creeLe?: string | Date;
    [cle: string]: unknown;
  }>;
  purgerAvant?(tenantId: string, avant: string): Promise<number>;
}

/**
 * Construit l'entrée normalisée destinée au dépôt (partie pure, testable sans
 * base de données).
 *
 * @throws ErreurMesure si des propriétés interdites ou personnelles sont
 * fournies.
 */
export function normaliserMesure(entree: EntreeMesure): {
  tenantId: string;
  visiteurId: string;
  sessionId: string;
  type: string;
  nom: NomEvenementErgonomie;
  page: string;
  metadata: Record<string, string | number | boolean>;
  consentement: Consentement;
  ipHash: string | null;
  userAgent: string | null;
} {
  if (!entree.tenantId || typeof entree.tenantId !== "string") {
    throw new ErreurMesure(
      "TENANT_REQUIS",
      "Le tenant de mesure vient de la session, jamais du client.",
      "tenantId",
    );
  }
  const evenement = entree.evenement;
  if (!evenement?.nom || !evenement?.route) {
    throw new ErreurMesure(
      "EVENEMENT_INVALIDE",
      "Événement de mesure incomplet (nom et route obligatoires).",
    );
  }

  const proprietes = filtrerProprietes(entree.proprietes);
  const metadata: Record<string, string | number | boolean> = {
    evenement: evenement.nom,
    surface: evenement.surface,
    parcoursId: evenement.parcoursId,
    version: evenement.version,
    ...(evenement.etape ? { etape: evenement.etape } : {}),
    ...(evenement.resultat ? { resultat: evenement.resultat } : {}),
    ...(evenement.dureeMs !== undefined ? { dureeMs: evenement.dureeMs } : {}),
    ...(evenement.role ? { role: evenement.role } : {}),
    ...proprietes,
  };

  // Deuxième barrière : même les champs structurés sont audités.
  const suspects = Object.entries(metadata).filter(([, valeur]) =>
    contientPii(valeur),
  );
  if (suspects.length > 0) {
    throw new ErreurMesure(
      "PII_REFUSEE",
      `Événement refusé : donnée personnelle détectée dans ${suspects
        .map(([cle]) => `« ${cle} »`)
        .join(", ")}.`,
      suspects[0]?.[0] ?? null,
    );
  }

  return {
    tenantId: entree.tenantId,
    visiteurId: entree.visiteurId,
    sessionId: entree.sessionId,
    type: typeSuiviPour(evenement.nom),
    nom: evenement.nom,
    page: evenement.route,
    metadata,
    consentement: entree.consentement,
    ipHash: entree.ipHash ?? null,
    userAgent: entree.userAgent ?? null,
  };
}

/**
 * Enregistre un événement d'ergonomie anonyme.
 *
 * La normalisation `normaliserEvenementSuivi` du domaine reste la référence :
 * elle masque toute PII résiduelle avant stockage.
 */
export async function enregistrerMesure(
  entree: EntreeMesure,
  depot: DepotMesure,
): Promise<MesureStockee> {
  const normalise = normaliserMesure(entree);
  const evenementSuivi = normaliserEvenementSuivi({
    type: normalise.type as TypeEvenementSuivi,
    nom: normalise.nom,
    page: normalise.page,
    referrer: null,
    campagne: {},
    valeurCentimes: null,
    metadata: normalise.metadata,
  });

  const stocke = await depot.enregistrerEvenement({
    tenantId: normalise.tenantId,
    visiteurId: normalise.visiteurId,
    sessionId: normalise.sessionId,
    type: evenementSuivi.type,
    nom: evenementSuivi.nom,
    page: evenementSuivi.page,
    metadata: evenementSuivi.metadata,
    consentement: normalise.consentement,
    ipHash: normalise.ipHash,
    userAgent: normalise.userAgent,
  });

  return {
    id: String(stocke.id),
    tenantId: normalise.tenantId,
    visiteurId: normalise.visiteurId,
    sessionId: normalise.sessionId,
    nom: normalise.nom,
    type: evenementSuivi.type,
    page: evenementSuivi.page,
    metadata: evenementSuivi.metadata as ProprietesMesure,
    creeLe: new Date(
      (stocke.creeLe as string | Date | undefined) ?? Date.now(),
    ).toISOString(),
  };
}

// --- Rétention --------------------------------------------------------------

/** Date limite de rétention : maintenant − 90 jours. */
export function dateLimiteRetention(maintenant: Date = new Date()): Date {
  return new Date(maintenant.getTime() - RETENTION_MS);
}

/** Vrai si un événement brut doit être conservé. */
export function dansRetention(
  creeLe: Date | string,
  maintenant: Date = new Date(),
): boolean {
  const date = creeLe instanceof Date ? creeLe : new Date(creeLe);
  if (Number.isNaN(date.getTime())) return false;
  return date.getTime() >= dateLimiteRetention(maintenant).getTime();
}

/**
 * Purge les événements bruts d'ergonomie de plus de 90 jours pour un tenant.
 * Les agrégats (comptes, médianes) sont conservés hors de cette table.
 *
 * La purge est **ciblée** : seuls les événements dont le nom appartient au
 * contrat de mesure d'ergonomie sont supprimés. Le journal de suivi général
 * (`page_vue`, `conversion`...) garde sa rétention de 13 mois, portée par
 * `scripts/purger-suivi.ts`.
 */
export async function purgerMesures(
  tenantId: string,
  maintenant: Date = new Date(),
): Promise<number> {
  if (!tenantId) {
    throw new ErreurMesure(
      "TENANT_REQUIS",
      "Purge refusée sans tenant : la mesure est toujours cloisonnée.",
      "tenantId",
    );
  }
  const limite = dateLimiteRetention(maintenant);
  return withTenant(tenantId, async (tx) => {
    const supprimes = await tx
      .delete(suiviEvenements)
      .where(
        and(
          eq(suiviEvenements.tenantId, tenantId),
          lt(suiviEvenements.creeLe, limite),
          inArray(suiviEvenements.nom, [...NOMS_EVENEMENT_ERGONOMIE]),
        ),
      )
      .returning({ id: suiviEvenements.id });
    return supprimes.length;
  });
}
