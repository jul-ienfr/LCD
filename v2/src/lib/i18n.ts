import type { StatutCommandeExtra } from "@/domain/extra";
import type { StatutIncident } from "@/domain/incident";

export const LANGUES = ["fr", "en", "it", "es", "de"] as const;
export type Langue = (typeof LANGUES)[number];

export interface Traductions {
  langue: string;
  espaceVoyageur: string;
  votreSejour: string;
  ouvrirLien: string;
  besoinAide: string;
  aideTexte: string;
  retourAccueil: string;
  lienInvalide: string;
  sejour: string;
  arrivee: string;
  depart: string;
  nuits: string;
  voyageurs: string;
  auNomDe: string;
  guideLogement: string;
  checkin: string;
  motDePasseWifi: string;
  urgence: string;
  regles: string;
  bonnesAdresses: string;
  guideACompleter: string;
  extras: string;
  commandeEnregistree: string;
  commandeErreur: string;
  aucunExtra: string;
  quantite: string;
  commander: string;
  vosCommandes: string;
  signalerIncident: string;
  incidentTexte: string;
  vosSignalements: string;
  aucunSignalement: string;
  incidentOk: string;
  incidentErreur: string;
  queSestIlPasse: string;
  placeholderIncident: string;
  decrivezProbleme: string;
  signalementRefuse: string;
  horsLigne: string;
  enAttente: string;
  signalementEnvoye: string;
  envoi: string;
  envoyer: string;
  statutsCommande: Record<StatutCommandeExtra, string>;
  statutsIncident: Record<StatutIncident, string>;
}

export function langueDepuisParam(valeur?: string): Langue {
  const code = valeur?.toLowerCase();
  return LANGUES.includes(code as Langue) ? (code as Langue) : "fr";
}

export function dictionnaire(langue: Langue): Traductions {
  return TRADUCTIONS[langue];
}

const FR: Traductions = {
  langue: "Langue",
  espaceVoyageur: "Espace voyageur",
  votreSejour: "Votre séjour",
  ouvrirLien:
    "Ouvrez le lien personnel reçu par SMS ou email pour accéder à votre séjour, votre guide et le formulaire d’incident.",
  besoinAide: "Besoin d’aide ?",
  aideTexte:
    "Si vous n’avez pas reçu votre lien, contactez votre hôte. En cas d’urgence, utilisez le numéro d’urgence présent dans votre logement.",
  retourAccueil: "Retour à l’accueil",
  lienInvalide:
    "Ce lien est invalide ou expiré. Demandez un nouveau lien à votre hôte.",
  sejour: "Séjour",
  arrivee: "Arrivée",
  depart: "Départ",
  nuits: "Nuits",
  voyageurs: "Voyageurs",
  auNomDe: "Au nom de",
  guideLogement: "Guide du logement",
  checkin: "Check-in",
  motDePasseWifi: "Mot de passe WiFi",
  urgence: "Urgence",
  regles: "Règles",
  bonnesAdresses: "Bonnes adresses",
  guideACompleter: "Le guide sera complété par votre hôte.",
  extras: "Extras",
  commandeEnregistree: "Commande enregistrée. Votre hôte la confirmera.",
  commandeErreur: "La commande n’a pas pu être enregistrée.",
  aucunExtra: "Aucun extra disponible pour ce séjour.",
  quantite: "Quantité",
  commander: "Commander",
  vosCommandes: "Vos commandes",
  signalerIncident: "Signaler un incident",
  incidentTexte:
    "Le formulaire fonctionne sans JavaScript. Si vous êtes hors ligne, il est mis en attente et envoyé au retour du réseau.",
  vosSignalements: "Vos signalements",
  aucunSignalement: "Aucun signalement pour ce séjour.",
  incidentOk: "Signalement envoyé. L’hôte en est informé.",
  incidentErreur:
    "Le signalement n’a pas pu être envoyé. Réessayez ou contactez l’hôte.",
  queSestIlPasse: "Que s’est-il passé ?",
  placeholderIncident: "Ex. la clé ne fonctionne plus…",
  decrivezProbleme:
    "Décrivez le problème en quelques mots (5 caractères min.).",
  signalementRefuse: "Signalement refusé.",
  horsLigne:
    "Hors ligne : signalement mis en attente. Il sera envoyé au retour du réseau.",
  enAttente: "({n} en attente)",
  signalementEnvoye: "Signalement envoyé. L’hôte en est informé.",
  envoi: "Envoi…",
  envoyer: "Envoyer",
  statutsCommande: {
    demandee: "Demandée",
    confirmee: "Confirmée",
    refusee: "Refusée",
    livree: "Livrée",
  },
  statutsIncident: {
    ouvert: "Ouvert",
    en_cours: "En cours",
    resolu: "Résolu",
    annule: "Annulé",
  },
};

const EN: Traductions = {
  langue: "Language",
  espaceVoyageur: "Guest area",
  votreSejour: "Your stay",
  ouvrirLien:
    "Open the personal link you received by SMS or email to access your stay, guide and incident form.",
  besoinAide: "Need help?",
  aideTexte:
    "If you did not receive your link, contact your host. In an emergency, use the emergency number inside your accommodation.",
  retourAccueil: "Back to home",
  lienInvalide:
    "This link is invalid or has expired. Ask your host for a new link.",
  sejour: "Stay",
  arrivee: "Arrival",
  depart: "Departure",
  nuits: "Nights",
  voyageurs: "Guests",
  auNomDe: "In the name of",
  guideLogement: "Accommodation guide",
  checkin: "Check-in",
  motDePasseWifi: "WiFi password",
  urgence: "Emergency",
  regles: "Rules",
  bonnesAdresses: "Local recommendations",
  guideACompleter: "The guide will be completed by your host.",
  extras: "Extras",
  commandeEnregistree: "Order recorded. Your host will confirm it.",
  commandeErreur: "The order could not be recorded.",
  aucunExtra: "No extras available for this stay.",
  quantite: "Quantity",
  commander: "Order",
  vosCommandes: "Your orders",
  signalerIncident: "Report an issue",
  incidentTexte:
    "The form works without JavaScript. If you are offline, it is queued and sent when the network returns.",
  vosSignalements: "Your reports",
  aucunSignalement: "No reports for this stay.",
  incidentOk: "Report sent. Your host has been notified.",
  incidentErreur:
    "The report could not be sent. Try again or contact your host.",
  queSestIlPasse: "What happened?",
  placeholderIncident: "E.g. the key no longer works…",
  decrivezProbleme: "Describe the problem in a few words (min. 5 characters).",
  signalementRefuse: "Report declined.",
  horsLigne:
    "Offline: report queued. It will be sent when the network returns.",
  enAttente: "({n} pending)",
  signalementEnvoye: "Report sent. Your host has been notified.",
  envoi: "Sending…",
  envoyer: "Send",
  statutsCommande: {
    demandee: "Requested",
    confirmee: "Confirmed",
    refusee: "Declined",
    livree: "Delivered",
  },
  statutsIncident: {
    ouvert: "Open",
    en_cours: "In progress",
    resolu: "Resolved",
    annule: "Cancelled",
  },
};

const IT: Traductions = {
  langue: "Lingua",
  espaceVoyageur: "Spazio viaggiatore",
  votreSejour: "Il tuo soggiorno",
  ouvrirLien:
    "Apri il link personale ricevuto via SMS o email per accedere al soggiorno, alla guida e al modulo di segnalazione.",
  besoinAide: "Hai bisogno di aiuto?",
  aideTexte:
    "Se non hai ricevuto il link, contatta il tuo host. In caso di emergenza, usa il numero di emergenza presente nell’alloggio.",
  retourAccueil: "Torna alla home",
  lienInvalide:
    "Questo link non è valido o è scaduto. Chiedi un nuovo link al tuo host.",
  sejour: "Soggiorno",
  arrivee: "Arrivo",
  depart: "Partenza",
  nuits: "Notti",
  voyageurs: "Ospiti",
  auNomDe: "A nome di",
  guideLogement: "Guida dell’alloggio",
  checkin: "Check-in",
  motDePasseWifi: "Password WiFi",
  urgence: "Emergenza",
  regles: "Regole",
  bonnesAdresses: "Indirizzi consigliati",
  guideACompleter: "La guida sarà completata dal tuo host.",
  extras: "Extra",
  commandeEnregistree: "Ordine registrato. Il tuo host lo confermerà.",
  commandeErreur: "L’ordine non è stato registrato.",
  aucunExtra: "Nessun extra disponibile per questo soggiorno.",
  quantite: "Quantità",
  commander: "Ordina",
  vosCommandes: "I tuoi ordini",
  signalerIncident: "Segnala un problema",
  incidentTexte:
    "Il modulo funziona senza JavaScript. Se sei offline, viene messo in coda e inviato al ritorno della rete.",
  vosSignalements: "Le tue segnalazioni",
  aucunSignalement: "Nessuna segnalazione per questo soggiorno.",
  incidentOk: "Segnalazione inviata. Il tuo host è stato informato.",
  incidentErreur:
    "La segnalazione non è stata inviata. Riprova o contatta il tuo host.",
  queSestIlPasse: "Cosa è successo?",
  placeholderIncident: "Es. la chiave non funziona più…",
  decrivezProbleme:
    "Descrivi il problema in poche parole (min. 5 caratteri).",
  signalementRefuse: "Segnalazione rifiutata.",
  horsLigne:
    "Offline: segnalazione in coda. Verrà inviata al ritorno della rete.",
  enAttente: "({n} in attesa)",
  signalementEnvoye: "Segnalazione inviata. Il tuo host è stato informato.",
  envoi: "Invio…",
  envoyer: "Invia",
  statutsCommande: {
    demandee: "Richiesta",
    confirmee: "Confermata",
    refusee: "Rifiutata",
    livree: "Consegnata",
  },
  statutsIncident: {
    ouvert: "Aperta",
    en_cours: "In corso",
    resolu: "Risolta",
    annule: "Annullata",
  },
};

const ES: Traductions = {
  langue: "Idioma",
  espaceVoyageur: "Espacio viajero",
  votreSejour: "Tu estancia",
  ouvrirLien:
    "Abre el enlace personal recibido por SMS o email para acceder a tu estancia, guía y formulario de incidencias.",
  besoinAide: "¿Necesitas ayuda?",
  aideTexte:
    "Si no has recibido tu enlace, contacta con tu anfitrión. En caso de urgencia, utiliza el número de urgencia del alojamiento.",
  retourAccueil: "Volver al inicio",
  lienInvalide:
    "Este enlace no es válido o ha caducado. Pide uno nuevo a tu anfitrión.",
  sejour: "Estancia",
  arrivee: "Llegada",
  depart: "Salida",
  nuits: "Noches",
  voyageurs: "Viajeros",
  auNomDe: "A nombre de",
  guideLogement: "Guía del alojamiento",
  checkin: "Check-in",
  motDePasseWifi: "Contraseña WiFi",
  urgence: "Urgencia",
  regles: "Normas",
  bonnesAdresses: "Recomendaciones",
  guideACompleter: "La guía será completada por tu anfitrión.",
  extras: "Extras",
  commandeEnregistree: "Pedido registrado. Tu anfitrión lo confirmará.",
  commandeErreur: "El pedido no se ha podido registrar.",
  aucunExtra: "No hay extras disponibles para esta estancia.",
  quantite: "Cantidad",
  commander: "Pedir",
  vosCommandes: "Tus pedidos",
  signalerIncident: "Informar de una incidencia",
  incidentTexte:
    "El formulario funciona sin JavaScript. Si estás sin conexión, se pone en cola y se envía al volver la red.",
  vosSignalements: "Tus incidencias",
  aucunSignalement: "No hay incidencias para esta estancia.",
  incidentOk: "Incidencia enviada. Tu anfitrión ha sido informado.",
  incidentErreur:
    "La incidencia no se ha podido enviar. Inténtalo de nuevo o contacta con tu anfitrión.",
  queSestIlPasse: "¿Qué ha pasado?",
  placeholderIncident: "Ej. la llave ya no funciona…",
  decrivezProbleme: "Describe el problema en pocas palabras (mín. 5 caracteres).",
  signalementRefuse: "Incidencia rechazada.",
  horsLigne:
    "Sin conexión: incidencia en cola. Se enviará al volver la red.",
  enAttente: "({n} pendientes)",
  signalementEnvoye: "Incidencia enviada. Tu anfitrión ha sido informado.",
  envoi: "Enviando…",
  envoyer: "Enviar",
  statutsCommande: {
    demandee: "Solicitado",
    confirmee: "Confirmado",
    refusee: "Rechazado",
    livree: "Entregado",
  },
  statutsIncident: {
    ouvert: "Abierta",
    en_cours: "En curso",
    resolu: "Resuelta",
    annule: "Anulada",
  },
};

const DE: Traductions = {
  langue: "Sprache",
  espaceVoyageur: "Gästebereich",
  votreSejour: "Ihr Aufenthalt",
  ouvrirLien:
    "Öffnen Sie den persönlichen Link aus SMS oder E-Mail, um Ihren Aufenthalt, den Leitfaden und das Meldeformular zu öffnen.",
  besoinAide: "Brauchen Sie Hilfe?",
  aideTexte:
    "Wenn Sie Ihren Link nicht erhalten haben, kontaktieren Sie Ihren Gastgeber. Im Notfall nutzen Sie die Notrufnummer in der Unterkunft.",
  retourAccueil: "Zurück zur Startseite",
  lienInvalide:
    "Dieser Link ist ungültig oder abgelaufen. Fordern Sie einen neuen Link bei Ihrem Gastgeber an.",
  sejour: "Aufenthalt",
  arrivee: "Anreise",
  depart: "Abreise",
  nuits: "Nächte",
  voyageurs: "Gäste",
  auNomDe: "Auf den Namen von",
  guideLogement: "Leitfaden der Unterkunft",
  checkin: "Check-in",
  motDePasseWifi: "WLAN-Passwort",
  urgence: "Notfall",
  regles: "Regeln",
  bonnesAdresses: "Empfehlungen",
  guideACompleter: "Der Leitfaden wird von Ihrem Gastgeber ergänzt.",
  extras: "Extras",
  commandeEnregistree: "Bestellung erfasst. Ihr Gastgeber bestätigt sie.",
  commandeErreur: "Die Bestellung konnte nicht erfasst werden.",
  aucunExtra: "Keine Extras für diesen Aufenthalt verfügbar.",
  quantite: "Menge",
  commander: "Bestellen",
  vosCommandes: "Ihre Bestellungen",
  signalerIncident: "Problem melden",
  incidentTexte:
    "Das Formular funktioniert ohne JavaScript. Wenn Sie offline sind, wird es vorgemerkt und bei Netzrückkehr gesendet.",
  vosSignalements: "Ihre Meldungen",
  aucunSignalement: "Keine Meldungen für diesen Aufenthalt.",
  incidentOk: "Meldung gesendet. Ihr Gastgeber wurde informiert.",
  incidentErreur:
    "Die Meldung konnte nicht gesendet werden. Versuchen Sie es erneut oder kontaktieren Sie Ihren Gastgeber.",
  queSestIlPasse: "Was ist passiert?",
  placeholderIncident: "Z. B. der Schlüssel funktioniert nicht mehr…",
  decrivezProbleme:
    "Beschreiben Sie das Problem in wenigen Worten (mind. 5 Zeichen).",
  signalementRefuse: "Meldung abgelehnt.",
  horsLigne:
    "Offline: Meldung vorgemerkt. Sie wird bei Netzrückkehr gesendet.",
  enAttente: "({n} ausstehend)",
  signalementEnvoye: "Meldung gesendet. Ihr Gastgeber wurde informiert.",
  envoi: "Senden…",
  envoyer: "Senden",
  statutsCommande: {
    demandee: "Angefragt",
    confirmee: "Bestätigt",
    refusee: "Abgelehnt",
    livree: "Geliefert",
  },
  statutsIncident: {
    ouvert: "Offen",
    en_cours: "In Bearbeitung",
    resolu: "Erledigt",
    annule: "Storniert",
  },
};

const TRADUCTIONS: Record<Langue, Traductions> = {
  fr: FR,
  en: EN,
  it: IT,
  es: ES,
  de: DE,
};
