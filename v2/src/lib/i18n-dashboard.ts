import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsTableauBord {
  titre: string;
  bonjour: string;
  role: string;
  apercu: string;
  logements: string;
  logementsNote: string;
  reservations: string;
  reservationsNote: string;
  ca: string;
  caNote: string;
  arrivees: string;
  departs: string;
  aucuneArrivee: string;
  aucunDepart: string;
  acces: string;
  reglages: string;
  reglagesDetail: string;
  departConfirme: string;
  accesLogements: string;
  accesLogementsDetail: string;
  accesPlanning: string;
  accesPlanningDetail: string;
  accesMenage: string;
  accesMenageDetail: string;
  accesFils: string;
  accesFilsDetail: string;
  accesSorties: string;
  accesSortiesDetail: string;
}

const FR: TraductionsTableauBord = {
  titre: "Espace hôte",
  bonjour: "Bonjour",
  role: "Rôle",
  apercu: "Mode aperçu : les écritures sont bloquées. Les données affichées sont réelles.",
  logements: "Logements",
  logementsNote: "Biens actifs sur le tenant",
  reservations: "Réservations du mois",
  reservationsNote: "Tous statuts confondus",
  ca: "CA du mois",
  caNote: "Hors séjours annulés",
  arrivees: "Arrivées · 7 jours",
  departs: "Départs · 7 jours",
  aucuneArrivee: "Aucune arrivée prévue.",
  aucunDepart: "Aucun départ prévu.",
  acces: "Accès rapides",
  reglages: "Réglages groupés",
  reglagesDetail: "Buffer, cutoff et stratégie sur plusieurs logements",
  departConfirme: "Départ confirmé",
  accesLogements: "Logements",
  accesLogementsDetail: "Biens, photos, équipements",
  accesPlanning: "Planning",
  accesPlanningDetail: "Séjours et disponibilités",
  accesMenage: "Ménage",
  accesMenageDetail: "Missions et qualité",
  accesFils: "Fils internes",
  accesFilsDetail: "Propriétaire, prestataire, voyageur",
  accesSorties: "Sorties d’argent",
  accesSortiesDetail: "Reversements, remboursements, gestes",
};

const EN: TraductionsTableauBord = {
  titre: "Staff area",
  bonjour: "Hello",
  role: "Role",
  apercu: "Preview mode: writes are blocked. Displayed data is real.",
  logements: "Properties",
  logementsNote: "Active properties for this tenant",
  reservations: "Bookings this month",
  reservationsNote: "All statuses",
  ca: "Monthly revenue",
  caNote: "Excluding cancelled stays",
  arrivees: "Arrivals · 7 days",
  departs: "Departures · 7 days",
  aucuneArrivee: "No arrivals expected.",
  aucunDepart: "No departures expected.",
  acces: "Quick access",
  reglages: "Group settings",
  reglagesDetail: "Buffer, cutoff and strategy across properties",
  departConfirme: "Departure confirmed",
  accesLogements: "Properties",
  accesLogementsDetail: "Listings, photos, amenities",
  accesPlanning: "Calendar",
  accesPlanningDetail: "Stays and availability",
  accesMenage: "Cleaning",
  accesMenageDetail: "Tasks and quality",
  accesFils: "Internal threads",
  accesFilsDetail: "Owner, cleaner, traveller",
  accesSorties: "Money out",
  accesSortiesDetail: "Payouts, refunds, goodwill",
};

const ES: TraductionsTableauBord = {
  titre: "Área profesional",
  bonjour: "Hola",
  role: "Rol",
  apercu: "Modo vista previa: las escrituras están bloqueadas. Los datos mostrados son reales.",
  logements: "Alojamientos",
  logementsNote: "Inmuebles activos del tenant",
  reservations: "Reservas del mes",
  reservationsNote: "Todos los estados",
  ca: "Ingresos del mes",
  caNote: "Excluidos los viajes cancelados",
  arrivees: "Llegadas · 7 días",
  departs: "Salidas · 7 días",
  aucuneArrivee: "No hay llegadas previstas.",
  aucunDepart: "No hay salidas previstas.",
  acces: "Accesos rápidos",
  reglages: "Ajustes grupales",
  reglagesDetail: "Buffer, cutoff y estrategia en varios alojamientos",
  departConfirme: "Salida confirmada",
  accesLogements: "Alojamientos",
  accesLogementsDetail: "Inmuebles, fotos, equipamiento",
  accesPlanning: "Calendario",
  accesPlanningDetail: "Estancias y disponibilidad",
  accesMenage: "Limpieza",
  accesMenageDetail: "Misiones y calidad",
  accesFils: "Hilos internos",
  accesFilsDetail: "Propietario, proveedor, viajero",
  accesSorties: "Salidas de dinero",
  accesSortiesDetail: "Transferencias, reembolsos, gestos",
};

const IT: TraductionsTableauBord = {
  titre: "Area professionale",
  bonjour: "Ciao",
  role: "Ruolo",
  apercu: "Modalità anteprima: le scritture sono bloccate. I dati mostrati sono reali.",
  logements: "Alloggi",
  logementsNote: "Immobili attivi del tenant",
  reservations: "Prenotazioni del mese",
  reservationsNote: "Tutti gli stati",
  ca: "Ricavi del mese",
  caNote: "Esclusi i soggiorni annullati",
  arrivees: "Arrivi · 7 giorni",
  departs: "Partenze · 7 giorni",
  aucuneArrivee: "Nessun arrivo previsto.",
  aucunDepart: "Nessuna partenza prevista.",
  acces: "Accessi rapidi",
  reglages: "Impostazioni di gruppo",
  reglagesDetail: "Buffer, cutoff e strategia su più alloggi",
  departConfirme: "Partenza confermata",
  accesLogements: "Alloggi",
  accesLogementsDetail: "Immobili, foto, dotazioni",
  accesPlanning: "Calendario",
  accesPlanningDetail: "Soggiorni e disponibilità",
  accesMenage: "Pulizie",
  accesMenageDetail: "Incarichi e qualità",
  accesFils: "Thread interni",
  accesFilsDetail: "Proprietario, fornitore, viaggiatore",
  accesSorties: "Uscite di denaro",
  accesSortiesDetail: "Trasferimenti, rimborsi, gesti",
};

const DE: TraductionsTableauBord = {
  titre: "Profibereich",
  bonjour: "Hallo",
  role: "Rolle",
  apercu: "Vorschaumodus: Schreibvorgänge sind gesperrt. Die angezeigten Daten sind echt.",
  logements: "Unterkünfte",
  logementsNote: "Aktive Objekte des Mandanten",
  reservations: "Buchungen dieses Monats",
  reservationsNote: "Alle Status",
  ca: "Monatsumsatz",
  caNote: "Ohne stornierte Aufenthalte",
  arrivees: "Anreisen · 7 Tage",
  departs: "Abreisen · 7 Tage",
  aucuneArrivee: "Keine Anreisen geplant.",
  aucunDepart: "Keine Abreisen geplant.",
  acces: "Schnellzugriff",
  reglages: "Gruppeneinstellungen",
  reglagesDetail: "Buffer, Cutoff und Strategie für mehrere Unterkünfte",
  departConfirme: "Abreise bestätigt",
  accesLogements: "Unterkünfte",
  accesLogementsDetail: "Objekte, Fotos, Ausstattung",
  accesPlanning: "Kalender",
  accesPlanningDetail: "Aufenthalte und Verfügbarkeit",
  accesMenage: "Reinigung",
  accesMenageDetail: "Aufträge und Qualität",
  accesFils: "Interne Threads",
  accesFilsDetail: "Eigentümer, Dienstleister, Reisender",
  accesSorties: "Geldausgänge",
  accesSortiesDetail: "Auszahlungen, Erstattungen, Kulanz",
};

const DICTIONNAIRES: Record<Langue, TraductionsTableauBord> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsTableauBord(langue: string): TraductionsTableauBord {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
