import type { Langue } from "@/lib/i18n";

/**
 * Dictionnaire du retour qualitatif (`/retour`, tâche T094 du plan 004).
 *
 * Contrat :
 * - les cinq langues de `LANGUES` sont présentes avec exactement les mêmes
 *   clés et aucune valeur vide ;
 * - aucun texte libre n'est collecté : seules des listes fermées sont
 *   proposées, donc aucune donnée personnelle ne peut être saisie ;
 * - le repli se fait sur le français pour toute langue inconnue.
 */

export interface TraductionsRetour {
  titre: string;
  intro: string;
  sansPii: string;
  parcours: string;
  choisirParcours: string;
  note: string;
  noteAide: string;
  noteBasse: string;
  noteHaute: string;
  obstacles: string;
  obstaclesAide: string;
  support: string;
  supportTelephone: string;
  supportTablette: string;
  supportOrdinateur: string;
  supportNon: string;
  envoyer: string;
  retourAide: string;
  merci: string;
  merciTexte: string;
  erreurParcours: string;
  erreurParcoursInconnu: string;
  erreurNote: string;
  erreurNoteBornes: string;
}

const PARCOURS: Record<Langue, Record<string, string>> = {
  fr: {
    "P-RESA": "Réserver un séjour",
    "P-SEJOUR": "Consulter mon séjour",
    "P-INCIDENT": "Signaler un incident",
    "P-HOTE-5": "Tâches de l'espace hôte",
    "P-RECHERCHE": "Rechercher dans l'espace hôte",
    "P-PRESTA": "Mission de prestataire",
  },
  en: {
    "P-RESA": "Book a stay",
    "P-SEJOUR": "View my stay",
    "P-INCIDENT": "Report an incident",
    "P-HOTE-5": "Host workspace tasks",
    "P-RECHERCHE": "Search the host workspace",
    "P-PRESTA": "Service provider task",
  },
  it: {
    "P-RESA": "Prenotare un soggiorno",
    "P-SEJOUR": "Consultare il mio soggiorno",
    "P-INCIDENT": "Segnalare un incidente",
    "P-HOTE-5": "Attività dello spazio host",
    "P-RECHERCHE": "Cercare nello spazio host",
    "P-PRESTA": "Missione del fornitore",
  },
  es: {
    "P-RESA": "Reservar una estancia",
    "P-SEJOUR": "Consultar mi estancia",
    "P-INCIDENT": "Informar de un incidente",
    "P-HOTE-5": "Tareas del espacio anfitrión",
    "P-RECHERCHE": "Buscar en el espacio anfitrión",
    "P-PRESTA": "Misión del proveedor",
  },
  de: {
    "P-RESA": "Aufenthalt buchen",
    "P-SEJOUR": "Meinen Aufenthalt ansehen",
    "P-INCIDENT": "Vorfall melden",
    "P-HOTE-5": "Aufgaben im Gastgeberbereich",
    "P-RECHERCHE": "Im Gastgeberbereich suchen",
    "P-PRESTA": "Auftrag für Dienstleister",
  },
};

const OBSTACLES: Record<Langue, Record<string, string>> = {
  fr: {
    information_introuvable: "Je n'ai pas trouvé l'information",
    formulaire_long: "Le formulaire était trop long",
    affichage: "Problème d'affichage sur mon écran",
    langue: "La langue ne convenait pas",
    erreur_bloquante: "Une erreur m'a bloqué",
    lenteur: "C'était trop lent",
    autre: "Autre difficulté",
  },
  en: {
    information_introuvable: "I could not find the information",
    formulaire_long: "The form was too long",
    affichage: "Display problem on my screen",
    langue: "The language was not right",
    erreur_bloquante: "An error blocked me",
    lenteur: "It was too slow",
    autre: "Another difficulty",
  },
  it: {
    information_introuvable: "Non ho trovato l'informazione",
    formulaire_long: "Il modulo era troppo lungo",
    affichage: "Problema di visualizzazione",
    langue: "La lingua non era adatta",
    erreur_bloquante: "Un errore mi ha bloccato",
    lenteur: "Era troppo lento",
    autre: "Altra difficoltà",
  },
  es: {
    information_introuvable: "No encontré la información",
    formulaire_long: "El formulario era demasiado largo",
    affichage: "Problema de visualización",
    langue: "El idioma no era el adecuado",
    erreur_bloquante: "Un error me bloqueó",
    lenteur: "Era demasiado lento",
    autre: "Otra dificultad",
  },
  de: {
    information_introuvable: "Ich habe die Information nicht gefunden",
    formulaire_long: "Das Formular war zu lang",
    affichage: "Anzeigeproblem auf meinem Bildschirm",
    langue: "Die Sprache passte nicht",
    erreur_bloquante: "Ein Fehler hat mich blockiert",
    lenteur: "Es war zu langsam",
    autre: "Andere Schwierigkeit",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsRetour> = {
  fr: {
    titre: "Votre avis sur votre parcours",
    intro:
      "Dites-nous en quelques clics comment s'est passée votre expérience. Aucune réponse n'est obligatoire à l'exception du parcours et de la note.",
    sansPii:
      "Aucune donnée personnelle n'est demandée ni enregistrée : seuls des choix fermés sont collectés, de façon anonyme.",
    parcours: "Parcours concerné",
    choisirParcours: "Choisissez le parcours",
    note: "Facilité globale",
    noteAide:
      "1 = très difficile, 7 = très facile. Cette échelle est la même que celle utilisée par l'équipe pour suivre la qualité.",
    noteBasse: "1 · très difficile",
    noteHaute: "7 · très facile",
    obstacles: "Qu'est-ce qui vous a gêné ?",
    obstaclesAide: "Plusieurs choix possibles, aucun n'est obligatoire.",
    support: "Sur quel appareil ?",
    supportTelephone: "Téléphone",
    supportTablette: "Tablette",
    supportOrdinateur: "Ordinateur",
    supportNon: "Je préfère ne pas répondre",
    envoyer: "Envoyer mon avis",
    retourAide: "Retour à l'aide",
    merci: "Merci, votre avis est enregistré.",
    merciTexte:
      "Il est anonyme et sert uniquement à améliorer les écrans. Aucune réponse ne vous sera demandée.",
    erreurParcours: "Choisissez le parcours concerné.",
    erreurParcoursInconnu: "Ce parcours n'est pas reconnu.",
    erreurNote: "Choisissez une note entre 1 et 7.",
    erreurNoteBornes: "La note doit être un nombre entier entre 1 et 7.",
  },
  en: {
    titre: "Your feedback on your journey",
    intro:
      "Tell us in a few clicks how your experience went. Only the journey and the rating are required.",
    sansPii:
      "No personal data is requested or stored: only closed choices are collected, anonymously.",
    parcours: "Journey",
    choisirParcours: "Choose the journey",
    note: "Overall ease",
    noteAide:
      "1 = very difficult, 7 = very easy. This is the same scale the team uses to track quality.",
    noteBasse: "1 · very difficult",
    noteHaute: "7 · very easy",
    obstacles: "What got in your way?",
    obstaclesAide: "Several choices allowed, none is required.",
    support: "On which device?",
    supportTelephone: "Phone",
    supportTablette: "Tablet",
    supportOrdinateur: "Computer",
    supportNon: "I prefer not to answer",
    envoyer: "Send my feedback",
    retourAide: "Back to help",
    merci: "Thank you, your feedback is saved.",
    merciTexte:
      "It is anonymous and only used to improve the screens. No answer will be asked of you.",
    erreurParcours: "Choose the journey concerned.",
    erreurParcoursInconnu: "This journey is not recognised.",
    erreurNote: "Choose a rating between 1 and 7.",
    erreurNoteBornes: "The rating must be a whole number between 1 and 7.",
  },
  it: {
    titre: "La tua opinione sul tuo percorso",
    intro:
      "Raccontaci in pochi clic come è andata. Solo il percorso e il voto sono obbligatori.",
    sansPii:
      "Nessun dato personale viene richiesto o memorizzato: solo scelte chiuse, in forma anonima.",
    parcours: "Percorso interessato",
    choisirParcours: "Scegli il percorso",
    note: "Facilità complessiva",
    noteAide:
      "1 = molto difficile, 7 = molto facile. È la stessa scala usata dal team per la qualità.",
    noteBasse: "1 · molto difficile",
    noteHaute: "7 · molto facile",
    obstacles: "Cosa ti ha ostacolato?",
    obstaclesAide: "Più scelte possibili, nessuna obbligatoria.",
    support: "Su quale dispositivo?",
    supportTelephone: "Telefono",
    supportTablette: "Tablet",
    supportOrdinateur: "Computer",
    supportNon: "Preferisco non rispondere",
    envoyer: "Invia la mia opinione",
    retourAide: "Torna all'aiuto",
    merci: "Grazie, la tua opinione è registrata.",
    merciTexte:
      "È anonima e serve solo a migliorare le schermate. Non ti verrà chiesto altro.",
    erreurParcours: "Scegli il percorso interessato.",
    erreurParcoursInconnu: "Questo percorso non è riconosciuto.",
    erreurNote: "Scegli un voto tra 1 e 7.",
    erreurNoteBornes: "Il voto deve essere un numero intero tra 1 e 7.",
  },
  es: {
    titre: "Tu opinión sobre tu recorrido",
    intro:
      "Cuéntanos en unos clics cómo fue tu experiencia. Solo el recorrido y la nota son obligatorios.",
    sansPii:
      "No se piden ni se guardan datos personales: solo se recogen opciones cerradas, de forma anónima.",
    parcours: "Recorrido",
    choisirParcours: "Elige el recorrido",
    note: "Facilidad global",
    noteAide:
      "1 = muy difícil, 7 = muy fácil. Es la misma escala que usa el equipo para la calidad.",
    noteBasse: "1 · muy difícil",
    noteHaute: "7 · muy fácil",
    obstacles: "¿Qué te lo dificultó?",
    obstaclesAide: "Varias opciones posibles, ninguna obligatoria.",
    support: "¿En qué dispositivo?",
    supportTelephone: "Teléfono",
    supportTablette: "Tableta",
    supportOrdinateur: "Ordenador",
    supportNon: "Prefiero no responder",
    envoyer: "Enviar mi opinión",
    retourAide: "Volver a la ayuda",
    merci: "Gracias, tu opinión está registrada.",
    merciTexte:
      "Es anónima y solo sirve para mejorar las pantallas. No se te pedirá nada más.",
    erreurParcours: "Elige el recorrido.",
    erreurParcoursInconnu: "Este recorrido no se reconoce.",
    erreurNote: "Elige una nota entre 1 y 7.",
    erreurNoteBornes: "La nota debe ser un número entero entre 1 y 7.",
  },
  de: {
    titre: "Ihre Rückmeldung zu Ihrem Ablauf",
    intro:
      "Sagen Sie uns mit wenigen Klicks, wie es gelaufen ist. Nur Ablauf und Bewertung sind Pflicht.",
    sansPii:
      "Es werden keine personenbezogenen Daten verlangt oder gespeichert: nur geschlossene Auswahlmöglichkeiten, anonym.",
    parcours: "Betroffener Ablauf",
    choisirParcours: "Ablauf wählen",
    note: "Gesamte Leichtigkeit",
    noteAide:
      "1 = sehr schwierig, 7 = sehr einfach. Dieselbe Skala nutzt das Team für die Qualität.",
    noteBasse: "1 · sehr schwierig",
    noteHaute: "7 · sehr einfach",
    obstacles: "Was hat Sie gestört?",
    obstaclesAide: "Mehrere Antworten möglich, keine Pflicht.",
    support: "Auf welchem Gerät?",
    supportTelephone: "Telefon",
    supportTablette: "Tablet",
    supportOrdinateur: "Computer",
    supportNon: "Ich möchte nicht antworten",
    envoyer: "Rückmeldung senden",
    retourAide: "Zurück zur Hilfe",
    merci: "Danke, Ihre Rückmeldung ist gespeichert.",
    merciTexte:
      "Sie ist anonym und dient nur der Verbesserung der Ansichten. Es wird nichts weiter verlangt.",
    erreurParcours: "Wählen Sie den betroffenen Ablauf.",
    erreurParcoursInconnu: "Dieser Ablauf ist nicht bekannt.",
    erreurNote: "Wählen Sie eine Bewertung zwischen 1 und 7.",
    erreurNoteBornes: "Die Bewertung muss eine ganze Zahl zwischen 1 und 7 sein.",
  },
};

export function libelleParcoursRetour(langue: Langue, id: string): string {
  return PARCOURS[langue]?.[id] ?? PARCOURS.fr[id] ?? id;
}

export function libelleObstacleRetour(langue: Langue, id: string): string {
  return OBSTACLES[langue]?.[id] ?? OBSTACLES.fr[id] ?? id;
}

export function traductionsRetour(langue: string): TraductionsRetour {
  return (
    (DICTIONNAIRES as Record<string, TraductionsRetour>)[langue] ??
    DICTIONNAIRES.fr
  );
}
