import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

/**
 * Dictionnaire de la page de préférences (FR-043, spec 006).
 *
 * Langue, mode d'affichage, densité et notifications : tout ce que la personne
 * règle pour son confort, dans les cinq langues servies. Les messages d'échec
 * sont des codes (`mode`, `densite`, `langue`, `inattendu`) : l'action les
 * renvoie par `echecSaisie`, la page les traduit ici.
 */
export interface TraductionsPreferences {
  titre: string;
  surtitre: string;
  intro: string;
  retour: string;
  visuel: string;
  visuelAide: string;
  langue: string;
  langueAide: string;
  mode: string;
  modeAide: string;
  modeSysteme: string;
  modeClair: string;
  modeSombre: string;
  densite: string;
  densiteAide: string;
  densiteConfortable: string;
  densiteCompacte: string;
  notifications: string;
  notificationsAide: string;
  notificationsActiver: string;
  enregistrer: string;
  reinitialiser: string;
  reinitialiserAide: string;
  enregistre: string;
  erreurs: Record<"mode" | "densite" | "langue" | "inattendu", string>;
}

const FR: TraductionsPreferences = {
  titre: "Préférences",
  surtitre: "Votre compte",
  intro:
    "Choisissez la langue, l’apparence et les notifications qui vous conviennent. Ces réglages sont conservés sur cet appareil.",
  retour: "Retour au tableau de bord",
  visuel: "Affichage",
  visuelAide:
    "Le mode s’applique dès le chargement de la page, sans clignotement ; la densité resserre les espacements sans réduire la taille des boutons.",
  langue: "Langue de l’interface",
  langueAide: "Cette langue est aussi proposée sur les pages publiques.",
  mode: "Mode d’affichage",
  modeAide: "« Système » suit le réglage clair ou sombre de l’appareil.",
  modeSysteme: "Système",
  modeClair: "Clair",
  modeSombre: "Sombre",
  densite: "Densité",
  densiteAide:
    "La densité compacte affiche plus de contenu à l’écran et garde des cibles tactiles d’au moins 44 px.",
  densiteConfortable: "Confortable",
  densiteCompacte: "Compacte",
  notifications: "Notifications",
  notificationsAide:
    "Affiche un signal discret après chaque action, en plus du message de la page. Les erreurs restent toujours visibles dans la page.",
  notificationsActiver: "Afficher les notifications d’action",
  enregistrer: "Enregistrer mes préférences",
  reinitialiser: "Rétablir les réglages par défaut",
  reinitialiserAide:
    "La langue est conservée ; le mode, la densité et les notifications reviennent aux valeurs par défaut.",
  enregistre: "Préférences enregistrées.",
  erreurs: {
    mode: "Choisissez un mode d’affichage valide.",
    densite: "Choisissez une densité valide.",
    langue: "Choisissez une langue proposée.",
    inattendu: "Les préférences n’ont pas pu être enregistrées. Réessayez.",
  },
};

const EN: TraductionsPreferences = {
  titre: "Preferences",
  surtitre: "Your account",
  intro:
    "Choose the language, appearance and notifications that suit you. These settings are kept on this device.",
  retour: "Back to the dashboard",
  visuel: "Display",
  visuelAide:
    "The mode applies as soon as the page loads, without flashing; compact density tightens spacing without shrinking buttons.",
  langue: "Interface language",
  langueAide: "This language is also offered on the public pages.",
  mode: "Display mode",
  modeAide: "“System” follows the device’s light or dark setting.",
  modeSysteme: "System",
  modeClair: "Light",
  modeSombre: "Dark",
  densite: "Density",
  densiteAide:
    "Compact density shows more content on screen and keeps touch targets at least 44 px.",
  densiteConfortable: "Comfortable",
  densiteCompacte: "Compact",
  notifications: "Notifications",
  notificationsAide:
    "Shows a discreet signal after each action, in addition to the page message. Errors always remain visible on the page.",
  notificationsActiver: "Show action notifications",
  enregistrer: "Save my preferences",
  reinitialiser: "Restore defaults",
  reinitialiserAide:
    "The language is kept; mode, density and notifications return to their default values.",
  enregistre: "Preferences saved.",
  erreurs: {
    mode: "Choose a valid display mode.",
    densite: "Choose a valid density.",
    langue: "Choose one of the offered languages.",
    inattendu: "The preferences could not be saved. Please try again.",
  },
};

const ES: TraductionsPreferences = {
  titre: "Preferencias",
  surtitre: "Su cuenta",
  intro:
    "Elija el idioma, la apariencia y las notificaciones que le convengan. Estos ajustes se guardan en este dispositivo.",
  retour: "Volver al panel",
  visuel: "Visualización",
  visuelAide:
    "El modo se aplica al cargar la página, sin parpadeos; la densidad compacta reduce los espacios sin disminuir los botones.",
  langue: "Idioma de la interfaz",
  langueAide: "Este idioma también se ofrece en las páginas públicas.",
  mode: "Modo de visualización",
  modeAide: "«Sistema» sigue el ajuste claro u oscuro del dispositivo.",
  modeSysteme: "Sistema",
  modeClair: "Claro",
  modeSombre: "Oscuro",
  densite: "Densidad",
  densiteAide:
    "La densidad compacta muestra más contenido en pantalla y mantiene objetivos táctiles de al menos 44 px.",
  densiteConfortable: "Cómoda",
  densiteCompacte: "Compacta",
  notifications: "Notificaciones",
  notificationsAide:
    "Muestra una señal discreta tras cada acción, además del mensaje de la página. Los errores siempre quedan visibles en la página.",
  notificationsActiver: "Mostrar las notificaciones de acción",
  enregistrer: "Guardar mis preferencias",
  reinitialiser: "Restablecer los valores predeterminados",
  reinitialiserAide:
    "Se conserva el idioma; el modo, la densidad y las notificaciones vuelven a sus valores predeterminados.",
  enregistre: "Preferencias guardadas.",
  erreurs: {
    mode: "Elija un modo de visualización válido.",
    densite: "Elija una densidad válida.",
    langue: "Elija uno de los idiomas ofrecidos.",
    inattendu: "No se pudieron guardar las preferencias. Inténtelo de nuevo.",
  },
};

const IT: TraductionsPreferences = {
  titre: "Preferenze",
  surtitre: "Il tuo account",
  intro:
    "Scegli la lingua, l’aspetto e le notifiche che preferisci. Queste impostazioni sono conservate su questo dispositivo.",
  retour: "Torna alla dashboard",
  visuel: "Visualizzazione",
  visuelAide:
    "Il modo si applica al caricamento della pagina, senza sfarfallii; la densità compatta riduce gli spazi senza ingrandire i pulsanti.",
  langue: "Lingua dell’interfaccia",
  langueAide: "Questa lingua è proposta anche nelle pagine pubbliche.",
  mode: "Modalità di visualizzazione",
  modeAide: "«Sistema» segue l’impostazione chiara o scura del dispositivo.",
  modeSysteme: "Sistema",
  modeClair: "Chiaro",
  modeSombre: "Scuro",
  densite: "Densità",
  densiteAide:
    "La densità compatta mostra più contenuti sullo schermo e mantiene aree tocco di almeno 44 px.",
  densiteConfortable: "Comoda",
  densiteCompacte: "Compatta",
  notifications: "Notifiche",
  notificationsAide:
    "Mostra un segnale discreto dopo ogni azione, oltre al messaggio della pagina. Gli errori restano sempre visibili nella pagina.",
  notificationsActiver: "Mostra le notifiche delle azioni",
  enregistrer: "Salva le mie preferenze",
  reinitialiser: "Ripristina le impostazioni predefinite",
  reinitialiserAide:
    "La lingua viene mantenuta; modalità, densità e notifiche tornano ai valori predefiniti.",
  enregistre: "Preferenze salvate.",
  erreurs: {
    mode: "Scegli una modalità di visualizzazione valida.",
    densite: "Scegli una densità valida.",
    langue: "Scegli una delle lingue proposte.",
    inattendu: "Non è stato possibile salvare le preferenze. Riprova.",
  },
};

const DE: TraductionsPreferences = {
  titre: "Einstellungen",
  surtitre: "Ihr Konto",
  intro:
    "Wählen Sie Sprache, Darstellung und Benachrichtigungen nach Ihrem Geschmack. Diese Einstellungen werden auf diesem Gerät gespeichert.",
  retour: "Zurück zum Dashboard",
  visuel: "Darstellung",
  visuelAide:
    "Der Modus wird beim Laden der Seite angewendet, ohne Aufblitzen; die kompakte Dichte verringert Abstände, ohne Schaltflächen zu verkleinern.",
  langue: "Sprache der Oberfläche",
  langueAide: "Diese Sprache wird auch auf den öffentlichen Seiten angeboten.",
  mode: "Anzeigemodus",
  modeAide: "„System“ folgt der hellen oder dunklen Einstellung des Geräts.",
  modeSysteme: "System",
  modeClair: "Hell",
  modeSombre: "Dunkel",
  densite: "Dichte",
  densiteAide:
    "Die kompakte Dichte zeigt mehr Inhalt auf dem Bildschirm und hält Berührungsziele von mindestens 44 px.",
  densiteConfortable: "Komfortabel",
  densiteCompacte: "Kompakt",
  notifications: "Benachrichtigungen",
  notificationsAide:
    "Zeigt nach jeder Aktion ein dezentes Signal zusätzlich zur Meldung auf der Seite. Fehler bleiben immer auf der Seite sichtbar.",
  notificationsActiver: "Aktionsbenachrichtigungen anzeigen",
  enregistrer: "Meine Einstellungen speichern",
  reinitialiser: "Standardwerte wiederherstellen",
  reinitialiserAide:
    "Die Sprache bleibt erhalten; Modus, Dichte und Benachrichtigungen kehren zu den Standardwerten zurück.",
  enregistre: "Einstellungen gespeichert.",
  erreurs: {
    mode: "Wählen Sie einen gültigen Anzeigemodus.",
    densite: "Wählen Sie eine gültige Dichte.",
    langue: "Wählen Sie eine der angebotenen Sprachen.",
    inattendu: "Die Einstellungen konnten nicht gespeichert werden. Bitte erneut versuchen.",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsPreferences> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsPreferences(
  langue: string | null | undefined,
): TraductionsPreferences {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
