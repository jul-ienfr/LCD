// Import iCal/ICS : parseur pur, sans réseau ni framework.
// Les OTA (Airbnb, Booking, Abritel…) exposent un flux ICS par logement.

import { dateIsoValide } from "./calendrier";

export type TypeEvenementIcs = "reservation" | "blocage";

export interface EvenementIcs {
  uid: string;
  ref: string;
  type: TypeEvenementIcs;
  debut: string; // AAAA-MM-JJ
  fin: string; // exclusive
  resume: string;
  description: string | null;
  clientNom: string | null;
  voyageurs: number;
  montantCentimes: number;
  motif: string | null;
}

export interface ResultatParsingIcs {
  evenements: EvenementIcs[];
  ignores: number;
}

interface ProprieteIcs {
  nom: string;
  params: Record<string, string>;
  valeur: string;
}

const MOTS_BLOCAGE = [
  "not available",
  "unavailable",
  "blocked",
  "closed",
  "indisponible",
  "bloque",
  "bloqué",
  "ferme",
  "fermé",
];

function deplierLignes(texte: string): string[] {
  const lignes = texte.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const resultat: string[] = [];
  for (const ligne of lignes) {
    if ((ligne.startsWith(" ") || ligne.startsWith("\t")) && resultat.length > 0) {
      resultat[resultat.length - 1] += ligne.slice(1);
    } else {
      resultat.push(ligne);
    }
  }
  return resultat;
}

function parserPropriete(ligne: string): ProprieteIcs | null {
  const separateur = ligne.indexOf(":");
  if (separateur < 0) return null;
  const gauche = ligne.slice(0, separateur);
  const valeur = ligne.slice(separateur + 1);
  const [nom, ...parametres] = gauche.split(";");
  if (!nom) return null;

  const params: Record<string, string> = {};
  for (const parametre of parametres) {
    const [cle, ...reste] = parametre.split("=");
    if (cle) params[cle.toUpperCase()] = reste.join("=");
  }

  return { nom: nom.toUpperCase(), params, valeur };
}

function desechapper(valeur: string): string {
  return valeur
    .replace(/\\n/gi, "\n")
    .replace(/\\,/g, ",")
    .replace(/\\;/g, ";")
    .replace(/\\\\/g, "\\");
}

function dateDepuisValeur(valeur: string): string | null {
  const brut = valeur.trim();
  if (/^\d{8}$/.test(brut)) {
    const date = `${brut.slice(0, 4)}-${brut.slice(4, 6)}-${brut.slice(6, 8)}`;
    return dateIsoValide(date) ? date : null;
  }
  if (/^\d{8}T\d{6}Z?$/.test(brut)) {
    const date = `${brut.slice(0, 4)}-${brut.slice(4, 6)}-${brut.slice(6, 8)}`;
    return dateIsoValide(date) ? date : null;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(brut)) {
    const date = brut.slice(0, 10);
    return dateIsoValide(date) ? date : null;
  }
  return null;
}

function ajouterJours(date: string, jours: number): string {
  const valeur = new Date(`${date}T00:00:00.000Z`);
  valeur.setUTCDate(valeur.getUTCDate() + jours);
  return valeur.toISOString().slice(0, 10);
}

function dureeEnJours(duree: string): number | null {
  const semaines = /^P(\d+)W$/.exec(duree);
  if (semaines) return Number(semaines[1]) * 7;
  const jours = /^P(\d+)D$/.exec(duree);
  if (jours) return Number(jours[1]);
  const heures = /^PT(\d+)H$/.exec(duree);
  if (heures) return Math.max(1, Math.ceil(Number(heures[1]) / 24));
  return null;
}

function estBloque(resume: string, description: string | null): boolean {
  const texte = `${resume} ${description ?? ""}`.toLowerCase();
  return MOTS_BLOCAGE.some((mot) => texte.includes(mot));
}

function extraireClient(
  description: string | null,
  resume: string,
  bloque: boolean,
): string | null {
  if (description) {
    const client = /(?:guest|client|voyageur)\s*[:\-]\s*([^\n\r]+)/i.exec(
      description,
    );
    if (client?.[1]) return client[1].trim().slice(0, 120);
  }
  if (
    !bloque &&
    resume &&
    !/^(reserved|reservation|airbnb|booking|abritel)/i.test(resume)
  ) {
    return resume.slice(0, 120);
  }
  return null;
}

function extraireVoyageurs(description: string | null): number {
  if (!description) return 2;
  const trouve = /(?:guests?|voyageurs?|persons?)\s*[:\-]\s*(\d{1,2})/i.exec(
    description,
  );
  if (!trouve?.[1]) return 2;
  const nombre = Number(trouve[1]);
  return Number.isInteger(nombre) && nombre >= 1 && nombre <= 20 ? nombre : 2;
}

function extraireMontant(description: string | null): number {
  if (!description) return 0;
  const trouve = /(?:total|montant|price)\s*[:\-]?\s*(?:€|\$)?\s*(\d+(?:[.,]\d{1,2})?)/i.exec(
    description,
  );
  if (!trouve?.[1]) return 0;
  const nombre = Number(trouve[1].replace(",", "."));
  if (!Number.isFinite(nombre) || nombre < 0) return 0;
  return Math.round(nombre * 100);
}

function hash32(texte: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < texte.length; index += 1) {
    hash ^= texte.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Référence stable et courte, dérivée de l'UID OTA. */
export function refDepuisUid(uid: string): string {
  const base =
    uid
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "event";
  return `ics-${base}-${hash32(uid)}`.slice(0, 64);
}

function construireEvenement(
  proprietes: ProprieteIcs[],
): EvenementIcs | null {
  const valeur = (nom: string) =>
    proprietes.find((propriete) => propriete.nom === nom)?.valeur ?? null;

  const statut = valeur("STATUS")?.toUpperCase() ?? "";
  if (statut === "CANCELLED" || statut === "CANCELED") return null;

  const debut = valeur("DTSTART");
  if (!debut) return null;
  const debutDate = dateDepuisValeur(debut);
  if (!debutDate) return null;

  const finBrute = valeur("DTEND");
  let finDate = finBrute ? dateDepuisValeur(finBrute) : null;
  if (!finDate) {
    const duree = valeur("DURATION");
    const jours = duree ? dureeEnJours(duree.trim().toUpperCase()) : null;
    finDate = ajouterJours(debutDate, jours ?? 1);
  }
  if (!finDate || !dateIsoValide(finDate) || finDate <= debutDate) return null;

  const resume = desechapper(valeur("SUMMARY") ?? "Import ICS").trim();
  const descriptionBrute = valeur("DESCRIPTION");
  const description = descriptionBrute
    ? desechapper(descriptionBrute).trim()
    : null;
  const bloque = estBloque(resume, description);
  const uid =
    valeur("UID")?.trim() ||
    `${debutDate}-${finDate}-${hash32(`${resume}-${description ?? ""}`)}`;

  return {
    uid,
    ref: refDepuisUid(uid),
    type: bloque ? "blocage" : "reservation",
    debut: debutDate,
    fin: finDate,
    resume,
    description,
    clientNom: extraireClient(description, resume, bloque),
    voyageurs: extraireVoyageurs(description),
    montantCentimes: bloque ? 0 : extraireMontant(description),
    motif: bloque ? resume : null,
  };
}

/** Parse un flux ICS et retourne les séjours/blocages exploitables. */
export function parserIcs(texte: string): ResultatParsingIcs {
  const lignes = deplierLignes(texte);
  const evenements: EvenementIcs[] = [];
  let ignores = 0;
  let proprietes: ProprieteIcs[] | null = null;

  for (const ligne of lignes) {
    if (ligne.trim().toUpperCase() === "BEGIN:VEVENT") {
      proprietes = [];
      continue;
    }
    if (ligne.trim().toUpperCase() === "END:VEVENT") {
      if (proprietes) {
        const evenement = construireEvenement(proprietes);
        if (evenement) evenements.push(evenement);
        else ignores += 1;
      }
      proprietes = null;
      continue;
    }
    if (proprietes) {
      const propriete = parserPropriete(ligne);
      if (propriete) proprietes.push(propriete);
    }
  }

  return { evenements, ignores };
}
