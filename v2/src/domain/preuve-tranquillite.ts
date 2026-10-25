import { ErreurMetier } from "./erreurs";
import { aujourdHuiIso, dateIsoValide } from "./objet-trouve";

export type TypePreuve = "db" | "attestation" | "intervention";
export type MomentPreuve = "jour" | "nuit";

export const TYPES_PREUVE: readonly TypePreuve[] = [
  "db",
  "attestation",
  "intervention",
];

export const LIBELLES_TYPE_PREUVE: Record<TypePreuve, string> = {
  db: "Mesure de bruit",
  attestation: "Attestation",
  intervention: "Intervention",
};

export const SEUIL_DB_JOUR = 55;
export const SEUIL_DB_NUIT = 35;
export const VALEUR_DB_MAX = 120;
export const NOTE_PREUVE_MAX = 1000;
export const MOIS_CARNET = 12;

export interface PreuveTranquillite {
  id: string;
  tenantId: string;
  logementId: string;
  ref: string;
  type: TypePreuve;
  date: string;
  moment: MomentPreuve | null;
  valeurDb: number | null;
  note: string;
  createdAt: Date;
}

export function refPreuveValide(ref: string): boolean {
  return /^[A-Za-z0-9-]{4,64}$/.test(ref);
}

export function typePreuveValide(type: string): type is TypePreuve {
  return (TYPES_PREUVE as readonly string[]).includes(type);
}

export function momentPreuveValide(
  moment: string,
): moment is MomentPreuve {
  return moment === "jour" || moment === "nuit";
}

export function seuilDb(moment: MomentPreuve): number {
  return moment === "nuit" ? SEUIL_DB_NUIT : SEUIL_DB_JOUR;
}

export function validerPreuve(input: {
  type: string;
  date: string;
  moment?: string | null;
  valeurDb?: number | null;
  note?: string | null;
}): {
  type: TypePreuve;
  date: string;
  moment: MomentPreuve | null;
  valeurDb: number | null;
  note: string;
} {
  if (!typePreuveValide(input.type)) {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      "Le type de preuve est invalide.",
    );
  }
  if (!dateIsoValide(input.date)) {
    throw new ErreurMetier("PREUVE_INVALIDE", "La date est invalide.");
  }
  if (input.date > aujourdHuiIso()) {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      "La date ne peut pas être future.",
    );
  }
  const note = (input.note ?? "").trim();

  if (input.type === "db") {
    const moment = input.moment ?? "";
    if (!momentPreuveValide(moment)) {
      throw new ErreurMetier(
        "PREUVE_INVALIDE",
        "Précisez si la mesure a été prise de jour ou de nuit.",
      );
    }
    const valeurDb = input.valeurDb;
    if (
      typeof valeurDb !== "number" ||
      !Number.isInteger(valeurDb) ||
      valeurDb < 1 ||
      valeurDb > VALEUR_DB_MAX
    ) {
      throw new ErreurMetier(
        "PREUVE_INVALIDE",
        `La mesure doit être un entier entre 1 et ${VALEUR_DB_MAX} dB.`,
      );
    }
    if (note.length > NOTE_PREUVE_MAX) {
      throw new ErreurMetier(
        "PREUVE_INVALIDE",
        `La note doit contenir au plus ${NOTE_PREUVE_MAX} caractères.`,
      );
    }
    return { type: "db", date: input.date, moment, valeurDb, note };
  }

  if (note.length < 2 || note.length > NOTE_PREUVE_MAX) {
    throw new ErreurMetier(
      "PREUVE_INVALIDE",
      `La note doit contenir 2 à ${NOTE_PREUVE_MAX} caractères.`,
    );
  }
  return {
    type: input.type,
    date: input.date,
    moment: null,
    valeurDb: null,
    note,
  };
}

export function depassement(
  preuve: Pick<PreuveTranquillite, "type" | "moment" | "valeurDb">,
): boolean {
  if (preuve.type !== "db" || preuve.valeurDb === null) return false;
  const moment = preuve.moment ?? "jour";
  return preuve.valeurDb > seuilDb(moment);
}

export function dansLesDouzeMois(
  date: string,
  maintenant: Date = new Date(),
): boolean {
  const limite = new Date(maintenant);
  limite.setUTCFullYear(limite.getUTCFullYear() - 1);
  return date >= limite.toISOString().slice(0, 10);
}

export interface ResumeCarnet {
  total: number;
  mesures: number;
  attestations: number;
  interventions: number;
  depassements: number;
  maxDb: number | null;
}

export function resumeCarnet(
  preuves: readonly PreuveTranquillite[],
  maintenant: Date = new Date(),
): ResumeCarnet {
  const recentes = preuves.filter((p) =>
    dansLesDouzeMois(p.date, maintenant),
  );
  const mesures = recentes.filter((p) => p.type === "db");
  return {
    total: recentes.length,
    mesures: mesures.length,
    attestations: recentes.filter((p) => p.type === "attestation").length,
    interventions: recentes.filter((p) => p.type === "intervention").length,
    depassements: recentes.filter((p) => depassement(p)).length,
    maxDb:
      mesures.length === 0
        ? null
        : Math.max(...mesures.map((p) => p.valeurDb ?? 0)),
  };
}

function formaterDateFr(iso: string): string {
  const [annee, mois, jour] = iso.split("-");
  return `${jour}/${mois}/${annee}`;
}

export function lettreTranquillite(input: {
  logement: string;
  adresse?: string | null;
  preuves: readonly PreuveTranquillite[];
  maintenant?: Date;
}): string {
  const maintenant = input.maintenant ?? new Date();
  const resume = resumeCarnet(input.preuves, maintenant);
  const recentes = input.preuves
    .filter((p) => dansLesDouzeMois(p.date, maintenant))
    .sort((a, b) => a.date.localeCompare(b.date));

  const lignes = recentes.map((p) => {
    if (p.type === "db") {
      return `- ${formaterDateFr(p.date)} (${p.moment}) : ${p.valeurDb} dB${
        depassement(p) ? " — dépassement du seuil" : ""
      }${p.note ? ` — ${p.note}` : ""}`;
    }
    return `- ${formaterDateFr(p.date)} (${LIBELLES_TYPE_PREUVE[p.type].toLowerCase()}) : ${p.note}`;
  });

  return [
    `Objet : nuisances sonores — ${input.logement}`,
    "",
    "Madame, Monsieur,",
    "",
    `Je vous transmets le carnet de preuves de mon logement « ${input.logement} »${
      input.adresse ? ` (${input.adresse})` : ""
    }, tenu sur les douze derniers mois.`,
    "",
    `Sur cette période, ${resume.total} événement(s) ont été consignés : ${resume.mesures} mesure(s) de bruit, ${resume.attestations} attestation(s) et ${resume.interventions} intervention(s).`,
    resume.depassements > 0
      ? `${resume.depassements} mesure(s) dépassent les seuils de référence (${SEUIL_DB_JOUR} dB le jour, ${SEUIL_DB_NUIT} dB la nuit)${resume.maxDb === null ? "" : `, avec un maximum relevé de ${resume.maxDb} dB`}.`
      : "Aucune mesure ne dépasse les seuils de référence retenus.",
    "",
    "Détail des événements :",
    ...(lignes.length > 0 ? lignes : ["- Aucun événement sur la période."]),
    "",
    "Je reste à votre disposition pour tout complément d’information et vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.",
    "",
    "Fait le " + formaterDateFr(aujourdHuiIso(maintenant)),
    "Signature :",
  ].join("\n");
}
