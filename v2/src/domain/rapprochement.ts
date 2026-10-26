/**
 * Rapprochement bancaire (CSV) — pur, sans I/O.
 * Le CSV accepte « date, libellé, montant » (signé) ou « date, libellé,
 * débit, crédit », séparateur `;` ou `,`, dates JJ/MM/AAAA ou AAAA-MM-JJ.
 * Les montants sont convertis en centimes entiers ; toute ligne invalide
 * invalide l'import (jamais d'import partiel silencieux).
 */

import type { Paiement } from "./paiement";

export interface LigneReleve {
  dateOperation: string;
  libelle: string;
  montantCentimes: number;
  reference: string | null;
}

export interface LigneRapprochee extends LigneReleve {
  statut: "rapproche" | "orpheline" | "ignoree";
  paiementId: string | null;
}

export interface PaiementAttendu {
  id: string;
  ref: string;
  montantCentimes: number;
  datePaiement: string;
  reference: string | null;
}

export interface ResultatRapprochement {
  lignes: LigneRapprochee[];
  paiementsAttendus: PaiementAttendu[];
  paiementsNonRetrouves: PaiementAttendu[];
  totalCreditsCentimes: number;
  totalDebitsCentimes: number;
  attendusCentimes: number;
  ecartBp: number;
}

export interface ErreurCsv {
  ligne: number;
  message: string;
}

export type StatutLigneBanque = "rapproche" | "orpheline" | "ignoree";

export interface ImportBanque {
  id: string;
  tenantId: string;
  ref: string;
  nomFichier: string;
  periodeDebut: string;
  periodeFin: string;
  totalCreditsCentimes: number;
  totalDebitsCentimes: number;
  attendusCentimes: number;
  ecartBp: number;
  lignesTotal: number;
  lignesRapprochees: number;
  lignesOrphelines: number;
  createdAt: Date;
}

export interface LigneBanque {
  id: string;
  tenantId: string;
  importId: string;
  ref: string;
  dateOperation: string;
  libelle: string;
  montantCentimes: number;
  paiementId: string | null;
  statut: StatutLigneBanque;
  createdAt: Date;
}

const TAILLE_MAX_LIGNES = 2000;
const TAILLE_MAX_LIBELLE = 240;
const TOLERANCE_JOURS = 3;
const SEUIL_ALERTE_BP = 200;

function normaliserEntete(valeur: string): string {
  return valeur
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function decouperLigne(ligne: string, separateur: string): string[] {
  const cellules: string[] = [];
  let courant = "";
  let entreGuillemets = false;
  for (let i = 0; i < ligne.length; i += 1) {
    const caractere = ligne[i]!;
    if (caractere === '"') {
      if (entreGuillemets && ligne[i + 1] === '"') {
        courant += '"';
        i += 1;
      } else {
        entreGuillemets = !entreGuillemets;
      }
    } else if (caractere === separateur && !entreGuillemets) {
      cellules.push(courant.trim());
      courant = "";
    } else {
      courant += caractere;
    }
  }
  cellules.push(courant.trim());
  return cellules;
}

function dateIso(valeur: string): string | null {
  const brut = valeur.trim();
  let annee: number;
  let mois: number;
  let jour: number;
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(brut);
  const fr = /^(\d{2})[/-](\d{2})[/-](\d{4})$/.exec(brut);
  if (iso) {
    annee = Number(iso[1]);
    mois = Number(iso[2]);
    jour = Number(iso[3]);
  } else if (fr) {
    jour = Number(fr[1]);
    mois = Number(fr[2]);
    annee = Number(fr[3]);
  } else {
    return null;
  }
  const date = new Date(Date.UTC(annee, mois - 1, jour));
  if (
    date.getUTCFullYear() !== annee ||
    date.getUTCMonth() !== mois - 1 ||
    date.getUTCDate() !== jour
  ) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

export function montantCentimes(valeur: string): number | null {
  let brut = valeur.replace(/[\s\u00a0€]/g, "").trim();
  if (!brut) return null;
  let negatif = false;
  if (/^\(.*\)$/.test(brut)) {
    negatif = true;
    brut = brut.slice(1, -1);
  }
  if (brut.startsWith("-")) {
    negatif = !negatif;
    brut = brut.slice(1);
  } else if (brut.startsWith("+")) {
    brut = brut.slice(1);
  }
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(brut)) return null;
  const [entier, decimal = ""] = brut.replace(",", ".").split(".");
  const centimes =
    Number(entier) * 100 + Number(decimal.padEnd(2, "0").slice(0, 2));
  return negatif ? -centimes : centimes;
}

export function parseCsvBanque(texte: string): {
  lignes: LigneReleve[];
  erreurs: ErreurCsv[];
} {
  const erreurs: ErreurCsv[] = [];
  const brut = texte.replace(/^\uFEFF/, "").split(/\r?\n/);
  const nonVides = brut
    .map((ligne, index) => ({ ligne, numero: index + 1 }))
    .filter(({ ligne }) => ligne.trim().length > 0);
  if (nonVides.length < 2) {
    return {
      lignes: [],
      erreurs: [{ ligne: 1, message: "CSV vide ou sans données." }],
    };
  }
  if (nonVides.length - 1 > TAILLE_MAX_LIGNES) {
    return {
      lignes: [],
      erreurs: [
        {
          ligne: TAILLE_MAX_LIGNES + 2,
          message: `Maximum ${TAILLE_MAX_LIGNES} lignes par import.`,
        },
      ],
    };
  }

  const entete = nonVides[0]!;
  const separateur = entete.ligne.includes(";") ? ";" : ",";
  const colonnes = decouperLigne(entete.ligne, separateur).map(normaliserEntete);
  const indexDate = colonnes.indexOf("date");
  const indexLibelle = colonnes.indexOf("libelle");
  const indexMontant = colonnes.indexOf("montant");
  const indexDebit = colonnes.indexOf("debit");
  const indexCredit = colonnes.indexOf("credit");
  const indexReference = colonnes.indexOf("reference");
  const montantSepare =
    indexMontant === -1 && indexDebit !== -1 && indexCredit !== -1;

  if (indexDate === -1 || indexLibelle === -1 || (indexMontant === -1 && !montantSepare)) {
    return {
      lignes: [],
      erreurs: [
        {
          ligne: entete.numero,
          message:
            "En-tête attendu : date, libelle, montant (ou debit et credit).",
        },
      ],
    };
  }

  const lignes: LigneReleve[] = [];
  for (const { ligne, numero } of nonVides.slice(1)) {
    const cellules = decouperLigne(ligne, separateur);
    const dateOperation = dateIso(cellules[indexDate] ?? "");
    if (!dateOperation) {
      erreurs.push({ ligne: numero, message: "Date invalide (JJ/MM/AAAA)." });
      continue;
    }
    const libelle = (cellules[indexLibelle] ?? "").slice(0, TAILLE_MAX_LIBELLE);
    if (libelle.trim().length < 2) {
      erreurs.push({ ligne: numero, message: "Libellé manquant." });
      continue;
    }

    let montant: number | null;
    if (indexMontant !== -1) {
      montant = montantCentimes(cellules[indexMontant] ?? "");
    } else {
      const debit = montantCentimes(cellules[indexDebit] ?? "");
      const credit = montantCentimes(cellules[indexCredit] ?? "");
      if (debit !== null && debit !== 0) {
        montant = -Math.abs(debit);
      } else if (credit !== null && credit !== 0) {
        montant = Math.abs(credit);
      } else {
        montant = null;
      }
    }
    if (montant === null || montant === 0) {
      erreurs.push({ ligne: numero, message: "Montant invalide ou nul." });
      continue;
    }

    const reference = indexReference !== -1
      ? (cellules[indexReference] ?? "").trim() || null
      : null;
    lignes.push({
      dateOperation,
      libelle: libelle.trim(),
      montantCentimes: montant,
      reference,
    });
  }

  if (lignes.length === 0 && erreurs.length === 0) {
    erreurs.push({ ligne: 2, message: "Aucune opération lisible." });
  }
  return { lignes, erreurs };
}

function jourEnMillisecondes(dateIsoBrut: string): number {
  return new Date(`${dateIsoBrut}T00:00:00Z`).getTime();
}

function normaliserTexte(valeur: string): string {
  return valeur
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function differenceJours(a: string, b: string): number {
  return Math.round(
    Math.abs(jourEnMillisecondes(a) - jourEnMillisecondes(b)) / 86_400_000,
  );
}

/**
 * Rapproche les crédits du relevé aux paiements non espèces du tenant.
 * Un paiement n'est consommé qu'une fois ; la référence du paiement/CSV
 * départage les candidats de même montant.
 */
export function rapprocher(
  lignes: LigneReleve[],
  paiements: Paiement[],
): ResultatRapprochement {
  const attendus: PaiementAttendu[] = paiements
    .filter((paiement) => paiement.mode !== "especes")
    .map((paiement) => ({
      id: paiement.id,
      ref: paiement.ref,
      montantCentimes: paiement.montantCentimes,
      datePaiement: paiement.datePaiement,
      reference: paiement.reference,
    }))
    .sort((a, b) => a.datePaiement.localeCompare(b.datePaiement));

  const consommes = new Set<string>();
  const lignesRapprochees: LigneRapprochee[] = lignes.map((ligne) => {
    if (ligne.montantCentimes < 0) {
      return { ...ligne, statut: "ignoree", paiementId: null };
    }
    const candidates = attendus
      .filter(
        (paiement) =>
          !consommes.has(paiement.id) &&
          paiement.montantCentimes === ligne.montantCentimes &&
          differenceJours(paiement.datePaiement, ligne.dateOperation) <=
            TOLERANCE_JOURS,
      )
      .sort((a, b) => {
        const referenceLigne = normaliserTexte(
          `${ligne.libelle} ${ligne.reference ?? ""}`,
        );
        const aRef = a.reference
          ? referenceLigne.includes(normaliserTexte(a.reference))
          : false;
        const bRef = b.reference
          ? referenceLigne.includes(normaliserTexte(b.reference))
          : false;
        if (aRef !== bRef) return aRef ? -1 : 1;
        return (
          differenceJours(a.datePaiement, ligne.dateOperation) -
          differenceJours(b.datePaiement, ligne.dateOperation)
        );
      });
    const choisi = candidates[0];
    if (!choisi) {
      return { ...ligne, statut: "orpheline", paiementId: null };
    }
    consommes.add(choisi.id);
    return { ...ligne, statut: "rapproche", paiementId: choisi.id };
  });

  const totalCreditsCentimes = lignes
    .filter((ligne) => ligne.montantCentimes > 0)
    .reduce((total, ligne) => total + ligne.montantCentimes, 0);
  const totalDebitsCentimes = lignes
    .filter((ligne) => ligne.montantCentimes < 0)
    .reduce((total, ligne) => total + ligne.montantCentimes, 0);
  const attendusCentimes = attendus.reduce(
    (total, paiement) => total + paiement.montantCentimes,
    0,
  );
  const ecartBp =
    totalCreditsCentimes === 0
      ? 0
      : Math.round(
          (Math.abs(totalCreditsCentimes - attendusCentimes) * 10_000) /
            totalCreditsCentimes,
        );

  return {
    lignes: lignesRapprochees,
    paiementsAttendus: attendus,
    paiementsNonRetrouves: attendus.filter(
      (paiement) => !consommes.has(paiement.id),
    ),
    totalCreditsCentimes,
    totalDebitsCentimes,
    attendusCentimes,
    ecartBp,
  };
}

export function alerteEcart(ecartBp: number): boolean {
  return ecartBp > SEUIL_ALERTE_BP;
}

export function orphelinesAnciennes(
  lignes: LigneRapprochee[],
  aujourdHui: Date,
  jours = 7,
): LigneRapprochee[] {
  const limite = aujourdHui.getTime() - jours * 86_400_000;
  return lignes.filter(
    (ligne) =>
      ligne.statut === "orpheline" &&
      jourEnMillisecondes(ligne.dateOperation) < limite,
  );
}

export function periodeReleve(lignes: LigneReleve[]): {
  debut: string;
  fin: string;
} | null {
  if (lignes.length === 0) return null;
  const dates = lignes.map((ligne) => ligne.dateOperation).sort();
  return { debut: dates[0]!, fin: dates[dates.length - 1]! };
}
