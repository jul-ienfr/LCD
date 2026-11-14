/**
 * T508 — Sélection pure pour le job de récurrence des relevés propriétaires.
 *
 * Détermine quels relevés doivent être générés/envoyés pour un tenant donné
 * à une date précise. La logique est pure (aucun appel réseau/DB) :
 * - mensuel : le 1er jour de chaque mois, générer le relevé du mois précédent ;
 * - trimestriel : le 1er jour de chaque trimestre, générer le relevé du
 *   trimestre précédent.
 *
 * L'orchestration complète (appel aux repositories, envoi email) vit dans
 * le endpoint cron `src/routes/api/cron/releves/+server.ts`.
 */
import type { PeriodeReleve } from "@/domain/releve-proprietaire";
import { decalerMois } from "@/domain/calendrier";

export interface CandidatReleve {
  /** Mois de début de la période à générer. */
  moisDebut: string;
  periode: PeriodeReleve;
}

/**
 * Retourne true si la date (AAAA-MM-JJ) est le premier jour du mois.
 */
export function estPremierJourDuMois(date: string): boolean {
  return date.endsWith("-01");
}

/**
 * Retourne true si la date est le premier jour d'un trimestre
 * (janvier, avril, juillet, octobre).
 */
export function estPremierJourDuTrimestre(date: string): boolean {
  if (!estPremierJourDuMois(date)) return false;
  const mois = Number(date.slice(5, 7));
  return [1, 4, 7, 10].includes(mois);
}

/**
 * Calcule les relevés à générer pour une date donnée.
 *
 * @param date - Date du jour AAAA-MM-JJ
 * @param periodicites - Types de relevés activés pour le tenant
 * @returns Liste des périodes à générer (peut être vide)
 */
export function selectionnerRelevesAGenerer(
  date: string,
  periodicites: readonly PeriodeReleve[] = ["mensuel"],
): CandidatReleve[] {
  if (!estPremierJourDuMois(date)) return [];

  const candidats: CandidatReleve[] = [];

  if (periodicites.includes("mensuel")) {
    // Le 1er du mois M : générer le relevé du mois M-1
    const moisPrecedent = decalerMois(date.slice(0, 7), -1);
    candidats.push({ moisDebut: moisPrecedent, periode: "mensuel" });
  }

  if (periodicites.includes("trimestriel") && estPremierJourDuTrimestre(date)) {
    // Le 1er du trimestre T : générer le relevé du trimestre T-1
    const moisCourant = date.slice(0, 7);
    const moisDebutTrimestrePrecedent = decalerMois(moisCourant, -3);
    candidats.push({ moisDebut: moisDebutTrimestrePrecedent, periode: "trimestriel" });
  }

  return candidats;
}

/**
 * Détermine les propriétaires ayant au moins un mandat actif pour un tenant.
 * Cette fonction est un helper de structure — le vrai filtre se fait dans le
 * repository (`listerLogementsAvecMandat`) et le use case `GenererReleve`.
 * Ici on ne fait que dédoublonner les identifiants de propriétaires.
 */
export function proprietairesDistincts(
  mandats: readonly {
    proprietaireId: string;
    proprietaireNom: string;
    proprietaireEmail?: string | null;
  }[],
): {
  proprietaireId: string;
  proprietaireNom: string;
  proprietaireEmail: string | null;
}[] {
  const vus = new Map<string, { nom: string; email: string | null }>();
  for (const mandat of mandats) {
    if (!vus.has(mandat.proprietaireId)) {
      vus.set(mandat.proprietaireId, {
        nom: mandat.proprietaireNom,
        email: mandat.proprietaireEmail ?? null,
      });
    }
  }
  return [...vus.entries()].map(([proprietaireId, entree]) => ({
    proprietaireId,
    proprietaireNom: entree.nom,
    proprietaireEmail: entree.email,
  }));
}
