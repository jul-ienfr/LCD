/**
 * Fiche de police (R.611-42) : une fiche par personne majeure/mineure
 * hébergée, remplie avant l'arrivée. Données strictement nécessaires — aucune
 * copie de pièce d'identité. Conservation 6 mois puis purge automatique.
 */

export type FichePolice = {
  id: string;
  tenantId: string;
  reservationId: string;
  logementId: string;
  ref: string;
  nom: string;
  prenoms: string;
  nationalite: string;
  dateNaissance: string;
  lieuNaissance: string;
  domicile: string;
  telephone: string;
  email: string | null;
  createdAt: Date;
  purgeAt: Date;
};

export type NouvelleFichePolice = Omit<FichePolice, "id">;

export const DUREE_CONSERVATION_MOIS = 6;

function texte(val: string, min: number, max: number): boolean {
  const v = val.trim();
  return v.length >= min && v.length <= max;
}

export function dateNaissanceValide(valeur: string, aujourdHui = new Date()): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valeur)) return false;
  const date = new Date(`${valeur}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return false;
  if (date.toISOString().slice(0, 10) !== valeur) return false;
  if (date.getTime() > aujourdHui.getTime()) return false;
  const limite = new Date(
    Date.UTC(
      aujourdHui.getUTCFullYear() - 120,
      aujourdHui.getUTCMonth(),
      aujourdHui.getUTCDate(),
    ),
  );
  return date.getTime() >= limite.getTime();
}

export function telephoneValide(valeur: string): boolean {
  const chiffres = valeur.replace(/[^\d]/g, "");
  return (
    /^\+?[\d\s().-]+$/.test(valeur.trim()) &&
    chiffres.length >= 6 &&
    chiffres.length <= 20
  );
}

export function emailFicheValide(valeur: string): boolean {
  if (!valeur.trim()) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valeur.trim());
}

export function fichePoliceValide(
  fiche: Pick<
    NouvelleFichePolice,
    | "nom"
    | "prenoms"
    | "nationalite"
    | "dateNaissance"
    | "lieuNaissance"
    | "domicile"
    | "telephone"
    | "email"
  >,
): boolean {
  return (
    texte(fiche.nom, 2, 120) &&
    texte(fiche.prenoms, 2, 120) &&
    texte(fiche.nationalite, 2, 80) &&
    dateNaissanceValide(fiche.dateNaissance) &&
    texte(fiche.lieuNaissance, 2, 160) &&
    texte(fiche.domicile, 5, 240) &&
    telephoneValide(fiche.telephone) &&
    emailFicheValide(fiche.email ?? "")
  );
}

/**
 * Échéance à 6 mois, jour borné au dernier jour du mois cible (31 août →
 * 28/29 février) : jamais de report au mois suivant.
 */
export function datePurgePolice(creation: Date): Date {
  const cible = new Date(creation.getTime());
  const jour = cible.getUTCDate();
  cible.setUTCDate(1);
  cible.setUTCMonth(cible.getUTCMonth() + DUREE_CONSERVATION_MOIS);
  const dernierJour = new Date(
    Date.UTC(cible.getUTCFullYear(), cible.getUTCMonth() + 1, 0),
  ).getUTCDate();
  cible.setUTCDate(Math.min(jour, dernierJour));
  return cible;
}

export function fichesRestantes(
  voyageurs: number,
  fichesExistantes: number,
): number {
  return Math.max(0, Math.max(0, voyageurs) - Math.max(0, fichesExistantes));
}
