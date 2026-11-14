/**
 * Règles de correspondance V1 → V2 (spec 005, US3).
 *
 * Ce module est volontairement pur : aucune lecture de fichier, aucune
 * connexion base. Les tests vérifient les décisions sans toucher aux sources
 * ni à PostgreSQL.
 *
 * Principes (PLAN-MIGRATION-V1-V2 §2) :
 *   - aucun secret, aucun mot de passe, aucune donnée de démonstration ;
 *   - aucune valeur inventée : un champ absent reste absent ;
 *   - chaque enregistrement source reçoit une décision explicite.
 */
import { createHash } from "node:crypto";

export type StatutJournal =
  | "importe"
  | "mis_a_jour"
  | "inchange"
  | "exclu"
  | "erreur"
  | "a_importer";

export interface EntiteSource {
  cle: string;
  libelle: string;
  nature: string;
  regime: string;
  tva: string;
  siren: string;
  statut: string;
}

export interface LogementSource {
  cle: string;
  nom: string;
  commune: string;
  surfaceM2: number | null;
  capacite: number | null;
  prixBase: number | null;
  prixMin: number | null;
  prixMax: number | null;
  modeGestion: string;
  coproVerifiee: boolean;
  annonceStatut: string | null;
}

export interface AnnonceSource {
  cle: string;
  titre: string;
  statut: string;
  nombreDescriptions: number;
  nombrePhotos: number;
}

export interface MandatSource {
  cle: string;
  entiteId: string;
  mode: string;
  commissionPct: number;
  statut: string;
}

export interface PersonneSource {
  id: string;
  role: string;
  sousRole: string;
  logements: string[];
  expireLe: string | null;
  mfa: boolean;
}

export interface ProspectSource {
  cle: string;
  nom: string;
  email: string | null;
  telephone: string | null;
}

export interface SourcesV1 {
  entites: EntiteSource[];
  logements: LogementSource[];
  annonces: AnnonceSource[];
  mandats: MandatSource[];
  personnes: PersonneSource[];
  prospects: ProspectSource[];
  voyageurs: Array<{ hash: string; optInLe: string | null }>;
  design: string | null;
}

export interface TenantCible {
  cleSource: string;
  empreinte: string;
  slug: string;
  nom: string;
  nature: string;
  regime: string;
  tva: string;
  siren: string | null;
}

export interface LogementCible {
  cleSource: string;
  empreinte: string;
  code: string;
  nom: string;
  adresse: string | null;
  strategiePrix: string;
  publication: string;
  coproVerifiee: boolean;
}

export interface DecisionExclusion {
  source: string;
  cleSource: string;
  cible: string;
  idCible: string;
  empreinte: string;
  motif: string;
}

export interface ConstatFinancier {
  logement: string;
  prixBase: number | null;
  prixMin: number | null;
  prixMax: number | null;
  commissionPct: number | null;
}

export interface PlanImport {
  tenant: TenantCible | null;
  logements: LogementCible[];
  exclusions: DecisionExclusion[];
  constatsFinanciers: ConstatFinancier[];
  anomalies: string[];
}

export interface OptionsPlan {
  slugTenant: string;
}

/** JSON stable : clés triées, pour une empreinte identique entre deux runs. */
export function jsonStable(valeur: unknown): string {
  if (valeur === null || typeof valeur !== "object") return JSON.stringify(valeur);
  if (Array.isArray(valeur)) return `[${valeur.map(jsonStable).join(",")}]`;
  const entrees = Object.keys(valeur as Record<string, unknown>)
    .sort()
    .map(
      (cle) =>
        `${JSON.stringify(cle)}:${jsonStable((valeur as Record<string, unknown>)[cle])}`,
    );
  return `{${entrees.join(",")}}`;
}

export function empreinte(valeur: unknown): string {
  return createHash("sha256").update(jsonStable(valeur)).digest("hex");
}

/** Un logement reste un gabarit tant que son identité n'est pas renseignée. */
export function estGabarit(logement: LogementSource): boolean {
  const texte = `${logement.nom} ${logement.commune}`.toLowerCase();
  return texte.includes("à définir") || texte.includes("a definir");
}

/** Valeurs autorisées par `logements.strategie_prix` côté V2. */
const STRATEGIES = new Set(["equilibre", "remplissage_max", "prix_haut"]);

export function strategiePrix(valeur: string): string {
  return STRATEGIES.has(valeur) ? valeur : "equilibre";
}

/**
 * Construit le plan complet. Aucune décision n'est implicite : un
 * enregistrement non importé apparaît dans `exclusions` avec son motif.
 */
export function construirePlan(
  sources: SourcesV1,
  options: OptionsPlan,
): PlanImport {
  const anomalies: string[] = [];
  const exclusions: DecisionExclusion[] = [];
  const logements: LogementCible[] = [];
  const constatsFinanciers: ConstatFinancier[] = [];

  const entiteActive =
    sources.entites.find((e) => e.statut === "active") ?? sources.entites[0];
  if (!entiteActive) anomalies.push("Aucune entité juridique dans entites.yaml");

  for (const entite of sources.entites) {
    if (entiteActive && entite.cle !== entiteActive.cle) {
      exclusions.push({
        source: "entites.yaml",
        cleSource: entite.cle,
        cible: "tenants",
        idCible: "-",
        empreinte: empreinte(entite),
        motif: `Entité « ${entite.libelle} » non retenue : une seule entité émettrice en V2 pour cette migration.`,
      });
    }
  }

  const tenant: TenantCible | null = entiteActive
    ? {
        cleSource: entiteActive.cle,
        empreinte: empreinte(entiteActive),
        slug: options.slugTenant,
        nom: entiteActive.libelle,
        nature: entiteActive.nature,
        regime: entiteActive.regime,
        tva: entiteActive.tva,
        siren: entiteActive.siren.trim() === "" ? null : entiteActive.siren,
      }
    : null;

  const mandatsParLogement = new Map(
    sources.mandats.map((m) => [m.cle, m] as const),
  );

  for (const logement of sources.logements) {
    const mandat = mandatsParLogement.get(logement.cle) ?? null;

    if (estGabarit(logement)) {
      exclusions.push({
        source: "logements.yaml",
        cleSource: logement.cle,
        cible: "logements",
        idCible: "-",
        empreinte: empreinte(logement),
        motif:
          "Gabarit non publié (nom ou commune « à définir ») : rien à reprendre, le logement sera créé dans V2 à l'onboarding réel.",
      });
      continue;
    }

    logements.push({
      cleSource: logement.cle,
      empreinte: empreinte(logement),
      code: logement.cle,
      nom: logement.nom,
      adresse: logement.commune.trim() === "" ? null : logement.commune,
      strategiePrix: strategiePrix(logement.modeGestion),
      // La V1 n'a aucune annonce publiée : la V2 démarre en brouillon, la
      // publication reste un geste humain (copro non vérifiée).
      publication: "brouillon",
      coproVerifiee: logement.coproVerifiee,
    });

    constatsFinanciers.push({
      logement: logement.cle,
      prixBase: logement.prixBase,
      prixMin: logement.prixMin,
      prixMax: logement.prixMax,
      commissionPct: mandat?.commissionPct ?? null,
    });

    if (mandat) {
      exclusions.push({
        source: "mandats.yaml",
        cleSource: mandat.cle,
        cible: "logement_proprietaires",
        idCible: "-",
        empreinte: empreinte(mandat),
        motif:
          mandat.mode === "propre"
            ? "Mandat en mode propre : le bien appartient au tenant, aucun propriétaire tiers à créer (commission 0 %)."
            : `Mandat tiers « ${mandat.statut} » : à recréer via l'onboarding V2, la checklist signée n'est pas dans la source.`,
      });
    } else {
      anomalies.push(`Logement ${logement.cle} sans mandat dans mandats.yaml`);
    }
  }

  // Toute annonce reçoit une décision, y compris celle d'un logement gabarit :
  // une source sans statut serait une source oubliée.
  for (const annonce of sources.annonces) {
    const logement = sources.logements.find((l) => l.cle === annonce.cle) ?? null;
    const motif = !logement
      ? "Annonce orpheline : aucun logement correspondant dans logements.yaml."
      : estGabarit(logement)
        ? `Annonce d'un logement gabarit (« ${annonce.statut} », ${annonce.nombreDescriptions} description(s)) : à rédiger avec le logement réel dans V2.`
        : `Annonce « ${annonce.statut} » avec ${annonce.nombreDescriptions} description(s) et ${annonce.nombrePhotos} photo(s) : contenu à rédiger dans V2, rien d'exploitable à copier.`;
    exclusions.push({
      source: "annonces.yaml",
      cleSource: annonce.cle,
      cible: "annonces_conformite",
      idCible: "-",
      empreinte: empreinte(annonce),
      motif,
    });
  }

  for (const mandat of sources.mandats) {
    if (!sources.logements.some((l) => l.cle === mandat.cle)) {
      anomalies.push(`Mandat ${mandat.cle} sans logement correspondant`);
    }
    if (!sources.entites.some((e) => e.cle === mandat.entiteId)) {
      anomalies.push(
        `Mandat ${mandat.cle} référence une entité absente : ${mandat.entiteId}`,
      );
    }
  }

  for (const personne of sources.personnes) {
    exclusions.push({
      source: "acces.yaml",
      cleSource: personne.id,
      cible: "users",
      idCible: "-",
      empreinte: empreinte(personne),
      motif: `Compte V1 « ${personne.role}/${personne.sousRole} » sans email réel ni mot de passe migrable : réinvitation obligatoire dans V2 (2FA à activer).`,
    });
  }

  for (const prospect of sources.prospects) {
    exclusions.push({
      source: "prospects.yaml",
      cleSource: prospect.cle,
      cible: "prospects",
      idCible: "-",
      empreinte: empreinte(prospect),
      motif:
        "Prospect sans base légale documentée dans la source : à ressaisir dans V2 si le contact professionnel est toujours valable.",
    });
  }

  for (const voyageur of sources.voyageurs) {
    exclusions.push({
      source: "memoire/voyageurs.yaml",
      cleSource: voyageur.hash,
      cible: "memoire_voyageurs",
      idCible: "-",
      empreinte: empreinte(voyageur),
      motif: "Mémoire voyageur reconstruite à zéro dans V2 (opt-in à recueillir à nouveau).",
    });
  }

  if (sources.design) {
    exclusions.push({
      source: "design.yaml",
      cleSource: sources.design,
      cible: "apparence_versions",
      idCible: "-",
      empreinte: empreinte({ design: sources.design }),
      motif: `Thème V1 « ${sources.design} » sans configuration sérialisée : la V2 repart de son thème par défaut.`,
    });
  }

  return { tenant, logements, exclusions, constatsFinanciers, anomalies };
}

/**
 * Décision d'écriture pour une correspondance déjà journalisée.
 * `empreinteCible` est l'empreinte de la ligne actuellement en base ; une
 * modification manuelle dans V2 produit une empreinte différente de celle du
 * journal et n'est jamais écrasée silencieusement.
 */
export function statutEcriture(argument: {
  journalExiste: boolean;
  empreinteJournal: string | null;
  empreinteSource: string;
}): "creer" | "inchange" | "mettre_a_jour" {
  if (!argument.journalExiste) return "creer";
  if (argument.empreinteJournal === argument.empreinteSource) return "inchange";
  return "mettre_a_jour";
}
