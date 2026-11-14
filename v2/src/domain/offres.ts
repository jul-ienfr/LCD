/**
 * US8 (T806) — Offres publiques LCD et calculateur.
 *
 * Grille issue du positionnement commercial : FULL 25 % du brut HT avec un
 * plancher de 149 €/mois, PILOTAGE 149 €/logement/mois, KIT 890 € puis
 * 240 €/an. Le ménage et les consommables FULL restent facturés à part et ne
 * sont pas simulés ici.
 */
import type { Centimes } from "./pricing";

export const OFFRES = [
  {
    code: "FULL",
    nom: "FULL",
    accroche: "Conciergerie complète, clé en main",
    description:
      "Nous opérons la location de bout en bout : annonces, prix, messages, ménage, états des lieux, police et relevés.",
    inclus: [
      "Commercialisation et optimisation des prix",
      "Messages voyageurs et guide local",
      "Ménage, linge et états des lieux",
      "Déclarations et relevés propriétaire",
    ],
  },
  {
    code: "PILOTAGE",
    nom: "PILOTAGE",
    accroche: "Le logiciel et les process, sans l'opération",
    description:
      "Votre équipe garde la main sur le terrain ; LCD fournit le poste de pilotage, les automatisations et le support.",
    inclus: [
      "Planning, prix et canaux",
      "Messages, guides et formulaires",
      "Comptabilité et relevés propriétaire",
      "Support et mises à jour",
    ],
  },
  {
    code: "KIT",
    nom: "KIT",
    accroche: "Un site et les outils, prêts à démarrer",
    description:
      "Pour lancer votre conciergerie : site public, réservation directe, back-office et formation.",
    inclus: [
      "Site public et réservation directe",
      "Back-office complet",
      "Formation de démarrage",
      "Mises à jour la première année",
    ],
  },
] as const;

export type CodeOffre = (typeof OFFRES)[number]["code"];

export const PRIX_FULL_BP = 2500;
export const PLANCHER_FULL_MENSUEL_CENTIMES = 14_900;
export const PRIX_PILOTAGE_LOGEMENT_CENTIMES = 14_900;
export const PRIX_KIT_INITIAL_CENTIMES = 89_000;
export const PRIX_KIT_ANNUEL_CENTIMES = 24_000;

export interface SimulationOffre {
  code: CodeOffre;
  mensuelCentimes: Centimes;
  annuelCentimes: Centimes;
  note: string;
}

export function bornerLogements(valeur: number): number {
  if (!Number.isFinite(valeur)) return 1;
  return Math.min(50, Math.max(1, Math.round(valeur)));
}

export function bornerCa(valeur: number): number {
  if (!Number.isFinite(valeur)) return 0;
  return Math.min(100_000_000, Math.max(0, Math.round(valeur)));
}

export function simulerOffre(
  code: CodeOffre,
  input: { logements: number; caMensuelCentimes: number },
): SimulationOffre {
  const logements = bornerLogements(input.logements);
  const ca = bornerCa(input.caMensuelCentimes);

  if (code === "FULL") {
    const commission = Math.round((ca * PRIX_FULL_BP) / 10_000);
    const mensuel = Math.max(PLANCHER_FULL_MENSUEL_CENTIMES, commission);
    return {
      code,
      mensuelCentimes: mensuel,
      annuelCentimes: mensuel * 12,
      note:
        commission < PLANCHER_FULL_MENSUEL_CENTIMES
          ? "Plancher de 149 €/mois appliqué ; ménage et consommables en sus."
          : "25 % du brut HT ; ménage et consommables en sus.",
    };
  }

  if (code === "PILOTAGE") {
    const mensuel = PRIX_PILOTAGE_LOGEMENT_CENTIMES * logements;
    return {
      code,
      mensuelCentimes: mensuel,
      annuelCentimes: mensuel * 12,
      note: `${logements} logement(s) × 149 €/mois.`,
    };
  }

  return {
    code: "KIT",
    mensuelCentimes: Math.round(PRIX_KIT_ANNUEL_CENTIMES / 12),
    annuelCentimes: PRIX_KIT_ANNUEL_CENTIMES,
    note: "890 € au démarrage, puis 240 €/an. Le calculateur affiche le coût récurrent.",
  };
}

export function euros(centimes: Centimes): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: centimes % 100 === 0 ? 0 : 2,
  }).format(centimes / 100);
}
