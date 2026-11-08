import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsMissions {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  resume: (missions: number, prestataires: number) => string;
  precedent: string;
  courant: string;
  suivant: string;
  espacePresta: string;
  creeePour: (ref: string, date: string) => string;
  creee: string;
  erreurs: Record<string, string>;
  aucunPrestataire: string;
  creer: string;
  creerAide: string;
  logement: string;
  prestataire: string;
  reference: string;
  type: string;
  date: string;
  heureFacultatif: string;
  reservationLiee: string;
  aucune: string;
  notesFacultatif: string;
  creerMission: string;
  missionsMois: string;
  aucuneMission: string;
  typesMission: { menage: string; maintenance: string; accueil: string; autre: string };
}

const COMMUNS_FR = {
  logement: "Logement", prestataire: "Prestataire", reference: "Référence",
  type: "Type", date: "Date", heureFacultatif: "Heure (facultatif)",
  reservationLiee: "Réservation liée (facultatif)", aucune: "Aucune",
  notesFacultatif: "Notes (facultatif)",
};
const COMMUNS_EN = {
  logement: "Property", prestataire: "Provider", reference: "Reference",
  type: "Type", date: "Date", heureFacultatif: "Time (optional)",
  reservationLiee: "Linked booking (optional)", aucune: "None",
  notesFacultatif: "Notes (optional)",
};
const COMMUNS_ES = {
  logement: "Alojamiento", prestataire: "Prestador", reference: "Referencia",
  type: "Tipo", date: "Fecha", heureFacultatif: "Hora (opcional)",
  reservationLiee: "Reserva vinculada (opcional)", aucune: "Ninguna",
  notesFacultatif: "Notas (opcional)",
};
const COMMUNS_IT = {
  logement: "Alloggio", prestataire: "Fornitore", reference: "Riferimento",
  type: "Tipo", date: "Data", heureFacultatif: "Ora (facoltativo)",
  reservationLiee: "Prenotazione collegata (facoltativo)", aucune: "Nessuna",
  notesFacultatif: "Note (facoltativo)",
};
const COMMUNS_DE = {
  logement: "Unterkunft", prestataire: "Dienstleister", reference: "Referenz",
  type: "Typ", date: "Datum", heureFacultatif: "Uhrzeit (optional)",
  reservationLiee: "Verknüpfte Buchung (optional)", aucune: "Keine",
  notesFacultatif: "Notizen (optional)",
};

const FR: TraductionsMissions = {
  ...COMMUNS_FR,
  titrePage: "Missions — Espace hôte", espace: "Espace hôte",
  titre: (mois) => `Missions — ${mois}`,
  resume: (m, p) => `${m} mission${m > 1 ? "s" : ""} · ${p} prestataire${p > 1 ? "s" : ""}`,
  precedent: "← Mois précédent", courant: "Mois courant", suivant: "Mois suivant →",
  espacePresta: "Espace prestataire",
  creeePour: (ref, date) => `Mission ${ref} créée pour ${date}.`,
  creee: "Mission créée.",
  erreurs: {
    type: "Type de mission invalide.", logement: "Logement introuvable.",
    prestataire: "Prestataire introuvable ou inactif.",
    reservation: "Réservation introuvable pour ce logement.",
    inattendu: "Erreur inattendue. Réessayez.",
  },
  aucunPrestataire: "Aucun prestataire actif. Créez un utilisateur de rôle presta avant d’assigner une mission.",
  creer: "Créer une mission",
  creerAide: "Ménage, maintenance, accueil ou autre. Le prestataire verra la mission dans son espace.",
  creerMission: "Créer la mission", missionsMois: "Missions du mois",
  aucuneMission: "Aucune mission sur ce mois.",
  typesMission: { menage: "Ménage", maintenance: "Maintenance", accueil: "Accueil", autre: "Autre" },
};

const EN: TraductionsMissions = {
  ...COMMUNS_EN,
  titrePage: "Tasks — Staff area", espace: "Staff area",
  titre: (mois) => `Tasks — ${mois}`,
  resume: (m, p) => `${m} task${m === 1 ? "" : "s"} · ${p} provider${p === 1 ? "" : "s"}`,
  precedent: "← Previous month", courant: "Current month", suivant: "Next month →",
  espacePresta: "Provider area",
  creeePour: (ref, date) => `Task ${ref} created for ${date}.`,
  creee: "Task created.",
  erreurs: {
    type: "Invalid task type.", logement: "Property not found.",
    prestataire: "Provider not found or inactive.",
    reservation: "Booking not found for this property.",
    inattendu: "Unexpected error. Try again.",
  },
  aucunPrestataire: "No active provider. Create a user with the presta role before assigning a task.",
  creer: "Create a task",
  creerAide: "Cleaning, maintenance, welcome or other. The provider sees the task in their area.",
  creerMission: "Create task", missionsMois: "Tasks this month",
  aucuneMission: "No task this month.",
  typesMission: { menage: "Cleaning", maintenance: "Maintenance", accueil: "Welcome", autre: "Other" },
};

const ES: TraductionsMissions = {
  ...COMMUNS_ES,
  titrePage: "Misiones — Área profesional", espace: "Área profesional",
  titre: (mois) => `Misiones — ${mois}`,
  resume: (m, p) => `${m} misión${m === 1 ? "" : "es"} · ${p} prestador${p === 1 ? "" : "es"}`,
  precedent: "← Mes anterior", courant: "Mes actual", suivant: "Mes siguiente →",
  espacePresta: "Área del prestador",
  creeePour: (ref, date) => `Misión ${ref} creada para ${date}.`,
  creee: "Misión creada.",
  erreurs: {
    type: "Tipo de misión no válido.", logement: "Alojamiento no encontrado.",
    prestataire: "Prestador no encontrado o inactivo.",
    reservation: "Reserva no encontrada para este alojamiento.",
    inattendu: "Error inesperado. Inténtelo de nuevo.",
  },
  aucunPrestataire: "Ningún prestador activo. Cree un usuario con rol presta antes de asignar una misión.",
  creer: "Crear una misión",
  creerAide: "Limpieza, mantenimiento, acogida u otra. El prestador verá la misión en su área.",
  creerMission: "Crear misión", missionsMois: "Misiones del mes",
  aucuneMission: "Ninguna misión este mes.",
  typesMission: { menage: "Limpieza", maintenance: "Mantenimiento", accueil: "Acogida", autre: "Otra" },
};

const IT: TraductionsMissions = {
  ...COMMUNS_IT,
  titrePage: "Incarichi — Area professionale", espace: "Area professionale",
  titre: (mois) => `Incarichi — ${mois}`,
  resume: (m, p) => `${m} incaric${m === 1 ? "o" : "hi"} · ${p} fornitore${p === 1 ? "" : "i"}`,
  precedent: "← Mese precedente", courant: "Mese corrente", suivant: "Mese successivo →",
  espacePresta: "Area del fornitore",
  creeePour: (ref, date) => `Incarico ${ref} creato per ${date}.`,
  creee: "Incarico creato.",
  erreurs: {
    type: "Tipo di incarico non valido.", logement: "Alloggio non trovato.",
    prestataire: "Fornitore non trovato o inattivo.",
    reservation: "Prenotazione non trovata per questo alloggio.",
    inattendu: "Errore imprevisto. Riprovare.",
  },
  aucunPrestataire: "Nessun fornitore attivo. Crei un utente con ruolo presta prima di assegnare un incarico.",
  creer: "Crea un incarico",
  creerAide: "Pulizia, manutenzione, accoglienza o altro. Il fornitore vedrà l’incarico nella sua area.",
  creerMission: "Crea incarico", missionsMois: "Incarichi del mese",
  aucuneMission: "Nessun incarico questo mese.",
  typesMission: { menage: "Pulizia", maintenance: "Manutenzione", accueil: "Accoglienza", autre: "Altro" },
};

const DE: TraductionsMissions = {
  ...COMMUNS_DE,
  titrePage: "Aufträge — Profibereich", espace: "Profibereich",
  titre: (mois) => `Aufträge — ${mois}`,
  resume: (m, p) => `${m} Auftrag/Aufträge · ${p} Dienstleister`,
  precedent: "← Vorheriger Monat", courant: "Aktueller Monat", suivant: "Nächster Monat →",
  espacePresta: "Dienstleisterbereich",
  creeePour: (ref, date) => `Auftrag ${ref} für ${date} erstellt.`,
  creee: "Auftrag erstellt.",
  erreurs: {
    type: "Ungültiger Auftragstyp.", logement: "Unterkunft nicht gefunden.",
    prestataire: "Dienstleister nicht gefunden oder inaktiv.",
    reservation: "Buchung für diese Unterkunft nicht gefunden.",
    inattendu: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  },
  aucunPrestataire: "Kein aktiver Dienstleister. Erstellen Sie einen Benutzer mit der Rolle presta, bevor Sie einen Auftrag zuweisen.",
  creer: "Auftrag erstellen",
  creerAide: "Reinigung, Wartung, Empfang oder anderes. Der Dienstleister sieht den Auftrag in seinem Bereich.",
  creerMission: "Auftrag erstellen", missionsMois: "Aufträge des Monats",
  aucuneMission: "Kein Auftrag in diesem Monat.",
  typesMission: { menage: "Reinigung", maintenance: "Wartung", accueil: "Empfang", autre: "Andere" },
};

const DICTIONNAIRES: Record<Langue, TraductionsMissions> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsMissions(langue: string): TraductionsMissions {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
