import { ErreurMetier } from "./erreurs";

export interface TraitementRgpd {
  code: string;
  finalite: string;
  baseLegale: string;
  donnees: readonly string[];
  destinataires: string;
  dureeMoisParDefaut: number;
}

export const TRAITEMENTS_RGPD: readonly TraitementRgpd[] = [
  {
    code: "reservations",
    finalite: "Gérer les réservations et l’accueil des voyageurs",
    baseLegale: "Contrat",
    donnees: ["identité", "coordonnées", "dates de séjour"],
    destinataires: "Équipe hôte, plateformes de réservation",
    dureeMoisParDefaut: 36,
  },
  {
    code: "facturation",
    finalite: "Émettre les factures et tenir la comptabilité",
    baseLegale: "Obligation légale",
    donnees: ["identité", "adresse", "montants", "paiements"],
    destinataires: "Comptable, administration fiscale",
    dureeMoisParDefaut: 120,
  },
  {
    code: "support",
    finalite: "Répondre aux demandes et incidents",
    baseLegale: "Intérêt légitime",
    donnees: ["identité", "messages", "photos d’incident"],
    destinataires: "Équipe hôte",
    dureeMoisParDefaut: 36,
  },
  {
    code: "avis",
    finalite: "Publier les avis vérifiés des voyageurs",
    baseLegale: "Consentement",
    donnees: ["prénom", "note", "commentaire"],
    destinataires: "Public (site)",
    dureeMoisParDefaut: 24,
  },
  {
    code: "memoire",
    finalite: "Mémoriser les préférences des voyageurs fidèles",
    baseLegale: "Consentement",
    donnees: ["nom", "préférences", "e-mail haché"],
    destinataires: "Équipe hôte",
    dureeMoisParDefaut: 24,
  },
  {
    code: "objets_trouves",
    finalite: "Restituer les objets oubliés",
    baseLegale: "Intérêt légitime",
    donnees: ["identité", "contact", "description de l’objet"],
    destinataires: "Équipe hôte, transporteur",
    dureeMoisParDefaut: 12,
  },
  {
    code: "tranquillite",
    finalite: "Constater les nuisances sonores",
    baseLegale: "Intérêt légitime",
    donnees: ["mesures en dB", "dates", "notes"],
    destinataires: "Syndic, autorités si requis",
    dureeMoisParDefaut: 12,
  },
];

export const DUREE_RGPD_MAX_MOIS = 120;
export const NOTE_RGPD_MAX = 500;

export interface EntreeRegistre {
  actif: boolean;
  dureeMois: number;
  notes: string;
}

export interface RegistreRgpd {
  tenantId: string;
  dpoNom: string | null;
  dpoContact: string | null;
  hebergement: string;
  entrees: Record<string, EntreeRegistre>;
  updatedAt: Date;
}

export function traitementParCode(code: string): TraitementRgpd | null {
  return TRAITEMENTS_RGPD.find((t) => t.code === code) ?? null;
}

export function entreesParDefaut(): Record<string, EntreeRegistre> {
  return Object.fromEntries(
    TRAITEMENTS_RGPD.map((t) => [
      t.code,
      {
        actif: true,
        dureeMois: t.dureeMoisParDefaut,
        notes: "",
      },
    ]),
  );
}

export function validerEntrees(
  entrees: Record<string, Partial<EntreeRegistre>>,
): Record<string, EntreeRegistre> {
  const resultat: Record<string, EntreeRegistre> = {};
  for (const traitement of TRAITEMENTS_RGPD) {
    const entree = entrees[traitement.code] ?? {};
    const actif = entree.actif === true;
    const dureeMois = Number(entree.dureeMois ?? traitement.dureeMoisParDefaut);
    if (
      !Number.isInteger(dureeMois) ||
      dureeMois < 1 ||
      dureeMois > DUREE_RGPD_MAX_MOIS
    ) {
      throw new ErreurMetier(
        "RGPD_INVALIDE",
        `La durée de « ${traitement.finalite} » doit être un entier entre 1 et ${DUREE_RGPD_MAX_MOIS} mois.`,
      );
    }
    const notes = String(entree.notes ?? "").trim();
    if (notes.length > NOTE_RGPD_MAX) {
      throw new ErreurMetier(
        "RGPD_INVALIDE",
        `Les notes doivent contenir au plus ${NOTE_RGPD_MAX} caractères.`,
      );
    }
    resultat[traitement.code] = { actif, dureeMois, notes };
  }
  return resultat;
}

export function normaliserRegistre(input: {
  dpoNom?: string | null;
  dpoContact?: string | null;
  hebergement?: string | null;
  entrees: Record<string, Partial<EntreeRegistre>>;
}): {
  dpoNom: string | null;
  dpoContact: string | null;
  hebergement: string;
  entrees: Record<string, EntreeRegistre>;
} {
  const dpoNom = String(input.dpoNom ?? "").trim() || null;
  if (dpoNom && dpoNom.length > 120) {
    throw new ErreurMetier(
      "RGPD_INVALIDE",
      "Le nom du DPO doit contenir au plus 120 caractères.",
    );
  }
  const dpoContact = String(input.dpoContact ?? "").trim() || null;
  if (dpoContact && dpoContact.length > 200) {
    throw new ErreurMetier(
      "RGPD_INVALIDE",
      "Le contact du DPO doit contenir au plus 200 caractères.",
    );
  }
  const hebergement = String(input.hebergement ?? "").trim();
  if (hebergement.length < 2 || hebergement.length > 200) {
    throw new ErreurMetier(
      "RGPD_INVALIDE",
      "L’hébergement des données doit contenir 2 à 200 caractères.",
    );
  }
  return {
    dpoNom,
    dpoContact,
    hebergement,
    entrees: validerEntrees(input.entrees),
  };
}

export function completudeRegistre(registre: {
  dpoContact: string | null;
  hebergement: string;
  entrees: Record<string, EntreeRegistre>;
}): {
  actifs: number;
  documentes: number;
  pourcentage: number;
  complet: boolean;
  manquants: TraitementRgpd[];
} {
  const actifs = TRAITEMENTS_RGPD.filter(
    (t) => registre.entrees[t.code]?.actif === true,
  );
  const manquants = actifs.filter((t) => {
    const entree = registre.entrees[t.code];
    return !entree || entree.dureeMois < 1;
  });
  const contactOk = Boolean(registre.dpoContact && registre.dpoContact.length >= 5);
  const hebergementOk = registre.hebergement.trim().length >= 2;
  const documentes = actifs.length - manquants.length;
  return {
    actifs: actifs.length,
    documentes,
    pourcentage:
      actifs.length === 0
        ? 0
        : Math.round((documentes / actifs.length) * 100),
    complet:
      actifs.length > 0 &&
      manquants.length === 0 &&
      contactOk &&
      hebergementOk,
    manquants,
  };
}
