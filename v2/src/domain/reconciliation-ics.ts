import type { EvenementIcs } from "./ics";

export type TypeCalendrier = "reservation" | "blocage";

/**
 * Vue minimale d'une réservation ou d'un blocage pour la réconciliation.
 * `fluxIcsId` est null pour les lignes importées avant l'introduction du
 * rattachement : elles peuvent être adoptées par la référence.
 */
export interface EnregistrementCalendrier {
  id: string;
  ref: string;
  type: TypeCalendrier;
  debut: string;
  fin: string;
  source: string;
  fluxIcsId: string | null;
  statut?: string | null;
  clientNom?: string | null;
  voyageurs?: number;
  montantCentimes?: number;
  motif?: string | null;
}

export interface ConflitIcs {
  ref: string;
  type: TypeCalendrier;
  debut: string;
  fin: string;
  avecRef: string;
  avecType: TypeCalendrier;
  message: string;
}

export interface PlanReconciliationIcs {
  creer: EvenementIcs[];
  mettreAJour: Array<{
    enregistrement: EnregistrementCalendrier;
    evenement: EvenementIcs;
  }>;
  remplacer: Array<{
    enregistrement: EnregistrementCalendrier;
    evenement: EvenementIcs;
  }>;
  supprimer: EnregistrementCalendrier[];
  conflits: ConflitIcs[];
  deja: number;
  ignores: number;
}

interface OccupationCalendrier {
  id: string;
  ref: string;
  type: TypeCalendrier;
  debut: string;
  fin: string;
}

interface Correspondance {
  evenement: EvenementIcs;
  existant: EnregistrementCalendrier | null;
  adoptable: boolean;
  meme: boolean;
}

function chevauche(
  a: { debut: string; fin: string },
  b: { debut: string; fin: string },
): boolean {
  return a.debut < b.fin && a.fin > b.debut;
}

function estImporte(enregistrement: EnregistrementCalendrier): boolean {
  if (enregistrement.source !== "import-ics") return false;
  // Une annulation faite dans LCD ne doit pas être ressuscitée par un flux OTA
  // qui n'a pas encore propagé l'annulation.
  return !(
    enregistrement.type === "reservation" &&
    enregistrement.statut === "annulee"
  );
}

function estAttribuable(
  enregistrement: EnregistrementCalendrier,
  fluxIcsId: string | null,
): boolean {
  return estImporte(enregistrement) && enregistrement.fluxIcsId === fluxIcsId;
}

function estAdoptable(
  enregistrement: EnregistrementCalendrier,
  fluxIcsId: string | null,
): boolean {
  return (
    estImporte(enregistrement) &&
    (enregistrement.fluxIcsId === fluxIcsId || enregistrement.fluxIcsId === null)
  );
}

function occupe(enregistrement: EnregistrementCalendrier): boolean {
  return !(
    enregistrement.type === "reservation" &&
    enregistrement.statut === "annulee"
  );
}

function memeContenu(
  enregistrement: EnregistrementCalendrier,
  evenement: EvenementIcs,
): boolean {
  if (enregistrement.debut !== evenement.debut) return false;
  if (enregistrement.fin !== evenement.fin) return false;
  if (enregistrement.type !== evenement.type) return false;
  if (enregistrement.type === "reservation") {
    if (enregistrement.statut === "annulee") return false;
    const nomEnregistre =
      enregistrement.clientNom && enregistrement.clientNom !== "Réservation OTA"
        ? enregistrement.clientNom
        : null;
    if (nomEnregistre !== (evenement.clientNom ?? null)) {
      return false;
    }
    if ((enregistrement.voyageurs ?? 0) !== evenement.voyageurs) return false;
    if (
      (enregistrement.montantCentimes ?? 0) !== evenement.montantCentimes
    ) {
      return false;
    }
    return true;
  }
  return (
    (enregistrement.motif ?? null) ===
    (evenement.motif ?? evenement.resume ?? null)
  );
}

function choisirExistant(
  candidats: EnregistrementCalendrier[],
  evenement: EvenementIcs,
  fluxIcsId: string | null,
): EnregistrementCalendrier | null {
  const memeType = candidats.filter((c) => c.type === evenement.type);
  const pool = memeType.length > 0 ? memeType : candidats;
  return (
    pool.find((c) => estAdoptable(c, fluxIcsId)) ??
    pool.find((c) => estImporte(c)) ??
    pool[0] ??
    null
  );
}

/**
 * Calcule le plan de réconciliation d'un flux sans toucher à la base.
 *
 * Règles :
 * - un événement absent du flux et rattaché à ce flux est supprimé ;
 * - une réservation/blocage identique est laissée telle quelle ;
 * - un déplacement n'est accepté que s'il ne crée pas de chevauchement ;
 * - deux déplacements qui se chevauchent sont refusés ensemble, jamais
 *   appliqués partiellement ;
 * - un conflit est signalé, jamais inséré ;
 * - les lignes importées avant le rattachement sont adoptées par référence.
 */
export function calculerPlanReconciliationIcs(input: {
  fluxIcsId: string | null;
  evenements: EvenementIcs[];
  enregistrements: EnregistrementCalendrier[];
  supprimerAbsents?: boolean;
}): PlanReconciliationIcs {
  const plan: PlanReconciliationIcs = {
    creer: [],
    mettreAJour: [],
    remplacer: [],
    supprimer: [],
    conflits: [],
    deja: 0,
    ignores: 0,
  };

  const evenementsParRef = new Map<string, EvenementIcs>();
  for (const evenement of input.evenements) {
    if (evenementsParRef.has(evenement.ref)) {
      plan.ignores += 1;
      continue;
    }
    evenementsParRef.set(evenement.ref, evenement);
  }

  const parRef = new Map<string, EnregistrementCalendrier[]>();
  for (const enregistrement of input.enregistrements) {
    const liste = parRef.get(enregistrement.ref) ?? [];
    liste.push(enregistrement);
    parRef.set(enregistrement.ref, liste);
  }

  const supprimerAbsents = input.supprimerAbsents ?? true;
  const supprimes = new Set<string>();
  if (supprimerAbsents) {
    for (const enregistrement of input.enregistrements) {
      if (
        estAttribuable(enregistrement, input.fluxIcsId) &&
        !evenementsParRef.has(enregistrement.ref)
      ) {
        plan.supprimer.push(enregistrement);
        supprimes.add(enregistrement.id);
      }
    }
  }

  const evenementsTries = [...evenementsParRef.values()].sort((a, b) =>
    a.debut === b.debut
      ? a.fin === b.fin
        ? a.ref.localeCompare(b.ref)
        : a.fin.localeCompare(b.fin)
      : a.debut.localeCompare(b.debut),
  );

  const correspondances: Correspondance[] = evenementsTries.map((evenement) => {
    const existant = choisirExistant(
      parRef.get(evenement.ref) ?? [],
      evenement,
      input.fluxIcsId,
    );
    return {
      evenement,
      existant,
      adoptable: existant ? estAdoptable(existant, input.fluxIcsId) : false,
      meme: existant ? memeContenu(existant, evenement) : false,
    };
  });

  // Les lignes rattachées à ce flux qui réapparaissent sont retirées de
  // l'occupation fixe : leurs dates peuvent changer (échange de dates entre
  // deux séjours). Elles sont replacées si leur déplacement est refusé.
  const idsRetires = new Set<string>(supprimes);
  for (const correspondance of correspondances) {
    if (correspondance.existant && correspondance.adoptable) {
      idsRetires.add(correspondance.existant.id);
    }
  }

  const occupation: OccupationCalendrier[] = [];
  const idsOccupation = new Set<string>();
  const ajouterOccupation = (enregistrement: EnregistrementCalendrier) => {
    if (idsOccupation.has(enregistrement.id)) return;
    idsOccupation.add(enregistrement.id);
    occupation.push({
      id: enregistrement.id,
      ref: enregistrement.ref,
      type: enregistrement.type,
      debut: enregistrement.debut,
      fin: enregistrement.fin,
    });
  };

  for (const enregistrement of input.enregistrements) {
    if (occupe(enregistrement) && !idsRetires.has(enregistrement.id)) {
      ajouterOccupation(enregistrement);
    }
  }
  // Les lignes inchangées forment aussi une occupation fixe, même si elles
  // ont été retirées de la liste initiale pour l'analyse.
  for (const correspondance of correspondances) {
    if (
      correspondance.existant &&
      correspondance.adoptable &&
      correspondance.meme
    ) {
      ajouterOccupation(correspondance.existant);
    }
  }

  const propositions = correspondances
    .filter(
      (correspondance) =>
        !correspondance.existant ||
        (correspondance.adoptable && !correspondance.meme),
    )
    .map((correspondance) => ({
      evenement: correspondance.evenement,
      existant: correspondance.existant,
    }));

  const conflits = new Map<string, ConflitIcs>();
  const rejeter = (
    evenement: EvenementIcs,
    avec: { ref: string; type: TypeCalendrier; debut: string; fin: string },
  ) => {
    if (conflits.has(evenement.ref)) return;
    conflits.set(evenement.ref, {
      ref: evenement.ref,
      type: evenement.type,
      debut: evenement.debut,
      fin: evenement.fin,
      avecRef: avec.ref,
      avecType: avec.type,
      message: `Chevauche ${avec.type} ${avec.ref} (${avec.debut} → ${avec.fin}).`,
    });
  };

  let encore = true;
  while (encore) {
    encore = false;

    // Conflits avec les occupations qui ne bougent pas.
    for (const proposition of propositions) {
      if (conflits.has(proposition.evenement.ref)) continue;
      const trouve = occupation.find(
        (entree) =>
          entree.id !== proposition.existant?.id &&
          chevauche(entree, proposition.evenement),
      );
      if (!trouve) continue;
      rejeter(proposition.evenement, trouve);
      if (proposition.existant) ajouterOccupation(proposition.existant);
      encore = true;
    }

    // Deux déplacements qui se chevauchent sont refusés ensemble : sinon le
    // premier pourrait être écrit alors que le second est en conflit, créant
    // un chevauchement réel en base.
    const actifs = propositions.filter(
      (proposition) => !conflits.has(proposition.evenement.ref),
    );
    for (let i = 0; i < actifs.length; i += 1) {
      const premier = actifs[i];
      if (!premier || conflits.has(premier.evenement.ref)) continue;
      for (let j = i + 1; j < actifs.length; j += 1) {
        const second = actifs[j];
        if (!second || conflits.has(second.evenement.ref)) continue;
        if (!chevauche(premier.evenement, second.evenement)) continue;
        rejeter(premier.evenement, second.evenement);
        rejeter(second.evenement, premier.evenement);
        if (premier.existant) ajouterOccupation(premier.existant);
        if (second.existant) ajouterOccupation(second.existant);
        encore = true;
      }
    }
  }

  for (const correspondance of correspondances) {
    if (correspondance.existant && !correspondance.adoptable) {
      // Réservation directe ou flux concurrent portant la même référence :
      // on ne touche pas à la ligne, elle bloque déjà les dates.
      plan.deja += 1;
      continue;
    }

    if (correspondance.existant && correspondance.meme) {
      plan.deja += 1;
      if (
        correspondance.existant.fluxIcsId === null &&
        input.fluxIcsId !== null
      ) {
        plan.mettreAJour.push({
          enregistrement: correspondance.existant,
          evenement: correspondance.evenement,
        });
      }
      continue;
    }

    if (conflits.has(correspondance.evenement.ref)) continue;

    if (!correspondance.existant) {
      plan.creer.push(correspondance.evenement);
    } else if (correspondance.existant.type !== correspondance.evenement.type) {
      plan.remplacer.push({
        enregistrement: correspondance.existant,
        evenement: correspondance.evenement,
      });
    } else {
      plan.mettreAJour.push({
        enregistrement: correspondance.existant,
        evenement: correspondance.evenement,
      });
    }
  }

  plan.conflits = [...conflits.values()];
  return plan;
}
