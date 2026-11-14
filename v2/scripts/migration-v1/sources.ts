/**
 * Lecture en lecture seule des sources V1 (spec 005, US3 — T100/T101/T104).
 *
 * Le module ne fait que lire : aucune écriture, aucun `rename`, aucun accès
 * aux secrets. Chaque fichier lu est empreinté (SHA-256) avant et après le
 * chargement ; une différence fait échouer l'appel.
 */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { parse as parseYaml } from "yaml";
import type {
  AnnonceSource,
  EntiteSource,
  LogementSource,
  MandatSource,
  PersonneSource,
  ProspectSource,
  SourcesV1,
} from "./mapper";

export interface FichierInventorie {
  chemin: string;
  role: "source" | "interdit" | "infrastructure";
  present: boolean;
  octets: number | null;
  sha256: string | null;
  mtime: string | null;
  volume: number | null;
  proprietaire: string;
  sensibilite: string;
  devenir: string;
  note: string | null;
}

export interface ChargementSources {
  sources: SourcesV1;
  fichiers: FichierInventorie[];
  racine: string;
}

const FICHIERS_SOURCE: Array<{
  chemin: string;
  volume: (sources: SourcesV1, brut: unknown) => number;
  devenir: string;
  note?: string;
}> = [
  {
    chemin: "logements.yaml",
    volume: (s) => s.logements.length,
    devenir: "migrer (logements réels uniquement)",
  },
  {
    chemin: "passerelle-parc/entites.yaml",
    volume: (s) => s.entites.length,
    devenir: "migrer (entité émettrice)",
  },
  {
    chemin: "passerelle-parc/mandats.yaml",
    volume: (s) => s.mandats.length,
    devenir: "décision par mandat (propre ou tiers)",
  },
  {
    chemin: "passerelle-parc/annonces.yaml",
    volume: (s) => s.annonces.length,
    devenir: "à ressaisir dans V2 (contenu brouillon)",
  },
  {
    chemin: "passerelle-parc/prospects.yaml",
    volume: (s) => s.prospects.length,
    devenir: "importer si base légale, sinon purger",
  },
  {
    chemin: "acces.yaml",
    volume: (s) => s.personnes.length,
    devenir: "réinviter (aucun mot de passe migré)",
  },
  {
    chemin: "memoire/voyageurs.yaml",
    volume: (s) => s.voyageurs.length,
    devenir: "repartir à zéro (opt-in à reconstruire)",
  },
  {
    chemin: "design.yaml",
    volume: (s) => (s.design ? 1 : 0),
    devenir: "exclu (thème par défaut V2)",
  },
  {
    chemin: "zones.yaml",
    volume: () => 0,
    devenir: "exclu (pas de table zones en V2)",
    note: "Configuration de zonage non modélisée en V2",
  },
  {
    chemin: "vitrines.yaml",
    volume: () => 0,
    devenir: "exclu (vitrines désactivées par défaut)",
  },
];

/**
 * Fichiers volontairement non lus : secrets, état runtime, infrastructure.
 * Leur simple présence est constatée, jamais leur contenu.
 */
const FICHIERS_INTERDITS: Array<{
  chemin: string;
  role: FichierInventorie["role"];
  sensibilite: string;
  note: string;
}> = [
  {
    chemin: "secrets.yaml",
    role: "interdit",
    sensibilite: "secret — non lu",
    note: "Secrets d'exploitation : jamais migrés",
  },
  {
    chemin: "passerelle-parc/secrets-registre.yaml",
    role: "interdit",
    sensibilite: "secret — non lu",
    note: "Registre de secrets V1 : jamais migré",
  },
  {
    chemin: "passerelle-parc/state",
    role: "infrastructure",
    sensibilite: "état runtime — non lu",
    note: "État interne de la passerelle",
  },
  {
    chemin: "passerelle-parc/boxes.yaml",
    role: "infrastructure",
    sensibilite: "infrastructure",
    note: "Box hébergées : documentées, non migrées",
  },
  {
    chemin: "passerelle-parc/config.yaml",
    role: "infrastructure",
    sensibilite: "infrastructure",
    note: "Configuration passerelle : hors périmètre métier",
  },
];

function sha256Fichier(chemin: string): string {
  return createHash("sha256").update(readFileSync(chemin)).digest("hex");
}

function objet(valeur: unknown, contexte: string): Record<string, unknown> {
  if (valeur === null || typeof valeur !== "object" || Array.isArray(valeur)) {
    throw new Error(`${contexte} : objet YAML attendu`);
  }
  return valeur as Record<string, unknown>;
}

function texte(valeur: unknown, defaut = ""): string {
  return typeof valeur === "string" ? valeur : defaut;
}

function nombreOuNull(valeur: unknown): number | null {
  return typeof valeur === "number" && Number.isFinite(valeur) ? valeur : null;
}

function booleen(valeur: unknown, defaut = false): boolean {
  return typeof valeur === "boolean" ? valeur : defaut;
}

function lireYaml(chemin: string): unknown {
  const brut = readFileSync(chemin, "utf8");
  try {
    return parseYaml(brut);
  } catch (erreur) {
    throw new Error(
      `${chemin} : YAML invalide — ${erreur instanceof Error ? erreur.message : String(erreur)}`,
    );
  }
}

function extraireLogements(brut: unknown): LogementSource[] {
  const racine = objet(brut, "logements.yaml");
  const bloc = objet(racine.logements ?? {}, "logements.yaml#logements");
  return Object.entries(bloc).map(([cle, valeur]) => {
    const l = objet(valeur, `logements.yaml#${cle}`);
    const pricing = objet(l.pricing ?? {}, `logements.yaml#${cle}.pricing`);
    const copro = objet(l.copro ?? {}, `logements.yaml#${cle}.copro`);
    return {
      cle,
      nom: texte(l.nom, cle),
      commune: texte(l.commune),
      surfaceM2: nombreOuNull(l.surface_m2),
      capacite: nombreOuNull(l.capacite),
      prixBase: nombreOuNull(pricing.prix_base),
      prixMin: nombreOuNull(pricing.prix_min),
      prixMax: nombreOuNull(pricing.prix_max),
      modeGestion: texte(pricing.mode_gestion_defaut, "equilibre"),
      coproVerifiee: booleen(copro.verifiee),
      annonceStatut: null,
    };
  });
}

function extraireEntites(brut: unknown): EntiteSource[] {
  const racine = objet(brut, "entites.yaml");
  const bloc = objet(racine.entites ?? {}, "entites.yaml#entites");
  return Object.entries(bloc).map(([cle, valeur]) => {
    const e = objet(valeur, `entites.yaml#${cle}`);
    return {
      cle,
      libelle: texte(e.libelle, cle),
      nature: texte(e.nature, "nom_propre"),
      regime: texte(e.regime, "micro_bic_non_classe"),
      tva: texte(e.tva, "non"),
      siren: texte(e.siren),
      statut: texte(e.statut, "active"),
    };
  });
}

function extraireMandats(brut: unknown): MandatSource[] {
  const racine = objet(brut, "mandats.yaml");
  const bloc = objet(racine.mandats ?? {}, "mandats.yaml#mandats");
  return Object.entries(bloc).map(([cle, valeur]) => {
    const m = objet(valeur, `mandats.yaml#${cle}`);
    return {
      cle,
      entiteId: texte(m.entite_id),
      mode: texte(m.mode, "propre"),
      commissionPct:
        typeof m.commission_pct === "number" ? m.commission_pct : 0,
      statut: texte(m.statut, "brouillon"),
    };
  });
}

function extraireAnnonces(brut: unknown): AnnonceSource[] {
  const racine = objet(brut, "annonces.yaml");
  const bloc = objet(racine.annonces ?? {}, "annonces.yaml#annonces");
  return Object.entries(bloc).map(([cle, valeur]) => {
    const a = objet(valeur, `annonces.yaml#${cle}`);
    const descriptions = objet(
      a.descriptions ?? {},
      `annonces.yaml#${cle}.descriptions`,
    );
    const photos = Array.isArray(a.photos) ? a.photos.length : 0;
    return {
      cle,
      titre: texte(a.titre, cle),
      statut: texte(a.statut, "brouillon"),
      nombreDescriptions: Object.keys(descriptions).length,
      nombrePhotos: photos,
    };
  });
}

function extrairePersonnes(brut: unknown): PersonneSource[] {
  const racine = objet(brut, "acces.yaml");
  const bloc = Array.isArray(racine.personnes) ? racine.personnes : [];
  return bloc.map((valeur, index) => {
    const p = objet(valeur, `acces.yaml#personnes[${index}]`);
    return {
      id: texte(p.id, `personne_${index + 1}`),
      role: texte(p.role, "inconnu"),
      sousRole: texte(p.sous_role, "inconnu"),
      logements: Array.isArray(p.logements)
        ? p.logements.filter((x): x is string => typeof x === "string")
        : [],
      expireLe: typeof p.expire_le === "string" ? p.expire_le : null,
      mfa: booleen(p.mfa),
    };
  });
}

function extraireProspects(brut: unknown): ProspectSource[] {
  const racine = objet(brut, "prospects.yaml");
  const bloc = objet(racine.prospects ?? {}, "prospects.yaml#prospects");
  return Object.entries(bloc).map(([cle, valeur]) => {
    const p = objet(valeur, `prospects.yaml#${cle}`);
    return {
      cle,
      nom: texte(p.nom, cle),
      email: typeof p.email === "string" ? p.email : null,
      telephone: typeof p.telephone === "string" ? p.telephone : null,
    };
  });
}

function extraireVoyageurs(
  brut: unknown,
): Array<{ hash: string; optInLe: string | null }> {
  const racine = objet(brut, "voyageurs.yaml");
  const bloc = Array.isArray(racine.voyageurs) ? racine.voyageurs : [];
  return bloc.map((valeur, index) => {
    const v = objet(valeur, `voyageurs.yaml#voyageurs[${index}]`);
    return {
      hash: texte(v.hash, `voyageur_${index + 1}`),
      optInLe: typeof v.opt_in_le === "string" ? v.opt_in_le : null,
    };
  });
}

/**
 * Charge toutes les sources déclarées. Les fichiers sont lus deux fois :
 * l'empreinte doit être identique, sinon les sources bougent pendant la
 * migration et l'appel échoue.
 */
export function chargerSources(racine: string): ChargementSources {
  const debut = new Map<string, string>();
  const sources: SourcesV1 = {
    entites: [],
    logements: [],
    annonces: [],
    mandats: [],
    personnes: [],
    prospects: [],
    voyageurs: [],
    design: null,
  };
  const fichiers: FichierInventorie[] = [];
  const volumes = new Map<string, number>();

  for (const declaration of FICHIERS_SOURCE) {
    const chemin = join(racine, declaration.chemin);
    const present = existsSync(chemin);
    if (present) {
      const info = lstatSync(chemin);
      if (info.isSymbolicLink()) {
        throw new Error(`${declaration.chemin} : lien symbolique refusé (lecture directe attendue)`);
      }
      const hash = sha256Fichier(chemin);
      debut.set(declaration.chemin, hash);
      fichiers.push({
        chemin: declaration.chemin,
        role: "source",
        present: true,
        octets: statSync(chemin).size,
        sha256: hash,
        mtime: statSync(chemin).mtime.toISOString(),
        volume: null,
        proprietaire: "fondateur",
        sensibilite: "données de gestion internes",
        devenir: declaration.devenir,
        note: declaration.note ?? null,
      });
      volumes.set(declaration.chemin, 0);
    } else {
      fichiers.push({
        chemin: declaration.chemin,
        role: "source",
        present: false,
        octets: null,
        sha256: null,
        mtime: null,
        volume: null,
        proprietaire: "fondateur",
        sensibilite: "—",
        devenir: declaration.devenir,
        note: declaration.note ?? "Fichier absent",
      });
    }
  }

  const lire = (relatif: string): unknown => {
    const chemin = join(racine, relatif);
    if (!existsSync(chemin)) return null;
    return lireYaml(chemin);
  };

  const logementsBrut = lire("logements.yaml");
  if (logementsBrut) {
    sources.logements = extraireLogements(logementsBrut);
    volumes.set("logements.yaml", sources.logements.length);
  }

  const entitesBrut = lire("passerelle-parc/entites.yaml");
  if (entitesBrut) {
    sources.entites = extraireEntites(entitesBrut);
    volumes.set("passerelle-parc/entites.yaml", sources.entites.length);
  }

  const mandatsBrut = lire("passerelle-parc/mandats.yaml");
  if (mandatsBrut) {
    sources.mandats = extraireMandats(mandatsBrut);
    volumes.set("passerelle-parc/mandats.yaml", sources.mandats.length);
  }

  const annoncesBrut = lire("passerelle-parc/annonces.yaml");
  if (annoncesBrut) {
    sources.annonces = extraireAnnonces(annoncesBrut);
    volumes.set("passerelle-parc/annonces.yaml", sources.annonces.length);
  }

  const prospectsBrut = lire("passerelle-parc/prospects.yaml");
  if (prospectsBrut) {
    sources.prospects = extraireProspects(prospectsBrut);
    volumes.set("passerelle-parc/prospects.yaml", sources.prospects.length);
  }

  const personnesBrut = lire("acces.yaml");
  if (personnesBrut) {
    sources.personnes = extrairePersonnes(personnesBrut);
    volumes.set("acces.yaml", sources.personnes.length);
  }

  const voyageursBrut = lire("memoire/voyageurs.yaml");
  if (voyageursBrut) {
    sources.voyageurs = extraireVoyageurs(voyageursBrut);
    volumes.set("memoire/voyageurs.yaml", sources.voyageurs.length);
  }

  const designBrut = lire("design.yaml");
  if (designBrut) {
    const design = objet(designBrut, "design.yaml");
    sources.design = typeof design.design === "string" ? design.design : null;
    volumes.set("design.yaml", sources.design ? 1 : 0);
  }

  for (const fichier of fichiers) {
    if (fichier.present) {
      fichier.volume = volumes.get(fichier.chemin) ?? null;
    }
  }

  for (const declaration of FICHIERS_INTERDITS) {
    const chemin = join(racine, declaration.chemin);
    const present = existsSync(chemin);
    fichiers.push({
      chemin: declaration.chemin,
      role: declaration.role,
      present,
      octets: null,
      sha256: null,
      mtime: null,
      volume: null,
      proprietaire: "fondateur",
      sensibilite: declaration.sensibilite,
      devenir:
        declaration.role === "interdit" ? "exclu — jamais lu" : "hors périmètre",
      note: present ? declaration.note : "Absent",
    });
  }

  // Deuxième passe : les sources n'ont pas bougé pendant la lecture.
  for (const [relatif, hash] of debut) {
    if (sha256Fichier(join(racine, relatif)) !== hash) {
      throw new Error(`${relatif} a changé pendant la lecture — migration interrompue`);
    }
  }

  const annoncesParLogement = new Map(
    sources.annonces.map((a) => [a.cle, a] as const),
  );
  sources.logements = sources.logements.map((logement) => ({
    ...logement,
    annonceStatut: annoncesParLogement.get(logement.cle)?.statut ?? null,
  }));

  return { sources, fichiers, racine };
}

/** Vérifie après import que les sources sont intactes. */
export function verifierSourcesIntactes(
  chargement: ChargementSources,
): { ok: boolean; ecarts: string[] } {
  const ecarts: string[] = [];
  for (const fichier of chargement.fichiers) {
    if (!fichier.present || fichier.sha256 === null) continue;
    const chemin = join(chargement.racine, fichier.chemin);
    if (!existsSync(chemin)) {
      ecarts.push(`${fichier.chemin} : supprimé pendant l'import`);
      continue;
    }
    if (sha256Fichier(chemin) !== fichier.sha256) {
      ecarts.push(`${fichier.chemin} : empreinte modifiée pendant l'import`);
    }
  }
  return { ok: ecarts.length === 0, ecarts };
}
