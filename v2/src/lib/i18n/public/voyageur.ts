import { LANGUES, type Langue } from "@/lib/i18n";

export type { Langue } from "@/lib/i18n";

/**
 * Dictionnaire de l'espace voyageur (US3, T047-T056).
 *
 * Il ne remplace pas `@/lib/i18n.ts` (dictionnaire historique des cinq langues,
 * gelé) : il porte les libellés **propres au premier écran réorganisé**
 * (essentiel, sommaire, sections repliables, cartes d'action, barre mobile,
 * bandeau de dernière mise à jour, mode hors ligne).
 *
 * Contrat de type : les cinq langues sont obligatoires et complètes. Une clé
 * oubliée casse la compilation ou le test `tests/ergonomie/i18n-voyageur.test.ts`,
 * jamais l'écran (data-model.md §1).
 */
export interface TraductionsVoyageur {
  /** Titre du premier écran : un seul `h1`. */
  titre: string;
  sousTitre: string;
  /** Titre du bloc « essentiel » (distinct du `h1`, pour la hiérarchie). */
  essentiel: string;
  /** Résumé de séjour : dates, nuits, voyageurs. */
  datesSejour: string;
  nuits: string;
  voyageurs: string;
  /** Sommaire ancré. */
  sommaire: string;
  sommaireLien: string;
  /** Accès au logement. */
  adresse: string;
  adresseAbsente: string;
  itineraire: string;
  itineraireCarte: string;
  /** Wi-Fi. */
  reseauWifi: string;
  motDePasseWifi: string;
  /** Horaires. */
  horaires: string;
  arrivee: string;
  depart: string;
  heureArrivee: string;
  heureDepart: string;
  /** Urgence. */
  urgence: string;
  appelerUrgence: string;
  /** Guide du logement. */
  guideLogement: string;
  guideResume: string;
  guideACompleter: string;
  guidePartenaire: string;
  ouvrirGuidePartenaire: string;
  /** Règles. */
  regles: string;
  /** Bonnes adresses et extras. */
  adresses: string;
  extras: string;
  /** Cartes d'action. */
  actions: string;
  actionIncidentTitre: string;
  actionIncidentTexte: string;
  actionIncidentLien: string;
  actionExtraTitre: string;
  actionExtraTexte: string;
  actionExtraLien: string;
  actionDepartTitre: string;
  actionDepartTexte: string;
  actionDepartLien: string;
  actionAvisTitre: string;
  actionAvisTexte: string;
  actionAvisLien: string;
  /** Sections repliables. */
  preparerDepart: string;
  laisserAvis: string;
  signalerIncident: string;
  preferencesSejour: string;
  memoireVoyageur: string;
  fichePolice: string;
  /** Bandeau « dernière mise à jour » et mode hors ligne. */
  derniereMiseAJour: string;
  horsLigneTitre: string;
  /** Barre d'action mobile. */
  appeler: string;
  ecrire: string;
  guide: string;
  actionsRapides: string;
}

const FR: TraductionsVoyageur = {
  titre: "Votre séjour",
  sousTitre: "Tout ce qu’il vous faut pour arriver, séjourner et partir sereinement.",
  essentiel: "L’essentiel en un coup d’œil",
  datesSejour: "Dates du séjour",
  nuits: "Nuits",
  voyageurs: "Voyageurs",
  sommaire: "Sommaire du séjour",
  sommaireLien: "Aller à la section",
  adresse: "Adresse",
  adresseAbsente: "Adresse communiquée par votre hôte à l’arrivée.",
  itineraire: "Itinéraire",
  itineraireCarte: "Ouvrir l’itinéraire",
  reseauWifi: "Réseau Wi-Fi",
  motDePasseWifi: "Mot de passe Wi-Fi",
  horaires: "Horaires",
  arrivee: "Arrivée",
  depart: "Départ",
  heureArrivee: "Arrivée à partir de",
  heureDepart: "Départ avant",
  urgence: "Urgence",
  appelerUrgence: "Appeler le numéro d’urgence",
  guideLogement: "Guide du logement",
  guideResume: "Arrivée, équipements et consignes du logement.",
  guideACompleter: "Le guide sera complété par votre hôte.",
  guidePartenaire: "Guide partenaire",
  ouvrirGuidePartenaire: "Ouvrir le guide partenaire",
  regles: "Règles du logement",
  adresses: "Bonnes adresses",
  extras: "Extras",
  actions: "Que voulez-vous faire ?",
  actionIncidentTitre: "Signaler un incident",
  actionIncidentTexte: "Un problème dans le logement ? Décrivez-le, votre hôte est prévenu.",
  actionIncidentLien: "Signaler un incident",
  actionExtraTitre: "Commander un extra",
  actionExtraTexte: "Ménage, linge, arrivée tardive : demandez en une touche.",
  actionExtraLien: "Voir les extras",
  actionDepartTitre: "Préparer mon départ",
  actionDepartTexte: "Cochez la liste de départ et confirmez en quelques secondes.",
  actionDepartLien: "Préparer mon départ",
  actionAvisTitre: "Laisser un avis",
  actionAvisTexte: "Votre retour aide votre hôte à améliorer le séjour.",
  actionAvisLien: "Laisser un avis",
  preparerDepart: "Préparer le départ",
  laisserAvis: "Laisser un avis",
  signalerIncident: "Signaler un incident",
  preferencesSejour: "Préférences de séjour",
  memoireVoyageur: "Mémoriser mes préférences",
  fichePolice: "Fiche de police",
  derniereMiseAJour: "Dernière mise à jour",
  horsLigneTitre: "Vous êtes hors ligne : les informations affichées restent consultables.",
  appeler: "Appeler",
  ecrire: "Écrire",
  guide: "Guide",
  actionsRapides: "Actions rapides",
};

const EN: TraductionsVoyageur = {
  titre: "Your stay",
  sousTitre: "Everything you need to arrive, stay and leave with peace of mind.",
  essentiel: "The essentials at a glance",
  datesSejour: "Stay dates",
  nuits: "Nights",
  voyageurs: "Guests",
  sommaire: "Stay contents",
  sommaireLien: "Go to section",
  adresse: "Address",
  adresseAbsente: "Your host will share the address on arrival.",
  itineraire: "Directions",
  itineraireCarte: "Open directions",
  reseauWifi: "Wi-Fi network",
  motDePasseWifi: "Wi-Fi password",
  horaires: "Times",
  arrivee: "Arrival",
  depart: "Departure",
  heureArrivee: "Check-in from",
  heureDepart: "Check-out before",
  urgence: "Emergency",
  appelerUrgence: "Call the emergency number",
  guideLogement: "Accommodation guide",
  guideResume: "Arrival, appliances and house instructions.",
  guideACompleter: "Your host will complete this guide.",
  guidePartenaire: "Partner guide",
  ouvrirGuidePartenaire: "Open the partner guide",
  regles: "House rules",
  adresses: "Local recommendations",
  extras: "Extras",
  actions: "What would you like to do?",
  actionIncidentTitre: "Report an issue",
  actionIncidentTexte: "Something wrong in the home? Describe it and your host is notified.",
  actionIncidentLien: "Report an issue",
  actionExtraTitre: "Order an extra",
  actionExtraTexte: "Cleaning, linen, late arrival: request it in one tap.",
  actionExtraLien: "See the extras",
  actionDepartTitre: "Prepare my departure",
  actionDepartTexte: "Tick the departure checklist and confirm in seconds.",
  actionDepartLien: "Prepare my departure",
  actionAvisTitre: "Leave a review",
  actionAvisTexte: "Your feedback helps your host improve the stay.",
  actionAvisLien: "Leave a review",
  preparerDepart: "Preparing your departure",
  laisserAvis: "Leave a review",
  signalerIncident: "Report an issue",
  preferencesSejour: "Stay preferences",
  memoireVoyageur: "Remember my preferences",
  fichePolice: "Police form",
  derniereMiseAJour: "Last updated",
  horsLigneTitre: "You are offline: the information shown stays available.",
  appeler: "Call",
  ecrire: "Write",
  guide: "Guide",
  actionsRapides: "Quick actions",
};

const ES: TraductionsVoyageur = {
  titre: "Su estancia",
  sousTitre: "Todo lo necesario para llegar, alojarse y salir con tranquilidad.",
  essentiel: "Lo esencial de un vistazo",
  datesSejour: "Fechas de la estancia",
  nuits: "Noches",
  voyageurs: "Huéspedes",
  sommaire: "Índice de la estancia",
  sommaireLien: "Ir a la sección",
  adresse: "Dirección",
  adresseAbsente: "Su anfitrión le dará la dirección a la llegada.",
  itineraire: "Cómo llegar",
  itineraireCarte: "Abrir la ruta",
  reseauWifi: "Red Wi-Fi",
  motDePasseWifi: "Contraseña Wi-Fi",
  horaires: "Horarios",
  arrivee: "Llegada",
  depart: "Salida",
  heureArrivee: "Entrada a partir de",
  heureDepart: "Salida antes de",
  urgence: "Urgencia",
  appelerUrgence: "Llamar al número de urgencia",
  guideLogement: "Guía del alojamiento",
  guideResume: "Llegada, equipamiento y normas del alojamiento.",
  guideACompleter: "Su anfitrión completará esta guía.",
  guidePartenaire: "Guía asociada",
  ouvrirGuidePartenaire: "Abrir la guía asociada",
  regles: "Normas del alojamiento",
  adresses: "Buenas direcciones",
  extras: "Extras",
  actions: "¿Qué desea hacer?",
  actionIncidentTitre: "Informar de una incidencia",
  actionIncidentTexte: "¿Un problema en el alojamiento? Descríbalo y su anfitrión queda avisado.",
  actionIncidentLien: "Informar de una incidencia",
  actionExtraTitre: "Pedir un extra",
  actionExtraTexte: "Limpieza, ropa, llegada tardía: pídalo con un toque.",
  actionExtraLien: "Ver los extras",
  actionDepartTitre: "Preparar mi salida",
  actionDepartTexte: "Marque la lista de salida y confirme en segundos.",
  actionDepartLien: "Preparar mi salida",
  actionAvisTitre: "Dejar una opinión",
  actionAvisTexte: "Su opinión ayuda a su anfitrión a mejorar la estancia.",
  actionAvisLien: "Dejar una opinión",
  preparerDepart: "Preparar la salida",
  laisserAvis: "Dejar una opinión",
  signalerIncident: "Informar de una incidencia",
  preferencesSejour: "Preferencias de estancia",
  memoireVoyageur: "Recordar mis preferencias",
  fichePolice: "Ficha policial",
  derniereMiseAJour: "Última actualización",
  horsLigneTitre: "Está sin conexión: la información mostrada sigue disponible.",
  appeler: "Llamar",
  ecrire: "Escribir",
  guide: "Guía",
  actionsRapides: "Acciones rápidas",
};

const IT: TraductionsVoyageur = {
  titre: "Il suo soggiorno",
  sousTitre: "Tutto il necessario per arrivare, soggiornare e partire serenamente.",
  essentiel: "L’essenziale a colpo d’occhio",
  datesSejour: "Date del soggiorno",
  nuits: "Notti",
  voyageurs: "Ospiti",
  sommaire: "Indice del soggiorno",
  sommaireLien: "Vai alla sezione",
  adresse: "Indirizzo",
  adresseAbsente: "Il suo host comunicherà l’indirizzo all’arrivo.",
  itineraire: "Indicazioni",
  itineraireCarte: "Apri il percorso",
  reseauWifi: "Rete Wi-Fi",
  motDePasseWifi: "Password Wi-Fi",
  horaires: "Orari",
  arrivee: "Arrivo",
  depart: "Partenza",
  heureArrivee: "Check-in dalle",
  heureDepart: "Check-out entro le",
  urgence: "Emergenza",
  appelerUrgence: "Chiamare il numero di emergenza",
  guideLogement: "Guida dell’alloggio",
  guideResume: "Arrivo, dotazioni e istruzioni dell’alloggio.",
  guideACompleter: "Il suo host completerà questa guida.",
  guidePartenaire: "Guida partner",
  ouvrirGuidePartenaire: "Aprire la guida partner",
  regles: "Regole dell’alloggio",
  adresses: "Buoni indirizzi",
  extras: "Extra",
  actions: "Che cosa vuole fare?",
  actionIncidentTitre: "Segnalare un problema",
  actionIncidentTexte: "Un problema nell’alloggio? Lo descriva e il suo host viene avvisato.",
  actionIncidentLien: "Segnalare un problema",
  actionExtraTitre: "Ordinare un extra",
  actionExtraTexte: "Pulizie, biancheria, arrivo tardivo: richieda con un tocco.",
  actionExtraLien: "Vedere gli extra",
  actionDepartTitre: "Preparare la partenza",
  actionDepartTexte: "Spunti la lista di partenza e confermi in pochi secondi.",
  actionDepartLien: "Preparare la partenza",
  actionAvisTitre: "Lasciare una recensione",
  actionAvisTexte: "Il suo parere aiuta il suo host a migliorare il soggiorno.",
  actionAvisLien: "Lasciare una recensione",
  preparerDepart: "Preparare la partenza",
  laisserAvis: "Lasciare una recensione",
  signalerIncident: "Segnala un problema",
  preferencesSejour: "Preferenze di soggiorno",
  memoireVoyageur: "Ricordare le mie preferenze",
  fichePolice: "Scheda di polizia",
  derniereMiseAJour: "Ultimo aggiornamento",
  horsLigneTitre: "Sei offline: le informazioni mostrate restano consultabili.",
  appeler: "Chiamare",
  ecrire: "Scrivere",
  guide: "Guida",
  actionsRapides: "Azioni rapide",
};

const DE: TraductionsVoyageur = {
  titre: "Ihr Aufenthalt",
  sousTitre: "Alles, was Sie für Anreise, Aufenthalt und Abreise brauchen.",
  essentiel: "Das Wichtigste auf einen Blick",
  datesSejour: "Reisedaten",
  nuits: "Nächte",
  voyageurs: "Gäste",
  sommaire: "Inhalt des Aufenthalts",
  sommaireLien: "Zum Abschnitt",
  adresse: "Adresse",
  adresseAbsente: "Ihr Gastgeber teilt die Adresse bei der Anreise mit.",
  itineraire: "Route",
  itineraireCarte: "Route öffnen",
  reseauWifi: "WLAN-Netz",
  motDePasseWifi: "WLAN-Passwort",
  horaires: "Zeiten",
  arrivee: "Anreise",
  depart: "Abreise",
  heureArrivee: "Check-in ab",
  heureDepart: "Check-out bis",
  urgence: "Notfall",
  appelerUrgence: "Notrufnummer anrufen",
  guideLogement: "Leitfaden der Unterkunft",
  guideResume: "Anreise, Ausstattung und Hinweise zur Unterkunft.",
  guideACompleter: "Ihr Gastgeber ergänzt diesen Führer.",
  guidePartenaire: "Partner-Führer",
  ouvrirGuidePartenaire: "Partner-Führer öffnen",
  regles: "Hausregeln",
  adresses: "Empfehlungen",
  extras: "Extras",
  actions: "Was möchten Sie tun?",
  actionIncidentTitre: "Problem melden",
  actionIncidentTexte: "Etwas stimmt nicht? Beschreiben Sie es, Ihr Gastgeber wird informiert.",
  actionIncidentLien: "Problem melden",
  actionExtraTitre: "Extra buchen",
  actionExtraTexte: "Reinigung, Wäsche, späte Anreise: mit einem Tipp anfragen.",
  actionExtraLien: "Extras ansehen",
  actionDepartTitre: "Abreise vorbereiten",
  actionDepartTexte: "Abreise-Checkliste abhaken und in Sekunden bestätigen.",
  actionDepartLien: "Abreise vorbereiten",
  actionAvisTitre: "Bewertung abgeben",
  actionAvisTexte: "Ihre Rückmeldung hilft Ihrem Gastgeber, den Aufenthalt zu verbessern.",
  actionAvisLien: "Bewertung abgeben",
  preparerDepart: "Abreise vorbereiten",
  laisserAvis: "Bewertung abgeben",
  signalerIncident: "Problem melden",
  preferencesSejour: "Aufenthaltsvorlieben",
  memoireVoyageur: "Meine Vorlieben merken",
  fichePolice: "Meldeschein",
  derniereMiseAJour: "Letzte Aktualisierung",
  horsLigneTitre: "Sie sind offline: die angezeigten Informationen bleiben verfügbar.",
  appeler: "Anrufen",
  ecrire: "Schreiben",
  guide: "Führer",
  actionsRapides: "Schnellaktionen",
};

const TRADUCTIONS: Record<Langue, TraductionsVoyageur> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

/**
 * Renvoie le dictionnaire voyageur de la langue demandée, avec repli sur le
 * français pour toute valeur inconnue (`null`, `undefined`, code non géré).
 */
export function traductionsVoyageur(langue?: string | null): TraductionsVoyageur {
  const code = langue?.toLowerCase() ?? "";
  return LANGUES.includes(code as Langue)
    ? TRADUCTIONS[code as Langue]
    : TRADUCTIONS.fr;
}
