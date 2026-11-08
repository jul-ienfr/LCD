export const CODES_FOURNISSEURS = [
  "beds24",
  "channex",
  "smoobu",
  "hostport",
  "nobeds",
] as const;

export type CodeFournisseur = (typeof CODES_FOURNISSEURS)[number];

export type ModeFournisseur = "complet" | "partiel" | "lecture_seule";

export interface CapacitesFournisseur {
  ecritureDisponibilites: boolean;
  ecritureTarifs: boolean;
  ecritureRestrictions: boolean;
  lectureReservations: boolean;
  webhooks: boolean;
  marqueBlanche: boolean;
}

export interface FicheFournisseur {
  code: CodeFournisseur;
  nom: string;
  editeur: string;
  mode: ModeFournisseur;
  capacites: CapacitesFournisseur;
  prix: string;
  site: string;
  documentation: string;
  pointsForts: readonly string[];
  limites: readonly string[];
  aVerifier: boolean;
}

export const CATALOGUE_FOURNISSEURS: readonly FicheFournisseur[] = [
  {
    code: "beds24",
    nom: "Beds24",
    editeur: "Beds24",
    mode: "complet",
    capacites: {
      ecritureDisponibilites: true,
      ecritureTarifs: true,
      ecritureRestrictions: true,
      lectureReservations: true,
      webhooks: true,
      marqueBlanche: false,
    },
    prix: "Dès 17,15 €/mois (1 logement, 3 canaux)",
    site: "https://www.beds24.com/",
    documentation: "https://beds24.com/api/v2/",
    pointsForts: [
      "API complète, webhooks, tarifs et restrictions",
      "Le moins cher des fournisseurs complets pour 1 à 30 logements",
      "Couverture internationale large",
    ],
    limites: [
      "Interface moins guidée qu’un PMS",
      "Pas de marque blanche channel manager",
    ],
    aVerifier: false,
  },
  {
    code: "channex",
    nom: "Channex",
    editeur: "Channex",
    mode: "complet",
    capacites: {
      ecritureDisponibilites: true,
      ecritureTarifs: true,
      ecritureRestrictions: true,
      lectureReservations: true,
      webhooks: true,
      marqueBlanche: true,
    },
    prix: "130 $/mois + 0,50 $/unité",
    site: "https://channex.io/",
    documentation: "https://docs.channex.io/",
    pointsForts: [
      "API moderne, staging gratuit, webhooks",
      "Marque blanche et 77 OTA",
      "Le meilleur coût à partir de ~30 logements",
    ],
    limites: [
      "Ticket d’entrée élevé pour un petit parc",
      "Pas de Gîtes de France, Clévacances ni Leboncoin natif",
    ],
    aVerifier: false,
  },
  {
    code: "smoobu",
    nom: "Smoobu",
    editeur: "Smoobu",
    mode: "partiel",
    capacites: {
      ecritureDisponibilites: false,
      ecritureTarifs: true,
      ecritureRestrictions: true,
      lectureReservations: true,
      webhooks: true,
      marqueBlanche: false,
    },
    prix: "35 €/mois Prepaid (0 %) ou 29 €/mois + 0,9 %",
    site: "https://www.smoobu.com/",
    documentation: "https://docs.smoobu.com/",
    pointsForts: [
      "API et webhooks simples",
      "Interface guidée, adaptée aux petits parcs",
      "Essai gratuit",
    ],
    limites: [
      "Pas d’écriture de disponibilité ni de CTA/CTD dans l’API publique",
      "Plus cher que Beds24 à volume égal",
      "Pas de marque blanche",
    ],
    aVerifier: false,
  },
  {
    code: "hostport",
    nom: "Host Port",
    editeur: "Host Port",
    mode: "lecture_seule",
    capacites: {
      ecritureDisponibilites: false,
      ecritureTarifs: false,
      ecritureRestrictions: false,
      lectureReservations: true,
      webhooks: true,
      marqueBlanche: false,
    },
    prix: "0 € en iCal ; 9 €/logement/mois en Pro",
    site: "https://hostport.co/",
    documentation: "https://hostport.co/data-connections",
    pointsForts: [
      "Le moins cher en autonome pour 1 à 2 logements",
      "API de lecture et webhooks pour importer les réservations",
      "488 canaux via Channex en Pro",
    ],
    limites: [
      "Aucune API d’écriture ARI : ne peut pas piloter les canaux depuis la V2",
      "Pas de marque blanche channel manager",
    ],
    aVerifier: false,
  },
  {
    code: "nobeds",
    nom: "Nobeds",
    editeur: "Nobeds",
    mode: "partiel",
    capacites: {
      ecritureDisponibilites: true,
      ecritureTarifs: true,
      ecritureRestrictions: false,
      lectureReservations: true,
      webhooks: false,
      marqueBlanche: true,
    },
    prix: "99 $/mois API, jusqu’à 1 000 propriétés",
    site: "https://nobeds.com/",
    documentation: "https://nobeds.com/api/",
    pointsForts: [
      "API disponibilités, tarifs et réservations, MCP",
      "White-label et jusqu’à 1 000 propriétés",
      "Très compétitif au-delà de 100 logements",
    ],
    limites: [
      "Fournisseur jeune, à auditer",
      "Min stay non poussé sans réécrire disponibilité et prix ; pas de CTA/CTD ni de webhooks documentés",
    ],
    aVerifier: true,
  },
];

const PAR_CODE = new Map<string, FicheFournisseur>(
  CATALOGUE_FOURNISSEURS.map((fiche) => [fiche.code, fiche]),
);

export function ficheFournisseur(code: string): FicheFournisseur | null {
  return PAR_CODE.get(code) ?? null;
}

export function codeFournisseurValide(code: string): code is CodeFournisseur {
  return PAR_CODE.has(code);
}

export function fournisseurEcriture(code: CodeFournisseur): boolean {
  return ficheFournisseur(code)?.mode === "complet";
}

export interface RecommandationFournisseur {
  min: number;
  max: number | null;
  principal: CodeFournisseur;
  alternative: CodeFournisseur | null;
  motif: string;
}

export const RECOMMANDATIONS_FOURNISSEURS: readonly RecommandationFournisseur[] =
  [
    {
      min: 1,
      max: 2,
      principal: "beds24",
      alternative: "hostport",
      motif:
        "Beds24 est le pilote complet le moins cher pour la V2 ; Host Port Pro reste l’option autonome à 9 €/logement.",
    },
    {
      min: 3,
      max: 10,
      principal: "beds24",
      alternative: "smoobu",
      motif:
        "Beds24 reste le seul pilote complet à ce volume ; Smoobu est une alternative simple mais ne pousse pas les disponibilités.",
    },
    {
      min: 11,
      max: 29,
      principal: "beds24",
      alternative: "channex",
      motif:
        "Beds24 reste devant jusqu’à ~30 logements ; Channex devient compétitif à l’approche du seuil.",
    },
    {
      min: 30,
      max: 99,
      principal: "channex",
      alternative: "beds24",
      motif:
        "Le fixe de Channex est amorti : moins cher que Beds24 et white-label disponible.",
    },
    {
      min: 100,
      max: null,
      principal: "channex",
      alternative: "nobeds",
      motif:
        "Channex reste la référence ; Nobeds API à 99 $/mois est à tester comme alternative volume.",
    },
  ];

export function recommandationPour(
  nombreLogements: number,
): RecommandationFournisseur {
  const nombre = Math.max(1, Math.floor(nombreLogements));
  const trouvee = RECOMMANDATIONS_FOURNISSEURS.find(
    (entree) =>
      nombre >= entree.min && (entree.max === null || nombre <= entree.max),
  );
  if (trouvee) return trouvee;
  const derniere =
    RECOMMANDATIONS_FOURNISSEURS[RECOMMANDATIONS_FOURNISSEURS.length - 1];
  if (!derniere) throw new Error("Recommandations fournisseurs absentes.");
  return derniere;
}

export function libelleMode(mode: ModeFournisseur): string {
  if (mode === "complet") return "Écriture complète";
  if (mode === "partiel") return "Écriture partielle";
  return "Lecture seule";
}

export function externalPropertyIdValide(valeur: string | null): boolean {
  if (valeur === null) return true;
  return (
    valeur.length <= 160 &&
    !/[\u0000-\u001f\u007f]/u.test(valeur)
  );
}
