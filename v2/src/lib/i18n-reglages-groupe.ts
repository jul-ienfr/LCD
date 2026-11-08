import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsReglagesGroupe {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  okApplique: (n: string) => string;
  okRestaure: (n: string) => string;
  okAucun: string;
  erreurInattendue: string;
  nombreDefautApplique: string;
  nombreDefautRestaure: string;
  bufferLabel: string;
  bufferIndication: string;
  cutoffLabel: string;
  cutoffIndication: string;
  strategieLabel: string;
  placeholderInchange: string;
  optionInchangee: string;
  logementsConcernes: string;
  aucunLogement: string;
  previsualiser: string;
  appliquerVersion: string;
  diffTitre: string;
  colLogement: string;
  colAvant: string;
  colApres: string;
  colEtat: string;
  modifie: string;
  inchange: string;
  historiqueTitre: string;
  historiqueAide: string;
  aucuneVersion: string;
  colDate: string;
  colAction: string;
  colAuteur: string;
  colLogements: string;
  colRef: string;
  restauration: string;
  application: string;
  revenirAvant: string;
  lienPrix: string;
  lienPlanning: string;
  lienTableauBord: string;
  apercuAucunChangement: string;
  apercuModifies: (n: number) => string;
  resumeReglages: (
    buffer: number | string | null,
    cutoff: number | string | null,
    strategie: string,
  ) => string;
  localeDate: string;
}

const FR: TraductionsReglagesGroupe = {
  titrePage: "Réglages groupés — LCD Parc",
  surtitre: "Espace hôte · Configuration",
  titre: "Réglages groupés",
  description:
    "Appliquez le buffer ménage, le cutoff de réservation et la stratégie de prix à plusieurs logements. Prévisualisez le diff avant d’écrire : chaque application crée une version restaurable.",
  okApplique: (n) => `${n} logement(s) mis à jour. Une version a été créée.`,
  okRestaure: (n) => `Version restaurée sur ${n} logement(s).`,
  okAucun:
    "Aucun changement : ces logements ont déjà les réglages demandés.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  nombreDefautApplique: "Les",
  nombreDefautRestaure: "les",
  bufferLabel: "Buffer ménage (jours)",
  bufferIndication: "0 à 7 · vide = inchangé",
  cutoffLabel: "Cutoff réservation (jours)",
  cutoffIndication: "0 à 365 · vide = inchangé",
  strategieLabel: "Stratégie de prix",
  placeholderInchange: "Inchangé",
  optionInchangee: "Inchangée",
  logementsConcernes: "Logements concernés",
  aucunLogement: "Aucun logement actif.",
  previsualiser: "Prévisualiser",
  appliquerVersion: "Appliquer et créer une version",
  diffTitre: "Diff avant application",
  colLogement: "Logement",
  colAvant: "Avant",
  colApres: "Après",
  colEtat: "État",
  modifie: "Modifié",
  inchange: "Inchangé",
  historiqueTitre: "Historique des versions",
  historiqueAide:
    "« Revenir avant » remet les valeurs d’avant la version choisie. L’opération est elle-même versionnée et auditée.",
  aucuneVersion: "Aucune version pour le moment.",
  colDate: "Date",
  colAction: "Action",
  colAuteur: "Auteur",
  colLogements: "Logements",
  colRef: "Réf.",
  restauration: "Restauration",
  application: "Application",
  revenirAvant: "Revenir avant",
  lienPrix: "Prix et disponibilités",
  lienPlanning: "Planning",
  lienTableauBord: "Tableau de bord",
  apercuAucunChangement:
    "Aucun changement : les logements ont déjà ces réglages.",
  apercuModifies: (n) => `${n} logement(s) seraient modifiés.`,
  resumeReglages: (buffer, cutoff, strategie) =>
    `buffer ${buffer} j · cutoff ${cutoff} j · ${strategie}`,
  localeDate: "fr-FR",
};

const EN: TraductionsReglagesGroupe = {
  titrePage: "Bulk settings — LCD Parc",
  surtitre: "Host space · Configuration",
  titre: "Bulk settings",
  description:
    "Apply the housekeeping buffer, the booking cutoff and the pricing strategy to several properties. Preview the diff before writing: each application creates a restorable version.",
  okApplique: (n) => `${n} propert(y/ies) updated. A version was created.`,
  okRestaure: (n) => `Version restored on ${n} propert(y/ies).`,
  okAucun: "No changes: these properties already have the requested settings.",
  erreurInattendue: "Unexpected error. Please try again.",
  nombreDefautApplique: "The",
  nombreDefautRestaure: "the",
  bufferLabel: "Housekeeping buffer (days)",
  bufferIndication: "0 to 7 · empty = unchanged",
  cutoffLabel: "Booking cutoff (days)",
  cutoffIndication: "0 to 365 · empty = unchanged",
  strategieLabel: "Pricing strategy",
  placeholderInchange: "Unchanged",
  optionInchangee: "Unchanged",
  logementsConcernes: "Properties concerned",
  aucunLogement: "No active property.",
  previsualiser: "Preview",
  appliquerVersion: "Apply and create a version",
  diffTitre: "Diff before applying",
  colLogement: "Property",
  colAvant: "Before",
  colApres: "After",
  colEtat: "Status",
  modifie: "Modified",
  inchange: "Unchanged",
  historiqueTitre: "Version history",
  historiqueAide:
    "“Roll back” restores the values from before the chosen version. The operation itself is versioned and audited.",
  aucuneVersion: "No versions yet.",
  colDate: "Date",
  colAction: "Action",
  colAuteur: "Author",
  colLogements: "Properties",
  colRef: "Ref.",
  restauration: "Rollback",
  application: "Application",
  revenirAvant: "Roll back",
  lienPrix: "Prices & availability",
  lienPlanning: "Calendar",
  lienTableauBord: "Dashboard",
  apercuAucunChangement:
    "No changes: the properties already have these settings.",
  apercuModifies: (n) => `${n} propert(y/ies) would be modified.`,
  resumeReglages: (buffer, cutoff, strategie) =>
    `buffer ${buffer} d · cutoff ${cutoff} d · ${strategie}`,
  localeDate: "en-GB",
};

const ES: TraductionsReglagesGroupe = {
  titrePage: "Ajustes en bloque — LCD Parc",
  surtitre: "Espacio anfitrión · Configuración",
  titre: "Ajustes en bloque",
  description:
    "Aplica el margen de limpieza, el cutoff de reserva y la estrategia de precios a varios alojamientos. Previsualiza el diff antes de escribir: cada aplicación crea una versión restaurable.",
  okApplique: (n) =>
    `${n} alojamiento(s) actualizado(s). Se ha creado una versión.`,
  okRestaure: (n) => `Versión restaurada en ${n} alojamiento(s).`,
  okAucun:
    "Sin cambios: estos alojamientos ya tienen los ajustes solicitados.",
  erreurInattendue: "Error inesperado. Inténtalo de nuevo.",
  nombreDefautApplique: "Los",
  nombreDefautRestaure: "los",
  bufferLabel: "Margen de limpieza (días)",
  bufferIndication: "0 a 7 · vacío = sin cambios",
  cutoffLabel: "Cutoff de reserva (días)",
  cutoffIndication: "0 a 365 · vacío = sin cambios",
  strategieLabel: "Estrategia de precios",
  placeholderInchange: "Sin cambios",
  optionInchangee: "Sin cambios",
  logementsConcernes: "Alojamientos afectados",
  aucunLogement: "Ningún alojamiento activo.",
  previsualiser: "Previsualizar",
  appliquerVersion: "Aplicar y crear una versión",
  diffTitre: "Diff antes de aplicar",
  colLogement: "Alojamiento",
  colAvant: "Antes",
  colApres: "Después",
  colEtat: "Estado",
  modifie: "Modificado",
  inchange: "Sin cambios",
  historiqueTitre: "Historial de versiones",
  historiqueAide:
    "«Volver atrás» restaura los valores previos a la versión elegida. La operación también se versiona y audita.",
  aucuneVersion: "Aún no hay versiones.",
  colDate: "Fecha",
  colAction: "Acción",
  colAuteur: "Autor",
  colLogements: "Alojamientos",
  colRef: "Ref.",
  restauration: "Restauración",
  application: "Aplicación",
  revenirAvant: "Volver atrás",
  lienPrix: "Precios y disponibilidad",
  lienPlanning: "Calendario",
  lienTableauBord: "Panel de control",
  apercuAucunChangement:
    "Sin cambios: los alojamientos ya tienen estos ajustes.",
  apercuModifies: (n) => `${n} alojamiento(s) se modificarían.`,
  resumeReglages: (buffer, cutoff, strategie) =>
    `margen ${buffer} d · cutoff ${cutoff} d · ${strategie}`,
  localeDate: "es-ES",
};

const IT: TraductionsReglagesGroupe = {
  titrePage: "Impostazioni in blocco — LCD Parc",
  surtitre: "Area host · Configurazione",
  titre: "Impostazioni in blocco",
  description:
    "Applica il buffer pulizie, il cutoff di prenotazione e la strategia di prezzo a più alloggi. Visualizza il diff prima di scrivere: ogni applicazione crea una versione ripristinabile.",
  okApplique: (n) =>
    `${n} alloggio/i aggiornati. È stata creata una versione.`,
  okRestaure: (n) => `Versione ripristinata su ${n} alloggio/i.`,
  okAucun:
    "Nessuna modifica: questi alloggi hanno già le impostazioni richieste.",
  erreurInattendue: "Errore imprevisto. Riprova.",
  nombreDefautApplique: "Gli",
  nombreDefautRestaure: "gli",
  bufferLabel: "Buffer pulizie (giorni)",
  bufferIndication: "da 0 a 7 · vuoto = invariato",
  cutoffLabel: "Cutoff prenotazione (giorni)",
  cutoffIndication: "da 0 a 365 · vuoto = invariato",
  strategieLabel: "Strategia di prezzo",
  placeholderInchange: "Invariato",
  optionInchangee: "Invariata",
  logementsConcernes: "Alloggi interessati",
  aucunLogement: "Nessun alloggio attivo.",
  previsualiser: "Anteprima",
  appliquerVersion: "Applica e crea una versione",
  diffTitre: "Diff prima dell’applicazione",
  colLogement: "Alloggio",
  colAvant: "Prima",
  colApres: "Dopo",
  colEtat: "Stato",
  modifie: "Modificato",
  inchange: "Invariato",
  historiqueTitre: "Cronologia delle versioni",
  historiqueAide:
    "«Ripristina» riporta i valori precedenti alla versione scelta. L’operazione è a sua volta versionata e auditata.",
  aucuneVersion: "Ancora nessuna versione.",
  colDate: "Data",
  colAction: "Azione",
  colAuteur: "Autore",
  colLogements: "Alloggi",
  colRef: "Rif.",
  restauration: "Ripristino",
  application: "Applicazione",
  revenirAvant: "Ripristina",
  lienPrix: "Prezzi e disponibilità",
  lienPlanning: "Calendario",
  lienTableauBord: "Cruscotto",
  apercuAucunChangement:
    "Nessuna modifica: gli alloggi hanno già queste impostazioni.",
  apercuModifies: (n) => `${n} alloggio/i verrebbero modificati.`,
  resumeReglages: (buffer, cutoff, strategie) =>
    `buffer ${buffer} g · cutoff ${cutoff} g · ${strategie}`,
  localeDate: "it-IT",
};

const DE: TraductionsReglagesGroupe = {
  titrePage: "Sammel-Einstellungen — LCD Parc",
  surtitre: "Gastgeberbereich · Konfiguration",
  titre: "Sammel-Einstellungen",
  description:
    "Wenden Sie den Reinigungspuffer, den Buchungs-Cutoff und die Preisstrategie auf mehrere Unterkünfte an. Sehen Sie sich den Diff vor dem Schreiben an: Jede Anwendung erstellt eine wiederherstellbare Version.",
  okApplique: (n) =>
    `${n} Unterkunft(en) aktualisiert. Eine Version wurde erstellt.`,
  okRestaure: (n) => `Version auf ${n} Unterkunft(en) wiederhergestellt.`,
  okAucun:
    "Keine Änderungen: Diese Unterkünfte haben bereits die gewünschten Einstellungen.",
  erreurInattendue: "Unerwarteter Fehler. Bitte erneut versuchen.",
  nombreDefautApplique: "Die",
  nombreDefautRestaure: "die",
  bufferLabel: "Reinigungspuffer (Tage)",
  bufferIndication: "0 bis 7 · leer = unverändert",
  cutoffLabel: "Buchungs-Cutoff (Tage)",
  cutoffIndication: "0 bis 365 · leer = unverändert",
  strategieLabel: "Preisstrategie",
  placeholderInchange: "Unverändert",
  optionInchangee: "Unverändert",
  logementsConcernes: "Betroffene Unterkünfte",
  aucunLogement: "Keine aktive Unterkunft.",
  previsualiser: "Vorschau",
  appliquerVersion: "Anwenden und Version erstellen",
  diffTitre: "Diff vor der Anwendung",
  colLogement: "Unterkunft",
  colAvant: "Vorher",
  colApres: "Nachher",
  colEtat: "Status",
  modifie: "Geändert",
  inchange: "Unverändert",
  historiqueTitre: "Versionsverlauf",
  historiqueAide:
    "„Zurücksetzen“ stellt die Werte von vor der gewählten Version wieder her. Der Vorgang selbst wird ebenfalls versioniert und protokolliert.",
  aucuneVersion: "Noch keine Versionen.",
  colDate: "Datum",
  colAction: "Aktion",
  colAuteur: "Autor",
  colLogements: "Unterkünfte",
  colRef: "Ref.",
  restauration: "Wiederherstellung",
  application: "Anwendung",
  revenirAvant: "Zurücksetzen",
  lienPrix: "Preise & Verfügbarkeiten",
  lienPlanning: "Belegungsplan",
  lienTableauBord: "Übersicht",
  apercuAucunChangement:
    "Keine Änderungen: Die Unterkünfte haben bereits diese Einstellungen.",
  apercuModifies: (n) => `${n} Unterkunft(en) würden geändert.`,
  resumeReglages: (buffer, cutoff, strategie) =>
    `Puffer ${buffer} T · Cutoff ${cutoff} T · ${strategie}`,
  localeDate: "de-DE",
};

const DICTIONNAIRES: Record<Langue, TraductionsReglagesGroupe> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsReglagesGroupe(
  langue: string,
): TraductionsReglagesGroupe {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
