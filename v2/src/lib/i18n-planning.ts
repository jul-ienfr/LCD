import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsPlanning {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  resume: (nom: string, code: string, reservations: number, blocages: number) => string;
  ventesSuspendues: string;
  stopGlobal: string;
  depuis: (date: string) => string;
  motif: (motif: string) => string;
  ventesSuspenduesAide: string;
  stopAide: string;
  motifFacultatif: string;
  motifPlaceholder: string;
  reprendre: string;
  toutArreter: string;
  ventesStop: string;
  ventesReprise: string;
  vide: string;
  gererLogements: string;
  moisPrecedent: string;
  moisCourant: string;
  moisSuivant: string;
  importerOta: string;
  canaux: string;
  logement: string;
  afficher: string;
  creerReservation: string;
  chevauchement: string;
  reference: string;
  clientFacultatif: string;
  clientPlaceholder: string;
  voyageurs: string;
  debut: string;
  finExclusive: string;
  montant: string;
  creation: (ref: string, debut: string, fin: string) => string;
  creer: string;
  bloquee: string;
  reservationsMois: string;
  aucuneReservation: string;
  nuits: (n: number) => string;
  voyageurCount: (n: number) => string;
  lienVoyageur: string;
  contrat: string;
  blocagesOta: string;
  aucunBlocage: string;
  indisponibiliteOta: string;
  bloque: string;
  jours: string[];
}

const FR: TraductionsPlanning = {
  titrePage: "Planning — LCD Parc", espace: "Espace hôte",
  titre: (mois) => `Planning — ${mois}`,
  resume: (nom, code, r, b) => `${nom} (${code}) · ${r} réservation${r > 1 ? "s" : ""} · ${b} blocage${b > 1 ? "s" : ""}`,
  ventesSuspendues: "Ventes suspendues sur tous les canaux",
  stopGlobal: "Stop commercial global",
  depuis: (date) => `Depuis le ${date}`,
  motif: (motif) => ` · motif : ${motif}`,
  ventesSuspenduesAide: "La réservation directe refuse toute nouvelle demande. Reprenez quand la situation est réglée.",
  stopAide: "Coupe la réservation directe et signale l’arrêt aux canaux synchronisés. Les séjours déjà confirmés ne sont pas annulés.",
  motifFacultatif: "Motif (facultatif)", motifPlaceholder: "Travaux, sinistre, surbooking…",
  reprendre: "Reprendre les ventes", toutArreter: "Tout arrêter",
  ventesStop: "Ventes suspendues.", ventesReprise: "Ventes reprises.",
  vide: "Créez d’abord un logement pour planifier des séjours.",
  gererLogements: "Gérer les logements", moisPrecedent: "← Mois précédent",
  moisCourant: "Mois courant", moisSuivant: "Mois suivant →",
  importerOta: "Importer un calendrier OTA", canaux: "Canaux",
  logement: "Logement", afficher: "Afficher",
  creerReservation: "Créer une réservation",
  chevauchement: "Le chevauchement avec une réservation existante est refusé.",
  reference: "Référence", clientFacultatif: "Client (facultatif)",
  clientPlaceholder: "Nom du voyageur", voyageurs: "Voyageurs",
  debut: "Début", finExclusive: "Fin (exclusive)", montant: "Montant (€)",
  creation: (ref, debut, fin) => `Réservation ${ref} créée (${debut} → ${fin}).`,
  creer: "Créer la réservation", bloquee: "Bloqué",
  reservationsMois: "Réservations du mois",
  aucuneReservation: "Aucune réservation sur ce mois pour ce logement.",
  nuits: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
  voyageurCount: (n) => `${n} voyageur${n > 1 ? "s" : ""}`,
  lienVoyageur: "Lien voyageur", contrat: "Contrat",
  blocagesOta: "Blocages OTA du mois",
  aucunBlocage: "Aucun blocage sur ce mois pour ce logement.",
  indisponibiliteOta: "Indisponibilité OTA", bloque: "bloqué",
  jours: ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"],
};

const EN: TraductionsPlanning = {
  titrePage: "Planning — LCD Parc", espace: "Staff area",
  titre: (mois) => `Planning — ${mois}`,
  resume: (nom, code, r, b) => `${nom} (${code}) · ${r} booking${r === 1 ? "" : "s"} · ${b} block${b === 1 ? "" : "s"}`,
  ventesSuspendues: "Sales suspended on all channels",
  stopGlobal: "Global sales stop",
  depuis: (date) => `Since ${date}`,
  motif: (motif) => ` · reason: ${motif}`,
  ventesSuspenduesAide: "Direct booking rejects any new request. Resume once the situation is resolved.",
  stopAide: "Cuts direct booking and signals the stop to synced channels. Confirmed stays are not cancelled.",
  motifFacultatif: "Reason (optional)", motifPlaceholder: "Works, incident, overbooking…",
  reprendre: "Resume sales", toutArreter: "Stop everything",
  ventesStop: "Sales suspended.", ventesReprise: "Sales resumed.",
  vide: "Create a property first to plan stays.",
  gererLogements: "Manage properties", moisPrecedent: "← Previous month",
  moisCourant: "Current month", moisSuivant: "Next month →",
  importerOta: "Import an OTA calendar", canaux: "Channels",
  logement: "Property", afficher: "Show",
  creerReservation: "Create a booking",
  chevauchement: "Overlap with an existing booking is refused.",
  reference: "Reference", clientFacultatif: "Guest (optional)",
  clientPlaceholder: "Guest name", voyageurs: "Guests",
  debut: "Start", finExclusive: "End (exclusive)", montant: "Amount (€)",
  creation: (ref, debut, fin) => `Booking ${ref} created (${debut} → ${fin}).`,
  creer: "Create booking", bloquee: "Blocked",
  reservationsMois: "Bookings this month",
  aucuneReservation: "No booking this month for this property.",
  nuits: (n) => `${n} night${n === 1 ? "" : "s"}`,
  voyageurCount: (n) => `${n} guest${n === 1 ? "" : "s"}`,
  lienVoyageur: "Guest link", contrat: "Contract",
  blocagesOta: "OTA blocks this month",
  aucunBlocage: "No block this month for this property.",
  indisponibiliteOta: "OTA unavailable", bloque: "blocked",
  jours: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
};

const ES: TraductionsPlanning = {
  titrePage: "Planificación — LCD Parc", espace: "Área profesional",
  titre: (mois) => `Planificación — ${mois}`,
  resume: (nom, code, r, b) => `${nom} (${code}) · ${r} reserva${r === 1 ? "" : "s"} · ${b} bloqueo${b === 1 ? "" : "s"}`,
  ventesSuspendues: "Ventas suspendidas en todos los canales",
  stopGlobal: "Parada comercial global",
  depuis: (date) => `Desde el ${date}`,
  motif: (motif) => ` · motivo: ${motif}`,
  ventesSuspenduesAide: "La reserva directa rechaza cualquier solicitud nueva. Reanude cuando la situación esté resuelta.",
  stopAide: "Corta la reserva directa y avisa a los canales sincronizados. Las estancias confirmadas no se cancelan.",
  motifFacultatif: "Motivo (opcional)", motifPlaceholder: "Obras, siniestro, sobreventa…",
  reprendre: "Reanudar ventas", toutArreter: "Parar todo",
  ventesStop: "Ventas suspendidas.", ventesReprise: "Ventas reanudadas.",
  vide: "Cree primero un alojamiento para planificar estancias.",
  gererLogements: "Gestionar alojamientos", moisPrecedent: "← Mes anterior",
  moisCourant: "Mes actual", moisSuivant: "Mes siguiente →",
  importerOta: "Importar calendario OTA", canaux: "Canales",
  logement: "Alojamiento", afficher: "Mostrar",
  creerReservation: "Crear una reserva",
  chevauchement: "Se rechaza el solapamiento con una reserva existente.",
  reference: "Referencia", clientFacultatif: "Cliente (opcional)",
  clientPlaceholder: "Nombre del viajero", voyageurs: "Viajeros",
  debut: "Inicio", finExclusive: "Fin (exclusivo)", montant: "Importe (€)",
  creation: (ref, debut, fin) => `Reserva ${ref} creada (${debut} → ${fin}).`,
  creer: "Crear reserva", bloquee: "Bloqueado",
  reservationsMois: "Reservas del mes",
  aucuneReservation: "Ninguna reserva este mes para este alojamiento.",
  nuits: (n) => `${n} noche${n === 1 ? "" : "s"}`,
  voyageurCount: (n) => `${n} viajero${n === 1 ? "" : "s"}`,
  lienVoyageur: "Enlace del viajero", contrat: "Contrato",
  blocagesOta: "Bloqueos OTA del mes",
  aucunBlocage: "Ningún bloqueo este mes para este alojamiento.",
  indisponibiliteOta: "No disponible en OTA", bloque: "bloqueado",
  jours: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
};

const IT: TraductionsPlanning = {
  titrePage: "Pianificazione — LCD Parc", espace: "Area professionale",
  titre: (mois) => `Pianificazione — ${mois}`,
  resume: (nom, code, r, b) => `${nom} (${code}) · ${r} prenotazion${r === 1 ? "e" : "i"} · ${b} blocc${b === 1 ? "o" : "hi"}`,
  ventesSuspendues: "Vendite sospese su tutti i canali",
  stopGlobal: "Stop commerciale globale",
  depuis: (date) => `Dal ${date}`,
  motif: (motif) => ` · motivo: ${motif}`,
  ventesSuspenduesAide: "La prenotazione diretta rifiuta ogni nuova richiesta. Riprenda quando la situazione è risolta.",
  stopAide: "Interrompe la prenotazione diretta e segnala lo stop ai canali sincronizzati. I soggiorni confermati non vengono annullati.",
  motifFacultatif: "Motivo (facoltativo)", motifPlaceholder: "Lavori, sinistro, overbooking…",
  reprendre: "Riprendi le vendite", toutArreter: "Ferma tutto",
  ventesStop: "Vendite sospese.", ventesReprise: "Vendite riprese.",
  vide: "Crei prima un alloggio per pianificare i soggiorni.",
  gererLogements: "Gestisci alloggi", moisPrecedent: "← Mese precedente",
  moisCourant: "Mese corrente", moisSuivant: "Mese successivo →",
  importerOta: "Importa calendario OTA", canaux: "Canali",
  logement: "Alloggio", afficher: "Mostra",
  creerReservation: "Crea una prenotazione",
  chevauchement: "La sovrapposizione con una prenotazione esistente viene rifiutata.",
  reference: "Riferimento", clientFacultatif: "Cliente (facoltativo)",
  clientPlaceholder: "Nome del viaggiatore", voyageurs: "Viaggiatori",
  debut: "Inizio", finExclusive: "Fine (esclusa)", montant: "Importo (€)",
  creation: (ref, debut, fin) => `Prenotazione ${ref} creata (${debut} → ${fin}).`,
  creer: "Crea prenotazione", bloquee: "Bloccato",
  reservationsMois: "Prenotazioni del mese",
  aucuneReservation: "Nessuna prenotazione questo mese per questo alloggio.",
  nuits: (n) => `${n} nott${n === 1 ? "e" : "i"}`,
  voyageurCount: (n) => `${n} viaggiator${n === 1 ? "e" : "i"}`,
  lienVoyageur: "Link viaggiatore", contrat: "Contratto",
  blocagesOta: "Blocchi OTA del mese",
  aucunBlocage: "Nessun blocco questo mese per questo alloggio.",
  indisponibiliteOta: "Non disponibile su OTA", bloque: "bloccato",
  jours: ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"],
};

const DE: TraductionsPlanning = {
  titrePage: "Planung — LCD Parc", espace: "Profibereich",
  titre: (mois) => `Planung — ${mois}`,
  resume: (nom, code, r, b) => `${nom} (${code}) · ${r} Buchung${r === 1 ? "" : "en"} · ${b} Sperrung${b === 1 ? "" : "en"}`,
  ventesSuspendues: "Verkauf auf allen Kanälen ausgesetzt",
  stopGlobal: "Globaler Verkaufsstopp",
  depuis: (date) => `Seit ${date}`,
  motif: (motif) => ` · Grund: ${motif}`,
  ventesSuspenduesAide: "Die Direktbuchung lehnt jede neue Anfrage ab. Setzen Sie fort, sobald die Lage geklärt ist.",
  stopAide: "Unterbricht die Direktbuchung und meldet den Stopp an synchronisierte Kanäle. Bestätigte Aufenthalte werden nicht storniert.",
  motifFacultatif: "Grund (optional)", motifPlaceholder: "Arbeiten, Schaden, Überbuchung…",
  reprendre: "Verkauf fortsetzen", toutArreter: "Alles stoppen",
  ventesStop: "Verkauf ausgesetzt.", ventesReprise: "Verkauf fortgesetzt.",
  vide: "Erstellen Sie zuerst eine Unterkunft, um Aufenthalte zu planen.",
  gererLogements: "Unterkünfte verwalten", moisPrecedent: "← Vorheriger Monat",
  moisCourant: "Aktueller Monat", moisSuivant: "Nächster Monat →",
  importerOta: "OTA-Kalender importieren", canaux: "Kanäle",
  logement: "Unterkunft", afficher: "Anzeigen",
  creerReservation: "Buchung erstellen",
  chevauchement: "Überschneidung mit einer bestehenden Buchung wird abgelehnt.",
  reference: "Referenz", clientFacultatif: "Gast (optional)",
  clientPlaceholder: "Name des Gastes", voyageurs: "Gäste",
  debut: "Beginn", finExclusive: "Ende (exklusiv)", montant: "Betrag (€)",
  creation: (ref, debut, fin) => `Buchung ${ref} erstellt (${debut} → ${fin}).`,
  creer: "Buchung erstellen", bloquee: "Gesperrt",
  reservationsMois: "Buchungen des Monats",
  aucuneReservation: "Keine Buchung in diesem Monat für diese Unterkunft.",
  nuits: (n) => `${n} Nacht${n === 1 ? "" : "e"}`,
  voyageurCount: (n) => `${n} Gast${n === 1 ? "" : "e"}`,
  lienVoyageur: "Gastlink", contrat: "Vertrag",
  blocagesOta: "OTA-Sperrungen des Monats",
  aucunBlocage: "Keine Sperrung in diesem Monat für diese Unterkunft.",
  indisponibiliteOta: "OTA nicht verfügbar", bloque: "gesperrt",
  jours: ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"],
};

const DICTIONNAIRES: Record<Langue, TraductionsPlanning> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsPlanning(langue: string): TraductionsPlanning {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
