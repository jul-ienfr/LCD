import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsRelation {
  qTitrePage: string;
  qSurtitre: string;
  qTitre: string;
  qDescription: string;
  creerDAbord: string;
  creerLogement: string;
  choisirLogement: string;
  reponses: string;
  moyenneGlobale: string;
  derniereReponse: string;
  moyennesCritere: string;
  reponsesTitre: string;
  aucunQuestionnaire: string;
  colDate: string;
  colMoyenne: string;
  colCommentaire: string;
  oTitrePage: string;
  oSurtitre: string;
  oTitre: string;
  oDescription: (jours: number) => string;
  retourTableau: string;
  oVide: string;
  oAucunObjet: string;
  enAttente: string;
  reclames: string;
  envoyes: string;
  pretsDon: string;
  declarer: string;
  descriptionChamp: string;
  descPlaceholder: string;
  lieu: string;
  lieuPlaceholder: string;
  trouveLe: string;
  voyageurOptionnel: string;
  contactOptionnel: string;
  enregistrerObjet: string;
  registreDe: (nom: string) => string;
  trouveLeLabel: (date: string) => string;
  fraisReclamation: string;
  envoyeLeLabel: (date: string) => string;
  modifierReclamation: string;
  reclamerObjet: string;
  nomVoyageur: string;
  contact: string;
  marquerReclame: (montant: string) => string;
  marquerEnvoye: string;
  donner: string;
  donDans: (jours: number) => string;
  phrases: string;
  tableauBord: string;
  erreurInattendue: string;
  okTrouve: string;
  okReclame: (montant: string) => string;
  okEnvoye: string;
  okDonne: string;
  statuts: Record<string, string>;
}

const FR: TraductionsRelation = {
  qTitrePage: "Questionnaires de séjour — Espace hôte",
  qSurtitre: "Espace hôte · Relation voyageur", qTitre: "Questionnaires de séjour",
  qDescription: "Satisfaction détaillée par critère, après le départ.",
  creerDAbord: "Créez d’abord un logement pour suivre les retours voyageurs.",
  creerLogement: "Créer un logement", choisirLogement: "Choisir un logement",
  reponses: "Réponses", moyenneGlobale: "Moyenne globale",
  derniereReponse: "Dernière réponse", moyennesCritere: "Moyennes par critère",
  reponsesTitre: "Réponses",
  aucunQuestionnaire: "Aucun questionnaire pour ce logement. Envoyez le lien voyageur après le séjour.",
  colDate: "Date", colMoyenne: "Moyenne", colCommentaire: "Commentaire",
  oTitrePage: "Objets trouvés — Espace hôte", oSurtitre: "Espace hôte · Relation voyageur",
  oTitre: "Objets trouvés",
  oDescription: (jours) => `Registre, réclamation et envoi des affaires oubliées, avec don après ${jours} jours.`,
  retourTableau: "Retour au tableau de bord",
  oVide: "Créez d’abord un logement pour tenir son registre d’objets trouvés.",
  oAucunObjet: "Aucun objet déclaré. Les objets trouvés apparaîtront ici avec leur suivi.",
  enAttente: "En attente", reclames: "Réclamés", envoyes: "Envoyés", pretsDon: "Prêts au don",
  declarer: "Déclarer un objet trouvé", descriptionChamp: "Description",
  descPlaceholder: "Chargeur USB blanc", lieu: "Lieu", lieuPlaceholder: "Salon",
  trouveLe: "Trouvé le", voyageurOptionnel: "Voyageur (optionnel)",
  contactOptionnel: "Contact (optionnel)", enregistrerObjet: "Enregistrer l’objet",
  registreDe: (nom) => `Registre de ${nom}`,
  trouveLeLabel: (date) => `Trouvé le ${date}`, fraisReclamation: "Frais de réclamation :",
  envoyeLeLabel: (date) => `Envoyé le ${date}`,
  modifierReclamation: "Modifier la réclamation", reclamerObjet: "Réclamer cet objet",
  nomVoyageur: "Nom du voyageur", contact: "Contact",
  marquerReclame: (montant) => `Marquer réclamé (${montant})`,
  marquerEnvoye: "Marquer envoyé", donner: "Donner / remettre au stock",
  donDans: (jours) => `Don possible dans ${jours} jour${jours > 1 ? "s" : ""}.`,
  phrases: "Phrases types", tableauBord: "Tableau de bord",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  okTrouve: "Objet enregistré.", okReclame: (montant) => `Objet réclamé : ${montant} de frais.`,
  okEnvoye: "Objet marqué envoyé.", okDonne: "Objet donné ou remis au stock.",
  statuts: { trouve: "trouvé", reclame: "réclamé", envoye: "envoyé", donne: "donné" },
};

const EN: TraductionsRelation = {
  qTitrePage: "Stay questionnaires — Staff area",
  qSurtitre: "Staff area · Guest relations", qTitre: "Stay questionnaires",
  qDescription: "Detailed satisfaction by criterion, after departure.",
  creerDAbord: "Create a property first to track guest feedback.",
  creerLogement: "Create a property", choisirLogement: "Choose a property",
  reponses: "Responses", moyenneGlobale: "Overall average",
  derniereReponse: "Latest response", moyennesCritere: "Averages by criterion",
  reponsesTitre: "Responses",
  aucunQuestionnaire: "No questionnaire for this property. Send the guest link after the stay.",
  colDate: "Date", colMoyenne: "Average", colCommentaire: "Comment",
  oTitrePage: "Lost property — Staff area", oSurtitre: "Staff area · Guest relations",
  oTitre: "Lost property",
  oDescription: (jours) => `Log, claim and return forgotten items, donated after ${jours} days.`,
  retourTableau: "Back to dashboard",
  oVide: "Create a property first to keep its lost-property log.",
  oAucunObjet: "No item reported. Lost property will appear here with its tracking.",
  enAttente: "Pending", reclames: "Claimed", envoyes: "Sent", pretsDon: "Ready to donate",
  declarer: "Report a found item", descriptionChamp: "Description",
  descPlaceholder: "White USB charger", lieu: "Location", lieuPlaceholder: "Living room",
  trouveLe: "Found on", voyageurOptionnel: "Guest (optional)",
  contactOptionnel: "Contact (optional)", enregistrerObjet: "Save item",
  registreDe: (nom) => `${nom} log`,
  trouveLeLabel: (date) => `Found on ${date}`, fraisReclamation: "Claim fee:",
  envoyeLeLabel: (date) => `Sent on ${date}`,
  modifierReclamation: "Edit claim", reclamerObjet: "Claim this item",
  nomVoyageur: "Guest name", contact: "Contact",
  marquerReclame: (montant) => `Mark claimed (${montant})`,
  marquerEnvoye: "Mark sent", donner: "Donate / return to stock",
  donDans: (jours) => `Donation possible in ${jours} day${jours > 1 ? "s" : ""}.`,
  phrases: "Templates", tableauBord: "Dashboard",
  erreurInattendue: "Unexpected error. Try again.",
  okTrouve: "Item saved.", okReclame: (montant) => `Item claimed: ${montant} fee.`,
  okEnvoye: "Item marked sent.", okDonne: "Item donated or returned to stock.",
  statuts: { trouve: "found", reclame: "claimed", envoye: "sent", donne: "donated" },
};

const ES: TraductionsRelation = {
  qTitrePage: "Cuestionarios de estancia — Área profesional",
  qSurtitre: "Área profesional · Relación con viajeros", qTitre: "Cuestionarios de estancia",
  qDescription: "Satisfacción detallada por criterio, tras la salida.",
  creerDAbord: "Cree primero un alojamiento para seguir los comentarios de los viajeros.",
  creerLogement: "Crear un alojamiento", choisirLogement: "Elegir un alojamiento",
  reponses: "Respuestas", moyenneGlobale: "Media global",
  derniereReponse: "Última respuesta", moyennesCritere: "Medias por criterio",
  reponsesTitre: "Respuestas",
  aucunQuestionnaire: "Ningún cuestionario para este alojamiento. Envíe el enlace al viajero tras la estancia.",
  colDate: "Fecha", colMoyenne: "Media", colCommentaire: "Comentario",
  oTitrePage: "Objetos perdidos — Área profesional", oSurtitre: "Área profesional · Relación con viajeros",
  oTitre: "Objetos perdidos",
  oDescription: (jours) => `Registro, reclamación y envío de objetos olvidados, con donación tras ${jours} días.`,
  retourTableau: "Volver al panel",
  oVide: "Cree primero un alojamiento para llevar su registro de objetos perdidos.",
  oAucunObjet: "Ningún objeto declarado. Los objetos perdidos aparecerán aquí con su seguimiento.",
  enAttente: "Pendientes", reclames: "Reclamados", envoyes: "Enviados", pretsDon: "Listos para donar",
  declarer: "Declarar un objeto encontrado", descriptionChamp: "Descripción",
  descPlaceholder: "Cargador USB blanco", lieu: "Lugar", lieuPlaceholder: "Salón",
  trouveLe: "Encontrado el", voyageurOptionnel: "Viajero (opcional)",
  contactOptionnel: "Contacto (opcional)", enregistrerObjet: "Guardar objeto",
  registreDe: (nom) => `Registro de ${nom}`,
  trouveLeLabel: (date) => `Encontrado el ${date}`, fraisReclamation: "Gastos de reclamación:",
  envoyeLeLabel: (date) => `Enviado el ${date}`,
  modifierReclamation: "Modificar la reclamación", reclamerObjet: "Reclamar este objeto",
  nomVoyageur: "Nombre del viajero", contact: "Contacto",
  marquerReclame: (montant) => `Marcar reclamado (${montant})`,
  marquerEnvoye: "Marcar enviado", donner: "Donar / devolver al almacén",
  donDans: (jours) => `Donación posible en ${jours} día${jours > 1 ? "s" : ""}.`,
  phrases: "Frases tipo", tableauBord: "Panel",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  okTrouve: "Objeto guardado.", okReclame: (montant) => `Objeto reclamado: ${montant} de gastos.`,
  okEnvoye: "Objeto marcado como enviado.", okDonne: "Objeto donado o devuelto al almacén.",
  statuts: { trouve: "encontrado", reclame: "reclamado", envoye: "enviado", donne: "donado" },
};

const IT: TraductionsRelation = {
  qTitrePage: "Questionari di soggiorno — Area professionale",
  qSurtitre: "Area professionale · Relazione ospiti", qTitre: "Questionari di soggiorno",
  qDescription: "Soddisfazione dettagliata per criterio, dopo la partenza.",
  creerDAbord: "Crei prima un alloggio per seguire i feedback degli ospiti.",
  creerLogement: "Crea un alloggio", choisirLogement: "Scegli un alloggio",
  reponses: "Risposte", moyenneGlobale: "Media globale",
  derniereReponse: "Ultima risposta", moyennesCritere: "Medie per criterio",
  reponsesTitre: "Risposte",
  aucunQuestionnaire: "Nessun questionario per questo alloggio. Invii il link all’ospite dopo il soggiorno.",
  colDate: "Data", colMoyenne: "Media", colCommentaire: "Commento",
  oTitrePage: "Oggetti smarriti — Area professionale", oSurtitre: "Area professionale · Relazione ospiti",
  oTitre: "Oggetti smarriti",
  oDescription: (jours) => `Registro, reclamo e spedizione degli oggetti dimenticati, con donazione dopo ${jours} giorni.`,
  retourTableau: "Torna alla dashboard",
  oVide: "Crei prima un alloggio per tenere il registro degli oggetti smarriti.",
  oAucunObjet: "Nessun oggetto dichiarato. Gli oggetti smarriti compariranno qui con il loro monitoraggio.",
  enAttente: "In attesa", reclames: "Reclamati", envoyes: "Inviati", pretsDon: "Pronti alla donazione",
  declarer: "Dichiara un oggetto trovato", descriptionChamp: "Descrizione",
  descPlaceholder: "Caricatore USB bianco", lieu: "Luogo", lieuPlaceholder: "Soggiorno",
  trouveLe: "Trovato il", voyageurOptionnel: "Ospite (facoltativo)",
  contactOptionnel: "Contatto (facoltativo)", enregistrerObjet: "Salva oggetto",
  registreDe: (nom) => `Registro di ${nom}`,
  trouveLeLabel: (date) => `Trovato il ${date}`, fraisReclamation: "Spese di reclamo:",
  envoyeLeLabel: (date) => `Inviato il ${date}`,
  modifierReclamation: "Modifica il reclamo", reclamerObjet: "Reclama questo oggetto",
  nomVoyageur: "Nome dell’ospite", contact: "Contatto",
  marquerReclame: (montant) => `Segna reclamato (${montant})`,
  marquerEnvoye: "Segna inviato", donner: "Dona / restituisci al magazzino",
  donDans: (jours) => `Donazione possibile tra ${jours} giorn${jours > 1 ? "i" : "o"}.`,
  phrases: "Frasi tipo", tableauBord: "Dashboard",
  erreurInattendue: "Errore imprevisto. Riprovi.",
  okTrouve: "Oggetto salvato.", okReclame: (montant) => `Oggetto reclamato: ${montant} di spese.`,
  okEnvoye: "Oggetto segnato come inviato.", okDonne: "Oggetto donato o restituito al magazzino.",
  statuts: { trouve: "trovato", reclame: "reclamato", envoye: "inviato", donne: "donato" },
};

const DE: TraductionsRelation = {
  qTitrePage: "Aufenthaltsfragebögen — Profibereich",
  qSurtitre: "Profibereich · Gästebeziehungen", qTitre: "Aufenthaltsfragebögen",
  qDescription: "Detaillierte Zufriedenheit nach Kriterien, nach der Abreise.",
  creerDAbord: "Erstellen Sie zuerst eine Unterkunft, um Gästefeedback zu verfolgen.",
  creerLogement: "Unterkunft erstellen", choisirLogement: "Unterkunft wählen",
  reponses: "Antworten", moyenneGlobale: "Gesamtdurchschnitt",
  derniereReponse: "Letzte Antwort", moyennesCritere: "Durchschnitte nach Kriterium",
  reponsesTitre: "Antworten",
  aucunQuestionnaire: "Kein Fragebogen für diese Unterkunft. Senden Sie den Gästelink nach dem Aufenthalt.",
  colDate: "Datum", colMoyenne: "Durchschnitt", colCommentaire: "Kommentar",
  oTitrePage: "Fundsachen — Profibereich", oSurtitre: "Profibereich · Gästebeziehungen",
  oTitre: "Fundsachen",
  oDescription: (jours) => `Register, Reklamation und Versand vergessener Gegenstände, Spende nach ${jours} Tagen.`,
  retourTableau: "Zurück zum Dashboard",
  oVide: "Erstellen Sie zuerst eine Unterkunft, um das Fundbuch zu führen.",
  oAucunObjet: "Kein Gegenstand gemeldet. Fundsachen erscheinen hier mit ihrer Nachverfolgung.",
  enAttente: "Ausstehend", reclames: "Reklamiert", envoyes: "Versendet", pretsDon: "Spendenbereit",
  declarer: "Gefundenen Gegenstand melden", descriptionChamp: "Beschreibung",
  descPlaceholder: "Weißes USB-Ladegerät", lieu: "Ort", lieuPlaceholder: "Wohnzimmer",
  trouveLe: "Gefunden am", voyageurOptionnel: "Gast (optional)",
  contactOptionnel: "Kontakt (optional)", enregistrerObjet: "Gegenstand speichern",
  registreDe: (nom) => `Fundbuch ${nom}`,
  trouveLeLabel: (date) => `Gefunden am ${date}`, fraisReclamation: "Reklamationsgebühr:",
  envoyeLeLabel: (date) => `Versendet am ${date}`,
  modifierReclamation: "Reklamation bearbeiten", reclamerObjet: "Diesen Gegenstand reklamieren",
  nomVoyageur: "Name des Gastes", contact: "Kontakt",
  marquerReclame: (montant) => `Als reklamiert markieren (${montant})`,
  marquerEnvoye: "Als versendet markieren", donner: "Spenden / ins Lager zurückgeben",
  donDans: (jours) => `Spende möglich in ${jours} Tag${jours > 1 ? "en" : ""}.`,
  phrases: "Textvorlagen", tableauBord: "Dashboard",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  okTrouve: "Gegenstand gespeichert.", okReclame: (montant) => `Gegenstand reklamiert: ${montant} Gebühr.`,
  okEnvoye: "Gegenstand als versendet markiert.", okDonne: "Gegenstand gespendet oder ins Lager zurückgegeben.",
  statuts: { trouve: "gefunden", reclame: "reklamiert", envoye: "versendet", donne: "gespendet" },
};

const DICTIONNAIRES: Record<Langue, TraductionsRelation> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsRelation(langue: string): TraductionsRelation {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
