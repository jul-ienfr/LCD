import { ErreurMetier } from "./erreurs";

export interface EtapeFormation {
  code: string;
  titre: string;
  detail: string;
}

export interface ModuleFormation {
  code: string;
  titre: string;
  description: string;
  etapes: readonly EtapeFormation[];
}

export interface ProgressionFormation {
  tenantId: string;
  userId: string;
  moduleCode: string;
  etapesFaites: string[];
  updatedAt: Date;
}

export const MODULES_FORMATION: readonly ModuleFormation[] = [
  {
    code: "accueil",
    titre: "Accueil voyageur",
    description:
      "Préparer le logement, envoyer les bons messages et sécuriser l’arrivée.",
    etapes: [
      {
        code: "guide",
        titre: "Relire le guide du logement",
        detail: "Check-in, wifi, règles et numéro d’urgence à jour.",
      },
      {
        code: "etat-entree",
        titre: "Faire l’état des lieux d’entrée",
        detail: "Photographier les biens et signaler tout écart.",
      },
      {
        code: "message-arrivee",
        titre: "Envoyer le message d’arrivée",
        detail: "Utiliser une phrase type avec les variables du séjour.",
      },
      {
        code: "check-in",
        titre: "Vérifier l’accès le jour J",
        detail: "Code ou clés testés avant l’arrivée du voyageur.",
      },
    ],
  },
  {
    code: "menage",
    titre: "Ménage et inventaire",
    description:
      "Remettre le logement en état et maintenir les stocks au bon niveau.",
    etapes: [
      {
        code: "checklist",
        titre: "Suivre la checklist ménage",
        detail: "Cocher chaque tâche puis passer le ménage à « Fait ».",
      },
      {
        code: "degradation",
        titre: "Signaler une dégradation",
        detail: "Créer un constat de sortie et chiffrer le remplacement.",
      },
      {
        code: "reassort",
        titre: "Réassortir les consommables",
        detail: "Comparer stock et seuil, puis remettre à la cible.",
      },
      {
        code: "inventaire",
        titre: "Mettre à jour l’inventaire",
        detail: "Enregistrer les usages et les lavages des biens.",
      },
    ],
  },
  {
    code: "securite",
    titre: "Urgences et sécurité",
    description:
      "Réagir vite et correctement en cas d’incident dans le logement.",
    etapes: [
      {
        code: "numeros",
        titre: "Connaître les numéros utiles",
        detail: "112, 18, 15 et le contact d’astreinte de l’hôte.",
      },
      {
        code: "coupures",
        titre: "Localiser les coupures",
        detail: "Vanne d’eau, tableau électrique et arrivée gaz.",
      },
      {
        code: "incident",
        titre: "Déclarer un incident",
        detail: "Utiliser le formulaire voyageur ou l’API idempotente.",
      },
      {
        code: "detecteurs",
        titre: "Tester les détecteurs",
        detail: "Fumée et monoxyde de carbone, une fois par mois.",
      },
    ],
  },
  {
    code: "facturation",
    titre: "Facturation et paiements",
    description:
      "Émettre des factures conformes et suivre les règlements.",
    etapes: [
      {
        code: "facture",
        titre: "Créer une facture",
        detail: "Choisir le séjour, vérifier le montant et la TVA.",
      },
      {
        code: "mentions",
        titre: "Vérifier les mentions légales",
        detail: "SIREN, adresse et régime fiscal de l’entité.",
      },
      {
        code: "factur-x",
        titre: "Exporter Factur-X",
        detail: "Télécharger le PDF avec XML incorporé.",
      },
      {
        code: "paiements",
        titre: "Suivre les paiements",
        detail: "Saisir les règlements et contrôler le reste à payer.",
      },
    ],
  },
];

export function moduleParCode(code: string): ModuleFormation | null {
  return MODULES_FORMATION.find((module) => module.code === code) ?? null;
}

export function etapesConnues(
  module: ModuleFormation,
  codes: readonly string[],
): string[] {
  const connus = new Set(module.etapes.map((etape) => etape.code));
  return [...new Set(codes)].filter((code) => connus.has(code));
}

export function avancementFormation(
  module: ModuleFormation,
  etapesFaites: readonly string[],
): { faites: number; total: number; pourcentage: number; termine: boolean } {
  const total = module.etapes.length;
  const faites = etapesConnues(module, etapesFaites).length;
  return {
    faites,
    total,
    pourcentage: total === 0 ? 0 : Math.round((faites / total) * 100),
    termine: total > 0 && faites === total,
  };
}

export function avancementGlobal(
  progressions: readonly Pick<
    ProgressionFormation,
    "moduleCode" | "etapesFaites"
  >[],
): { faites: number; total: number; pourcentage: number } {
  let faites = 0;
  let total = 0;
  for (const moduleFormation of MODULES_FORMATION) {
    const progression = progressions.find(
      (p) => p.moduleCode === moduleFormation.code,
    );
    const avancement = avancementFormation(
      moduleFormation,
      progression?.etapesFaites ?? [],
    );
    faites += avancement.faites;
    total += avancement.total;
  }
  return {
    faites,
    total,
    pourcentage: total === 0 ? 0 : Math.round((faites / total) * 100),
  };
}

export function validerProgression(input: {
  moduleCode: string;
  etapesFaites: readonly string[];
}): { module: ModuleFormation; etapesFaites: string[] } {
  const moduleFormation = moduleParCode(input.moduleCode);
  if (!moduleFormation) {
    throw new ErreurMetier(
      "FORMATION_INVALIDE",
      "Le module de formation est inconnu.",
    );
  }
  return {
    module: moduleFormation,
    etapesFaites: etapesConnues(moduleFormation, input.etapesFaites),
  };
}
