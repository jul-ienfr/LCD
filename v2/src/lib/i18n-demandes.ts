import type { LanguePublique } from "@/domain/page-publique";

export interface TraductionsDemandes {
  titrePage: string;
  titre: string;
  description: string;
  filtreTous: string;
  statuts: Record<"nouvelle" | "qualifiee" | "convertie" | "refusee", string>;
  colonneDemande: string;
  colonneSejour: string;
  colonneStatut: string;
  colonneSource: string;
  colonneMessage: string;
  colonneAction: string;
  voyageurs: string;
  motifRefus: string;
  motifPlaceholder: string;
  qualifier: string;
  refuser: string;
  convertir: string;
  logementChoisi: string;
  reservation: string;
  okQualifiee: string;
  okRefusee: string;
  okConvertie: (reference: string) => string;
  erreur: string;
  vide: string;
}

const TRADUCTIONS: Record<LanguePublique, TraductionsDemandes> = {
  fr: {
    titrePage: "Demandes de séjour — LCD",
    titre: "Demandes de séjour",
    description:
      "Demandes reçues depuis le site public : qualifiez-les, puis convertissez-les en réservation sans ressaisie.",
    filtreTous: "Toutes",
    statuts: {
      nouvelle: "Nouvelle",
      qualifiee: "Qualifiée",
      convertie: "Convertie",
      refusee: "Refusée",
    },
    colonneDemande: "Demande",
    colonneSejour: "Séjour",
    colonneStatut: "Statut",
    colonneSource: "Source",
    colonneMessage: "Message",
    colonneAction: "Action",
    voyageurs: "voyageurs",
    motifRefus: "Motif du refus",
    motifPlaceholder: "Dates déjà prises",
    qualifier: "Qualifier",
    refuser: "Refuser",
    convertir: "Convertir",
    logementChoisi: "Logement",
    reservation: "Réservation",
    okQualifiee: "Demande qualifiée.",
    okRefusee: "Demande refusée.",
    okConvertie: (reference) => `Réservation créée : ${reference}.`,
    erreur: "Action impossible : demandez plus de détails.",
    vide: "Aucune demande pour ce filtre.",
  },
  en: {
    titrePage: "Booking requests — LCD",
    titre: "Booking requests",
    description:
      "Requests received from the public site: qualify them, then convert them into a booking without retyping.",
    filtreTous: "All",
    statuts: {
      nouvelle: "New",
      qualifiee: "Qualified",
      convertie: "Converted",
      refusee: "Declined",
    },
    colonneDemande: "Request",
    colonneSejour: "Stay",
    colonneStatut: "Status",
    colonneSource: "Source",
    colonneMessage: "Message",
    colonneAction: "Action",
    voyageurs: "guests",
    motifRefus: "Reason for declining",
    motifPlaceholder: "Dates already taken",
    qualifier: "Qualify",
    refuser: "Decline",
    convertir: "Convert",
    logementChoisi: "Property",
    reservation: "Booking",
    okQualifiee: "Request qualified.",
    okRefusee: "Request declined.",
    okConvertie: (reference) => `Booking created: ${reference}.`,
    erreur: "Action failed: ask for more details.",
    vide: "No request for this filter.",
  },
  es: {
    titrePage: "Solicitudes de estancia — LCD",
    titre: "Solicitudes de estancia",
    description:
      "Solicitudes recibidas del sitio público: califíquelas y conviértalas en reserva sin volver a teclear.",
    filtreTous: "Todas",
    statuts: {
      nouvelle: "Nueva",
      qualifiee: "Cualificada",
      convertie: "Convertida",
      refusee: "Rechazada",
    },
    colonneDemande: "Solicitud",
    colonneSejour: "Estancia",
    colonneStatut: "Estado",
    colonneSource: "Origen",
    colonneMessage: "Mensaje",
    colonneAction: "Acción",
    voyageurs: "huéspedes",
    motifRefus: "Motivo del rechazo",
    motifPlaceholder: "Fechas ya ocupadas",
    qualifier: "Cualificar",
    refuser: "Rechazar",
    convertir: "Convertir",
    logementChoisi: "Alojamiento",
    reservation: "Reserva",
    okQualifiee: "Solicitud cualificada.",
    okRefusee: "Solicitud rechazada.",
    okConvertie: (reference) => `Reserva creada: ${reference}.`,
    erreur: "Acción imposible: pida más detalles.",
    vide: "Ninguna solicitud para este filtro.",
  },
  it: {
    titrePage: "Richieste di soggiorno — LCD",
    titre: "Richieste di soggiorno",
    description:
      "Richieste ricevute dal sito pubblico: qualificale, poi convertile in prenotazione senza reinserire i dati.",
    filtreTous: "Tutte",
    statuts: {
      nouvelle: "Nuova",
      qualifiee: "Qualificata",
      convertie: "Convertita",
      refusee: "Rifiutata",
    },
    colonneDemande: "Richiesta",
    colonneSejour: "Soggiorno",
    colonneStatut: "Stato",
    colonneSource: "Origine",
    colonneMessage: "Messaggio",
    colonneAction: "Azione",
    voyageurs: "ospiti",
    motifRefus: "Motivo del rifiuto",
    motifPlaceholder: "Date già occupate",
    qualifier: "Qualifica",
    refuser: "Rifiuta",
    convertir: "Converti",
    logementChoisi: "Alloggio",
    reservation: "Prenotazione",
    okQualifiee: "Richiesta qualificata.",
    okRefusee: "Richiesta rifiutata.",
    okConvertie: (reference) => `Prenotazione creata: ${reference}.`,
    erreur: "Azione impossibile: chiedi più dettagli.",
    vide: "Nessuna richiesta per questo filtro.",
  },
  de: {
    titrePage: "Aufenthaltsanfragen — LCD",
    titre: "Aufenthaltsanfragen",
    description:
      "Anfragen von der öffentlichen Website: qualifizieren und ohne Neueingabe in eine Buchung umwandeln.",
    filtreTous: "Alle",
    statuts: {
      nouvelle: "Neu",
      qualifiee: "Qualifiziert",
      convertie: "Umgewandelt",
      refusee: "Abgelehnt",
    },
    colonneDemande: "Anfrage",
    colonneSejour: "Aufenthalt",
    colonneStatut: "Status",
    colonneSource: "Quelle",
    colonneMessage: "Nachricht",
    colonneAction: "Aktion",
    voyageurs: "Gäste",
    motifRefus: "Ablehnungsgrund",
    motifPlaceholder: "Termine bereits belegt",
    qualifier: "Qualifizieren",
    refuser: "Ablehnen",
    convertir: "Umwandeln",
    logementChoisi: "Unterkunft",
    reservation: "Buchung",
    okQualifiee: "Anfrage qualifiziert.",
    okRefusee: "Anfrage abgelehnt.",
    okConvertie: (reference) => `Buchung erstellt: ${reference}.`,
    erreur: "Aktion nicht möglich: Details anfordern.",
    vide: "Keine Anfrage für diesen Filter.",
  },
  nl: {
    titrePage: "Verblijfsaanvragen — LCD",
    titre: "Verblijfsaanvragen",
    description:
      "Aanvragen van de publieke site: kwalificeer ze en zet ze om in een boeking zonder opnieuw in te voeren.",
    filtreTous: "Alle",
    statuts: {
      nouvelle: "Nieuw",
      qualifiee: "Gekwalificeerd",
      convertie: "Omgezet",
      refusee: "Geweigerd",
    },
    colonneDemande: "Aanvraag",
    colonneSejour: "Verblijf",
    colonneStatut: "Status",
    colonneSource: "Bron",
    colonneMessage: "Bericht",
    colonneAction: "Actie",
    voyageurs: "gasten",
    motifRefus: "Reden van weigering",
    motifPlaceholder: "Data al bezet",
    qualifier: "Kwalificeren",
    refuser: "Weigeren",
    convertir: "Omzetten",
    logementChoisi: "Woning",
    reservation: "Boeking",
    okQualifiee: "Aanvraag gekwalificeerd.",
    okRefusee: "Aanvraag geweigerd.",
    okConvertie: (reference) => `Boeking aangemaakt: ${reference}.`,
    erreur: "Actie niet mogelijk: vraag meer details.",
    vide: "Geen aanvraag voor dit filter.",
  },
};

export function traductionsDemandes(langue: string): TraductionsDemandes {
  return TRADUCTIONS[langue as LanguePublique] ?? TRADUCTIONS.fr;
}
