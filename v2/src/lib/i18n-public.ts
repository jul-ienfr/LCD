import { LANGUES, type Langue } from "./i18n";

export type { Langue } from "./i18n";

/**
 * Dictionnaire des surfaces publiques (vitrine, réservation, aide).
 * Toute nouvelle clé doit être présente dans les cinq langues : le test
 * `tests/ergonomie/i18n-public.test.ts` échoue sinon.
 */
export interface TraductionsPubliques {
  allerAuContenu: string;
  ouvrirMenu: string;
  fermerMenu: string;
  navigationPrincipale: string;
  sejours: string;
  aide: string;
  proprietaires: string;
  seConnecter: string;
  reserver: string;
  accueil: string;
  mentionsLegales: string;
  langue: string;
  choisirLangue: string;
  doublon: string;
  notifSucces: string;
  notifEchec: string;
  notifFermer: string;
  notifRegion: string;
}

const FR: TraductionsPubliques = {
  allerAuContenu: "Aller au contenu",
  ouvrirMenu: "Ouvrir le menu",
  fermerMenu: "Fermer le menu",
  navigationPrincipale: "Navigation principale",
  sejours: "Séjours",
  aide: "Aide",
  proprietaires: "Propriétaires",
  seConnecter: "Se connecter",
  reserver: "Réserver",
  accueil: "Accueil",
  mentionsLegales: "Mentions légales",
  langue: "Langue",
  choisirLangue: "Choisir la langue",
  doublon: "Envoi déjà enregistré : le doublon a été ignoré.",
  notifSucces: "Action enregistrée.",
  notifEchec: "L'action n'a pas abouti. Corrigez les champs signalés puis réessayez.",
  notifFermer: "Fermer la notification",
  notifRegion: "Notifications d'action",
};

const EN: TraductionsPubliques = {
  allerAuContenu: "Skip to content",
  ouvrirMenu: "Open menu",
  fermerMenu: "Close menu",
  navigationPrincipale: "Main navigation",
  sejours: "Stays",
  aide: "Help",
  proprietaires: "Owners",
  seConnecter: "Sign in",
  reserver: "Book",
  accueil: "Home",
  mentionsLegales: "Legal notice",
  langue: "Language",
  choisirLangue: "Choose language",
  doublon: "Submission already recorded: the duplicate was ignored.",
  notifSucces: "Action saved.",
  notifEchec: "The action did not go through. Fix the highlighted fields and try again.",
  notifFermer: "Dismiss notification",
  notifRegion: "Action notifications",
};

const ES: TraductionsPubliques = {
  allerAuContenu: "Ir al contenido",
  ouvrirMenu: "Abrir el menú",
  fermerMenu: "Cerrar el menú",
  navigationPrincipale: "Navegación principal",
  sejours: "Estancias",
  aide: "Ayuda",
  proprietaires: "Propietarios",
  seConnecter: "Iniciar sesión",
  reserver: "Reservar",
  accueil: "Inicio",
  mentionsLegales: "Aviso legal",
  langue: "Idioma",
  choisirLangue: "Elegir idioma",
  doublon: "Envío ya registrado: se ignoró el duplicado.",
  notifSucces: "Acción guardada.",
  notifEchec: "La acción no se completó. Corrija los campos señalados e inténtelo de nuevo.",
  notifFermer: "Cerrar la notificación",
  notifRegion: "Notificaciones de acciones",
};

const IT: TraductionsPubliques = {
  allerAuContenu: "Vai al contenuto",
  ouvrirMenu: "Apri il menu",
  fermerMenu: "Chiudi il menu",
  navigationPrincipale: "Navigazione principale",
  sejours: "Soggiorni",
  aide: "Aiuto",
  proprietaires: "Proprietari",
  seConnecter: "Accedi",
  reserver: "Prenota",
  accueil: "Home",
  mentionsLegales: "Note legali",
  langue: "Lingua",
  choisirLangue: "Scegli la lingua",
  doublon: "Invio già registrato: il duplicato è stato ignorato.",
  notifSucces: "Azione salvata.",
  notifEchec: "L'azione non è andata a buon fine. Correggi i campi segnalati e riprova.",
  notifFermer: "Chiudi la notifica",
  notifRegion: "Notifiche delle azioni",
};

const DE: TraductionsPubliques = {
  allerAuContenu: "Zum Inhalt springen",
  ouvrirMenu: "Menü öffnen",
  fermerMenu: "Menü schließen",
  navigationPrincipale: "Hauptnavigation",
  sejours: "Aufenthalte",
  aide: "Hilfe",
  proprietaires: "Eigentümer",
  seConnecter: "Anmelden",
  reserver: "Buchen",
  accueil: "Startseite",
  mentionsLegales: "Impressum",
  langue: "Sprache",
  choisirLangue: "Sprache wählen",
  doublon: "Übermittlung bereits erfasst: die Dublette wurde ignoriert.",
  notifSucces: "Aktion gespeichert.",
  notifEchec: "Die Aktion ist fehlgeschlagen. Korrigieren Sie die markierten Felder und versuchen Sie es erneut.",
  notifFermer: "Benachrichtigung schließen",
  notifRegion: "Aktionsbenachrichtigungen",
};

const DICTIONNAIRES: Record<Langue, TraductionsPubliques> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export const estLangue = (valeur: string | null | undefined): valeur is Langue =>
  typeof valeur === "string" && LANGUES.includes(valeur as Langue);

export const traductionsPubliques = (
  langue: string | null | undefined,
): TraductionsPubliques => DICTIONNAIRES[estLangue(langue) ? langue : "fr"];

export const LANGUES_PUBLIQUES = LANGUES;
