import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsVoyageurs {
  messagesTitrePage: string;
  messagesSurtitre: string;
  messagesTitre: string;
  messagesDescription: string;
  retourTableau: string;
  creerLogementDAbord: string;
  creerLogement: string;
  choisirLogement: string;
  prepare: string;
  envoye: string;
  erreurInattendue: string;
  brouillons: string;
  envoyes: string;
  logement: string;
  preparerTitre: string;
  canal: string;
  type: string;
  codeAvert: string;
  emailVoyageur: string;
  emailAide: string;
  telephoneVoyageur: string;
  telephoneAide: string;
  contenu: string;
  contenuPlaceholder: string;
  preparer: string;
  messagesDe: (nom: string, n: number) => string;
  aucunMessage: string;
  envoyeStatut: string;
  brouillon: string;
  envoyerSms: string;
  marquerEnvoye: string;
  envoyerEmail: string;
  journalAudit: string;
  tableauBord: string;
  avisTitrePage: string;
  avisEspace: string;
  avisTitre: string;
  avisResume: (total: number, publies: number, moyenne: string | null) => string;
  avisMaj: string;
  avisIntrouvable: string;
  aucunAvis: string;
  noteSur: (note: number) => string;
  publie: string;
  masque: string;
  masquer: string;
  publier: string;
  statuts: Record<string, string>;
}

const FR: TraductionsVoyageurs = {
  messagesTitrePage: "Messages voyageurs — LCD Parc",
  messagesSurtitre: "Espace hôte · Voyageurs",
  messagesTitre: "Messages voyageurs",
  messagesDescription: "Messages J-1, arrivée et départ — sans jamais transmettre de code d’accès.",
  retourTableau: "Retour au tableau de bord",
  creerLogementDAbord: "Créez d’abord un logement pour préparer un message.",
  creerLogement: "Créer un logement", choisirLogement: "Choisir un logement",
  prepare: "Message préparé.", envoye: "Message envoyé.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  brouillons: "Brouillons", envoyes: "Envoyés", logement: "Logement",
  preparerTitre: "Préparer un message", canal: "Canal", type: "Type",
  codeAvert: "Le code d’accès n’est jamais inclus : communiquez-le par un canal vérifié.",
  emailVoyageur: "E-mail du voyageur",
  emailAide: "Requis pour un envoi réel par e-mail ; laissez vide pour un envoi manuel.",
  telephoneVoyageur: "Téléphone du voyageur",
  telephoneAide: "Utilisé uniquement pour le canal SMS.", contenu: "Contenu",
  contenuPlaceholder: "Bonjour, votre séjour approche. L’arrivée est possible à partir de 15 h.",
  preparer: "Préparer le message",
  messagesDe: (nom, n) => `Messages de ${nom} (${n})`,
  aucunMessage: "Aucun message préparé pour ce logement.",
  envoyeStatut: "Envoyé", brouillon: "Brouillon",
  envoyerSms: "Envoyer par SMS", marquerEnvoye: "Marquer envoyé",
  envoyerEmail: "Envoyer par e-mail", journalAudit: "Journal d’audit",
  tableauBord: "Tableau de bord", avisTitrePage: "Avis voyageurs — Espace hôte",
  avisEspace: "Espace hôte", avisTitre: "Avis voyageurs",
  avisResume: (total, publies, moyenne) =>
    `${total} avis · ${publies} publié${publies > 1 ? "s" : ""}${moyenne !== null ? ` · moyenne ${moyenne}/5` : ""}`,
  avisMaj: "Avis mis à jour.", avisIntrouvable: "Avis introuvable.",
  aucunAvis: "Aucun avis pour le moment. Les voyageurs peuvent en déposer depuis leur espace séjour.",
  noteSur: (note) => `Note ${note} sur 5`, publie: "Publié", masque: "Masqué",
  masquer: "Masquer", publier: "Publier",
  statuts: { publie: "Publié", masque: "Masqué" },
};

const EN: TraductionsVoyageurs = {
  messagesTitrePage: "Guest messages — LCD Parc", messagesSurtitre: "Staff area · Guests",
  messagesTitre: "Guest messages",
  messagesDescription: "D-1, arrival and departure messages — never include an access code.",
  retourTableau: "Back to dashboard",
  creerLogementDAbord: "Create a property first to prepare a message.",
  creerLogement: "Create a property", choisirLogement: "Choose a property",
  prepare: "Message prepared.", envoye: "Message sent.",
  erreurInattendue: "Unexpected error. Try again.",
  brouillons: "Drafts", envoyes: "Sent", logement: "Property",
  preparerTitre: "Prepare a message", canal: "Channel", type: "Type",
  codeAvert: "The access code is never included: share it through a verified channel.",
  emailVoyageur: "Guest email",
  emailAide: "Required for a real email send; leave blank for manual sending.",
  telephoneVoyageur: "Guest phone",
  telephoneAide: "Used only for the SMS channel.", contenu: "Content",
  contenuPlaceholder: "Hello, your stay is approaching. Arrival is possible from 3 pm.",
  preparer: "Prepare message",
  messagesDe: (nom, n) => `${nom} messages (${n})`,
  aucunMessage: "No message prepared for this property.",
  envoyeStatut: "Sent", brouillon: "Draft",
  envoyerSms: "Send by SMS", marquerEnvoye: "Mark sent",
  envoyerEmail: "Send by email", journalAudit: "Audit log",
  tableauBord: "Dashboard", avisTitrePage: "Guest reviews — Staff area",
  avisEspace: "Staff area", avisTitre: "Guest reviews",
  avisResume: (total, publies, moyenne) =>
    `${total} reviews · ${publies} published${moyenne !== null ? ` · average ${moyenne}/5` : ""}`,
  avisMaj: "Review updated.", avisIntrouvable: "Review not found.",
  aucunAvis: "No reviews yet. Guests can leave one from their stay area.",
  noteSur: (note) => `Rating ${note} out of 5`, publie: "Published", masque: "Hidden",
  masquer: "Hide", publier: "Publish",
  statuts: { publie: "Published", masque: "Hidden" },
};

const ES: TraductionsVoyageurs = {
  messagesTitrePage: "Mensajes de viajeros — LCD Parc", messagesSurtitre: "Área profesional · Viajeros",
  messagesTitre: "Mensajes de viajeros",
  messagesDescription: "Mensajes D-1, llegada y salida — sin transmitir nunca un código de acceso.",
  retourTableau: "Volver al panel",
  creerLogementDAbord: "Cree primero un alojamiento para preparar un mensaje.",
  creerLogement: "Crear un alojamiento", choisirLogement: "Elegir un alojamiento",
  prepare: "Mensaje preparado.", envoye: "Mensaje enviado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  brouillons: "Borradores", envoyes: "Enviados", logement: "Alojamiento",
  preparerTitre: "Preparar un mensaje", canal: "Canal", type: "Tipo",
  codeAvert: "El código de acceso nunca se incluye: comuníquelo por un canal verificado.",
  emailVoyageur: "Correo del viajero",
  emailAide: "Obligatorio para un envío real por correo; déjelo vacío para un envío manual.",
  telephoneVoyageur: "Teléfono del viajero",
  telephoneAide: "Solo se usa para el canal SMS.", contenu: "Contenido",
  contenuPlaceholder: "Hola, su estancia se acerca. La llegada es posible a partir de las 15 h.",
  preparer: "Preparar el mensaje",
  messagesDe: (nom, n) => `Mensajes de ${nom} (${n})`,
  aucunMessage: "Ningún mensaje preparado para este alojamiento.",
  envoyeStatut: "Enviado", brouillon: "Borrador",
  envoyerSms: "Enviar por SMS", marquerEnvoye: "Marcar enviado",
  envoyerEmail: "Enviar por correo", journalAudit: "Registro de auditoría",
  tableauBord: "Panel", avisTitrePage: "Opiniones de viajeros — Área profesional",
  avisEspace: "Área profesional", avisTitre: "Opiniones de viajeros",
  avisResume: (total, publies, moyenne) =>
    `${total} opiniones · ${publies} publicada${publies > 1 ? "s" : ""}${moyenne !== null ? ` · media ${moyenne}/5` : ""}`,
  avisMaj: "Opinión actualizada.", avisIntrouvable: "Opinión no encontrada.",
  aucunAvis: "Aún no hay opiniones. Los viajeros pueden dejarla desde su espacio de estancia.",
  noteSur: (note) => `Nota ${note} sobre 5`, publie: "Publicada", masque: "Oculta",
  masquer: "Ocultar", publier: "Publicar",
  statuts: { publie: "Publicada", masque: "Oculta" },
};

const IT: TraductionsVoyageurs = {
  messagesTitrePage: "Messaggi ospiti — LCD Parc", messagesSurtitre: "Area professionale · Ospiti",
  messagesTitre: "Messaggi ospiti",
  messagesDescription: "Messaggi D-1, arrivo e partenza — senza mai trasmettere un codice di accesso.",
  retourTableau: "Torna alla dashboard",
  creerLogementDAbord: "Crei prima un alloggio per preparare un messaggio.",
  creerLogement: "Crea un alloggio", choisirLogement: "Scegli un alloggio",
  prepare: "Messaggio preparato.", envoye: "Messaggio inviato.",
  erreurInattendue: "Errore imprevisto. Riprovi.",
  brouillons: "Bozze", envoyes: "Inviati", logement: "Alloggio",
  preparerTitre: "Prepara un messaggio", canal: "Canale", type: "Tipo",
  codeAvert: "Il codice di accesso non è mai incluso: lo comunichi tramite un canale verificato.",
  emailVoyageur: "E-mail dell’ospite",
  emailAide: "Obbligatoria per un invio reale via e-mail; lasci vuoto per un invio manuale.",
  telephoneVoyageur: "Telefono dell’ospite",
  telephoneAide: "Usato solo per il canale SMS.", contenu: "Contenuto",
  contenuPlaceholder: "Salve, il suo soggiorno si avvicina. L’arrivo è possibile dalle 15.",
  preparer: "Prepara il messaggio",
  messagesDe: (nom, n) => `Messaggi di ${nom} (${n})`,
  aucunMessage: "Nessun messaggio preparato per questo alloggio.",
  envoyeStatut: "Inviato", brouillon: "Bozza",
  envoyerSms: "Invia via SMS", marquerEnvoye: "Segna inviato",
  envoyerEmail: "Invia via e-mail", journalAudit: "Registro di audit",
  tableauBord: "Dashboard", avisTitrePage: "Recensioni ospiti — Area professionale",
  avisEspace: "Area professionale", avisTitre: "Recensioni ospiti",
  avisResume: (total, publies, moyenne) =>
    `${total} recensioni · ${publies} pubblicat${publies === 1 ? "a" : "e"}${moyenne !== null ? ` · media ${moyenne}/5` : ""}`,
  avisMaj: "Recensione aggiornata.", avisIntrouvable: "Recensione non trovata.",
  aucunAvis: "Nessuna recensione per ora. Gli ospiti possono lasciarla dal loro spazio soggiorno.",
  noteSur: (note) => `Voto ${note} su 5`, publie: "Pubblicata", masque: "Nascosta",
  masquer: "Nascondi", publier: "Pubblica",
  statuts: { publie: "Pubblicata", masque: "Nascosta" },
};

const DE: TraductionsVoyageurs = {
  messagesTitrePage: "Gästemitteilungen — LCD Parc", messagesSurtitre: "Profibereich · Gäste",
  messagesTitre: "Gästemitteilungen",
  messagesDescription: "Nachrichten zu Anreise-1, Ankunft und Abreise — niemals mit Zugangscode.",
  retourTableau: "Zurück zum Dashboard",
  creerLogementDAbord: "Erstellen Sie zuerst eine Unterkunft, um eine Mitteilung vorzubereiten.",
  creerLogement: "Unterkunft erstellen", choisirLogement: "Unterkunft wählen",
  prepare: "Mitteilung vorbereitet.", envoye: "Mitteilung gesendet.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  brouillons: "Entwürfe", envoyes: "Gesendet", logement: "Unterkunft",
  preparerTitre: "Mitteilung vorbereiten", canal: "Kanal", type: "Typ",
  codeAvert: "Der Zugangscode ist nie enthalten: Teilen Sie ihn über einen verifizierten Kanal.",
  emailVoyageur: "E-Mail des Gastes",
  emailAide: "Erforderlich für einen echten E-Mail-Versand; leer lassen für manuellen Versand.",
  telephoneVoyageur: "Telefon des Gastes",
  telephoneAide: "Nur für den SMS-Kanal verwendet.", contenu: "Inhalt",
  contenuPlaceholder: "Hallo, Ihr Aufenthalt naht. Die Ankunft ist ab 15 Uhr möglich.",
  preparer: "Mitteilung vorbereiten",
  messagesDe: (nom, n) => `Mitteilungen von ${nom} (${n})`,
  aucunMessage: "Keine Mitteilung für diese Unterkunft vorbereitet.",
  envoyeStatut: "Gesendet", brouillon: "Entwurf",
  envoyerSms: "Per SMS senden", marquerEnvoye: "Als gesendet markieren",
  envoyerEmail: "Per E-Mail senden", journalAudit: "Auditprotokoll",
  tableauBord: "Dashboard", avisTitrePage: "Gästebewertungen — Profibereich",
  avisEspace: "Profibereich", avisTitre: "Gästebewertungen",
  avisResume: (total, publies, moyenne) =>
    `${total} Bewertungen · ${publies} veröffentlicht${moyenne !== null ? ` · Durchschnitt ${moyenne}/5` : ""}`,
  avisMaj: "Bewertung aktualisiert.", avisIntrouvable: "Bewertung nicht gefunden.",
  aucunAvis: "Noch keine Bewertungen. Gäste können sie in ihrem Aufenthaltsbereich abgeben.",
  noteSur: (note) => `Bewertung ${note} von 5`, publie: "Veröffentlicht", masque: "Ausgeblendet",
  masquer: "Ausblenden", publier: "Veröffentlichen",
  statuts: { publie: "Veröffentlicht", masque: "Ausgeblendet" },
};

const DICTIONNAIRES: Record<Langue, TraductionsVoyageurs> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsVoyageurs(langue: string): TraductionsVoyageurs {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
