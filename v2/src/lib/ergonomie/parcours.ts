/**
 * Parcours P1 du plan 004 — source unique, pure, testable.
 * Chaque parcours décrit l'objectif utilisateur, les étapes et le critère
 * de succès mesurable utilisé en recette et en mesure first-party.
 */

export type ParcoursId =
  | "P-RESA"
  | "P-SEJOUR"
  | "P-HOTE-5"
  | "P-INCIDENT"
  | "P-PRESTA";

export type SurfaceParcours = "public" | "voyageur" | "staff" | "presta";

export interface EtapeParcours {
  id: string;
  libelle: string;
  route: string;
  actionPrimaire: string;
  critereSucces: string;
}

export interface Parcours {
  id: ParcoursId;
  surface: SurfaceParcours;
  objectif: string;
  persona: string;
  /** Durée cible de réussite complète, en secondes. */
  cibleSecondes: number;
  etapes: readonly EtapeParcours[];
}

export const PARCOURS: Record<ParcoursId, Parcours> = {
  "P-RESA": {
    id: "P-RESA",
    surface: "public",
    objectif:
      "Comprendre l'offre, vérifier une disponibilité et envoyer une demande de réservation.",
    persona: "Visiteur grand public, mobile, parfois sans JavaScript.",
    cibleSecondes: 180,
    etapes: [
      {
        id: "accueil",
        libelle: "Comprendre la promesse",
        route: "/",
        actionPrimaire: "Lire la promesse et voir un prix d'appel",
        critereSucces: "Promesse comprise en moins de 10 secondes.",
      },
      {
        id: "dates",
        libelle: "Choisir les dates",
        route: "/reserver",
        actionPrimaire: "Saisir arrivée, départ et voyageurs",
        critereSucces: "Validation inline sans rechargement perdu.",
      },
      {
        id: "logement",
        libelle: "Choisir un logement",
        route: "/reserver",
        actionPrimaire: "Comparer les logements disponibles",
        critereSucces: "Prix total et inclusions visibles avant choix.",
      },
      {
        id: "coordonnees",
        libelle: "Laisser ses coordonnées",
        route: "/reserver",
        actionPrimaire: "Renseigner nom, e-mail, téléphone, message",
        critereSucces: "Aucune donnée perdue en cas d'erreur.",
      },
      {
        id: "confirmation",
        libelle: "Recevoir la confirmation",
        route: "/reserver/confirmation",
        actionPrimaire: "Lire le récapitulatif et le délai de réponse",
        critereSucces: "Délai et prochaine étape explicites.",
      },
    ],
  },

  "P-SEJOUR": {
    id: "P-SEJOUR",
    surface: "voyageur",
    objectif:
      "Trouver immédiatement l'essentiel du séjour : accès, Wi-Fi, horaires, urgence.",
    persona: "Voyageur sur place, souvent en mobilité et en réseau faible.",
    cibleSecondes: 10,
    etapes: [
      {
        id: "ouverture",
        libelle: "Ouvrir le lien signé",
        route: "/voyageur",
        actionPrimaire: "Accéder au séjour sans compte",
        critereSucces: "Lien valide reconnu en une requête, sans JavaScript.",
      },
      {
        id: "essentiel",
        libelle: "Voir l'essentiel",
        route: "/voyageur",
        actionPrimaire: "Lire logement, dates, accès, Wi-Fi, horaires",
        critereSucces: "Information trouvée en moins de 10 secondes.",
      },
      {
        id: "guide",
        libelle: "Consulter le guide",
        route: "/voyageur/guide",
        actionPrimaire: "Lire les règles et les bonnes adresses",
        critereSucces: "Sections repliables accessibles au clavier.",
      },
      {
        id: "depart",
        libelle: "Préparer le départ",
        route: "/voyageur",
        actionPrimaire: "Connaître l'heure et les consignes de départ",
        critereSucces: "Consignes visibles sans défilement excessif.",
      },
    ],
  },

  "P-HOTE-5": {
    id: "P-HOTE-5",
    surface: "staff",
    objectif:
      "Accomplir les 5 tâches hôte les plus fréquentes en un minimum de clics.",
    persona: "Hôte ou opérateur, desktop et mobile, en cours de journée.",
    cibleSecondes: 120,
    etapes: [
      {
        id: "planning",
        libelle: "Vérifier le planning",
        route: "/hote/planning",
        actionPrimaire: "Voir les arrivées et départs du jour",
        critereSucces: "Information visible dès le premier écran.",
      },
      {
        id: "messages",
        libelle: "Répondre aux messages",
        route: "/hote/messages",
        actionPrimaire: "Ouvrir un fil et répondre",
        critereSucces: "Fil prioritaire identifiable sans recherche.",
      },
      {
        id: "menage",
        libelle: "Planifier un ménage",
        route: "/hote/menage",
        actionPrimaire: "Assigner une prestation",
        critereSucces: "Action réalisable en trois interactions maximum.",
      },
      {
        id: "factures",
        libelle: "Suivre une facture",
        route: "/hote/factures",
        actionPrimaire: "Identifier une facture en retard",
        critereSucces: "Statut et montant lisibles sans ouvrir le détail.",
      },
      {
        id: "logements",
        libelle: "Mettre à jour un logement",
        route: "/hote/logements",
        actionPrimaire: "Modifier une information logement",
        critereSucces: "Recherche globale ou filtre disponible.",
      },
    ],
  },

  "P-INCIDENT": {
    id: "P-INCIDENT",
    surface: "voyageur",
    objectif: "Signaler un incident et suivre sa prise en charge.",
    persona: "Voyageur sur place, en urgence relative.",
    cibleSecondes: 90,
    etapes: [
      {
        id: "signalement",
        libelle: "Signaler l'incident",
        route: "/voyageur/incident",
        actionPrimaire: "Décrire l'incident et joindre une photo",
        critereSucces: "Envoi possible sans compte, rejeu idempotent.",
      },
      {
        id: "accuse",
        libelle: "Recevoir un accusé",
        route: "/voyageur/incident",
        actionPrimaire: "Lire le délai de prise en charge",
        critereSucces: "Délai explicite et numéro de suivi affiché.",
      },
      {
        id: "suivi",
        libelle: "Suivre le traitement",
        route: "/hote/sinistres",
        actionPrimaire: "Côté staff : qualifier et assigner",
        critereSucces: "Incident visible dans la file priorisée.",
      },
    ],
  },

  "P-PRESTA": {
    id: "P-PRESTA",
    surface: "presta",
    objectif: "Réaliser une mission assignée et la clôturer avec preuve.",
    persona: "Prestataire de ménage ou de maintenance, mobile, sur le terrain.",
    cibleSecondes: 150,
    etapes: [
      {
        id: "mission",
        libelle: "Ouvrir la mission",
        route: "/hote/missions",
        actionPrimaire: "Voir lieu, créneau et consignes",
        critereSucces: "Adresse et créneau lisibles en un écran.",
      },
      {
        id: "execution",
        libelle: "Exécuter et prouver",
        route: "/hote/missions",
        actionPrimaire: "Ajouter photos et commentaire",
        critereSucces: "Ajout possible en réseau faible.",
      },
      {
        id: "cloture",
        libelle: "Clôturer",
        route: "/hote/missions",
        actionPrimaire: "Valider la fin de mission",
        critereSucces: "Statut mis à jour sans doublon.",
      },
    ],
  },
};

export const PARCOURS_P1: readonly Parcours[] = Object.values(PARCOURS);

export const parcours = (id: ParcoursId): Parcours => PARCOURS[id];
