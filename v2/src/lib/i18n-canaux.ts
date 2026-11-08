import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsCanaux {
  titrePage: string;
  espace: string;
  titre: string;
  description: string;
  retourPlanning: string;
  importIcs: string;
  notice: string;
  fournisseurTitre: string;
  reserveSuperAdmin: string;
  identifiantExterne: string;
  derniereSync: string;
  jamais: string;
  etat: string;
  aucunFournisseur: string;
  creerLogement: string;
  logement: string;
  afficher: string;
  santeCanaux: string;
  canaux: string;
  exportsActifs: string;
  importsIcal: string;
  erreursRetard: string;
  ajouterCanal: (nom: string) => string;
  ajouterCanalAide: string;
  plateforme: string;
  choisir: string;
  icalVerifier: string;
  nomAffiche: string;
  identifiantAnnonceFacultatif: string;
  urlImportFacultatif: string;
  bufferApresDepart: string;
  intervalleImport: string;
  publierExport: string;
  notesInternesFacultatif: string;
  ajouter: string;
  canauxDe: (nom: string) => string;
  sansImport: (n: number) => string;
  aucunCanal: string;
  icalVerifierBadge: string;
  apiNative: string;
  canalActif: string;
  canalDesactive: string;
  exportActif: string;
  exportCoupe: string;
  importIcal: string;
  jamaisSynchronise: string;
  enRetard: string;
  derniereSyncLabel: string;
  prochainEssai: string;
  intervalle: string;
  echecs: (n: number) => string;
  aucunFlux: string;
  exportVers: string;
  urlSignee: string;
  telecharger: string;
  exportDesactive: string;
  buffer: (n: number) => string;
  identifiantAnnonce: string;
  notes: string;
  synchroniser: string;
  retirerImport: string;
  modifierCanal: string;
  laisserVide: string;
  canalActifLabel: string;
  exportActifLabel: string;
  desactiverAide: string;
  notesInternes: string;
  enregistrer: string;
  supprimerCanal: string;
  supprimerAide: string;
  confirmerSuppression: string;
  placeholderLibelle: string;
  placeholderUrl: string;
  placeholderId: string;
  desQuePossible: string;
  videLogement: string;
}

const FR: TraductionsCanaux = {
  titrePage: "Channel manager — LCD Parc", espace: "Espace hôte · Planning",
  titre: "Channel manager",
  description: "Un planning central, plusieurs canaux. LCD importe les réservations iCal de chaque plateforme et publie un calendrier signé par canal, avec un buffer de ménage paramétrable.",
  retourPlanning: "← Planning", importIcs: "Import ICS",
  notice: "Le canal manager V2 fonctionne en iCal : import des réservations et export des indisponibilités. Les tarifs, minimums de séjour et promotions ne sont pas transportés par iCal. Les API natives Airbnb, Booking et Expedia restent fermées sans contrat partenaire ; aucun connecteur ne prétend écrire dans ces plateformes sans cette certification.",
  fournisseurTitre: "Fournisseur channel manager",
  reserveSuperAdmin: "Ce choix est réservé au super-admin. Les canaux iCal restent disponibles en complément.",
  identifiantExterne: "Identifiant externe", derniereSync: "Dernière synchronisation",
  jamais: "jamais", etat: "État",
  aucunFournisseur: "Aucun fournisseur API n’est encore affecté à ce logement. Le super-admin peut en choisir un dans Supervision → Fournisseurs.",
  creerLogement: "Créer un logement", logement: "Logement", afficher: "Afficher",
  santeCanaux: "Santé des canaux", canaux: "Canaux", exportsActifs: "Exports actifs",
  importsIcal: "Imports iCal", erreursRetard: "Erreurs / retard",
  ajouterCanal: (nom) => `Ajouter un canal — ${nom}`,
  ajouterCanalAide: "Le nom du canal est libre. L’identifiant d’annonce sert de clé de rapprochement pour un futur connecteur API ; il reste facultatif en iCal.",
  plateforme: "Plateforme", choisir: "Choisir…", icalVerifier: "iCal à vérifier",
  nomAffiche: "Nom affiché", identifiantAnnonceFacultatif: "Identifiant d’annonce (facultatif)",
  urlImportFacultatif: "URL iCal d’import (facultatif)",
  bufferApresDepart: "Buffer après départ (jours)",
  intervalleImport: "Intervalle d’import (minutes)",
  publierExport: "Publier le calendrier d’export",
  notesInternesFacultatif: "Notes internes (facultatif)", ajouter: "Ajouter le canal",
  canauxDe: (nom) => `Canaux de ${nom}`,
  sansImport: (n) => `${n} canal(aux) sans import iCal : ils peuvent déjà recevoir le calendrier d’export.`,
  aucunCanal: "Aucun canal configuré. Ajoutez Airbnb, Booking ou un canal générique pour commencer.",
  icalVerifierBadge: "iCal à vérifier", apiNative: "API native sur contrat",
  canalActif: "Canal actif", canalDesactive: "Canal désactivé",
  exportActif: "Export actif", exportCoupe: "Export coupé", importIcal: "Import iCal",
  jamaisSynchronise: "Jamais synchronisé", enRetard: "en retard",
  derniereSyncLabel: "Dernière sync", prochainEssai: "Prochain essai",
  intervalle: "Intervalle", echecs: (n) => `${n} échec(s) consécutif(s)`,
  aucunFlux: "Aucun flux importé. Les réservations de cette plateforme ne sont pas lues par LCD.",
  exportVers: "Export vers la plateforme", urlSignee: "URL iCalendar signée",
  telecharger: "Télécharger le .ics", exportDesactive: "Export désactivé",
  buffer: (n) => `Buffer : ${n} jour(s)`,
  identifiantAnnonce: "Identifiant d’annonce", notes: "Notes",
  synchroniser: "Synchroniser maintenant", retirerImport: "Retirer l’import iCal",
  modifierCanal: "Modifier le canal", laisserVide: "Laisser vide pour ne pas modifier",
  canalActifLabel: "Canal actif", exportActifLabel: "Export actif",
  desactiverAide: "Désactiver le canal coupe l’export. Pour arrêter l’import, utilisez « Retirer l’import iCal ».",
  notesInternes: "Notes internes", enregistrer: "Enregistrer",
  supprimerCanal: "Supprimer ce canal",
  supprimerAide: "Le flux iCal et son historique seront supprimés. Les réservations déjà importées restent dans le planning.",
  confirmerSuppression: "Confirmer la suppression",
  placeholderLibelle: "Airbnb — Studio Nice", placeholderUrl: "https://…/calendar.ics",
  placeholderId: "12345678", desQuePossible: "dès que possible",
  videLogement: "Créez d’abord un logement pour configurer ses canaux.",
};

const EN: TraductionsCanaux = {
  titrePage: "Channel manager — LCD Parc", espace: "Staff area · Planning",
  titre: "Channel manager",
  description: "One central calendar, several channels. LCD imports each platform’s iCal bookings and publishes a signed calendar per channel, with a configurable cleaning buffer.",
  retourPlanning: "← Planning", importIcs: "ICS import",
  notice: "Channel manager V2 works over iCal: booking import and availability export. Rates, minimum stays and promotions are not carried by iCal. Native Airbnb, Booking and Expedia APIs remain closed without a partner contract; no connector claims to write to these platforms without that certification.",
  fournisseurTitre: "Channel manager provider",
  reserveSuperAdmin: "This choice is reserved for the super-admin. iCal channels remain available as a complement.",
  identifiantExterne: "External ID", derniereSync: "Last sync",
  jamais: "never", etat: "Status",
  aucunFournisseur: "No API provider is assigned to this property yet. A super-admin can choose one in Supervision → Providers.",
  creerLogement: "Create a property", logement: "Property", afficher: "Show",
  santeCanaux: "Channel health", canaux: "Channels", exportsActifs: "Active exports",
  importsIcal: "iCal imports", erreursRetard: "Errors / late",
  ajouterCanal: (nom) => `Add a channel — ${nom}`,
  ajouterCanalAide: "The channel name is free-form. The listing ID is the matching key for a future API connector; it stays optional in iCal.",
  plateforme: "Platform", choisir: "Choose…", icalVerifier: "iCal to verify",
  nomAffiche: "Display name", identifiantAnnonceFacultatif: "Listing ID (optional)",
  urlImportFacultatif: "iCal import URL (optional)",
  bufferApresDepart: "Buffer after departure (days)",
  intervalleImport: "Import interval (minutes)",
  publierExport: "Publish the export calendar",
  notesInternesFacultatif: "Internal notes (optional)", ajouter: "Add channel",
  canauxDe: (nom) => `${nom} channels`,
  sansImport: (n) => `${n} channel(s) without iCal import: they can already receive the export calendar.`,
  aucunCanal: "No channel configured. Add Airbnb, Booking or a generic channel to start.",
  icalVerifierBadge: "iCal to verify", apiNative: "Native API under contract",
  canalActif: "Channel active", canalDesactive: "Channel disabled",
  exportActif: "Export active", exportCoupe: "Export off", importIcal: "iCal import",
  jamaisSynchronise: "Never synced", enRetard: "late",
  derniereSyncLabel: "Last sync", prochainEssai: "Next attempt",
  intervalle: "Interval", echecs: (n) => `${n} consecutive failure(s)`,
  aucunFlux: "No imported feed. Bookings from this platform are not read by LCD.",
  exportVers: "Export to the platform", urlSignee: "Signed iCalendar URL",
  telecharger: "Download the .ics", exportDesactive: "Export disabled",
  buffer: (n) => `Buffer: ${n} day(s)`,
  identifiantAnnonce: "Listing ID", notes: "Notes",
  synchroniser: "Sync now", retirerImport: "Remove iCal import",
  modifierCanal: "Edit channel", laisserVide: "Leave empty to keep unchanged",
  canalActifLabel: "Channel active", exportActifLabel: "Export active",
  desactiverAide: "Disabling the channel cuts the export. To stop the import, use “Remove iCal import”.",
  notesInternes: "Internal notes", enregistrer: "Save",
  supprimerCanal: "Delete this channel",
  supprimerAide: "The iCal feed and its history will be deleted. Already imported bookings remain in the planning.",
  confirmerSuppression: "Confirm deletion",
  placeholderLibelle: "Airbnb — Nice studio", placeholderUrl: "https://…/calendar.ics",
  placeholderId: "12345678", desQuePossible: "as soon as possible",
  videLogement: "Create a property first to configure its channels.",
};

const ES: TraductionsCanaux = {
  titrePage: "Channel manager — LCD Parc", espace: "Área profesional · Planificación",
  titre: "Channel manager",
  description: "Una planificación central, varios canales. LCD importa las reservas iCal de cada plataforma y publica un calendario firmado por canal, con un buffer de limpieza configurable.",
  retourPlanning: "← Planificación", importIcs: "Importar ICS",
  notice: "Channel manager V2 funciona en iCal: importación de reservas y exportación de indisponibilidades. Las tarifas, estancias mínimas y promociones no se transportan por iCal. Las API nativas de Airbnb, Booking y Expedia siguen cerradas sin contrato de socio; ningún conector afirma escribir en estas plataformas sin esa certificación.",
  fournisseurTitre: "Proveedor channel manager",
  reserveSuperAdmin: "Esta elección está reservada al super-admin. Los canales iCal siguen disponibles como complemento.",
  identifiantExterne: "Identificador externo", derniereSync: "Última sincronización",
  jamais: "nunca", etat: "Estado",
  aucunFournisseur: "Ningún proveedor API está asignado a este alojamiento. Un super-admin puede elegir uno en Supervisión → Proveedores.",
  creerLogement: "Crear un alojamiento", logement: "Alojamiento", afficher: "Mostrar",
  santeCanaux: "Salud de los canales", canaux: "Canales", exportsActifs: "Exportaciones activas",
  importsIcal: "Importaciones iCal", erreursRetard: "Errores / retraso",
  ajouterCanal: (nom) => `Añadir un canal — ${nom}`,
  ajouterCanalAide: "El nombre del canal es libre. El identificador de anuncio sirve de clave de conciliación para un futuro conector API; sigue siendo opcional en iCal.",
  plateforme: "Plataforma", choisir: "Elegir…", icalVerifier: "iCal por verificar",
  nomAffiche: "Nombre mostrado", identifiantAnnonceFacultatif: "Identificador de anuncio (opcional)",
  urlImportFacultatif: "URL iCal de importación (opcional)",
  bufferApresDepart: "Buffer tras la salida (días)",
  intervalleImport: "Intervalo de importación (minutos)",
  publierExport: "Publicar el calendario de exportación",
  notesInternesFacultatif: "Notas internas (opcional)", ajouter: "Añadir canal",
  canauxDe: (nom) => `Canales de ${nom}`,
  sansImport: (n) => `${n} canal(es) sin importación iCal: ya pueden recibir el calendario de exportación.`,
  aucunCanal: "Ningún canal configurado. Añada Airbnb, Booking o un canal genérico para empezar.",
  icalVerifierBadge: "iCal por verificar", apiNative: "API nativa con contrato",
  canalActif: "Canal activo", canalDesactive: "Canal desactivado",
  exportActif: "Exportación activa", exportCoupe: "Exportación cortada", importIcal: "Importación iCal",
  jamaisSynchronise: "Nunca sincronizado", enRetard: "con retraso",
  derniereSyncLabel: "Última sincronización", prochainEssai: "Próximo intento",
  intervalle: "Intervalo", echecs: (n) => `${n} fallo(s) consecutivo(s)`,
  aucunFlux: "Ningún flujo importado. LCD no lee las reservas de esta plataforma.",
  exportVers: "Exportación a la plataforma", urlSignee: "URL iCalendar firmada",
  telecharger: "Descargar el .ics", exportDesactive: "Exportación desactivada",
  buffer: (n) => `Buffer: ${n} día(s)`,
  identifiantAnnonce: "Identificador de anuncio", notes: "Notas",
  synchroniser: "Sincronizar ahora", retirerImport: "Quitar importación iCal",
  modifierCanal: "Modificar canal", laisserVide: "Dejar vacío para no modificar",
  canalActifLabel: "Canal activo", exportActifLabel: "Exportación activa",
  desactiverAide: "Desactivar el canal corta la exportación. Para detener la importación, use «Quitar importación iCal».",
  notesInternes: "Notas internas", enregistrer: "Guardar",
  supprimerCanal: "Eliminar este canal",
  supprimerAide: "El flujo iCal y su historial se eliminarán. Las reservas ya importadas permanecen en la planificación.",
  confirmerSuppression: "Confirmar eliminación",
  placeholderLibelle: "Airbnb — Estudio Niza", placeholderUrl: "https://…/calendar.ics",
  placeholderId: "12345678", desQuePossible: "lo antes posible",
  videLogement: "Cree primero un alojamiento para configurar sus canales.",
};

const IT: TraductionsCanaux = {
  titrePage: "Channel manager — LCD Parc", espace: "Area professionale · Pianificazione",
  titre: "Channel manager",
  description: "Una pianificazione centrale, più canali. LCD importa le prenotazioni iCal di ogni piattaforma e pubblica un calendario firmato per canale, con un buffer di pulizia configurabile.",
  retourPlanning: "← Pianificazione", importIcs: "Importa ICS",
  notice: "Channel manager V2 funziona in iCal: importazione prenotazioni ed esportazione indisponibilità. Tariffe, soggiorni minimi e promozioni non sono trasportati da iCal. Le API native Airbnb, Booking ed Expedia restano chiuse senza contratto partner; nessun connettore dichiara di scrivere su queste piattaforme senza tale certificazione.",
  fournisseurTitre: "Fornitore channel manager",
  reserveSuperAdmin: "Questa scelta è riservata al super-admin. I canali iCal restano disponibili in complemento.",
  identifiantExterne: "Identificativo esterno", derniereSync: "Ultima sincronizzazione",
  jamais: "mai", etat: "Stato",
  aucunFournisseur: "Nessun fornitore API è ancora assegnato a questo alloggio. Un super-admin può sceglierne uno in Supervisione → Fornitori.",
  creerLogement: "Crea un alloggio", logement: "Alloggio", afficher: "Mostra",
  santeCanaux: "Salute dei canali", canaux: "Canali", exportsActifs: "Esportazioni attive",
  importsIcal: "Importazioni iCal", erreursRetard: "Errori / ritardo",
  ajouterCanal: (nom) => `Aggiungi un canale — ${nom}`,
  ajouterCanalAide: "Il nome del canale è libero. L’identificativo annuncio serve da chiave di riconciliazione per un futuro connettore API; resta facoltativo in iCal.",
  plateforme: "Piattaforma", choisir: "Scegli…", icalVerifier: "iCal da verificare",
  nomAffiche: "Nome visualizzato", identifiantAnnonceFacultatif: "Identificativo annuncio (facoltativo)",
  urlImportFacultatif: "URL iCal di importazione (facoltativo)",
  bufferApresDepart: "Buffer dopo la partenza (giorni)",
  intervalleImport: "Intervallo di importazione (minuti)",
  publierExport: "Pubblica il calendario di esportazione",
  notesInternesFacultatif: "Note interne (facoltativo)", ajouter: "Aggiungi canale",
  canauxDe: (nom) => `Canali di ${nom}`,
  sansImport: (n) => `${n} canale/i senza importazione iCal: possono già ricevere il calendario di esportazione.`,
  aucunCanal: "Nessun canale configurato. Aggiunga Airbnb, Booking o un canale generico per iniziare.",
  icalVerifierBadge: "iCal da verificare", apiNative: "API nativa con contratto",
  canalActif: "Canale attivo", canalDesactive: "Canale disattivato",
  exportActif: "Esportazione attiva", exportCoupe: "Esportazione interrotta", importIcal: "Importazione iCal",
  jamaisSynchronise: "Mai sincronizzato", enRetard: "in ritardo",
  derniereSyncLabel: "Ultima sincronizzazione", prochainEssai: "Prossimo tentativo",
  intervalle: "Intervallo", echecs: (n) => `${n} errore/i consecutivo/i`,
  aucunFlux: "Nessun flusso importato. LCD non legge le prenotazioni di questa piattaforma.",
  exportVers: "Esportazione verso la piattaforma", urlSignee: "URL iCalendar firmata",
  telecharger: "Scarica il .ics", exportDesactive: "Esportazione disattivata",
  buffer: (n) => `Buffer: ${n} giorno/i`,
  identifiantAnnonce: "Identificativo annuncio", notes: "Note",
  synchroniser: "Sincronizza ora", retirerImport: "Rimuovi importazione iCal",
  modifierCanal: "Modifica canale", laisserVide: "Lasciare vuoto per non modificare",
  canalActifLabel: "Canale attivo", exportActifLabel: "Esportazione attiva",
  desactiverAide: "Disattivare il canale interrompe l’esportazione. Per fermare l’importazione, usi «Rimuovi importazione iCal».",
  notesInternes: "Note interne", enregistrer: "Salva",
  supprimerCanal: "Elimina questo canale",
  supprimerAide: "Il flusso iCal e la sua cronologia saranno eliminati. Le prenotazioni già importate restano nella pianificazione.",
  confirmerSuppression: "Conferma eliminazione",
  placeholderLibelle: "Airbnb — Studio Nizza", placeholderUrl: "https://…/calendar.ics",
  placeholderId: "12345678", desQuePossible: "prima possibile",
  videLogement: "Crei prima un alloggio per configurare i suoi canali.",
};

const DE: TraductionsCanaux = {
  titrePage: "Channel manager — LCD Parc", espace: "Profibereich · Planung",
  titre: "Channel manager",
  description: "Ein zentraler Kalender, mehrere Kanäle. LCD importiert die iCal-Buchungen jeder Plattform und veröffentlicht einen signierten Kalender pro Kanal, mit konfigurierbarem Reinigungspuffer.",
  retourPlanning: "← Planung", importIcs: "ICS importieren",
  notice: "Channel manager V2 arbeitet über iCal: Buchungsimport und Verfügbarkeitsexport. Preise, Mindestaufenthalte und Aktionen werden nicht über iCal übertragen. Die nativen APIs von Airbnb, Booking und Expedia bleiben ohne Partnervertrag geschlossen; kein Connector behauptet, ohne diese Zertifizierung in diese Plattformen zu schreiben.",
  fournisseurTitre: "Channel-Manager-Anbieter",
  reserveSuperAdmin: "Diese Wahl ist dem Super-Admin vorbehalten. iCal-Kanäle bleiben ergänzend verfügbar.",
  identifiantExterne: "Externe ID", derniereSync: "Letzte Synchronisierung",
  jamais: "nie", etat: "Status",
  aucunFournisseur: "Dieser Unterkunft ist noch kein API-Anbieter zugewiesen. Ein Super-Admin kann in Supervision → Anbieter einen auswählen.",
  creerLogement: "Unterkunft erstellen", logement: "Unterkunft", afficher: "Anzeigen",
  santeCanaux: "Kanalzustand", canaux: "Kanäle", exportsActifs: "Aktive Exporte",
  importsIcal: "iCal-Importe", erreursRetard: "Fehler / Verzug",
  ajouterCanal: (nom) => `Kanal hinzufügen — ${nom}`,
  ajouterCanalAide: "Der Kanalname ist frei. Die Inserats-ID dient als Abgleichsschlüssel für einen künftigen API-Connector; in iCal bleibt sie optional.",
  plateforme: "Plattform", choisir: "Auswählen…", icalVerifier: "iCal zu prüfen",
  nomAffiche: "Anzeigename", identifiantAnnonceFacultatif: "Inserats-ID (optional)",
  urlImportFacultatif: "iCal-Import-URL (optional)",
  bufferApresDepart: "Puffer nach Abreise (Tage)",
  intervalleImport: "Importintervall (Minuten)",
  publierExport: "Exportkalender veröffentlichen",
  notesInternesFacultatif: "Interne Notizen (optional)", ajouter: "Kanal hinzufügen",
  canauxDe: (nom) => `Kanäle von ${nom}`,
  sansImport: (n) => `${n} Kanal/Kanäle ohne iCal-Import: sie können den Exportkalender bereits erhalten.`,
  aucunCanal: "Kein Kanal konfiguriert. Fügen Sie Airbnb, Booking oder einen generischen Kanal hinzu.",
  icalVerifierBadge: "iCal zu prüfen", apiNative: "Native API mit Vertrag",
  canalActif: "Kanal aktiv", canalDesactive: "Kanal deaktiviert",
  exportActif: "Export aktiv", exportCoupe: "Export aus", importIcal: "iCal-Import",
  jamaisSynchronise: "Nie synchronisiert", enRetard: "verspätet",
  derniereSyncLabel: "Letzte Synchronisierung", prochainEssai: "Nächster Versuch",
  intervalle: "Intervall", echecs: (n) => `${n} aufeinanderfolgende(r) Fehler`,
  aucunFlux: "Kein importierter Feed. Buchungen dieser Plattform werden von LCD nicht gelesen.",
  exportVers: "Export zur Plattform", urlSignee: "Signierte iCalendar-URL",
  telecharger: "Die .ics herunterladen", exportDesactive: "Export deaktiviert",
  buffer: (n) => `Puffer: ${n} Tag(e)`,
  identifiantAnnonce: "Inserats-ID", notes: "Notizen",
  synchroniser: "Jetzt synchronisieren", retirerImport: "iCal-Import entfernen",
  modifierCanal: "Kanal bearbeiten", laisserVide: "Leer lassen, um nicht zu ändern",
  canalActifLabel: "Kanal aktiv", exportActifLabel: "Export aktiv",
  desactiverAide: "Das Deaktivieren des Kanals stoppt den Export. Um den Import zu stoppen, verwenden Sie „iCal-Import entfernen“.",
  notesInternes: "Interne Notizen", enregistrer: "Speichern",
  supprimerCanal: "Diesen Kanal löschen",
  supprimerAide: "Der iCal-Feed und seine Historie werden gelöscht. Bereits importierte Buchungen bleiben in der Planung.",
  confirmerSuppression: "Löschung bestätigen",
  placeholderLibelle: "Airbnb — Studio Nizza", placeholderUrl: "https://…/calendar.ics",
  placeholderId: "12345678", desQuePossible: "so bald wie möglich",
  videLogement: "Erstellen Sie zuerst eine Unterkunft, um ihre Kanäle zu konfigurieren.",
};

const DICTIONNAIRES: Record<Langue, TraductionsCanaux> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsCanaux(langue: string): TraductionsCanaux {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
