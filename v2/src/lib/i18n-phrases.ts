import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsPhrases {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  retour: string;
  videTexte: string;
  creerLogement: string;
  choisirLogement: string;
  okEnregistre: string;
  okSupprime: string;
  okModeles: string;
  enregistreDefaut: string;
  erreurInattendue: string;
  modifierTitre: (titre: string) => string;
  nouvellePhrase: string;
  categorie: string;
  titreChamp: string;
  placeholderTitre: string;
  message: string;
  placeholderMessage: string;
  variables: string;
  enregistrer: string;
  annuler: string;
  phrasesDe: (logement: string) => string;
  aucunePhrase: string;
  installer: string;
  modifier: string;
  supprimer: string;
  tableau: string;
  categories: Record<string, string>;
}

const FR: TraductionsPhrases = {
  titrePage: "Phrases types — Espace hôte",
  surtitre: "Espace hôte · Relation voyageur",
  titre: "Phrases types",
  description: "Messages prêts à copier pour l’arrivée, le départ, l’urgence.",
  retour: "Retour au tableau de bord",
  videTexte: "Créez d’abord un logement pour préparer ses messages.",
  creerLogement: "Créer un logement",
  choisirLogement: "Choisir un logement",
  okEnregistre: "Phrase enregistrée.",
  okSupprime: "Phrase supprimée.",
  okModeles: "Modèles installés.",
  enregistreDefaut: "Enregistré.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  modifierTitre: (titre) => `Modifier « ${titre} »`,
  nouvellePhrase: "Nouvelle phrase type",
  categorie: "Catégorie",
  titreChamp: "Titre",
  placeholderTitre: "Message d’arrivée",
  message: "Message",
  placeholderMessage: "Bonjour {voyageur}, votre séjour au {logement}…",
  variables:
    "Variables disponibles : {voyageur}, {logement}, {debut}, {fin}, {heure}.",
  enregistrer: "Enregistrer la phrase",
  annuler: "Annuler",
  phrasesDe: (logement) => `Phrases de ${logement}`,
  aucunePhrase:
    "Aucune phrase pour ce logement. Installez les modèles pour démarrer :",
  installer: "Installer les modèles",
  modifier: "Modifier",
  supprimer: "Supprimer",
  tableau: "Tableau de bord",
  categories: {
    arrivee: "Arrivée",
    depart: "Départ",
    urgence: "Urgence",
    general: "Général",
  },
};

const EN: TraductionsPhrases = {
  titrePage: "Message templates — Staff area",
  surtitre: "Staff area · Guest relations",
  titre: "Message templates",
  description: "Ready-to-copy messages for arrival, departure and emergencies.",
  retour: "Back to dashboard",
  videTexte: "Create a property first to prepare its messages.",
  creerLogement: "Create a property",
  choisirLogement: "Choose a property",
  okEnregistre: "Template saved.",
  okSupprime: "Template deleted.",
  okModeles: "Templates installed.",
  enregistreDefaut: "Saved.",
  erreurInattendue: "Unexpected error. Try again.",
  modifierTitre: (titre) => `Edit “${titre}”`,
  nouvellePhrase: "New message template",
  categorie: "Category",
  titreChamp: "Title",
  placeholderTitre: "Arrival message",
  message: "Message",
  placeholderMessage: "Hello {voyageur}, your stay at {logement}…",
  variables:
    "Available variables: {voyageur}, {logement}, {debut}, {fin}, {heure}.",
  enregistrer: "Save template",
  annuler: "Cancel",
  phrasesDe: (logement) => `Templates for ${logement}`,
  aucunePhrase:
    "No template for this property. Install the templates to get started:",
  installer: "Install templates",
  modifier: "Edit",
  supprimer: "Delete",
  tableau: "Dashboard",
  categories: {
    arrivee: "Arrival",
    depart: "Departure",
    urgence: "Emergency",
    general: "General",
  },
};

const ES: TraductionsPhrases = {
  titrePage: "Plantillas de mensajes — Área profesional",
  surtitre: "Área profesional · Relación con el viajero",
  titre: "Plantillas de mensajes",
  description:
    "Mensajes listos para copiar para la llegada, la salida y las urgencias.",
  retour: "Volver al panel",
  videTexte: "Cree primero un alojamiento para preparar sus mensajes.",
  creerLogement: "Crear un alojamiento",
  choisirLogement: "Elegir un alojamiento",
  okEnregistre: "Plantilla guardada.",
  okSupprime: "Plantilla eliminada.",
  okModeles: "Plantillas instaladas.",
  enregistreDefaut: "Guardado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  modifierTitre: (titre) => `Editar «${titre}»`,
  nouvellePhrase: "Nueva plantilla de mensaje",
  categorie: "Categoría",
  titreChamp: "Título",
  placeholderTitre: "Mensaje de llegada",
  message: "Mensaje",
  placeholderMessage: "Hola {voyageur}, su estancia en {logement}…",
  variables:
    "Variables disponibles: {voyageur}, {logement}, {debut}, {fin}, {heure}.",
  enregistrer: "Guardar plantilla",
  annuler: "Cancelar",
  phrasesDe: (logement) => `Plantillas de ${logement}`,
  aucunePhrase:
    "Ninguna plantilla para este alojamiento. Instale las plantillas para empezar:",
  installer: "Instalar plantillas",
  modifier: "Editar",
  supprimer: "Eliminar",
  tableau: "Panel",
  categories: {
    arrivee: "Llegada",
    depart: "Salida",
    urgence: "Urgencia",
    general: "General",
  },
};

const IT: TraductionsPhrases = {
  titrePage: "Modelli di messaggi — Area professionale",
  surtitre: "Area professionale · Relazione con l’ospite",
  titre: "Modelli di messaggi",
  description:
    "Messaggi pronti da copiare per arrivo, partenza e urgenze.",
  retour: "Torna alla dashboard",
  videTexte: "Creare prima un alloggio per preparare i suoi messaggi.",
  creerLogement: "Creare un alloggio",
  choisirLogement: "Scegliere un alloggio",
  okEnregistre: "Modello salvato.",
  okSupprime: "Modello eliminato.",
  okModeles: "Modelli installati.",
  enregistreDefaut: "Salvato.",
  erreurInattendue: "Errore imprevisto. Riprovare.",
  modifierTitre: (titre) => `Modifica «${titre}»`,
  nouvellePhrase: "Nuovo modello di messaggio",
  categorie: "Categoria",
  titreChamp: "Titolo",
  placeholderTitre: "Messaggio di arrivo",
  message: "Messaggio",
  placeholderMessage: "Buongiorno {voyageur}, il suo soggiorno a {logement}…",
  variables:
    "Variabili disponibili: {voyageur}, {logement}, {debut}, {fin}, {heure}.",
  enregistrer: "Salvare il modello",
  annuler: "Annulla",
  phrasesDe: (logement) => `Modelli di ${logement}`,
  aucunePhrase:
    "Nessun modello per questo alloggio. Installare i modelli per iniziare:",
  installer: "Installare i modelli",
  modifier: "Modifica",
  supprimer: "Elimina",
  tableau: "Dashboard",
  categories: {
    arrivee: "Arrivo",
    depart: "Partenza",
    urgence: "Urgenza",
    general: "Generale",
  },
};

const DE: TraductionsPhrases = {
  titrePage: "Nachrichtenvorlagen — Mitarbeiterbereich",
  surtitre: "Mitarbeiterbereich · Gästebeziehung",
  titre: "Nachrichtenvorlagen",
  description:
    "Vorlagen zum Kopieren für Anreise, Abreise und Notfälle.",
  retour: "Zurück zum Dashboard",
  videTexte:
    "Legen Sie zuerst eine Unterkunft an, um ihre Nachrichten vorzubereiten.",
  creerLogement: "Unterkunft anlegen",
  choisirLogement: "Unterkunft auswählen",
  okEnregistre: "Vorlage gespeichert.",
  okSupprime: "Vorlage gelöscht.",
  okModeles: "Vorlagen installiert.",
  enregistreDefaut: "Gespeichert.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  modifierTitre: (titre) => `„${titre}“ bearbeiten`,
  nouvellePhrase: "Neue Nachrichtenvorlage",
  categorie: "Kategorie",
  titreChamp: "Titel",
  placeholderTitre: "Anreisenachricht",
  message: "Nachricht",
  placeholderMessage: "Hallo {voyageur}, Ihr Aufenthalt in {logement}…",
  variables:
    "Verfügbare Variablen: {voyageur}, {logement}, {debut}, {fin}, {heure}.",
  enregistrer: "Vorlage speichern",
  annuler: "Abbrechen",
  phrasesDe: (logement) => `Vorlagen für ${logement}`,
  aucunePhrase:
    "Keine Vorlage für diese Unterkunft. Installieren Sie die Vorlagen:",
  installer: "Vorlagen installieren",
  modifier: "Bearbeiten",
  supprimer: "Löschen",
  tableau: "Dashboard",
  categories: {
    arrivee: "Anreise",
    depart: "Abreise",
    urgence: "Notfall",
    general: "Allgemein",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsPhrases> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsPhrases(langue: string): TraductionsPhrases {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
