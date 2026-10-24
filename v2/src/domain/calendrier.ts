// Calendrier pur : mois AAAA-MM, jours, grille lundi→dimanche.
// Aucune dépendance UI : utilisable côté serveur et dans les tests.

export function moisValide(mois: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(mois);
}

export function dateIsoValide(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const ms = Date.parse(`${date}T00:00:00.000Z`);
  if (!Number.isFinite(ms)) return false;
  return new Date(ms).toISOString().slice(0, 10) === date;
}

export function moisCourant(date = new Date()): string {
  const annee = date.getFullYear();
  const mois = String(date.getMonth() + 1).padStart(2, "0");
  return `${annee}-${mois}`;
}

function morceauxMois(mois: string): { annee: number; moisNum: number } {
  if (!moisValide(mois)) throw new Error(`Mois invalide : ${mois}`);
  const [anneeTexte, moisTexte] = mois.split("-");
  const annee = Number(anneeTexte);
  const moisNum = Number(moisTexte);
  if (!Number.isInteger(annee) || !Number.isInteger(moisNum)) {
    throw new Error(`Mois invalide : ${mois}`);
  }
  return { annee, moisNum };
}

export function decalerMois(mois: string, delta: number): string {
  const { annee, moisNum } = morceauxMois(mois);
  const d = new Date(Date.UTC(annee, moisNum - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function joursDuMois(mois: string): string[] {
  const { annee, moisNum } = morceauxMois(mois);
  const nbJours = new Date(Date.UTC(annee, moisNum, 0)).getUTCDate();
  return Array.from({ length: nbJours }, (_, i) =>
    `${mois}-${String(i + 1).padStart(2, "0")}`,
  );
}

/**
 * Grille du mois, semaines commençant le lundi.
 * Les cases vides avant/après sont `null`.
 */
export function grilleMois(mois: string): (string | null)[][] {
  const jours = joursDuMois(mois);
  const { annee, moisNum } = morceauxMois(mois);
  const premier = new Date(Date.UTC(annee, moisNum - 1, 1));
  const decalage = (premier.getUTCDay() + 6) % 7; // lundi = 0

  const cases: (string | null)[] = [
    ...Array.from({ length: decalage }, () => null),
    ...jours,
  ];
  while (cases.length % 7 !== 0) cases.push(null);

  const semaines: (string | null)[][] = [];
  for (let i = 0; i < cases.length; i += 7) {
    semaines.push(cases.slice(i, i + 7));
  }
  return semaines;
}

export function ajouterJours(date: string, jours: number): string {
  if (!dateIsoValide(date)) throw new Error(`Date invalide : ${date}`);
  const ms = Date.parse(`${date}T00:00:00.000Z`) + jours * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

export function moisEnFrancais(mois: string): string {
  const { annee, moisNum } = morceauxMois(mois);
  return new Intl.DateTimeFormat("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(annee, moisNum - 1, 1)));
}

export function jourEnFrancais(date: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00.000Z`));
}
