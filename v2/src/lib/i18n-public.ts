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
