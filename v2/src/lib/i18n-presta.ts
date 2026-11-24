import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";
import type { StatutMission, TypeMission } from "@/domain/mission";
import type { StatutPreuve } from "@/domain/preuve-intervention";

/**
 * Dictionnaire de l'espace prestataire (FR-038, spec 006).
 *
 * L'espace prestataire était le dernier à n'être ni traduit ni doté d'un
 * layout : ses libellés étaient écrits en français dans la page. Ce module
 * porte tout ce que l'intervenant lit — en-tête et menu du layout, missions,
 * pointage, preuve — dans les cinq langues servies.
 *
 * Deux blocs méritent l'attention :
 * - `retours` et `erreurs` forment le **retour d'action** : chaque action
 *   serveur redirige avec un code (`?ok=` / `?erreur=`) et la page affiche le
 *   message correspondant. Les codes sont déclarés ici (`CODES_RETOUR_PRESTA`,
 *   `CODES_ERREUR_PRESTA`) pour qu'aucune action silencieuse ne puisse être
 *   ajoutée sans message : le test `tests/ergonomie/presta-retours.test.ts`
 *   confronte ces listes aux redirections réellement écrites dans la route.
 * - les libellés composés sont des fonctions (`resume`, `refusACorriger`, ...)
 *   et sont donc masqués par `masquerFonctions` : jamais transmis par un
 *   `load`, ils sont importés directement par le layout et la page.
 */

/** Codes de succès d'une action de l'espace prestataire. */
export const CODES_RETOUR_PRESTA = [
  "preuve",
  "pointage_debut",
  "pointage_fin",
  "statut",
  "dispatch_accepte",
  "dispatch_refuse",
] as const;
export type CodeRetourPresta = (typeof CODES_RETOUR_PRESTA)[number];

/** Codes d'échec d'une action de l'espace prestataire. */
export const CODES_ERREUR_PRESTA = [
  "preuve",
  "pointage",
  "statut",
  "dispatch",
  "droits",
  "inattendu",
] as const;
export type CodeErreurPresta = (typeof CODES_ERREUR_PRESTA)[number];

export interface TraductionsPresta {
  /* Layout : en-tête, menu, langue. */
  espace: string;
  navigationPrincipale: string;
  mesMissions: string;
  securite: string;
  support: string;
  site: string;
  langue: string;
  monCompte: string;
  quitter: string;

  /* Accueil de l'espace. */
  titrePage: string;
  bonjour: string;
  resume: (missions: number) => string;
  offresTitre: (offres: number) => string;
  accepter: string;
  refuser: string;
  aucuneMission: string;
  missionAVenir: string;
  logement: string;

  /* Mission : type, statut, pointage. */
  typesMission: Record<TypeMission, string>;
  statutsMission: Record<StatutMission, string>;
  annulerMission: string;
  pointerDebut: string;
  pointerFin: string;
  pointageHorsLigneQuestion: string;
  heureReellePointage: string;
  dureePrevue: (duree: string) => string;
  debutPointe: string;
  finPointe: string;
  dureeReelle: string;
  prevu: (duree: string) => string;
  ecart: string;
  recuLe: (quand: string) => string;

  /* Hors ligne terrain (FR-045). */
  terrainHorsLigne: string;
  terrainFileTitre: string;
  terrainFileEnAttente: (n: number) => string;
  terrainSynchronise: (n: number) => string;
  terrainEchec: string;

  /* Preuve d'intervention. */
  preuveStatuts: Record<StatutPreuve, string>;
  preuveSoumiseLe: (le: string) => string;
  preuveValideeLe: (le: string, qui: string) => string;
  refusACorriger: (motif: string) => string;
  soumettrePreuve: string;
  corrigerResoumettre: string;
  historiquePreuve: string;

  /* Retour d'action : succès puis échec. */
  retours: Record<CodeRetourPresta, string>;
  retourEnregistre: string;
  erreurs: Record<CodeErreurPresta, string>;
}

const FR: TraductionsPresta = {
  espace: "Espace prestataire",
  navigationPrincipale: "Navigation principale",
  mesMissions: "Mes missions",
  securite: "Sécurité / 2FA",
  support: "Support",
  site: "Accueil",
  langue: "Langue",
  monCompte: "Mon compte",
  quitter: "Quitter",

  titrePage: "Mes missions — Espace prestataire",
  bonjour: "Bonjour",
  resume: (missions) =>
    `${missions} mission${missions > 1 ? "s" : ""} attribuée${missions > 1 ? "s" : ""}`,
  offresTitre: (offres) => `Offres en attente (${offres})`,
  accepter: "Accepter",
  refuser: "Refuser",
  aucuneMission: "Aucune mission attribuée pour le moment.",
  missionAVenir: "Mission à venir",
  logement: "Logement",

  typesMission: {
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
  annulerMission: "Annuler la mission",
  pointerDebut: "Pointer le début",
  pointerFin: "Pointer la fin",
  pointageHorsLigneQuestion: "Pointage fait hors ligne ?",
  heureReellePointage: "Heure réelle du pointage",
  dureePrevue: (duree) => `Durée prévue : ${duree}`,
  debutPointe: "Début pointé",
  finPointe: "Fin pointée",
  dureeReelle: "Durée réelle",
  prevu: (duree) => `prévu ${duree}`,
  ecart: "Écart",
  recuLe: (quand) => `hors ligne, reçu le ${quand}`,
  terrainHorsLigne:
    "Hors ligne : le contenu reste consultable et vos pointages sont conservés sur cet appareil.",
  terrainFileTitre: "Pointages en attente",
  terrainFileEnAttente: (n) =>
    n === 1
      ? "1 pointage en attente d’envoi."
      : `${n} pointages en attente d’envoi.`,
  terrainSynchronise: (n) =>
    n === 1 ? "1 pointage synchronisé." : `${n} pointages synchronisés.`,
  terrainEchec:
    "Synchronisation impossible pour le moment. Les pointages restent sur cet appareil et repartiront au prochain réseau.",

  preuveStatuts: {
    a_soumettre: "Preuve à soumettre",
    soumise: "Preuve à valider",
    validee: "Preuve validée",
    refusee: "Preuve en reprise",
  },
  preuveSoumiseLe: (le) => `soumise le ${le}`,
  preuveValideeLe: (le, qui) => `validée le ${le} par ${qui}`,
  refusACorriger: (motif) => `Refus à corriger : ${motif}`,
  soumettrePreuve: "Soumettre la preuve",
  corrigerResoumettre: "Corriger et resoumettre",
  historiquePreuve: "Historique de la preuve",

  retours: {
    preuve: "Preuve soumise à validation.",
    pointage_debut: "Début pointé à l’heure du serveur.",
    pointage_fin: "Fin pointée à l’heure du serveur.",
    statut: "Statut de la mission mis à jour.",
    dispatch_accepte: "Offre acceptée : la mission vous est attribuée.",
    dispatch_refuse: "Offre refusée.",
  },
  retourEnregistre: "Action enregistrée.",
  erreurs: {
    preuve:
      "Preuve non soumise : la mission doit être terminée (fin pointée) et sa preuve ni déjà en attente de validation ni validée.",
    pointage:
      "Pointage refusé : vérifiez l’ordre des pointages et l’heure indiquée.",
    statut: "Changement de statut refusé : cette transition n’est pas permise.",
    dispatch:
      "Réponse à l’offre non enregistrée : l’offre est peut-être déjà traitée.",
    droits: "Action refusée : cette mission ne vous est pas attribuée.",
    inattendu: "Erreur inattendue. Réessayez.",
  },
};

const EN: TraductionsPresta = {
  espace: "Provider area",
  navigationPrincipale: "Main navigation",
  mesMissions: "My jobs",
  securite: "Security / 2FA",
  support: "Support",
  site: "Home",
  langue: "Language",
  monCompte: "My account",
  quitter: "Sign out",

  titrePage: "My jobs — Provider area",
  bonjour: "Hello",
  resume: (missions) => `${missions} task${missions === 1 ? "" : "s"} assigned`,
  offresTitre: (offres) => `Pending offers (${offres})`,
  accepter: "Accept",
  refuser: "Decline",
  aucuneMission: "No job assigned yet.",
  missionAVenir: "Upcoming job",
  logement: "Property",

  typesMission: {
    menage: "Cleaning",
    maintenance: "Maintenance",
    accueil: "Welcome",
    autre: "Other",
  },
  statutsMission: {
    planifiee: "Planned",
    en_cours: "In progress",
    terminee: "Completed",
    annulee: "Cancelled",
  },
  annulerMission: "Cancel the job",
  pointerDebut: "Clock in",
  pointerFin: "Clock out",
  pointageHorsLigneQuestion: "Clocked while offline?",
  heureReellePointage: "Actual clock time",
  dureePrevue: (duree) => `Expected duration: ${duree}`,
  debutPointe: "Start clocked",
  finPointe: "End clocked",
  dureeReelle: "Actual duration",
  prevu: (duree) => `expected ${duree}`,
  ecart: "Variance",
  recuLe: (quand) => `offline, received on ${quand}`,
  terrainHorsLigne:
    "Offline: content stays readable and your clock-ins are kept on this device.",
  terrainFileTitre: "Pending clock-ins",
  terrainFileEnAttente: (n) =>
    n === 1
      ? "1 clock-in waiting to be sent."
      : `${n} clock-ins waiting to be sent.`,
  terrainSynchronise: (n) =>
    n === 1 ? "1 clock-in synchronised." : `${n} clock-ins synchronised.`,
  terrainEchec:
    "Synchronisation failed for now. Clock-ins stay on this device and will be sent with the next connection.",

  preuveStatuts: {
    a_soumettre: "Evidence to submit",
    soumise: "Evidence pending review",
    validee: "Evidence approved",
    refusee: "Evidence to redo",
  },
  preuveSoumiseLe: (le) => `submitted on ${le}`,
  preuveValideeLe: (le, qui) => `approved on ${le} by ${qui}`,
  refusACorriger: (motif) => `Rejected — to fix: ${motif}`,
  soumettrePreuve: "Submit evidence",
  corrigerResoumettre: "Fix and resubmit",
  historiquePreuve: "Evidence history",

  retours: {
    preuve: "Evidence submitted for review.",
    pointage_debut: "Start clocked with server time.",
    pointage_fin: "End clocked with server time.",
    statut: "Job status updated.",
    dispatch_accepte: "Offer accepted: the job is assigned to you.",
    dispatch_refuse: "Offer declined.",
  },
  retourEnregistre: "Action saved.",
  erreurs: {
    preuve:
      "Evidence not submitted: the job must be completed (end clocked) and its evidence neither pending review nor already approved.",
    pointage: "Clock refused: check the order of the clock-ins and the time given.",
    statut: "Status change refused: this transition is not allowed.",
    dispatch: "Offer response not saved: the offer may already be handled.",
    droits: "Action refused: this job is not assigned to you.",
    inattendu: "Unexpected error. Try again.",
  },
};

const ES: TraductionsPresta = {
  espace: "Área del proveedor",
  navigationPrincipale: "Navegación principal",
  mesMissions: "Mis misiones",
  securite: "Seguridad / 2FA",
  support: "Soporte",
  site: "Inicio",
  langue: "Idioma",
  monCompte: "Mi cuenta",
  quitter: "Salir",

  titrePage: "Mis misiones — Área del proveedor",
  bonjour: "Hola",
  resume: (missions) =>
    `${missions} misión${missions === 1 ? "" : "es"} asignada${missions === 1 ? "" : "s"}`,
  offresTitre: (offres) => `Ofertas pendientes (${offres})`,
  accepter: "Aceptar",
  refuser: "Rechazar",
  aucuneMission: "Todavía no tienes misiones asignadas.",
  missionAVenir: "Misión próxima",
  logement: "Alojamiento",

  typesMission: {
    menage: "Limpieza",
    maintenance: "Mantenimiento",
    accueil: "Acogida",
    autre: "Otra",
  },
  statutsMission: {
    planifiee: "Planificada",
    en_cours: "En curso",
    terminee: "Terminada",
    annulee: "Anulada",
  },
  annulerMission: "Cancelar la misión",
  pointerDebut: "Registrar el inicio",
  pointerFin: "Registrar el fin",
  pointageHorsLigneQuestion: "¿Registro hecho sin conexión?",
  heureReellePointage: "Hora real del registro",
  dureePrevue: (duree) => `Duración prevista: ${duree}`,
  debutPointe: "Inicio registrado",
  finPointe: "Fin registrado",
  dureeReelle: "Duración real",
  prevu: (duree) => `previsto ${duree}`,
  ecart: "Desviación",
  recuLe: (quand) => `sin conexión, recibido el ${quand}`,
  terrainHorsLigne:
    "Sin conexión: el contenido sigue consultable y tus registros se guardan en este dispositivo.",
  terrainFileTitre: "Registros pendientes",
  terrainFileEnAttente: (n) =>
    n === 1
      ? "1 registro pendiente de envío."
      : `${n} registros pendientes de envío.`,
  terrainSynchronise: (n) =>
    n === 1 ? "1 registro sincronizado." : `${n} registros sincronizados.`,
  terrainEchec:
    "No se puede sincronizar por ahora. Los registros quedan en este dispositivo y se enviarán con la próxima conexión.",

  preuveStatuts: {
    a_soumettre: "Prueba por enviar",
    soumise: "Prueba pendiente de validación",
    validee: "Prueba validada",
    refusee: "Prueba por rehacer",
  },
  preuveSoumiseLe: (le) => `enviada el ${le}`,
  preuveValideeLe: (le, qui) => `validada el ${le} por ${qui}`,
  refusACorriger: (motif) => `Rechazo que corregir: ${motif}`,
  soumettrePreuve: "Enviar la prueba",
  corrigerResoumettre: "Corregir y reenviar",
  historiquePreuve: "Historial de la prueba",

  retours: {
    preuve: "Prueba enviada para validación.",
    pointage_debut: "Inicio registrado con la hora del servidor.",
    pointage_fin: "Fin registrado con la hora del servidor.",
    statut: "Estado de la misión actualizado.",
    dispatch_accepte: "Oferta aceptada: la misión queda asignada a ti.",
    dispatch_refuse: "Oferta rechazada.",
  },
  retourEnregistre: "Acción registrada.",
  erreurs: {
    preuve:
      "Prueba no enviada: la misión debe estar terminada (fin registrado) y su prueba ni pendiente de validación ni ya validada.",
    pointage:
      "Registro rechazado: comprueba el orden de los registros y la hora indicada.",
    statut: "Cambio de estado rechazado: esa transición no está permitida.",
    dispatch:
      "Respuesta a la oferta no guardada: puede que la oferta ya esté tratada.",
    droits: "Acción rechazada: esta misión no está asignada a ti.",
    inattendu: "Error inesperado. Inténtalo de nuevo.",
  },
};

const IT: TraductionsPresta = {
  espace: "Area fornitori",
  navigationPrincipale: "Navigazione principale",
  mesMissions: "Le mie missioni",
  securite: "Sicurezza / 2FA",
  support: "Supporto",
  site: "Home",
  langue: "Lingua",
  monCompte: "Il mio account",
  quitter: "Esci",

  titrePage: "Le mie missioni — Area fornitori",
  bonjour: "Ciao",
  resume: (missions) =>
    `${missions} mission${missions === 1 ? "e" : "i"} assegnat${missions === 1 ? "a" : "e"}`,
  offresTitre: (offres) => `Offerte in attesa (${offres})`,
  accepter: "Accetta",
  refuser: "Rifiuta",
  aucuneMission: "Nessuna missione assegnata al momento.",
  missionAVenir: "Missione in arrivo",
  logement: "Alloggio",

  typesMission: {
    menage: "Pulizia",
    maintenance: "Manutenzione",
    accueil: "Accoglienza",
    autre: "Altro",
  },
  statutsMission: {
    planifiee: "Pianificata",
    en_cours: "In corso",
    terminee: "Conclusa",
    annulee: "Annullata",
  },
  annulerMission: "Annulla la missione",
  pointerDebut: "Registra l’inizio",
  pointerFin: "Registra la fine",
  pointageHorsLigneQuestion: "Registrazione fatta offline?",
  heureReellePointage: "Ora reale della registrazione",
  dureePrevue: (duree) => `Durata prevista: ${duree}`,
  debutPointe: "Inizio registrato",
  finPointe: "Fine registrata",
  dureeReelle: "Durata reale",
  prevu: (duree) => `prevista ${duree}`,
  ecart: "Scostamento",
  recuLe: (quand) => `offline, ricevuto il ${quand}`,
  terrainHorsLigne:
    "Offline: il contenuto resta consultabile e le tue timbrature sono conservate su questo dispositivo.",
  terrainFileTitre: "Timbrature in attesa",
  terrainFileEnAttente: (n) =>
    `${n} timbratur${n === 1 ? "a" : "e"} in attesa di invio.`,
  terrainSynchronise: (n) =>
    `${n} timbratur${n === 1 ? "a" : "e"} sincronizzat${n === 1 ? "a" : "e"}.`,
  terrainEchec:
    "Sincronizzazione impossibile per ora. Le timbrature restano su questo dispositivo e partiranno alla prossima connessione.",

  preuveStatuts: {
    a_soumettre: "Prova da inviare",
    soumise: "Prova in attesa di validazione",
    validee: "Prova approvata",
    refusee: "Prova da rifare",
  },
  preuveSoumiseLe: (le) => `inviata il ${le}`,
  preuveValideeLe: (le, qui) => `approvata il ${le} da ${qui}`,
  refusACorriger: (motif) => `Rifiuto da correggere: ${motif}`,
  soumettrePreuve: "Invia la prova",
  corrigerResoumettre: "Correggi e reinvia",
  historiquePreuve: "Cronologia della prova",

  retours: {
    preuve: "Prova inviata per la validazione.",
    pointage_debut: "Inizio registrato con l’ora del server.",
    pointage_fin: "Fine registrata con l’ora del server.",
    statut: "Stato della missione aggiornato.",
    dispatch_accepte: "Offerta accettata: la missione ti è assegnata.",
    dispatch_refuse: "Offerta rifiutata.",
  },
  retourEnregistre: "Azione registrata.",
  erreurs: {
    preuve:
      "Prova non inviata: la missione deve essere conclusa (fine registrata) e la prova né in attesa di validazione né già approvata.",
    pointage:
      "Registrazione rifiutata: controlla l’ordine delle registrazioni e l’ora indicata.",
    statut: "Cambio di stato rifiutato: questa transizione non è ammessa.",
    dispatch:
      "Risposta all’offerta non salvata: l’offerta potrebbe essere già gestita.",
    droits: "Azione rifiutata: questa missione non ti è assegnata.",
    inattendu: "Errore imprevisto. Riprova.",
  },
};

const DE: TraductionsPresta = {
  espace: "Dienstleister-Bereich",
  navigationPrincipale: "Hauptnavigation",
  mesMissions: "Meine Aufträge",
  securite: "Sicherheit / 2FA",
  support: "Support",
  site: "Startseite",
  langue: "Sprache",
  monCompte: "Mein Konto",
  quitter: "Abmelden",

  titrePage: "Meine Aufträge — Dienstleister-Bereich",
  bonjour: "Hallo",
  resume: (missions) =>
    `${missions} zugewiesene${missions === 1 ? "r" : ""} Auftrag${missions === 1 ? "" : "e"}`,
  offresTitre: (offres) => `Offene Angebote (${offres})`,
  accepter: "Annehmen",
  refuser: "Ablehnen",
  aucuneMission: "Derzeit kein Auftrag zugewiesen.",
  missionAVenir: "Kommender Auftrag",
  logement: "Unterkunft",

  typesMission: {
    menage: "Reinigung",
    maintenance: "Wartung",
    accueil: "Empfang",
    autre: "Andere",
  },
  statutsMission: {
    planifiee: "Geplant",
    en_cours: "Läuft",
    terminee: "Abgeschlossen",
    annulee: "Storniert",
  },
  annulerMission: "Auftrag stornieren",
  pointerDebut: "Beginn erfassen",
  pointerFin: "Ende erfassen",
  pointageHorsLigneQuestion: "Erfassung offline erfolgt?",
  heureReellePointage: "Tatsächliche Erfassungszeit",
  dureePrevue: (duree) => `Geplante Dauer: ${duree}`,
  debutPointe: "Beginn erfasst",
  finPointe: "Ende erfasst",
  dureeReelle: "Tatsächliche Dauer",
  prevu: (duree) => `geplant ${duree}`,
  ecart: "Abweichung",
  recuLe: (quand) => `offline, erhalten am ${quand}`,
  terrainHorsLigne:
    "Offline: die Inhalte bleiben lesbar, und Ihre Stempelungen werden auf diesem Gerät gespeichert.",
  terrainFileTitre: "Ausstehende Stempelungen",
  terrainFileEnAttente: (n) =>
    `${n} Stempelung${n === 1 ? "" : "en"} ${n === 1 ? "wartet" : "warten"} auf das Senden.`,
  terrainSynchronise: (n) =>
    `${n} Stempelung${n === 1 ? "" : "en"} synchronisiert.`,
  terrainEchec:
    "Synchronisierung derzeit nicht möglich. Die Stempelungen bleiben auf diesem Gerät und gehen mit der nächsten Verbindung raus.",

  preuveStatuts: {
    a_soumettre: "Nachweis einzureichen",
    soumise: "Nachweis zur Prüfung",
    validee: "Nachweis bestätigt",
    refusee: "Nachweis zurückgegeben",
  },
  preuveSoumiseLe: (le) => `eingereicht am ${le}`,
  preuveValideeLe: (le, qui) => `bestätigt am ${le} von ${qui}`,
  refusACorriger: (motif) => `Ablehnung zu korrigieren: ${motif}`,
  soumettrePreuve: "Nachweis einreichen",
  corrigerResoumettre: "Korrigieren und erneut einreichen",
  historiquePreuve: "Verlauf des Nachweises",

  retours: {
    preuve: "Nachweis zur Prüfung eingereicht.",
    pointage_debut: "Beginn mit Serverzeit erfasst.",
    pointage_fin: "Ende mit Serverzeit erfasst.",
    statut: "Auftragsstatus aktualisiert.",
    dispatch_accepte: "Angebot angenommen: der Auftrag ist Ihnen zugewiesen.",
    dispatch_refuse: "Angebot abgelehnt.",
  },
  retourEnregistre: "Aktion gespeichert.",
  erreurs: {
    preuve:
      "Nachweis nicht eingereicht: der Auftrag muss abgeschlossen sein (Ende erfasst) und sein Nachweis weder in Prüfung noch bereits bestätigt.",
    pointage:
      "Erfassung abgelehnt: prüfen Sie die Reihenfolge der Erfassungen und die angegebene Uhrzeit.",
    statut: "Statuswechsel abgelehnt: dieser Übergang ist nicht erlaubt.",
    dispatch:
      "Antwort auf das Angebot nicht gespeichert: das Angebot ist eventuell schon bearbeitet.",
    droits: "Aktion abgelehnt: dieser Auftrag ist Ihnen nicht zugewiesen.",
    inattendu: "Unerwarteter Fehler. Bitte erneut versuchen.",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsPresta> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsPresta(langue: string | null | undefined): TraductionsPresta {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
