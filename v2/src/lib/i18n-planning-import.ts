import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsPlanningImport {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  retourPlanning: string;
  channelManager: string;
  syncOk: string;
  syncSupprime: string;
  syncErreur: string;
  fluxOk: (libelle: string) => string;
  vide: string;
  creerLogement: string;
  logement: string;
  afficher: string;
  santeAria: string;
  fluxActifs: string;
  enErreur: string;
  enRetard: string;
  jamaisSync: string;
  abonnementTitre: (nom: string) => string;
  abonnementDescription: string;
  urlSignee: string;
  telecharger: string;
  rafraichissement: string;
  importTitre: (nom: string) => string;
  importDescription: string;
  fichierIcs: string;
  ouCollage: string;
  placeholderIcs: string;
  importer: string;
  cree: (n: number) => string;
  blocages: (n: number) => string;
  maj: (n: number) => string;
  deja: (n: number) => string;
  conflits: (n: number) => string;
  ignores: (n: number) => string;
  colReference: string;
  colType: string;
  colDebut: string;
  colFin: string;
  colResultat: string;
  reservation: string;
  blocage: string;
  fluxTitre: string;
  fluxDescription: string;
  toutSynchroniser: string;
  libelle: string;
  urlIcs: string;
  enregistrerFlux: string;
  aucunFlux: string;
  dernierSucces: (date: string) => string;
  jamaisSynchronise: string;
  intervalle: (minutes: number) => string;
  prochainEssai: (date: string) => string;
  echecs: (n: number) => string;
  actif: string;
  inactif: string;
  enRetardBadge: string;
  confirmationRequise: string;
  dernieresExecutions: string;
  execution: (debut: string, statut: string, crees: number, maj: number, annules: number, conflits: number) => string;
  synchroniser: string;
  supprimer: string;
  planningLogement: string;
  logements: string;
  msgLogementIntrouvable: string;
  msgFichierTropGrand: string;
  msgIcsVide: string;
  msgImportTermine: (morceaux: string) => string;
  msgErreurImport: string;
  msgFluxIntrouvable: string;
  msgSyncTout: (reussis: number, erreurs: number, conflits: number) => string;
  msgErreurInattendue: string;
  morceauReservations: (n: number) => string;
  morceauBlocages: (n: number) => string;
  morceauMaj: (n: number) => string;
  morceauDeja: (n: number) => string;
  morceauConflits: (n: number) => string;
}

const FR: TraductionsPlanningImport = {
  titrePage: "Import ICS — LCD Parc", surtitre: "Espace hôte · Planning",
  titre: "Synchronisation ICS",
  description: "Chaque flux OTA est relu automatiquement, réconcilié et fusionné dans le planning. Les séjours retirés d’un flux sont annulés.",
  retourPlanning: "← Planning", channelManager: "Channel manager",
  syncOk: "Flux synchronisé.", syncSupprime: "Flux supprimé.",
  syncErreur: "La synchronisation a échoué. Vérifiez l’URL du flux.",
  fluxOk: (libelle) => `Flux « ${libelle} » enregistré.`,
  vide: "Créez d’abord un logement pour importer son calendrier.",
  creerLogement: "Créer un logement", logement: "Logement", afficher: "Afficher",
  santeAria: "Santé de la synchronisation", fluxActifs: "Flux actifs", enErreur: "En erreur",
  enRetard: "En retard", jamaisSync: "Jamais synchronisés",
  abonnementTitre: (nom) => `Abonnement OTA — ${nom}`,
  abonnementDescription: "Collez cette URL dans « Importer un calendrier » sur Airbnb, Booking, Abritel et Expedia. Chaque plateforme verra ainsi les séjours et blocages de toutes les autres, en plus de ses propres réservations.",
  urlSignee: "URL iCalendar signée (lecture seule)", telecharger: "Télécharger le .ics",
  rafraichissement: "Rafraîchissement demandé toutes les 5 minutes ; les OTA appliquent leur propre délai (souvent 1 à 3 h).",
  importTitre: (nom) => `Importer un fichier — ${nom}`,
  importDescription: "Fichier .ics ou contenu collé, 2 Mo maximum. L’import manuel est additif : il ne supprime jamais de séjour existant. Pour une réconciliation automatique, ajoutez un flux abonné ci-dessous.",
  fichierIcs: "Fichier ICS", ouCollage: "… ou collage du contenu", placeholderIcs: "BEGIN:VCALENDAR…",
  importer: "Importer le calendrier",
  cree: (n) => `${n} créé(s)`, blocages: (n) => `${n} blocage(s)`, maj: (n) => `${n} mis à jour`,
  deja: (n) => `${n} déjà présent(s)`, conflits: (n) => `${n} conflit(s)`, ignores: (n) => `${n} ignoré(s)`,
  colReference: "Référence", colType: "Type", colDebut: "Début", colFin: "Fin", colResultat: "Résultat",
  reservation: "Réservation", blocage: "Blocage",
  fluxTitre: "Flux abonnés",
  fluxDescription: "Relus automatiquement selon l’intervalle du flux, avec ETag/304, reprise progressive en cas d’erreur et confirmation avant suppression d’un calendrier devenu vide.",
  toutSynchroniser: "Tout synchroniser", libelle: "Libellé", urlIcs: "URL ICS (HTTPS)",
  enregistrerFlux: "Enregistrer le flux", aucunFlux: "Aucun flux pour ce logement.",
  dernierSucces: (date) => `Dernier succès : ${date}`, jamaisSynchronise: "Jamais synchronisé",
  intervalle: (minutes) => `Toutes les ${minutes} min`, prochainEssai: (date) => `Prochain essai : ${date}`,
  echecs: (n) => `${n} échec(s) consécutif(s) — reprise progressive.`,
  actif: "actif", inactif: "inactif", enRetardBadge: "en retard", confirmationRequise: "confirmation requise",
  dernieresExecutions: "5 dernières exécutions",
  execution: (debut, statut, crees, maj, annules, conflits) =>
    `${debut} — ${statut} · ${crees} créé(s), ${maj} maj, ${annules} annulé(s), ${conflits} conflit(s)`,
  synchroniser: "Synchroniser", supprimer: "Supprimer",
  planningLogement: "Planning du logement", logements: "Logements",
  msgLogementIntrouvable: "Logement introuvable.",
  msgFichierTropGrand: "Fichier trop volumineux (2 Mo maximum).",
  msgIcsVide: "Collez un calendrier ICS ou choisissez un fichier.",
  msgImportTermine: (morceaux) => `Import terminé : ${morceaux}.`,
  msgErreurImport: "Erreur inattendue pendant l’import.",
  msgFluxIntrouvable: "Flux ICS introuvable pour ce logement.",
  msgSyncTout: (reussis, erreurs, conflits) => `${reussis} flux synchronisé(s), ${erreurs} erreur(s), ${conflits} conflit(s).`,
  msgErreurInattendue: "Erreur inattendue. Réessayez.",
  morceauReservations: (n) => `${n} réservation(s)`, morceauBlocages: (n) => `${n} blocage(s)`,
  morceauMaj: (n) => `${n} mise(s) à jour`, morceauDeja: (n) => `${n} déjà présent(s)`,
  morceauConflits: (n) => `${n} conflit(s)`,
};

const EN: TraductionsPlanningImport = {
  titrePage: "ICS import — LCD Parc", surtitre: "Staff area · Planning",
  titre: "ICS sync",
  description: "Each OTA feed is re-read automatically, reconciled and merged into the planning. Stays removed from a feed are cancelled.",
  retourPlanning: "← Planning", channelManager: "Channel manager",
  syncOk: "Feed synced.", syncSupprime: "Feed deleted.",
  syncErreur: "Sync failed. Check the feed URL.",
  fluxOk: (libelle) => `Feed “${libelle}” saved.`,
  vide: "Create a property first to import its calendar.",
  creerLogement: "Create a property", logement: "Property", afficher: "Show",
  santeAria: "Sync health", fluxActifs: "Active feeds", enErreur: "In error",
  enRetard: "Overdue", jamaisSync: "Never synced",
  abonnementTitre: (nom) => `OTA subscription — ${nom}`,
  abonnementDescription: "Paste this URL into “Import a calendar” on Airbnb, Booking, Abritel and Expedia. Each platform will then see the stays and blocks from all the others, in addition to its own bookings.",
  urlSignee: "Signed iCalendar URL (read-only)", telecharger: "Download the .ics",
  rafraichissement: "Refresh requested every 5 minutes; OTAs apply their own delay (often 1 to 3 h).",
  importTitre: (nom) => `Import a file — ${nom}`,
  importDescription: ".ics file or pasted content, 2 MB maximum. Manual import is additive: it never deletes an existing stay. For automatic reconciliation, add a subscribed feed below.",
  fichierIcs: "ICS file", ouCollage: "… or paste the content", placeholderIcs: "BEGIN:VCALENDAR…",
  importer: "Import calendar",
  cree: (n) => `${n} created`, blocages: (n) => `${n} block(s)`, maj: (n) => `${n} updated`,
  deja: (n) => `${n} already present`, conflits: (n) => `${n} conflict(s)`, ignores: (n) => `${n} ignored`,
  colReference: "Reference", colType: "Type", colDebut: "Start", colFin: "End", colResultat: "Result",
  reservation: "Booking", blocage: "Block",
  fluxTitre: "Subscribed feeds",
  fluxDescription: "Re-read automatically at the feed interval, with ETag/304, gradual backoff on error and confirmation before deleting a calendar that became empty.",
  toutSynchroniser: "Sync all", libelle: "Label", urlIcs: "ICS URL (HTTPS)",
  enregistrerFlux: "Save feed", aucunFlux: "No feed for this property.",
  dernierSucces: (date) => `Last success: ${date}`, jamaisSynchronise: "Never synced",
  intervalle: (minutes) => `Every ${minutes} min`, prochainEssai: (date) => `Next attempt: ${date}`,
  echecs: (n) => `${n} consecutive failure(s) — gradual backoff.`,
  actif: "active", inactif: "inactive", enRetardBadge: "overdue", confirmationRequise: "confirmation required",
  dernieresExecutions: "Last 5 runs",
  execution: (debut, statut, crees, maj, annules, conflits) =>
    `${debut} — ${statut} · ${crees} created, ${maj} updated, ${annules} cancelled, ${conflits} conflict(s)`,
  synchroniser: "Sync", supprimer: "Delete",
  planningLogement: "Property planning", logements: "Properties",
  msgLogementIntrouvable: "Property not found.",
  msgFichierTropGrand: "File too large (2 MB maximum).",
  msgIcsVide: "Paste an ICS calendar or choose a file.",
  msgImportTermine: (morceaux) => `Import complete: ${morceaux}.`,
  msgErreurImport: "Unexpected error during import.",
  msgFluxIntrouvable: "ICS feed not found for this property.",
  msgSyncTout: (reussis, erreurs, conflits) => `${reussis} feed(s) synced, ${erreurs} error(s), ${conflits} conflict(s).`,
  msgErreurInattendue: "Unexpected error. Try again.",
  morceauReservations: (n) => `${n} booking(s)`, morceauBlocages: (n) => `${n} block(s)`,
  morceauMaj: (n) => `${n} update(s)`, morceauDeja: (n) => `${n} already present`,
  morceauConflits: (n) => `${n} conflict(s)`,
};

const ES: TraductionsPlanningImport = {
  titrePage: "Importación ICS — LCD Parc", surtitre: "Área profesional · Planificación",
  titre: "Sincronización ICS",
  description: "Cada flujo OTA se relee automáticamente, se reconcilia y se fusiona en la planificación. Las estancias retiradas de un flujo se cancelan.",
  retourPlanning: "← Planificación", channelManager: "Channel manager",
  syncOk: "Flujo sincronizado.", syncSupprime: "Flujo eliminado.",
  syncErreur: "La sincronización ha fallado. Compruebe la URL del flujo.",
  fluxOk: (libelle) => `Flujo «${libelle}» guardado.`,
  vide: "Cree primero un alojamiento para importar su calendario.",
  creerLogement: "Crear un alojamiento", logement: "Alojamiento", afficher: "Mostrar",
  santeAria: "Salud de la sincronización", fluxActifs: "Flujos activos", enErreur: "Con error",
  enRetard: "Con retraso", jamaisSync: "Nunca sincronizados",
  abonnementTitre: (nom) => `Suscripción OTA — ${nom}`,
  abonnementDescription: "Pegue esta URL en «Importar un calendario» en Airbnb, Booking, Abritel y Expedia. Cada plataforma verá así las estancias y bloqueos de todas las demás, además de sus propias reservas.",
  urlSignee: "URL iCalendar firmada (solo lectura)", telecharger: "Descargar el .ics",
  rafraichissement: "Actualización solicitada cada 5 minutos; las OTA aplican su propio retraso (a menudo 1 a 3 h).",
  importTitre: (nom) => `Importar un archivo — ${nom}`,
  importDescription: "Archivo .ics o contenido pegado, 2 MB máximo. La importación manual es aditiva: nunca elimina una estancia existente. Para una reconciliación automática, añada un flujo suscrito abajo.",
  fichierIcs: "Archivo ICS", ouCollage: "… o pegar el contenido", placeholderIcs: "BEGIN:VCALENDAR…",
  importer: "Importar el calendario",
  cree: (n) => `${n} creado(s)`, blocages: (n) => `${n} bloqueo(s)`, maj: (n) => `${n} actualizado(s)`,
  deja: (n) => `${n} ya presente(s)`, conflits: (n) => `${n} conflicto(s)`, ignores: (n) => `${n} ignorado(s)`,
  colReference: "Referencia", colType: "Tipo", colDebut: "Inicio", colFin: "Fin", colResultat: "Resultado",
  reservation: "Reserva", blocage: "Bloqueo",
  fluxTitre: "Flujos suscritos",
  fluxDescription: "Releídos automáticamente según el intervalo del flujo, con ETag/304, reintento progresivo en caso de error y confirmación antes de eliminar un calendario que se ha quedado vacío.",
  toutSynchroniser: "Sincronizar todo", libelle: "Etiqueta", urlIcs: "URL ICS (HTTPS)",
  enregistrerFlux: "Guardar el flujo", aucunFlux: "Ningún flujo para este alojamiento.",
  dernierSucces: (date) => `Último éxito: ${date}`, jamaisSynchronise: "Nunca sincronizado",
  intervalle: (minutes) => `Cada ${minutes} min`, prochainEssai: (date) => `Próximo intento: ${date}`,
  echecs: (n) => `${n} fallo(s) consecutivo(s) — reintento progresivo.`,
  actif: "activo", inactif: "inactivo", enRetardBadge: "con retraso", confirmationRequise: "confirmación requerida",
  dernieresExecutions: "Últimas 5 ejecuciones",
  execution: (debut, statut, crees, maj, annules, conflits) =>
    `${debut} — ${statut} · ${crees} creado(s), ${maj} act., ${annules} cancelado(s), ${conflits} conflicto(s)`,
  synchroniser: "Sincronizar", supprimer: "Eliminar",
  planningLogement: "Planificación del alojamiento", logements: "Alojamientos",
  msgLogementIntrouvable: "Alojamiento no encontrado.",
  msgFichierTropGrand: "Archivo demasiado grande (2 MB máximo).",
  msgIcsVide: "Pegue un calendario ICS o elija un archivo.",
  msgImportTermine: (morceaux) => `Importación completada: ${morceaux}.`,
  msgErreurImport: "Error inesperado durante la importación.",
  msgFluxIntrouvable: "Flujo ICS no encontrado para este alojamiento.",
  msgSyncTout: (reussis, erreurs, conflits) => `${reussis} flujo(s) sincronizado(s), ${erreurs} error(es), ${conflits} conflicto(s).`,
  msgErreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  morceauReservations: (n) => `${n} reserva(s)`, morceauBlocages: (n) => `${n} bloqueo(s)`,
  morceauMaj: (n) => `${n} actualización(es)`, morceauDeja: (n) => `${n} ya presente(s)`,
  morceauConflits: (n) => `${n} conflicto(s)`,
};

const IT: TraductionsPlanningImport = {
  titrePage: "Importazione ICS — LCD Parc", surtitre: "Area professionale · Pianificazione",
  titre: "Sincronizzazione ICS",
  description: "Ogni flusso OTA viene riletto automaticamente, riconciliato e unito alla pianificazione. I soggiorni rimossi da un flusso vengono annullati.",
  retourPlanning: "← Pianificazione", channelManager: "Channel manager",
  syncOk: "Flusso sincronizzato.", syncSupprime: "Flusso eliminato.",
  syncErreur: "La sincronizzazione non è riuscita. Controlli l’URL del flusso.",
  fluxOk: (libelle) => `Flusso «${libelle}» salvato.`,
  vide: "Crei prima un alloggio per importarne il calendario.",
  creerLogement: "Crea un alloggio", logement: "Alloggio", afficher: "Mostra",
  santeAria: "Stato della sincronizzazione", fluxActifs: "Flussi attivi", enErreur: "In errore",
  enRetard: "In ritardo", jamaisSync: "Mai sincronizzati",
  abonnementTitre: (nom) => `Abbonamento OTA — ${nom}`,
  abonnementDescription: "Incolli questo URL in «Importa un calendario» su Airbnb, Booking, Abritel ed Expedia. Ogni piattaforma vedrà così i soggiorni e i blocchi di tutte le altre, oltre alle proprie prenotazioni.",
  urlSignee: "URL iCalendar firmato (sola lettura)", telecharger: "Scarica il .ics",
  rafraichissement: "Aggiornamento richiesto ogni 5 minuti; le OTA applicano il proprio ritardo (spesso 1–3 h).",
  importTitre: (nom) => `Importa un file — ${nom}`,
  importDescription: "File .ics o contenuto incollato, 2 MB massimo. L’importazione manuale è additiva: non elimina mai un soggiorno esistente. Per una riconciliazione automatica, aggiunga un flusso sottoscritto qui sotto.",
  fichierIcs: "File ICS", ouCollage: "… o incolla il contenuto", placeholderIcs: "BEGIN:VCALENDAR…",
  importer: "Importa il calendario",
  cree: (n) => `${n} creato/i`, blocages: (n) => `${n} blocco/hi`, maj: (n) => `${n} aggiornato/i`,
  deja: (n) => `${n} già presente/i`, conflits: (n) => `${n} conflitto/i`, ignores: (n) => `${n} ignorato/i`,
  colReference: "Riferimento", colType: "Tipo", colDebut: "Inizio", colFin: "Fine", colResultat: "Risultato",
  reservation: "Prenotazione", blocage: "Blocco",
  fluxTitre: "Flussi sottoscritti",
  fluxDescription: "Riletti automaticamente secondo l’intervallo del flusso, con ETag/304, ripresa graduale in caso di errore e conferma prima dell’eliminazione di un calendario diventato vuoto.",
  toutSynchroniser: "Sincronizza tutto", libelle: "Etichetta", urlIcs: "URL ICS (HTTPS)",
  enregistrerFlux: "Salva il flusso", aucunFlux: "Nessun flusso per questo alloggio.",
  dernierSucces: (date) => `Ultimo successo: ${date}`, jamaisSynchronise: "Mai sincronizzato",
  intervalle: (minutes) => `Ogni ${minutes} min`, prochainEssai: (date) => `Prossimo tentativo: ${date}`,
  echecs: (n) => `${n} errore/i consecutivo/i — ripresa graduale.`,
  actif: "attivo", inactif: "inattivo", enRetardBadge: "in ritardo", confirmationRequise: "conferma richiesta",
  dernieresExecutions: "Ultime 5 esecuzioni",
  execution: (debut, statut, crees, maj, annules, conflits) =>
    `${debut} — ${statut} · ${crees} creato/i, ${maj} agg., ${annules} annullato/i, ${conflits} conflitto/i`,
  synchroniser: "Sincronizza", supprimer: "Elimina",
  planningLogement: "Pianificazione dell’alloggio", logements: "Alloggi",
  msgLogementIntrouvable: "Alloggio non trovato.",
  msgFichierTropGrand: "File troppo grande (2 MB massimo).",
  msgIcsVide: "Incolli un calendario ICS o scelga un file.",
  msgImportTermine: (morceaux) => `Importazione completata: ${morceaux}.`,
  msgErreurImport: "Errore imprevisto durante l’importazione.",
  msgFluxIntrouvable: "Flusso ICS non trovato per questo alloggio.",
  msgSyncTout: (reussis, erreurs, conflits) => `${reussis} flusso/i sincronizzato/i, ${erreurs} errore/i, ${conflits} conflitto/i.`,
  msgErreurInattendue: "Errore imprevisto. Riprovi.",
  morceauReservations: (n) => `${n} prenotazione/i`, morceauBlocages: (n) => `${n} blocco/hi`,
  morceauMaj: (n) => `${n} aggiornamento/i`, morceauDeja: (n) => `${n} già presente/i`,
  morceauConflits: (n) => `${n} conflitto/i`,
};

const DE: TraductionsPlanningImport = {
  titrePage: "ICS-Import — LCD Parc", surtitre: "Profibereich · Planung",
  titre: "ICS-Synchronisierung",
  description: "Jeder OTA-Feed wird automatisch neu gelesen, abgeglichen und in die Planung übernommen. Aus einem Feed entfernte Aufenthalte werden storniert.",
  retourPlanning: "← Planung", channelManager: "Channel Manager",
  syncOk: "Feed synchronisiert.", syncSupprime: "Feed gelöscht.",
  syncErreur: "Synchronisierung fehlgeschlagen. Prüfen Sie die Feed-URL.",
  fluxOk: (libelle) => `Feed „${libelle}“ gespeichert.`,
  vide: "Erstellen Sie zuerst eine Unterkunft, um ihren Kalender zu importieren.",
  creerLogement: "Unterkunft erstellen", logement: "Unterkunft", afficher: "Anzeigen",
  santeAria: "Zustand der Synchronisierung", fluxActifs: "Aktive Feeds", enErreur: "Mit Fehler",
  enRetard: "Überfällig", jamaisSync: "Nie synchronisiert",
  abonnementTitre: (nom) => `OTA-Abonnement — ${nom}`,
  abonnementDescription: "Fügen Sie diese URL bei Airbnb, Booking, Abritel und Expedia unter „Kalender importieren“ ein. Jede Plattform sieht dann die Aufenthalte und Sperren aller anderen sowie ihre eigenen Buchungen.",
  urlSignee: "Signierte iCalendar-URL (schreibgeschützt)", telecharger: "Die .ics herunterladen",
  rafraichissement: "Aktualisierung alle 5 Minuten angefordert; OTAs wenden ihre eigene Verzögerung an (oft 1–3 h).",
  importTitre: (nom) => `Datei importieren — ${nom}`,
  importDescription: ".ics-Datei oder eingefügter Inhalt, maximal 2 MB. Der manuelle Import ist additiv: Er löscht nie einen bestehenden Aufenthalt. Für einen automatischen Abgleich fügen Sie unten einen abonnierten Feed hinzu.",
  fichierIcs: "ICS-Datei", ouCollage: "… oder Inhalt einfügen", placeholderIcs: "BEGIN:VCALENDAR…",
  importer: "Kalender importieren",
  cree: (n) => `${n} erstellt`, blocages: (n) => `${n} Sperre(n)`, maj: (n) => `${n} aktualisiert`,
  deja: (n) => `${n} bereits vorhanden`, conflits: (n) => `${n} Konflikt(e)`, ignores: (n) => `${n} ignoriert`,
  colReference: "Referenz", colType: "Typ", colDebut: "Beginn", colFin: "Ende", colResultat: "Ergebnis",
  reservation: "Buchung", blocage: "Sperre",
  fluxTitre: "Abonnierte Feeds",
  fluxDescription: "Automatisch im Feed-Intervall neu gelesen, mit ETag/304, schrittweiser Wiederholung bei Fehlern und Bestätigung vor dem Löschen eines leer gewordenen Kalenders.",
  toutSynchroniser: "Alle synchronisieren", libelle: "Bezeichnung", urlIcs: "ICS-URL (HTTPS)",
  enregistrerFlux: "Feed speichern", aucunFlux: "Kein Feed für diese Unterkunft.",
  dernierSucces: (date) => `Letzter Erfolg: ${date}`, jamaisSynchronise: "Nie synchronisiert",
  intervalle: (minutes) => `Alle ${minutes} Min.`, prochainEssai: (date) => `Nächster Versuch: ${date}`,
  echecs: (n) => `${n} aufeinanderfolgende(r) Fehler — schrittweise Wiederholung.`,
  actif: "aktiv", inactif: "inaktiv", enRetardBadge: "überfällig", confirmationRequise: "Bestätigung erforderlich",
  dernieresExecutions: "Letzte 5 Ausführungen",
  execution: (debut, statut, crees, maj, annules, conflits) =>
    `${debut} — ${statut} · ${crees} erstellt, ${maj} aktualisiert, ${annules} storniert, ${conflits} Konflikt(e)`,
  synchroniser: "Synchronisieren", supprimer: "Löschen",
  planningLogement: "Planung der Unterkunft", logements: "Unterkünfte",
  msgLogementIntrouvable: "Unterkunft nicht gefunden.",
  msgFichierTropGrand: "Datei zu groß (maximal 2 MB).",
  msgIcsVide: "Fügen Sie einen ICS-Kalender ein oder wählen Sie eine Datei.",
  msgImportTermine: (morceaux) => `Import abgeschlossen: ${morceaux}.`,
  msgErreurImport: "Unerwarteter Fehler beim Import.",
  msgFluxIntrouvable: "ICS-Feed für diese Unterkunft nicht gefunden.",
  msgSyncTout: (reussis, erreurs, conflits) => `${reussis} Feed(s) synchronisiert, ${erreurs} Fehler, ${conflits} Konflikt(e).`,
  msgErreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  morceauReservations: (n) => `${n} Buchung(en)`, morceauBlocages: (n) => `${n} Sperre(n)`,
  morceauMaj: (n) => `${n} Aktualisierung(en)`, morceauDeja: (n) => `${n} bereits vorhanden`,
  morceauConflits: (n) => `${n} Konflikt(e)`,
};

const DICTIONNAIRES: Record<Langue, TraductionsPlanningImport> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsPlanningImport(langue: string): TraductionsPlanningImport {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
