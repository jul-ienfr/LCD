import type { Langue } from "@/lib/i18n";

/**
 * Dictionnaire de la page de maintenance globale (FR-017, spec 006).
 *
 * Contrat (même forme que les autres dictionnaires publics) :
 * - les cinq langues de `LANGUES` sont présentes avec exactement les mêmes
 *   clés et aucune valeur vide (`tests/ergonomie/i18n-maintenance.test.ts`) ;
 * - `traductionsMaintenance()` replie sur le français pour toute langue
 *   inconnue ;
 * - aucun JavaScript n'est requis : la page est rendue par le serveur, avec
 *   la langue de `?lang=` ou du cookie.
 */

export interface TraductionsMaintenance {
  /** Balise `title`. */
  metaTitre: string;
  metaDescription: string;
  /** Surtitre au-dessus du titre. */
  surtitre: string;
  /** Titre principal de la page. */
  titre: string;
  /** Texte par défaut quand l'exploitant n'a pas saisi de message. */
  texteDefaut: string;
  /** Consigne de patience. */
  consigne: string;
  /** Lien vers la page d'aide, seule navigation conservée. */
  lienAide: string;
}

export const MAINTENANCE: Record<Langue, TraductionsMaintenance> = {
  fr: {
    metaTitre: "Maintenance en cours",
    metaDescription:
      "Le site est momentanément suspendu pour une opération de maintenance.",
    surtitre: "Maintenance",
    titre: "Le site est momentanément suspendu.",
    texteDefaut:
      "Nous effectuons une opération de maintenance. Vos données et vos réservations sont en sécurité ; le site rouvre dès que l'opération est terminée.",
    consigne: "Merci de repasser dans quelques minutes.",
    lienAide: "Consulter l'aide",
  },
  en: {
    metaTitre: "Maintenance in progress",
    metaDescription:
      "The site is temporarily suspended for a maintenance operation.",
    surtitre: "Maintenance",
    titre: "The site is temporarily suspended.",
    texteDefaut:
      "We are carrying out a maintenance operation. Your data and bookings are safe; the site reopens as soon as the operation is complete.",
    consigne: "Please check back in a few minutes.",
    lienAide: "View the help page",
  },
  it: {
    metaTitre: "Manutenzione in corso",
    metaDescription:
      "Il sito è temporaneamente sospeso per un intervento di manutenzione.",
    surtitre: "Manutenzione",
    titre: "Il sito è temporaneamente sospeso.",
    texteDefaut:
      "Stiamo effettuando un intervento di manutenzione. I tuoi dati e le tue prenotazioni sono al sicuro; il sito riapre appena l'intervento è concluso.",
    consigne: "Riprova tra qualche minuto.",
    lienAide: "Consultare l'aiuto",
  },
  es: {
    metaTitre: "Mantenimiento en curso",
    metaDescription:
      "El sitio está temporalmente suspendido por una operación de mantenimiento.",
    surtitre: "Mantenimiento",
    titre: "El sitio está temporalmente suspendido.",
    texteDefaut:
      "Estamos realizando una operación de mantenimiento. Tus datos y reservas están a salvo; el sitio reabre en cuanto termine la operación.",
    consigne: "Vuelve a intentarlo dentro de unos minutos.",
    lienAide: "Consultar la ayuda",
  },
  de: {
    metaTitre: "Wartung läuft",
    metaDescription:
      "Die Website ist vorübergehend wegen einer Wartung ausgesetzt.",
    surtitre: "Wartung",
    titre: "Die Website ist vorübergehend ausgesetzt.",
    texteDefaut:
      "Wir führen derzeit eine Wartung durch. Ihre Daten und Buchungen sind sicher; die Website ist wieder erreichbar, sobald die Wartung abgeschlossen ist.",
    consigne: "Bitte versuchen Sie es in einigen Minuten erneut.",
    lienAide: "Hilfe ansehen",
  },
};

export function traductionsMaintenance(langue: string): TraductionsMaintenance {
  return (
    (MAINTENANCE as Record<string, TraductionsMaintenance>)[langue] ??
    MAINTENANCE.fr
  );
}
