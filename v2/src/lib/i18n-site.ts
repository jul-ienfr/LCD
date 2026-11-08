import type { LanguePublique } from "@/domain/page-publique";

export interface TraductionsSite {
  accueil: string;
  logement: string;
  region: string;
  contact: string;
  mentionsLegales: string;
  reserver: string;
  trouver: string;
  demandeTitre: string;
  demandeIntro: string;
  demandeNom: string;
  demandeEmail: string;
  demandeTelephone: string;
  demandeArrivee: string;
  demandeDepart: string;
  demandeVoyageurs: string;
  demandeLogement: string;
  demandeMessage: string;
  demandeEnvoyer: string;
  demandeOk: string;
  demandeErreur: string;
}

const TRADUCTIONS: Record<LanguePublique, TraductionsSite> = {
  fr: {
    accueil: "Accueil",
    logement: "Le logement",
    region: "La région",
    contact: "Contact",
    mentionsLegales: "Mentions légales",
    reserver: "Réserver",
    trouver: "Nous trouver",
    demandeTitre: "Demander ce séjour",
    demandeIntro:
      "Indiquez vos dates : nous répondons sous 24 h. Aucun paiement à cette étape.",
    demandeNom: "Nom",
    demandeEmail: "Email",
    demandeTelephone: "Téléphone (facultatif)",
    demandeArrivee: "Arrivée",
    demandeDepart: "Départ",
    demandeVoyageurs: "Voyageurs",
    demandeLogement: "Logement souhaité",
    demandeMessage: "Votre message",
    demandeEnvoyer: "Envoyer la demande",
    demandeOk: "Demande envoyée. Nous revenons vers vous très vite.",
    demandeErreur: "Demande non enregistrée : corrigez les champs indiqués.",
  },
  en: {
    accueil: "Home",
    logement: "The property",
    region: "The area",
    contact: "Contact",
    mentionsLegales: "Legal notice",
    reserver: "Book now",
    trouver: "Find us",
    demandeTitre: "Ask about these dates",
    demandeIntro:
      "Send us your dates: we reply within 24 hours. No payment at this stage.",
    demandeNom: "Name",
    demandeEmail: "Email",
    demandeTelephone: "Phone (optional)",
    demandeArrivee: "Arrival",
    demandeDepart: "Departure",
    demandeVoyageurs: "Guests",
    demandeLogement: "Preferred property",
    demandeMessage: "Your message",
    demandeEnvoyer: "Send request",
    demandeOk: "Request sent. We will get back to you shortly.",
    demandeErreur: "Request not saved: please fix the highlighted fields.",
  },
  es: {
    accueil: "Inicio",
    logement: "El alojamiento",
    region: "La región",
    contact: "Contacto",
    mentionsLegales: "Aviso legal",
    reserver: "Reservar",
    trouver: "Cómo llegar",
    demandeTitre: "Consultar estas fechas",
    demandeIntro:
      "Envíenos sus fechas: respondemos en 24 h. Sin pago en este paso.",
    demandeNom: "Nombre",
    demandeEmail: "Correo electrónico",
    demandeTelephone: "Teléfono (opcional)",
    demandeArrivee: "Llegada",
    demandeDepart: "Salida",
    demandeVoyageurs: "Huéspedes",
    demandeLogement: "Alojamiento deseado",
    demandeMessage: "Su mensaje",
    demandeEnvoyer: "Enviar solicitud",
    demandeOk: "Solicitud enviada. Le responderemos muy pronto.",
    demandeErreur: "Solicitud no guardada: corrija los campos indicados.",
  },
  it: {
    accueil: "Home",
    logement: "L'alloggio",
    region: "La zona",
    contact: "Contatti",
    mentionsLegales: "Note legali",
    reserver: "Prenota",
    trouver: "Dove siamo",
    demandeTitre: "Chiedi per queste date",
    demandeIntro:
      "Indicaci le tue date: rispondiamo entro 24 ore. Nessun pagamento ora.",
    demandeNom: "Nome",
    demandeEmail: "Email",
    demandeTelephone: "Telefono (facoltativo)",
    demandeArrivee: "Arrivo",
    demandeDepart: "Partenza",
    demandeVoyageurs: "Ospiti",
    demandeLogement: "Alloggio desiderato",
    demandeMessage: "Il tuo messaggio",
    demandeEnvoyer: "Invia richiesta",
    demandeOk: "Richiesta inviata. Ti risponderemo al più presto.",
    demandeErreur: "Richiesta non salvata: correggi i campi indicati.",
  },
  de: {
    accueil: "Startseite",
    logement: "Die Unterkunft",
    region: "Die Region",
    contact: "Kontakt",
    mentionsLegales: "Impressum",
    reserver: "Jetzt buchen",
    trouver: "Anfahrt",
    demandeTitre: "Diese Termine anfragen",
    demandeIntro:
      "Nennen Sie uns Ihre Daten: Wir antworten innerhalb von 24 Stunden. Keine Zahlung in diesem Schritt.",
    demandeNom: "Name",
    demandeEmail: "E-Mail",
    demandeTelephone: "Telefon (optional)",
    demandeArrivee: "Anreise",
    demandeDepart: "Abreise",
    demandeVoyageurs: "Gäste",
    demandeLogement: "Gewünschte Unterkunft",
    demandeMessage: "Ihre Nachricht",
    demandeEnvoyer: "Anfrage senden",
    demandeOk: "Anfrage gesendet. Wir melden uns in Kürze.",
    demandeErreur: "Anfrage nicht gespeichert: bitte Felder korrigieren.",
  },
  nl: {
    accueil: "Home",
    logement: "De woning",
    region: "De omgeving",
    contact: "Contact",
    mentionsLegales: "Juridische informatie",
    reserver: "Boeken",
    trouver: "Route",
    demandeTitre: "Deze data aanvragen",
    demandeIntro:
      "Geef uw data door: wij antwoorden binnen 24 uur. Geen betaling in deze stap.",
    demandeNom: "Naam",
    demandeEmail: "E-mail",
    demandeTelephone: "Telefoon (optioneel)",
    demandeArrivee: "Aankomst",
    demandeDepart: "Vertrek",
    demandeVoyageurs: "Gasten",
    demandeLogement: "Gewenste woning",
    demandeMessage: "Uw bericht",
    demandeEnvoyer: "Aanvraag versturen",
    demandeOk: "Aanvraag verzonden. We nemen snel contact op.",
    demandeErreur: "Aanvraag niet opgeslagen: corrigeer de velden.",
  },
};

export function traductionsSite(langue: string): TraductionsSite {
  return TRADUCTIONS[langue as LanguePublique] ?? TRADUCTIONS.fr;
}
