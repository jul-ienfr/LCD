import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsDispatch {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  okRetire: string;
  okPropose: string;
  erreurInattendue: string;
  aucunPrestataire: string;
  missionsAVenir: (n: number) => string;
  aucuneMission: string;
  mission: string;
  logement: string;
  date: string;
  assigne: string;
  offreEnCours: string;
  dispatcher: string;
  aucuneOffre: string;
  retirerOffre: string;
  choisir: string;
  messagePlaceholder: string;
  proposer: string;
  enCours: string;
  nonDispatchable: string;
  historique: string;
  aucuneOffreHistorique: string;
  types: Record<string, string>;
  statutsMission: Record<string, string>;
  statutsDispatch: Record<string, string>;
}

const FR: TraductionsDispatch = {
  titrePage: "Dispatch prestataires — Espace hôte",
  surtitre: "Espace hôte · Prestataires",
  titre: "Dispatch prestataires",
  description:
    "Proposez une mission, suivez les réponses et réassignez sans chevauchement.",
  okRetire: "Offre retirée.",
  okPropose: "Offre envoyée au prestataire.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  aucunPrestataire:
    "Aucun prestataire actif. Créez un utilisateur de rôle presta avant de dispatcher.",
  missionsAVenir: (n) => `Missions à venir (${n})`,
  aucuneMission:
    "Aucune mission sur les 90 prochains jours. Créez-en une depuis « Missions ».",
  mission: "Mission",
  logement: "Logement",
  date: "Date",
  assigne: "Assigné",
  offreEnCours: "Offre en cours",
  dispatcher: "Dispatcher",
  aucuneOffre: "Aucune",
  retirerOffre: "Retirer l’offre",
  choisir: "Choisir…",
  messagePlaceholder: "Créneau, consignes…",
  proposer: "Proposer",
  enCours: "En cours",
  nonDispatchable: "Non dispatchable",
  historique: "Historique des offres",
  aucuneOffreHistorique: "Aucune offre pour le moment.",
  types: {
    menage: "Ménage",
    maintenance: "Maintenance",
    accueil: "Accueil",
    autre: "Autre",
  },
  statutsMission: {
    planifiee: "Planifiée",
    en_cours: "En cours",
    terminee: "Terminée",
    annulee: "Annulée",
  },
  statutsDispatch: {
    proposee: "Proposée",
    acceptee: "Acceptée",
    refusee: "Refusée",
    retiree: "Retirée",
  },
};

const EN: TraductionsDispatch = {
  titrePage: "Provider dispatch — Staff area",
  surtitre: "Staff area · Providers",
  titre: "Provider dispatch",
  description:
    "Offer a mission, track responses and reassign without overlap.",
  okRetire: "Offer withdrawn.",
  okPropose: "Offer sent to the provider.",
  erreurInattendue: "Unexpected error. Try again.",
  aucunPrestataire:
    "No active provider. Create a user with the presta role before dispatching.",
  missionsAVenir: (n) => `Upcoming missions (${n})`,
  aucuneMission:
    "No mission in the next 90 days. Create one from “Missions”.",
  mission: "Mission",
  logement: "Property",
  date: "Date",
  assigne: "Assigned",
  offreEnCours: "Current offer",
  dispatcher: "Dispatch",
  aucuneOffre: "None",
  retirerOffre: "Withdraw offer",
  choisir: "Choose…",
  messagePlaceholder: "Slot, instructions…",
  proposer: "Offer",
  enCours: "In progress",
  nonDispatchable: "Not dispatchable",
  historique: "Offer history",
  aucuneOffreHistorique: "No offer yet.",
  types: {
    menage: "Cleaning",
    maintenance: "Maintenance",
    accueil: "Check-in",
    autre: "Other",
  },
  statutsMission: {
    planifiee: "Scheduled",
    en_cours: "In progress",
    terminee: "Completed",
    annulee: "Cancelled",
  },
  statutsDispatch: {
    proposee: "Offered",
    acceptee: "Accepted",
    refusee: "Declined",
    retiree: "Withdrawn",
  },
};

const ES: TraductionsDispatch = {
  titrePage: "Dispatch de proveedores — Área profesional",
  surtitre: "Área profesional · Proveedores",
  titre: "Dispatch de proveedores",
  description:
    "Proponga una misión, siga las respuestas y reasigne sin solapamientos.",
  okRetire: "Oferta retirada.",
  okPropose: "Oferta enviada al proveedor.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  aucunPrestataire:
    "Ningún proveedor activo. Cree un usuario con el rol presta antes de hacer dispatch.",
  missionsAVenir: (n) => `Misiones próximas (${n})`,
  aucuneMission:
    "Ninguna misión en los próximos 90 días. Cree una desde «Misiones».",
  mission: "Misión",
  logement: "Alojamiento",
  date: "Fecha",
  assigne: "Asignado",
  offreEnCours: "Oferta en curso",
  dispatcher: "Dispatch",
  aucuneOffre: "Ninguna",
  retirerOffre: "Retirar la oferta",
  choisir: "Elegir…",
  messagePlaceholder: "Franja, instrucciones…",
  proposer: "Proponer",
  enCours: "En curso",
  nonDispatchable: "No disponible para dispatch",
  historique: "Historial de ofertas",
  aucuneOffreHistorique: "Ninguna oferta por el momento.",
  types: {
    menage: "Limpieza",
    maintenance: "Mantenimiento",
    accueil: "Recepción",
    autre: "Otro",
  },
  statutsMission: {
    planifiee: "Planificada",
    en_cours: "En curso",
    terminee: "Terminada",
    annulee: "Anulada",
  },
  statutsDispatch: {
    proposee: "Propuesta",
    acceptee: "Aceptada",
    refusee: "Rechazada",
    retiree: "Retirada",
  },
};

const IT: TraductionsDispatch = {
  titrePage: "Dispatch fornitori — Area professionale",
  surtitre: "Area professionale · Fornitori",
  titre: "Dispatch fornitori",
  description:
    "Proponi una missione, segui le risposte e riassegna senza sovrapposizioni.",
  okRetire: "Offerta ritirata.",
  okPropose: "Offerta inviata al fornitore.",
  erreurInattendue: "Errore imprevisto. Riprovare.",
  aucunPrestataire:
    "Nessun fornitore attivo. Creare un utente con ruolo presta prima del dispatch.",
  missionsAVenir: (n) => `Missioni in arrivo (${n})`,
  aucuneMission:
    "Nessuna missione nei prossimi 90 giorni. Crearne una da «Missioni».",
  mission: "Missione",
  logement: "Alloggio",
  date: "Data",
  assigne: "Assegnato",
  offreEnCours: "Offerta in corso",
  dispatcher: "Dispatch",
  aucuneOffre: "Nessuna",
  retirerOffre: "Ritirare l’offerta",
  choisir: "Scegliere…",
  messagePlaceholder: "Fascia oraria, istruzioni…",
  proposer: "Proporre",
  enCours: "In corso",
  nonDispatchable: "Non disponibile per dispatch",
  historique: "Storico offerte",
  aucuneOffreHistorique: "Nessuna offerta per il momento.",
  types: {
    menage: "Pulizia",
    maintenance: "Manutenzione",
    accueil: "Accoglienza",
    autre: "Altro",
  },
  statutsMission: {
    planifiee: "Pianificata",
    en_cours: "In corso",
    terminee: "Terminata",
    annulee: "Annullata",
  },
  statutsDispatch: {
    proposee: "Proposta",
    acceptee: "Accettata",
    refusee: "Rifiutata",
    retiree: "Ritirata",
  },
};

const DE: TraductionsDispatch = {
  titrePage: "Dienstleister-Dispatch — Mitarbeiterbereich",
  surtitre: "Mitarbeiterbereich · Dienstleister",
  titre: "Dienstleister-Dispatch",
  description:
    "Mission anbieten, Antworten verfolgen und ohne Überschneidung neu zuweisen.",
  okRetire: "Angebot zurückgezogen.",
  okPropose: "Angebot an den Dienstleister gesendet.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  aucunPrestataire:
    "Kein aktiver Dienstleister. Legen Sie einen Benutzer mit der Rolle presta an, bevor Sie dispatchen.",
  missionsAVenir: (n) => `Kommende Missionen (${n})`,
  aucuneMission:
    "Keine Mission in den nächsten 90 Tagen. Legen Sie eine unter „Missionen“ an.",
  mission: "Mission",
  logement: "Unterkunft",
  date: "Datum",
  assigne: "Zugewiesen",
  offreEnCours: "Laufendes Angebot",
  dispatcher: "Dispatch",
  aucuneOffre: "Keine",
  retirerOffre: "Angebot zurückziehen",
  choisir: "Auswählen…",
  messagePlaceholder: "Zeitfenster, Hinweise…",
  proposer: "Anbieten",
  enCours: "Läuft",
  nonDispatchable: "Nicht dispatchbar",
  historique: "Angebotsverlauf",
  aucuneOffreHistorique: "Noch kein Angebot.",
  types: {
    menage: "Reinigung",
    maintenance: "Wartung",
    accueil: "Empfang",
    autre: "Sonstiges",
  },
  statutsMission: {
    planifiee: "Geplant",
    en_cours: "Läuft",
    terminee: "Abgeschlossen",
    annulee: "Storniert",
  },
  statutsDispatch: {
    proposee: "Angeboten",
    acceptee: "Angenommen",
    refusee: "Abgelehnt",
    retiree: "Zurückgezogen",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsDispatch> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsDispatch(langue: string): TraductionsDispatch {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
