/**
 * T510 — Traductions de l'écran Rapports (/hote/rapports).
 */
import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsRapports {
  titrePage: string;
  espace: string;
  titre: (mois: string) => string;
  description: string;
  precedent: string;
  courant: string;
  suivant: string;
  // KPIs
  kpiCa: string;
  kpiOccupation: string;
  kpiAdr: string;
  kpiRevpar: string;
  kpiReservations: string;
  // Mix canal
  mixCanalTitre: string;
  colCanal: string;
  colReservations: string;
  colCaCanal: string;
  colPart: string;
  aucunCanal: string;
  // Alertes
  alertesTitre: string;
  aucuneAlerte: string;
  // Table par logement
  parLogementTitre: string;
  colLogement: string;
  colSejours: string;
  colCa: string;
  colCommission: string;
  colCharges: string;
  colNet: string;
  aucunLogement: string;
  // Exports
  exportsTitre: string;
  resasCsv: string;
  facturesCsv: string;
  paiementsCsv: string;
  comptableCsv: string;
  // Divers
  nuits: (n: number) => string;
  sejours: (n: number) => string;
}

const FR: TraductionsRapports = {
  titrePage: "Rapports — Espace hôte",
  espace: "Espace hôte",
  titre: (mois) => `Rapports — ${mois}`,
  description: "Performance, mix canal, alertes et exports.",
  precedent: "Précédent",
  courant: "Mois courant",
  suivant: "Suivant",
  kpiCa: "Chiffre d'affaires",
  kpiOccupation: "Taux d'occupation",
  kpiAdr: "ADR",
  kpiRevpar: "RevPAR",
  kpiReservations: "Réservations",
  mixCanalTitre: "Mix canal",
  colCanal: "Canal",
  colReservations: "Réservations",
  colCaCanal: "CA",
  colPart: "Part",
  aucunCanal: "Aucune réservation sur la période.",
  alertesTitre: "Alertes",
  aucuneAlerte: "Aucune alerte sur la période.",
  parLogementTitre: "Détail par logement",
  colLogement: "Logement",
  colSejours: "Séjours",
  colCa: "CA",
  colCommission: "Commission",
  colCharges: "Charges",
  colNet: "Net",
  aucunLogement: "Aucun logement avec mandat actif.",
  exportsTitre: "Exports",
  resasCsv: "Réservations CSV",
  facturesCsv: "Factures CSV",
  paiementsCsv: "Paiements CSV",
  comptableCsv: "Comptable CSV",
  nuits: (n) => `${n} nuit${n > 1 ? "s" : ""}`,
  sejours: (n) => `${n} séjour${n > 1 ? "s" : ""}`,
};

const EN: TraductionsRapports = {
  titrePage: "Reports — Host space",
  espace: "Host space",
  titre: (mois) => `Reports — ${mois}`,
  description: "Performance, channel mix, alerts and exports.",
  precedent: "Previous",
  courant: "Current month",
  suivant: "Next",
  kpiCa: "Revenue",
  kpiOccupation: "Occupancy rate",
  kpiAdr: "ADR",
  kpiRevpar: "RevPAR",
  kpiReservations: "Reservations",
  mixCanalTitre: "Channel mix",
  colCanal: "Channel",
  colReservations: "Reservations",
  colCaCanal: "Revenue",
  colPart: "Share",
  aucunCanal: "No reservations for this period.",
  alertesTitre: "Alerts",
  aucuneAlerte: "No alerts for this period.",
  parLogementTitre: "Per property detail",
  colLogement: "Property",
  colSejours: "Stays",
  colCa: "Revenue",
  colCommission: "Commission",
  colCharges: "Charges",
  colNet: "Net",
  aucunLogement: "No property with active mandate.",
  exportsTitre: "Exports",
  resasCsv: "Reservations CSV",
  facturesCsv: "Invoices CSV",
  paiementsCsv: "Payments CSV",
  comptableCsv: "Accounting CSV",
  nuits: (n) => `${n} night${n > 1 ? "s" : ""}`,
  sejours: (n) => `${n} stay${n > 1 ? "s" : ""}`,
};

const ES: TraductionsRapports = {
  titrePage: "Informes — Espacio anfitrión",
  espace: "Espacio anfitrión",
  titre: (mois) => `Informes — ${mois}`,
  description: "Rendimiento, mix de canales, alertas y exportaciones.",
  precedent: "Anterior",
  courant: "Mes actual",
  suivant: "Siguiente",
  kpiCa: "Ingresos",
  kpiOccupation: "Tasa de ocupación",
  kpiAdr: "ADR",
  kpiRevpar: "RevPAR",
  kpiReservations: "Reservas",
  mixCanalTitre: "Mix de canales",
  colCanal: "Canal",
  colReservations: "Reservas",
  colCaCanal: "Ingresos",
  colPart: "Parte",
  aucunCanal: "Sin reservas en el período.",
  alertesTitre: "Alertas",
  aucuneAlerte: "Sin alertas en el período.",
  parLogementTitre: "Detalle por alojamiento",
  colLogement: "Alojamiento",
  colSejours: "Estancias",
  colCa: "Ingresos",
  colCommission: "Comisión",
  colCharges: "Cargos",
  colNet: "Neto",
  aucunLogement: "Sin alojamiento con mandato activo.",
  exportsTitre: "Exportaciones",
  resasCsv: "Reservas CSV",
  facturesCsv: "Facturas CSV",
  paiementsCsv: "Pagos CSV",
  comptableCsv: "Contable CSV",
  nuits: (n) => `${n} noche${n > 1 ? "s" : ""}`,
  sejours: (n) => `${n} estancia${n > 1 ? "s" : ""}`,
};

const IT: TraductionsRapports = {
  titrePage: "Report — Spazio host",
  espace: "Spazio host",
  titre: (mois) => `Report — ${mois}`,
  description: "Performance, mix canali, avvisi ed esportazioni.",
  precedent: "Precedente",
  courant: "Mese corrente",
  suivant: "Successivo",
  kpiCa: "Fatturato",
  kpiOccupation: "Tasso di occupazione",
  kpiAdr: "ADR",
  kpiRevpar: "RevPAR",
  kpiReservations: "Prenotazioni",
  mixCanalTitre: "Mix canali",
  colCanal: "Canale",
  colReservations: "Prenotazioni",
  colCaCanal: "Fatturato",
  colPart: "Quota",
  aucunCanal: "Nessuna prenotazione nel periodo.",
  alertesTitre: "Avvisi",
  aucuneAlerte: "Nessun avviso nel periodo.",
  parLogementTitre: "Dettaglio per alloggio",
  colLogement: "Alloggio",
  colSejours: "Soggiorni",
  colCa: "Fatturato",
  colCommission: "Commissione",
  colCharges: "Spese",
  colNet: "Netto",
  aucunLogement: "Nessun alloggio con mandato attivo.",
  exportsTitre: "Esportazioni",
  resasCsv: "Prenotazioni CSV",
  facturesCsv: "Fatture CSV",
  paiementsCsv: "Pagamenti CSV",
  comptableCsv: "Contabile CSV",
  nuits: (n) => `${n} notte${n > 1 ? "i" : ""}`,
  sejours: (n) => `${n} soggiorno${n > 1 ? "i" : ""}`,
};

const DE: TraductionsRapports = {
  titrePage: "Berichte — Gastgebersbereich",
  espace: "Gastgeberbereich",
  titre: (mois) => `Berichte — ${mois}`,
  description: "Leistung, Kanalmix, Warnungen und Exporte.",
  precedent: "Zurück",
  courant: "Aktueller Monat",
  suivant: "Weiter",
  kpiCa: "Umsatz",
  kpiOccupation: "Belegungsrate",
  kpiAdr: "ADR",
  kpiRevpar: "RevPAR",
  kpiReservations: "Buchungen",
  mixCanalTitre: "Kanalmix",
  colCanal: "Kanal",
  colReservations: "Buchungen",
  colCaCanal: "Umsatz",
  colPart: "Anteil",
  aucunCanal: "Keine Buchungen im Zeitraum.",
  alertesTitre: "Warnungen",
  aucuneAlerte: "Keine Warnungen im Zeitraum.",
  parLogementTitre: "Detail pro Unterkunft",
  colLogement: "Unterkunft",
  colSejours: "Aufenthalte",
  colCa: "Umsatz",
  colCommission: "Provision",
  colCharges: "Kosten",
  colNet: "Netto",
  aucunLogement: "Keine Unterkunft mit aktivem Mandat.",
  exportsTitre: "Exporte",
  resasCsv: "Buchungen CSV",
  facturesCsv: "Rechnungen CSV",
  paiementsCsv: "Zahlungen CSV",
  comptableCsv: "Buchhaltung CSV",
  nuits: (n) => `${n} Nacht${n > 1 ? "e" : ""}`,
  sejours: (n) => `${n} Aufenthalt${n > 1 ? "e" : ""}`,
};

const DICTIONNAIRES: Record<Langue, TraductionsRapports> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsRapports(langue: string): TraductionsRapports {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
