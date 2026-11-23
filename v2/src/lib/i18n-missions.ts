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
  pointageDebut: (heure: string) => string;
  pointageFin: (debut: string, fin: string) => string;
  pointageHorsLigne: string;
  dureeReelle: (reelle: string, prevue: string, ecart: string) => string;
  preuveStatuts: {
    a_soumettre: string;
    soumise: string;
    validee: string;
    refusee: string;
  };
  preuveSoumiseLe: (le: string) => string;
  preuveValideeLe: (le: string, qui: string) => string;
  preuveMotif: (motif: string) => string;
  preuveHistorique: string;
  validerPreuve: string;
  refuserPreuve: string;
  motifRefus: string;
  motifRefusAide: (min: number, max: number) => string;
  okPreuveValidee: string;
  okPreuveRefusee: string;
  typesMission: { menage: string; maintenance: string; accueil: string; autre: string };
}

const COMMUNS_FR = {
  logement: "Logement", prestataire: "Prestataire", reference: "Référence",
  type: "Type", date: "Date", heureFacultatif: "Heure (facultatif)",
  reservationLiee: "Réservation liée (facultatif)", aucune: "Aucune",
  notesFacultatif: "Notes (facultatif)",
  pointageDebut: (heure: string) => `Pointage débuté à ${heure}`,
  pointageFin: (debut: string, fin: string) => `Pointage ${debut} → ${fin}`,
  pointageHorsLigne: "hors ligne",
  dureeReelle: (reelle: string, prevue: string, ecart: string) =>
    `Durée réelle ${reelle} · prévu ${prevue} · écart ${ecart}`,
  preuveStatuts: {
    a_soumettre: "Preuve à soumettre",
    soumise: "Preuve à valider",
    validee: "Preuve validée",
    refusee: "Preuve en reprise",
  },
  preuveSoumiseLe: (le: string) => `Soumise le ${le}`,
  preuveValideeLe: (le: string, qui: string) => `Validée le ${le} par ${qui}`,
  preuveMotif: (motif: string) => `Refus : ${motif}`,
  preuveHistorique: "Historique de la preuve",
  validerPreuve: "Valider la preuve",
  refuserPreuve: "Refuser",
  motifRefus: "Motif du refus (obligatoire)",
  motifRefusAide: (min: number, max: number) =>
    `${min} à ${max} caractères ; ce motif est visible par l’intervenant.`,
  okPreuveValidee: "Preuve validée.",
  okPreuveRefusee: "Preuve refusée : le motif a été transmis à l’intervenant.",
};
const COMMUNS_EN = {
  logement: "Property", prestataire: "Provider", reference: "Reference",
  type: "Type", date: "Date", heureFacultatif: "Time (optional)",
  reservationLiee: "Linked booking (optional)", aucune: "None",
  notesFacultatif: "Notes (optional)",
  pointageDebut: (heure: string) => `Check-in at ${heure}`,
  pointageFin: (debut: string, fin: string) => `Check-in ${debut} → ${fin}`,
  pointageHorsLigne: "offline capture",
  dureeReelle: (reelle: string, prevue: string, ecart: string) =>
    `Actual duration ${reelle} · planned ${prevue} · deviation ${ecart}`,
  preuveStatuts: {
    a_soumettre: "Proof to submit",
    soumise: "Proof awaiting validation",
    validee: "Proof validated",
    refusee: "Proof returned",
  },
  preuveSoumiseLe: (le: string) => `Submitted on ${le}`,
  preuveValideeLe: (le: string, qui: string) => `Validated on ${le} by ${qui}`,
  preuveMotif: (motif: string) => `Rejection: ${motif}`,
  preuveHistorique: "Proof history",
  validerPreuve: "Validate proof",
  refuserPreuve: "Reject",
  motifRefus: "Reason for rejection (required)",
  motifRefusAide: (min: number, max: number) =>
    `${min} to ${max} characters; the provider sees this reason.`,
  okPreuveValidee: "Proof validated.",
  okPreuveRefusee: "Proof rejected: the reason was sent to the provider.",
};
const COMMUNS_ES = {
  logement: "Alojamiento", prestataire: "Prestador", reference: "Referencia",
  type: "Tipo", date: "Fecha", heureFacultatif: "Hora (opcional)",
  reservationLiee: "Reserva vinculada (opcional)", aucune: "Ninguna",
  notesFacultatif: "Notas (opcional)",
  pointageDebut: (heure: string) => `Entrada registrada a las ${heure}`,
  pointageFin: (debut: string, fin: string) => `Registro ${debut} → ${fin}`,
  pointageHorsLigne: "captura sin conexión",
  dureeReelle: (reelle: string, prevue: string, ecart: string) =>
    `Duración real ${reelle} · prevista ${prevue} · desviación ${ecart}`,
  preuveStatuts: {
    a_soumettre: "Prueba por enviar",
    soumise: "Prueba pendiente de validación",
    validee: "Prueba validada",
    refusee: "Prueba devuelta",
  },
  preuveSoumiseLe: (le: string) => `Enviada el ${le}`,
  preuveValideeLe: (le: string, qui: string) => `Validada el ${le} por ${qui}`,
  preuveMotif: (motif: string) => `Rechazo: ${motif}`,
  preuveHistorique: "Historial de la prueba",
  validerPreuve: "Validar la prueba",
  refuserPreuve: "Rechazar",
  motifRefus: "Motivo del rechazo (obligatorio)",
  motifRefusAide: (min: number, max: number) =>
    `${min} a ${max} caracteres; el prestador ve este motivo.`,
  okPreuveValidee: "Prueba validada.",
  okPreuveRefusee: "Prueba rechazada: el motivo se envió al prestador.",
};
const COMMUNS_IT = {
  logement: "Alloggio", prestataire: "Fornitore", reference: "Riferimento",
  type: "Tipo", date: "Data", heureFacultatif: "Ora (facoltativo)",
  reservationLiee: "Prenotazione collegata (facoltativo)", aucune: "Nessuna",
  notesFacultatif: "Note (facoltativo)",
  pointageDebut: (heure: string) => `Ingresso registrato alle ${heure}`,
  pointageFin: (debut: string, fin: string) => `Registrazione ${debut} → ${fin}`,
  pointageHorsLigne: "registrazione offline",
  dureeReelle: (reelle: string, prevue: string, ecart: string) =>
    `Durata reale ${reelle} · prevista ${prevue} · scostamento ${ecart}`,
  preuveStatuts: {
    a_soumettre: "Prova da inviare",
    soumise: "Prova in attesa di validazione",
    validee: "Prova validata",
    refusee: "Prova rinviata",
  },
  preuveSoumiseLe: (le: string) => `Inviata il ${le}`,
  preuveValideeLe: (le: string, qui: string) => `Validata il ${le} da ${qui}`,
  preuveMotif: (motif: string) => `Rifiuto: ${motif}`,
  preuveHistorique: "Cronologia della prova",
  validerPreuve: "Validare la prova",
  refuserPreuve: "Rifiutare",
  motifRefus: "Motivo del rifiuto (obbligatorio)",
  motifRefusAide: (min: number, max: number) =>
    `${min} a ${max} caratteri; il fornitore vede questo motivo.`,
  okPreuveValidee: "Prova validata.",
  okPreuveRefusee: "Prova rifiutata: il motivo è stato inviato al fornitore.",
};
const COMMUNS_DE = {
  logement: "Unterkunft", prestataire: "Dienstleister", reference: "Referenz",
  type: "Typ", date: "Datum", heureFacultatif: "Uhrzeit (optional)",
  reservationLiee: "Verknüpfte Buchung (optional)", aucune: "Keine",
  notesFacultatif: "Notizen (optional)",
  pointageDebut: (heure: string) => `Beginn erfasst um ${heure}`,
  pointageFin: (debut: string, fin: string) => `Stempelung ${debut} → ${fin}`,
  pointageHorsLigne: "offline erfasst",
  dureeReelle: (reelle: string, prevue: string, ecart: string) =>
    `Ist-Dauer ${reelle} · geplant ${prevue} · Abweichung ${ecart}`,
  preuveStatuts: {
    a_soumettre: "Nachweis offen",
    soumise: "Nachweis zur Prüfung",
    validee: "Nachweis bestätigt",
    refusee: "Nachweis zurückgegeben",
  },
  preuveSoumiseLe: (le: string) => `Eingereicht am ${le}`,
  preuveValideeLe: (le: string, qui: string) => `Bestätigt am ${le} von ${qui}`,
  preuveMotif: (motif: string) => `Ablehnung: ${motif}`,
  preuveHistorique: "Verlauf des Nachweises",
  validerPreuve: "Nachweis bestätigen",
  refuserPreuve: "Ablehnen",
  motifRefus: "Ablehnungsgrund (erforderlich)",
  motifRefusAide: (min: number, max: number) =>
    `${min} bis ${max} Zeichen; der Dienstleister sieht diesen Grund.`,
  okPreuveValidee: "Nachweis bestätigt.",
  okPreuveRefusee: "Nachweis abgelehnt: der Grund wurde übermittelt.",
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
    preuve_motif:
      "Motif de refus obligatoire : 10 à 1000 caractères, visible par l’intervenant.",
    preuve_etat:
      "Cette preuve ne peut pas être validée ou refusée : elle n’est pas en attente de validation.",
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
    preuve_motif:
      "A rejection reason is required: 10 to 1000 characters, shown to the provider.",
    preuve_etat:
      "This proof cannot be validated or rejected: it is not awaiting validation.",
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
    preuve_motif:
      "El motivo del rechazo es obligatorio: de 10 a 1000 caracteres, visible para el prestador.",
    preuve_etat:
      "Esta prueba no se puede validar ni rechazar: no está pendiente de validación.",
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
    preuve_motif:
      "Il motivo del rifiuto è obbligatorio: da 10 a 1000 caratteri, visibile al fornitore.",
    preuve_etat:
      "Questa prova non può essere validata né rifiutata: non è in attesa di validazione.",
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
    preuve_motif:
      "Ablehnungsgrund erforderlich: 10 bis 1000 Zeichen, für den Dienstleister sichtbar.",
    preuve_etat:
      "Dieser Nachweis kann nicht bestätigt oder abgelehnt werden: er ist nicht zur Prüfung offen.",
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
