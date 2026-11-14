import { LANGUES, type Langue } from "@/lib/i18n";

/**
 * Textes du tunnel de réservation directe (`/reserver`) et de la page de suivi
 * (`/reserver/[ref]`). Cinq langues, mêmes clés partout : le repli est le
 * français pour toute langue absente ou inconnue.
 *
 * Aucun montant, aucun délai chiffré et aucune promesse commerciale ne sont
 * écrits ici : le prix, la taxe de séjour et les dates viennent du serveur.
 */
export interface TraductionsReservation {
  /** Repères de navigation et d'orientation. */
  filAriane: string;
  arianeAccueil: string;
  arianeReserver: string;
  surtitre: string;
  titre: string;
  intro: string;
  etapesNom: string;
  etape1: string;
  etape2: string;
  titreEtape1: string;
  titreEtape2: string;
  aideEtape1: string;
  aideEtape2: string;
  suiteTitre: string;
  suite1: string;
  suite2: string;
  suite3: string;
  /** Liste des logements. */
  nosLogements: string;
  aucunLogement: string;
  voirDisponibilites: string;
  changerLogement: string;
  avisTitre: string;
  avisSuffixe: string;
  /** Dates et validation. */
  arrivee: string;
  depart: string;
  voyageurs: string;
  calculerPrix: string;
  aideDates: string;
  erreurArriveePasse: string;
  erreurDepartAvantArrivee: string;
  erreurArriveeLointaine: string;
  erreurDatesInvalides: string;
  erreurSejourTropLong: string;
  erreurTarifManquant: string;
  /** Prix, inclusions, taxe et délai. */
  estimation: string;
  nuit: string;
  nuits: string;
  estime: string;
  resumeTitre: string;
  resumeLogement: string;
  resumeDates: string;
  resumeVoyageurs: string;
  dateDu: string;
  dateAu: string;
  modifierDates: string;
  detailNuits: string;
  notePrixNuit: string;
  taxeDueAvant: string;
  taxeDueApres: string;
  taxeNonApplicable: string;
  inclusTitre: string;
  inclusionNuitees: string;
  inclusionSansPaiement: string;
  inclusionSansEngagement: string;
  inclusionConfirmation: string;
  nonInclusTitre: string;
  nonInclusExtras: string;
  delaiTitre: string;
  delaiTexte: string;
  /** Formulaire de demande. */
  nomComplet: string;
  email: string;
  envoyerDemande: string;
  aucunPaiement: string;
  erreursTitre: string;
  erreurNom: string;
  erreurEmail: string;
  erreurGenerique: string;
  erreurLogement: string;
  erreurDatesRefusees: string;
  erreurSejour: string;
  erreurCutoff: string;
  erreurVoyageurs: string;
  reessayer: string;
  revenirDates: string;
  contacterHote: string;
  /** Confirmation. */
  demandeEnregistree: string;
  demandeEnregistreeTexte: string;
  ouvrirEspaceSejour: string;
  voirRecapitulatif: string;
  referenceTitre: string;
  referenceAide: string;
  prochaineEtapeTitre: string;
  prochaineEtapeTexte: string;
  contactTitre: string;
  contactTexte: string;
  /** Page de suivi. */
  echeancesTitre: string;
  payer: string;
  paiementOk: string;
  paiementAnnule: string;
  paiementIndisponible: string;
  introuvableTitre: string;
  introuvableTexte: string;
  titreSejour: string;
  sejourConfirme: string;
  totalSejour: string;
  echeanceDu: string;
  cautionNote: string;
  echeanceTypeAcompte: string;
  echeanceTypeSolde: string;
  echeanceTypeCaution: string;
  echeanceStatutAPayer: string;
  echeanceStatutPaye: string;
  echeanceStatutAnnule: string;
  echeanceStatutRembourse: string;
  indisponibleTitre: string;
  indisponibleTexte: string;
  retourAccueil: string;
  ventesSuspenduesTitre: string;
  ventesSuspenduesTexte: string;
  lienIncomplet: string;
  siteIndisponible: string;
  actionMobileNom: string;
}

const FR: TraductionsReservation = {
  filAriane: "Fil d’Ariane",
  arianeAccueil: "Accueil",
  arianeReserver: "Réserver",
  surtitre: "Réservation directe",
  titre: "Réservez votre séjour",
  intro:
    "Demande sans paiement en ligne : l’hôte vérifie les disponibilités, puis vous recevez les instructions d’arrivée.",
  etapesNom: "Étapes de la demande",
  etape1: "Dates et logement",
  etape2: "Coordonnées et demande",
  titreEtape1: "1. Vos dates et votre logement",
  titreEtape2: "2. Vos coordonnées",
  aideEtape1:
    "Choisissez un logement puis vos dates : le prix s’affiche avant toute saisie de coordonnées.",
  aideEtape2:
    "Vérifiez le récapitulatif, puis envoyez votre demande. Aucun paiement n’est demandé maintenant.",
  suiteTitre: "Ce qui se passe ensuite",
  suite1: "1. Votre demande part à l’hôte, sans engagement.",
  suite2: "2. L’hôte vérifie les disponibilités et vous répond par e-mail.",
  suite3:
    "3. Après accord, vous recevez le lien de votre espace séjour et les instructions d’arrivée.",
  nosLogements: "Nos logements",
  aucunLogement:
    "Aucun logement n’est ouvert à la réservation pour le moment.",
  voirDisponibilites: "Voir les disponibilités",
  changerLogement: "Changer de logement",
  avisTitre: "Avis voyageurs",
  avisSuffixe: "avis",
  arrivee: "Arrivée",
  depart: "Départ",
  voyageurs: "Voyageurs",
  calculerPrix: "Calculer le prix",
  aideDates:
    "Un séjour direct est limité à 60 nuits et à 18 mois à l’avance.",
  erreurArriveePasse: "Choisissez une date d’arrivée à partir d’aujourd’hui.",
  erreurDepartAvantArrivee:
    "La date de départ doit être postérieure à la date d’arrivée.",
  erreurArriveeLointaine:
    "Les demandes sont ouvertes sur les 18 prochains mois : choisissez une date plus proche.",
  erreurDatesInvalides:
    "Vérifiez les deux dates : elles doivent être valides et cohérentes.",
  erreurSejourTropLong:
    "Un séjour direct est limité à 60 nuits : raccourcissez le séjour ou contactez l’hôte.",
  erreurTarifManquant:
    "Les tarifs ne sont pas encore ouverts sur cette période : choisissez d’autres dates ou consultez l’aide.",
  estimation: "Votre estimation",
  nuit: "nuit",
  nuits: "nuits",
  estime: "estimés",
  resumeTitre: "Votre demande",
  resumeLogement: "Logement",
  resumeDates: "Dates",
  resumeVoyageurs: "Voyageurs",
  dateDu: "Du",
  dateAu: "au",
  modifierDates: "Modifier les dates",
  detailNuits: "Détail des nuits",
  notePrixNuit: "Prix moyen par nuit ; le détail figure ci-dessus.",
  taxeDueAvant: "Taxe de séjour estimée :",
  taxeDueApres:
    "à régler à l’hôte ; elle n’est pas comprise dans le total.",
  taxeNonApplicable:
    "Aucune taxe de séjour n’est paramétrée pour ce logement : elle n’est pas comptée ici.",
  inclusTitre: "Inclus dans votre demande",
  inclusionNuitees: "Nuitées aux tarifs affichés ci-dessus.",
  inclusionSansPaiement:
    "Aucun paiement en ligne n’est demandé à l’envoi de la demande.",
  inclusionSansEngagement:
    "La demande n’engage rien tant que l’hôte n’a pas confirmé.",
  inclusionConfirmation:
    "Confirmation et instructions d’arrivée envoyées par e-mail.",
  nonInclusTitre: "Non compris",
  nonInclusExtras:
    "Prestations facultatives et extras éventuels : précisés sur la facture.",
  delaiTitre: "Délai de réponse",
  delaiTexte:
    "L’hôte vérifie les disponibilités puis répond à l’adresse indiquée. Vous pouvez annuler votre demande tant qu’elle n’est pas confirmée.",
  nomComplet: "Nom complet",
  email: "E-mail",
  envoyerDemande: "Envoyer la demande",
  aucunPaiement:
    "Aucun paiement n’est demandé maintenant : la demande devient une réservation après confirmation de l’hôte.",
  erreursTitre: "À corriger avant d’envoyer",
  erreurNom: "Indiquez votre nom complet (2 caractères minimum).",
  erreurEmail:
    "Indiquez une adresse e-mail valide, par exemple nom@domaine.fr.",
  erreurGenerique: "La demande n’a pas pu être envoyée.",
  erreurLogement:
    "Ce logement n’est plus ouvert à la réservation : choisissez-en un autre.",
  erreurDatesRefusees:
    "Ces dates ne sont pas disponibles pour ce logement : choisissez d’autres dates.",
  erreurSejour:
    "Ce séjour ne respecte pas les règles de l’hôte : choisissez d’autres dates.",
  erreurCutoff:
    "L’hôte demande un délai minimum avant l’arrivée : choisissez une date plus tardive.",
  erreurVoyageurs: "Indiquez un nombre de voyageurs entre 1 et 20.",
  reessayer: "Réessayer",
  revenirDates: "Revenir aux dates",
  contacterHote: "Consulter l’aide",
  demandeEnregistree: "Demande enregistrée",
  demandeEnregistreeTexte:
    "Un e-mail de confirmation vous sera envoyé après validation par l’hôte.",
  ouvrirEspaceSejour: "Ouvrir mon espace séjour",
  voirRecapitulatif: "Voir le récapitulatif de ma demande",
  referenceTitre: "Référence de votre demande",
  referenceAide:
    "Conservez cette référence : elle identifie votre demande. Sélectionnez-la pour la copier.",
  prochaineEtapeTitre: "Prochaine étape",
  prochaineEtapeTexte:
    "L’hôte vérifie les disponibilités et vous répond par e-mail à l’adresse indiquée.",
  contactTitre: "Une question ?",
  contactTexte:
    "Répondez à l’e-mail de confirmation ou consultez l’aide : l’hôte suit votre demande jusqu’à l’arrivée.",
  echeancesTitre: "Échéances",
  payer: "Payer",
  paiementOk: "Paiement confirmé. Merci !",
  paiementAnnule: "Paiement annulé : vous pouvez réessayer.",
  paiementIndisponible:
    "Paiement en ligne bientôt disponible sur ce séjour : l’hôte vous indique comment régler.",
  introuvableTitre: "Réservation introuvable",
  introuvableTexte:
    "Cette réservation est introuvable. Vérifiez le lien reçu ou consultez l’aide.",
  titreSejour: "Votre séjour",
  sejourConfirme:
    "Votre séjour est confirmé : les instructions d’arrivée vous sont envoyées par e-mail.",
  totalSejour: "Total du séjour",
  echeanceDu: "Échéance du",
  cautionNote:
    "Une empreinte de caution n’est débitée qu’en cas de dommage constaté.",
  echeanceTypeAcompte: "Acompte",
  echeanceTypeSolde: "Solde",
  echeanceTypeCaution: "Caution",
  echeanceStatutAPayer: "À payer",
  echeanceStatutPaye: "Payé",
  echeanceStatutAnnule: "Annulé",
  echeanceStatutRembourse: "Remboursé",
  indisponibleTitre: "Réservation indisponible",
  indisponibleTexte:
    "Cet espace de réservation n’existe pas ou n’est pas ouvert.",
  retourAccueil: "Retour à l’accueil",
  ventesSuspenduesTitre: "Réservations temporairement suspendues",
  ventesSuspenduesTexte:
    "L’hôte a mis les ventes en pause : aucune demande ne peut être enregistrée pour le moment. Les séjours déjà confirmés restent valables.",
  lienIncomplet: "Lien incomplet : précisez le site dans l’adresse.",
  siteIndisponible: "Site indisponible.",
  actionMobileNom: "Actions de la demande",
};

const EN: TraductionsReservation = {
  filAriane: "Breadcrumb",
  arianeAccueil: "Home",
  arianeReserver: "Book",
  surtitre: "Direct booking",
  titre: "Book your stay",
  intro:
    "Request without online payment: the host checks availability, then you receive the arrival instructions.",
  etapesNom: "Request steps",
  etape1: "Dates and property",
  etape2: "Details and request",
  titreEtape1: "1. Your dates and property",
  titreEtape2: "2. Your details",
  aideEtape1:
    "Pick a property, then your dates: the price appears before you enter any personal details.",
  aideEtape2:
    "Check the summary, then send your request. No payment is required now.",
  suiteTitre: "What happens next",
  suite1: "1. Your request goes to the host, with no commitment.",
  suite2: "2. The host checks availability and replies by email.",
  suite3:
    "3. Once agreed, you receive the link to your stay area and the arrival instructions.",
  nosLogements: "Our properties",
  aucunLogement: "No property is open for booking at the moment.",
  voirDisponibilites: "See availability",
  changerLogement: "Change property",
  avisTitre: "Traveller reviews",
  avisSuffixe: "reviews",
  arrivee: "Arrival",
  depart: "Departure",
  voyageurs: "Travellers",
  calculerPrix: "Calculate the price",
  aideDates: "A direct stay is limited to 60 nights and 18 months ahead.",
  erreurArriveePasse: "Choose an arrival date from today onwards.",
  erreurDepartAvantArrivee:
    "The departure date must be later than the arrival date.",
  erreurArriveeLointaine:
    "Requests are open for the next 18 months: choose a closer date.",
  erreurDatesInvalides:
    "Check both dates: they must be valid and consistent.",
  erreurSejourTropLong:
    "A direct stay is limited to 60 nights: shorten the stay or contact the host.",
  erreurTarifManquant:
    "Rates are not open yet for this period: choose other dates or read the help page.",
  estimation: "Your estimate",
  nuit: "night",
  nuits: "nights",
  estime: "estimated",
  resumeTitre: "Your request",
  resumeLogement: "Property",
  resumeDates: "Dates",
  resumeVoyageurs: "Travellers",
  dateDu: "From",
  dateAu: "to",
  modifierDates: "Change the dates",
  detailNuits: "Nightly breakdown",
  notePrixNuit: "Average price per night; the breakdown is shown above.",
  taxeDueAvant: "Estimated tourist tax:",
  taxeDueApres: "payable to the host; it is not included in the total.",
  taxeNonApplicable:
    "No tourist tax is configured for this property: it is not counted here.",
  inclusTitre: "Included in your request",
  inclusionNuitees: "Nights at the rates shown above.",
  inclusionSansPaiement:
    "No online payment is required when you send the request.",
  inclusionSansEngagement:
    "The request commits you to nothing until the host confirms.",
  inclusionConfirmation:
    "Confirmation and arrival instructions sent by email.",
  nonInclusTitre: "Not included",
  nonInclusExtras:
    "Optional services and any extras: specified on the invoice.",
  delaiTitre: "Response time",
  delaiTexte:
    "The host checks availability then replies to the address you give. You may cancel your request as long as it is not confirmed.",
  nomComplet: "Full name",
  email: "Email",
  envoyerDemande: "Send the request",
  aucunPaiement:
    "No payment is required now: the request becomes a booking once the host confirms.",
  erreursTitre: "To fix before sending",
  erreurNom: "Enter your full name (at least 2 characters).",
  erreurEmail: "Enter a valid email address, for example name@domain.com.",
  erreurGenerique: "The request could not be sent.",
  erreurLogement:
    "This property is no longer open for booking: choose another one.",
  erreurDatesRefusees:
    "These dates are not available for this property: choose other dates.",
  erreurSejour:
    "This stay does not match the host’s rules: choose other dates.",
  erreurCutoff:
    "The host requires a minimum notice before arrival: choose a later date.",
  erreurVoyageurs: "Enter a number of travellers between 1 and 20.",
  reessayer: "Try again",
  revenirDates: "Back to the dates",
  contacterHote: "Read the help page",
  demandeEnregistree: "Request recorded",
  demandeEnregistreeTexte:
    "A confirmation email will be sent once the host validates your request.",
  ouvrirEspaceSejour: "Open my stay area",
  voirRecapitulatif: "See the summary of my request",
  referenceTitre: "Your request reference",
  referenceAide:
    "Keep this reference: it identifies your request. Select it to copy.",
  prochaineEtapeTitre: "Next step",
  prochaineEtapeTexte:
    "The host checks availability and replies by email to the address you gave.",
  contactTitre: "A question?",
  contactTexte:
    "Reply to the confirmation email or read the help page: the host follows your request until arrival.",
  echeancesTitre: "Due dates",
  payer: "Pay",
  paiementOk: "Payment confirmed. Thank you!",
  paiementAnnule: "Payment cancelled: you can try again.",
  paiementIndisponible: "Online payment is not open yet for this stay.",
  introuvableTitre: "Booking not found",
  introuvableTexte:
    "This booking cannot be found. Check the link you received or read the help page.",
  titreSejour: "Your stay",
  sejourConfirme:
    "Your stay is confirmed: arrival instructions are sent to you by e-mail.",
  totalSejour: "Total for the stay",
  echeanceDu: "Due on",
  cautionNote: "A security deposit hold is only charged if damage is found.",
  echeanceTypeAcompte: "Deposit",
  echeanceTypeSolde: "Balance",
  echeanceTypeCaution: "Security deposit",
  echeanceStatutAPayer: "To pay",
  echeanceStatutPaye: "Paid",
  echeanceStatutAnnule: "Cancelled",
  echeanceStatutRembourse: "Refunded",
  indisponibleTitre: "Booking unavailable",
  indisponibleTexte: "This booking area does not exist or is not open.",
  retourAccueil: "Back to home",
  ventesSuspenduesTitre: "Bookings temporarily on hold",
  ventesSuspenduesTexte:
    "The host has paused sales: no request can be recorded right now. Stays already confirmed remain valid.",
  lienIncomplet: "Incomplete link: add the site to the address.",
  siteIndisponible: "Site unavailable.",
  actionMobileNom: "Request actions",
};

const IT: TraductionsReservation = {
  filAriane: "Percorso",
  arianeAccueil: "Home",
  arianeReserver: "Prenota",
  surtitre: "Prenotazione diretta",
  titre: "Prenota il tuo soggiorno",
  intro:
    "Richiesta senza pagamento online: l’host verifica la disponibilità, poi ricevi le istruzioni per l’arrivo.",
  etapesNom: "Passi della richiesta",
  etape1: "Date e alloggio",
  etape2: "Dati e richiesta",
  titreEtape1: "1. Le tue date e il tuo alloggio",
  titreEtape2: "2. I tuoi dati",
  aideEtape1:
    "Scegli un alloggio, poi le date: il prezzo appare prima di inserire i dati personali.",
  aideEtape2:
    "Controlla il riepilogo, poi invia la richiesta. Ora non è richiesto alcun pagamento.",
  suiteTitre: "Cosa succede dopo",
  suite1: "1. La richiesta arriva all’host, senza impegno.",
  suite2: "2. L’host verifica la disponibilità e risponde via e-mail.",
  suite3:
    "3. Dopo l’accordo, ricevi il link alla tua area soggiorno e le istruzioni per l’arrivo.",
  nosLogements: "I nostri alloggi",
  aucunLogement: "Nessun alloggio è aperto alle prenotazioni al momento.",
  voirDisponibilites: "Vedi le disponibilità",
  changerLogement: "Cambia alloggio",
  avisTitre: "Recensioni dei viaggiatori",
  avisSuffixe: "recensioni",
  arrivee: "Arrivo",
  depart: "Partenza",
  voyageurs: "Viaggiatori",
  calculerPrix: "Calcola il prezzo",
  aideDates:
    "Un soggiorno diretto è limitato a 60 notti e a 18 mesi in anticipo.",
  erreurArriveePasse: "Scegli una data di arrivo a partire da oggi.",
  erreurDepartAvantArrivee:
    "La data di partenza deve essere successiva alla data di arrivo.",
  erreurArriveeLointaine:
    "Le richieste sono aperte per i prossimi 18 mesi: scegli una data più vicina.",
  erreurDatesInvalides:
    "Controlla le due date: devono essere valide e coerenti.",
  erreurSejourTropLong:
    "Un soggiorno diretto è limitato a 60 notti: accorcia il soggiorno o contatta l’host.",
  erreurTarifManquant:
    "Le tariffe non sono ancora aperte per questo periodo: scegli altre date o consulta la guida.",
  estimation: "La tua stima",
  nuit: "notte",
  nuits: "notti",
  estime: "stimati",
  resumeTitre: "La tua richiesta",
  resumeLogement: "Alloggio",
  resumeDates: "Date",
  resumeVoyageurs: "Viaggiatori",
  dateDu: "Dal",
  dateAu: "al",
  modifierDates: "Modifica le date",
  detailNuits: "Dettaglio delle notti",
  notePrixNuit: "Prezzo medio per notte; il dettaglio è qui sopra.",
  taxeDueAvant: "Tassa di soggiorno stimata:",
  taxeDueApres: "da pagare all’host; non è compresa nel totale.",
  taxeNonApplicable:
    "Nessuna tassa di soggiorno è configurata per questo alloggio: non è conteggiata qui.",
  inclusTitre: "Incluso nella tua richiesta",
  inclusionNuitees: "Notti alle tariffe indicate qui sopra.",
  inclusionSansPaiement:
    "Nessun pagamento online è richiesto quando invii la richiesta.",
  inclusionSansEngagement:
    "La richiesta non impegna nulla finché l’host non conferma.",
  inclusionConfirmation:
    "Conferma e istruzioni per l’arrivo inviate via e-mail.",
  nonInclusTitre: "Non compreso",
  nonInclusExtras:
    "Servizi facoltativi ed eventuali extra: indicati in fattura.",
  delaiTitre: "Tempo di risposta",
  delaiTexte:
    "L’host verifica la disponibilità e risponde all’indirizzo indicato. Puoi annullare la richiesta finché non è confermata.",
  nomComplet: "Nome e cognome",
  email: "E-mail",
  envoyerDemande: "Invia la richiesta",
  aucunPaiement:
    "Ora non è richiesto alcun pagamento: la richiesta diventa una prenotazione dopo la conferma dell’host.",
  erreursTitre: "Da correggere prima di inviare",
  erreurNom: "Indica nome e cognome (almeno 2 caratteri).",
  erreurEmail: "Indica un indirizzo e-mail valido, per esempio nome@dominio.it.",
  erreurGenerique: "La richiesta non è stata inviata.",
  erreurLogement:
    "Questo alloggio non è più aperto alle prenotazioni: scegline un altro.",
  erreurDatesRefusees:
    "Queste date non sono disponibili per questo alloggio: scegli altre date.",
  erreurSejour:
    "Questo soggiorno non rispetta le regole dell’host: scegli altre date.",
  erreurCutoff:
    "L’host richiede un preavviso minimo: scegli una data più tarda.",
  erreurVoyageurs: "Indica un numero di viaggiatori tra 1 e 20.",
  reessayer: "Riprova",
  revenirDates: "Torna alle date",
  contacterHote: "Consulta la guida",
  demandeEnregistree: "Richiesta registrata",
  demandeEnregistreeTexte:
    "Riceverai un’e-mail di conferma dopo la convalida dell’host.",
  ouvrirEspaceSejour: "Apri la mia area soggiorno",
  voirRecapitulatif: "Vedi il riepilogo della mia richiesta",
  referenceTitre: "Riferimento della tua richiesta",
  referenceAide:
    "Conserva questo riferimento: identifica la tua richiesta. Selezionalo per copiarlo.",
  prochaineEtapeTitre: "Prossimo passo",
  prochaineEtapeTexte:
    "L’host verifica la disponibilità e risponde via e-mail all’indirizzo indicato.",
  contactTitre: "Una domanda?",
  contactTexte:
    "Rispondi all’e-mail di conferma o consulta la guida: l’host segue la richiesta fino all’arrivo.",
  echeancesTitre: "Scadenze",
  payer: "Paga",
  paiementOk: "Pagamento confermato. Grazie!",
  paiementAnnule: "Pagamento annullato: puoi riprovare.",
  paiementIndisponible:
    "Il pagamento online non è ancora aperto per questo soggiorno.",
  introuvableTitre: "Prenotazione non trovata",
  introuvableTexte:
    "Questa prenotazione non è stata trovata. Controlla il link ricevuto o consulta l’aiuto.",
  titreSejour: "Il tuo soggiorno",
  sejourConfirme:
    "Il tuo soggiorno è confermato: le istruzioni per l’arrivo ti vengono inviate via e-mail.",
  totalSejour: "Totale del soggiorno",
  echeanceDu: "Scadenza del",
  cautionNote: "La cauzione viene addebitata solo in caso di danni accertati.",
  echeanceTypeAcompte: "Acconto",
  echeanceTypeSolde: "Saldo",
  echeanceTypeCaution: "Cauzione",
  echeanceStatutAPayer: "Da pagare",
  echeanceStatutPaye: "Pagato",
  echeanceStatutAnnule: "Annullato",
  echeanceStatutRembourse: "Rimborsato",
  indisponibleTitre: "Prenotazione non disponibile",
  indisponibleTexte: "Questa area di prenotazione non esiste o non è aperta.",
  retourAccueil: "Torna alla home",
  ventesSuspenduesTitre: "Prenotazioni temporaneamente sospese",
  ventesSuspenduesTexte:
    "L’host ha sospeso le vendite: al momento nessuna richiesta può essere registrata. I soggiorni già confermati restano validi.",
  lienIncomplet: "Link incompleto: indica il sito nell’indirizzo.",
  siteIndisponible: "Sito non disponibile.",
  actionMobileNom: "Azioni della richiesta",
};

const ES: TraductionsReservation = {
  filAriane: "Ruta de navegación",
  arianeAccueil: "Inicio",
  arianeReserver: "Reservar",
  surtitre: "Reserva directa",
  titre: "Reserva tu estancia",
  intro:
    "Solicitud sin pago en línea: el anfitrión comprueba la disponibilidad y después recibes las instrucciones de llegada.",
  etapesNom: "Pasos de la solicitud",
  etape1: "Fechas y alojamiento",
  etape2: "Datos y solicitud",
  titreEtape1: "1. Tus fechas y tu alojamiento",
  titreEtape2: "2. Tus datos",
  aideEtape1:
    "Elige un alojamiento y luego las fechas: el precio aparece antes de escribir tus datos.",
  aideEtape2:
    "Revisa el resumen y envía tu solicitud. Ahora no se pide ningún pago.",
  suiteTitre: "Qué ocurre después",
  suite1: "1. Tu solicitud llega al anfitrión, sin compromiso.",
  suite2: "2. El anfitrión comprueba la disponibilidad y responde por correo.",
  suite3:
    "3. Cuando acepte, recibes el enlace a tu espacio de estancia y las instrucciones de llegada.",
  nosLogements: "Nuestros alojamientos",
  aucunLogement: "Ahora mismo no hay ningún alojamiento abierto a reservas.",
  voirDisponibilites: "Ver disponibilidad",
  changerLogement: "Cambiar de alojamiento",
  avisTitre: "Opiniones de viajeros",
  avisSuffixe: "opiniones",
  arrivee: "Llegada",
  depart: "Salida",
  voyageurs: "Viajeros",
  calculerPrix: "Calcular el precio",
  aideDates: "Una estancia directa se limita a 60 noches y 18 meses de antelación.",
  erreurArriveePasse: "Elige una fecha de llegada a partir de hoy.",
  erreurDepartAvantArrivee:
    "La fecha de salida debe ser posterior a la fecha de llegada.",
  erreurArriveeLointaine:
    "Las solicitudes están abiertas para los próximos 18 meses: elige una fecha más cercana.",
  erreurDatesInvalides: "Revisa las dos fechas: deben ser válidas y coherentes.",
  erreurSejourTropLong:
    "Una estancia directa se limita a 60 noches: acorta la estancia o contacta con el anfitrión.",
  erreurTarifManquant:
    "Las tarifas aún no están abiertas para este periodo: elige otras fechas o consulta la ayuda.",
  estimation: "Tu estimación",
  nuit: "noche",
  nuits: "noches",
  estime: "estimados",
  resumeTitre: "Tu solicitud",
  resumeLogement: "Alojamiento",
  resumeDates: "Fechas",
  resumeVoyageurs: "Viajeros",
  dateDu: "Del",
  dateAu: "al",
  modifierDates: "Cambiar las fechas",
  detailNuits: "Detalle de las noches",
  notePrixNuit: "Precio medio por noche; el detalle aparece arriba.",
  taxeDueAvant: "Tasa turística estimada:",
  taxeDueApres: "a pagar al anfitrión; no está incluida en el total.",
  taxeNonApplicable:
    "No hay tasa turística configurada para este alojamiento: no se cuenta aquí.",
  inclusTitre: "Incluido en tu solicitud",
  inclusionNuitees: "Noches con las tarifas indicadas arriba.",
  inclusionSansPaiement:
    "No se pide ningún pago en línea al enviar la solicitud.",
  inclusionSansEngagement:
    "La solicitud no compromete nada hasta que el anfitrión confirme.",
  inclusionConfirmation:
    "Confirmación e instrucciones de llegada enviadas por correo.",
  nonInclusTitre: "No incluido",
  nonInclusExtras:
    "Servicios opcionales y posibles extras: se detallan en la factura.",
  delaiTitre: "Plazo de respuesta",
  delaiTexte:
    "El anfitrión comprueba la disponibilidad y responde a la dirección indicada. Puedes anular tu solicitud mientras no esté confirmada.",
  nomComplet: "Nombre completo",
  email: "Correo electrónico",
  envoyerDemande: "Enviar la solicitud",
  aucunPaiement:
    "Ahora no se pide ningún pago: la solicitud se convierte en reserva cuando el anfitrión confirma.",
  erreursTitre: "Para corregir antes de enviar",
  erreurNom: "Indica tu nombre completo (2 caracteres como mínimo).",
  erreurEmail:
    "Indica una dirección de correo válida, por ejemplo nombre@dominio.es.",
  erreurGenerique: "No se ha podido enviar la solicitud.",
  erreurLogement:
    "Este alojamiento ya no está abierto a reservas: elige otro.",
  erreurDatesRefusees:
    "Estas fechas no están disponibles para este alojamiento: elige otras.",
  erreurSejour:
    "Esta estancia no respeta las normas del anfitrión: elige otras fechas.",
  erreurCutoff:
    "El anfitrión exige un preaviso mínimo: elige una fecha más tardía.",
  erreurVoyageurs: "Indica un número de viajeros entre 1 y 20.",
  reessayer: "Reintentar",
  revenirDates: "Volver a las fechas",
  contacterHote: "Consultar la ayuda",
  demandeEnregistree: "Solicitud registrada",
  demandeEnregistreeTexte:
    "Recibirás un correo de confirmación tras la validación del anfitrión.",
  ouvrirEspaceSejour: "Abrir mi espacio de estancia",
  voirRecapitulatif: "Ver el resumen de mi solicitud",
  referenceTitre: "Referencia de tu solicitud",
  referenceAide:
    "Guarda esta referencia: identifica tu solicitud. Selecciónala para copiarla.",
  prochaineEtapeTitre: "Siguiente paso",
  prochaineEtapeTexte:
    "El anfitrión comprueba la disponibilidad y responde por correo a la dirección indicada.",
  contactTitre: "¿Tienes alguna duda?",
  contactTexte:
    "Responde al correo de confirmación o consulta la ayuda: el anfitrión sigue tu solicitud hasta la llegada.",
  echeancesTitre: "Vencimientos",
  payer: "Pagar",
  paiementOk: "Pago confirmado. ¡Gracias!",
  paiementAnnule: "Pago cancelado: puedes intentarlo de nuevo.",
  paiementIndisponible:
    "El pago en línea aún no está abierto para esta estancia.",
  introuvableTitre: "Reserva no encontrada",
  introuvableTexte:
    "No se ha encontrado esta reserva. Comprueba el enlace recibido o consulta la ayuda.",
  titreSejour: "Tu estancia",
  sejourConfirme:
    "Tu estancia está confirmada: recibirás las instrucciones de llegada por correo electrónico.",
  totalSejour: "Total de la estancia",
  echeanceDu: "Vence el",
  cautionNote: "La fianza solo se cobra si se detectan daños.",
  echeanceTypeAcompte: "Anticipo",
  echeanceTypeSolde: "Saldo",
  echeanceTypeCaution: "Fianza",
  echeanceStatutAPayer: "Por pagar",
  echeanceStatutPaye: "Pagado",
  echeanceStatutAnnule: "Cancelado",
  echeanceStatutRembourse: "Reembolsado",
  indisponibleTitre: "Reserva no disponible",
  indisponibleTexte: "Este espacio de reserva no existe o no está abierto.",
  retourAccueil: "Volver al inicio",
  ventesSuspenduesTitre: "Reservas suspendidas temporalmente",
  ventesSuspenduesTexte:
    "El anfitrión ha pausado las ventas: ahora no se puede registrar ninguna solicitud. Las estancias ya confirmadas siguen vigentes.",
  lienIncomplet: "Enlace incompleto: indica el sitio en la dirección.",
  siteIndisponible: "Sitio no disponible.",
  actionMobileNom: "Acciones de la solicitud",
};

const DE: TraductionsReservation = {
  filAriane: "Brotkrumenpfad",
  arianeAccueil: "Startseite",
  arianeReserver: "Buchen",
  surtitre: "Direktbuchung",
  titre: "Buchen Sie Ihren Aufenthalt",
  intro:
    "Anfrage ohne Online-Zahlung: Der Gastgeber prüft die Verfügbarkeit, danach erhalten Sie die Anreisehinweise.",
  etapesNom: "Schritte der Anfrage",
  etape1: "Daten und Unterkunft",
  etape2: "Angaben und Anfrage",
  titreEtape1: "1. Ihre Daten und Ihre Unterkunft",
  titreEtape2: "2. Ihre Angaben",
  aideEtape1:
    "Wählen Sie eine Unterkunft und dann die Daten: Der Preis erscheint, bevor Sie persönliche Angaben eingeben.",
  aideEtape2:
    "Prüfen Sie die Zusammenfassung und senden Sie die Anfrage. Jetzt ist keine Zahlung nötig.",
  suiteTitre: "Wie es weitergeht",
  suite1: "1. Ihre Anfrage geht unverbindlich an den Gastgeber.",
  suite2: "2. Der Gastgeber prüft die Verfügbarkeit und antwortet per E-Mail.",
  suite3:
    "3. Nach der Zusage erhalten Sie den Link zu Ihrem Aufenthaltsbereich und die Anreisehinweise.",
  nosLogements: "Unsere Unterkünfte",
  aucunLogement: "Derzeit ist keine Unterkunft buchbar.",
  voirDisponibilites: "Verfügbarkeit ansehen",
  changerLogement: "Unterkunft wechseln",
  avisTitre: "Bewertungen von Reisenden",
  avisSuffixe: "Bewertungen",
  arrivee: "Anreise",
  depart: "Abreise",
  voyageurs: "Reisende",
  calculerPrix: "Preis berechnen",
  aideDates:
    "Ein direkter Aufenthalt ist auf 60 Nächte und 18 Monate im Voraus begrenzt.",
  erreurArriveePasse: "Wählen Sie ein Anreisedatum ab heute.",
  erreurDepartAvantArrivee:
    "Das Abreisedatum muss nach dem Anreisedatum liegen.",
  erreurArriveeLointaine:
    "Anfragen sind für die nächsten 18 Monate möglich: Wählen Sie ein näheres Datum.",
  erreurDatesInvalides:
    "Prüfen Sie beide Daten: Sie müssen gültig und stimmig sein.",
  erreurSejourTropLong:
    "Ein direkter Aufenthalt ist auf 60 Nächte begrenzt: Kürzen Sie den Aufenthalt oder kontaktieren Sie den Gastgeber.",
  erreurTarifManquant:
    "Für diesen Zeitraum sind noch keine Preise hinterlegt: Wählen Sie andere Daten oder lesen Sie die Hilfe.",
  estimation: "Ihre Schätzung",
  nuit: "Nacht",
  nuits: "Nächte",
  estime: "geschätzt",
  resumeTitre: "Ihre Anfrage",
  resumeLogement: "Unterkunft",
  resumeDates: "Daten",
  resumeVoyageurs: "Reisende",
  dateDu: "Vom",
  dateAu: "bis",
  modifierDates: "Daten ändern",
  detailNuits: "Aufschlüsselung der Nächte",
  notePrixNuit: "Durchschnittspreis pro Nacht; die Aufschlüsselung steht oben.",
  taxeDueAvant: "Geschätzte Kurtaxe:",
  taxeDueApres: "beim Gastgeber zu zahlen; nicht im Gesamtpreis enthalten.",
  taxeNonApplicable:
    "Für diese Unterkunft ist keine Kurtaxe hinterlegt: sie wird hier nicht berechnet.",
  inclusTitre: "In Ihrer Anfrage enthalten",
  inclusionNuitees: "Nächte zu den oben genannten Preisen.",
  inclusionSansPaiement:
    "Beim Senden der Anfrage ist keine Online-Zahlung nötig.",
  inclusionSansEngagement:
    "Die Anfrage ist unverbindlich, bis der Gastgeber bestätigt.",
  inclusionConfirmation:
    "Bestätigung und Anreisehinweise werden per E-Mail gesendet.",
  nonInclusTitre: "Nicht enthalten",
  nonInclusExtras:
    "Optionale Leistungen und mögliche Extras: auf der Rechnung ausgewiesen.",
  delaiTitre: "Antwortzeit",
  delaiTexte:
    "Der Gastgeber prüft die Verfügbarkeit und antwortet an die angegebene Adresse. Sie können Ihre Anfrage stornieren, solange sie nicht bestätigt ist.",
  nomComplet: "Vollständiger Name",
  email: "E-Mail",
  envoyerDemande: "Anfrage senden",
  aucunPaiement:
    "Jetzt ist keine Zahlung nötig: Die Anfrage wird zur Buchung, sobald der Gastgeber bestätigt.",
  erreursTitre: "Vor dem Senden zu korrigieren",
  erreurNom: "Geben Sie Ihren vollständigen Namen an (mindestens 2 Zeichen).",
  erreurEmail:
    "Geben Sie eine gültige E-Mail-Adresse an, zum Beispiel name@domain.de.",
  erreurGenerique: "Die Anfrage konnte nicht gesendet werden.",
  erreurLogement:
    "Diese Unterkunft ist nicht mehr buchbar: Wählen Sie eine andere.",
  erreurDatesRefusees:
    "Diese Daten sind für diese Unterkunft nicht verfügbar: Wählen Sie andere Daten.",
  erreurSejour:
    "Dieser Aufenthalt entspricht nicht den Regeln des Gastgebers: Wählen Sie andere Daten.",
  erreurCutoff:
    "Der Gastgeber verlangt eine Mindestvorlaufzeit: Wählen Sie ein späteres Datum.",
  erreurVoyageurs: "Geben Sie eine Anzahl Reisender zwischen 1 und 20 an.",
  reessayer: "Erneut versuchen",
  revenirDates: "Zurück zu den Daten",
  contacterHote: "Hilfe lesen",
  demandeEnregistree: "Anfrage erfasst",
  demandeEnregistreeTexte:
    "Nach der Prüfung durch den Gastgeber erhalten Sie eine Bestätigungs-E-Mail.",
  ouvrirEspaceSejour: "Meinen Aufenthaltsbereich öffnen",
  voirRecapitulatif: "Zusammenfassung meiner Anfrage ansehen",
  referenceTitre: "Referenz Ihrer Anfrage",
  referenceAide:
    "Bewahren Sie diese Referenz auf: Sie kennzeichnet Ihre Anfrage. Zum Kopieren markieren.",
  prochaineEtapeTitre: "Nächster Schritt",
  prochaineEtapeTexte:
    "Der Gastgeber prüft die Verfügbarkeit und antwortet per E-Mail an die angegebene Adresse.",
  contactTitre: "Eine Frage?",
  contactTexte:
    "Antworten Sie auf die Bestätigungs-E-Mail oder lesen Sie die Hilfe: Der Gastgeber begleitet Ihre Anfrage bis zur Anreise.",
  echeancesTitre: "Fälligkeiten",
  payer: "Bezahlen",
  paiementOk: "Zahlung bestätigt. Vielen Dank!",
  paiementAnnule: "Zahlung abgebrochen: Sie können es erneut versuchen.",
  paiementIndisponible:
    "Die Online-Zahlung ist für diesen Aufenthalt noch nicht geöffnet.",
  introuvableTitre: "Buchung nicht gefunden",
  introuvableTexte:
    "Diese Buchung wurde nicht gefunden. Prüfen Sie den erhaltenen Link oder die Hilfe.",
  titreSejour: "Ihr Aufenthalt",
  sejourConfirme:
    "Ihr Aufenthalt ist bestätigt: Die Anreiseinformationen erhalten Sie per E-Mail.",
  totalSejour: "Gesamtbetrag des Aufenthalts",
  echeanceDu: "Fällig am",
  cautionNote: "Eine Kaution wird nur bei festgestelltem Schaden belastet.",
  echeanceTypeAcompte: "Anzahlung",
  echeanceTypeSolde: "Restbetrag",
  echeanceTypeCaution: "Kaution",
  echeanceStatutAPayer: "Zu zahlen",
  echeanceStatutPaye: "Bezahlt",
  echeanceStatutAnnule: "Storniert",
  echeanceStatutRembourse: "Erstattet",
  indisponibleTitre: "Buchung nicht verfügbar",
  indisponibleTexte: "Dieser Buchungsbereich existiert nicht oder ist nicht geöffnet.",
  retourAccueil: "Zurück zur Startseite",
  ventesSuspenduesTitre: "Buchungen vorübergehend ausgesetzt",
  ventesSuspenduesTexte:
    "Der Gastgeber hat den Verkauf pausiert: Derzeit kann keine Anfrage erfasst werden. Bereits bestätigte Aufenthalte bleiben gültig.",
  lienIncomplet: "Unvollständiger Link: Bitte die Website in der Adresse angeben.",
  siteIndisponible: "Website nicht verfügbar.",
  actionMobileNom: "Aktionen der Anfrage",
};

/** Les cinq langues publiées, dans l'ordre de `LANGUES`. */
export const RESERVATION: Record<Langue, TraductionsReservation> = {
  fr: FR,
  en: EN,
  it: IT,
  es: ES,
  de: DE,
};

const CONNUES = new Set<string>(LANGUES);

/**
 * Traductions du tunnel de réservation pour une langue quelconque.
 * Toute valeur absente ou inconnue replie sur le français.
 */
export function traductionsReservation(
  langue: unknown,
): TraductionsReservation {
  return typeof langue === "string" && CONNUES.has(langue)
    ? RESERVATION[langue as Langue]
    : RESERVATION.fr;
}
