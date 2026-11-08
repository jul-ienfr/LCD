import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsRecherche {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  label: string;
  placeholder: string;
  rechercher: string;
  minimum: (minimum: number) => string;
  resultats: (nombre: number, requete: string) => string;
  aucun: string;
  retour: string;
  audit: string;
  categories: Record<string, string>;
}

const FR: TraductionsRecherche = {
  titrePage: "Recherche globale — Espace hôte", surtitre: "Pilotage",
  titre: "Recherche globale",
  description: "Référence de séjour, facture, paiement, mission, ménage, état des lieux, ticket, sinistre ou objet trouvé. Recherche limitée à votre espace.",
  label: "Référence ou nom", placeholder: "RESA-2026-001, FAC-2026-0042, MEN-…",
  rechercher: "Rechercher",
  minimum: (n) => `Saisissez au moins ${n} caractères.`,
  resultats: (n, q) => `${n} résultat(s) pour « ${q} ».`,
  aucun: "Aucun résultat. Vérifiez la référence ou essayez un nom de client.",
  retour: "← Pilotage", audit: "Journal d’audit",
  categories: {
    logement: "Logements", reservation: "Réservations", facture: "Factures",
    paiement: "Paiements", mission: "Missions", menage: "Ménages",
    "etat-des-lieux": "États des lieux", ticket: "Support", sinistre: "Sinistres",
    "objet-trouve": "Objets trouvés", "commande-extra": "Extras",
  },
};

const EN: TraductionsRecherche = {
  titrePage: "Global search — Staff area", surtitre: "Operations",
  titre: "Global search",
  description: "Stay, invoice, payment, task, cleaning, inventory, ticket, incident or lost-item reference. Search limited to your workspace.",
  label: "Reference or name", placeholder: "BOOK-2026-001, INV-2026-0042, CLN-…",
  rechercher: "Search",
  minimum: (n) => `Enter at least ${n} characters.`,
  resultats: (n, q) => `${n} result${n === 1 ? "" : "s"} for “${q}”.`,
  aucun: "No result. Check the reference or try a guest name.",
  retour: "← Operations", audit: "Audit log",
  categories: {
    logement: "Properties", reservation: "Bookings", facture: "Invoices",
    paiement: "Payments", mission: "Tasks", menage: "Cleaning",
    "etat-des-lieux": "Inventory checks", ticket: "Support", sinistre: "Incidents",
    "objet-trouve": "Lost items", "commande-extra": "Extras",
  },
};

const ES: TraductionsRecherche = {
  titrePage: "Búsqueda global — Área profesional", surtitre: "Gestión",
  titre: "Búsqueda global",
  description: "Referencia de estancia, factura, pago, misión, limpieza, inventario, ticket, siniestro u objeto perdido. Búsqueda limitada a su espacio.",
  label: "Referencia o nombre", placeholder: "RES-2026-001, FAC-2026-0042, LIM-…",
  rechercher: "Buscar",
  minimum: (n) => `Introduzca al menos ${n} caracteres.`,
  resultats: (n, q) => `${n} resultado(s) para «${q}».`,
  aucun: "Ningún resultado. Compruebe la referencia o pruebe un nombre de cliente.",
  retour: "← Gestión", audit: "Registro de auditoría",
  categories: {
    logement: "Alojamientos", reservation: "Reservas", facture: "Facturas",
    paiement: "Pagos", mission: "Misiones", menage: "Limpiezas",
    "etat-des-lieux": "Inventarios", ticket: "Soporte", sinistre: "Siniestros",
    "objet-trouve": "Objetos perdidos", "commande-extra": "Extras",
  },
};

const IT: TraductionsRecherche = {
  titrePage: "Ricerca globale — Area professionale", surtitre: "Gestione",
  titre: "Ricerca globale",
  description: "Riferimento di soggiorno, fattura, pagamento, incarico, pulizia, inventario, ticket, sinistro o oggetto smarrito. Ricerca limitata al proprio spazio.",
  label: "Riferimento o nome", placeholder: "SOG-2026-001, FAT-2026-0042, PUL-…",
  rechercher: "Cerca",
  minimum: (n) => `Inserire almeno ${n} caratteri.`,
  resultats: (n, q) => `${n} risultato/i per «${q}».`,
  aucun: "Nessun risultato. Controlli il riferimento o provi un nome cliente.",
  retour: "← Gestione", audit: "Registro di audit",
  categories: {
    logement: "Alloggi", reservation: "Prenotazioni", facture: "Fatture",
    paiement: "Pagamenti", mission: "Incarichi", menage: "Pulizie",
    "etat-des-lieux": "Inventari", ticket: "Supporto", sinistre: "Sinistri",
    "objet-trouve": "Oggetti smarriti", "commande-extra": "Extra",
  },
};

const DE: TraductionsRecherche = {
  titrePage: "Globale Suche — Profibereich", surtitre: "Steuerung",
  titre: "Globale Suche",
  description: "Referenz für Aufenthalt, Rechnung, Zahlung, Auftrag, Reinigung, Inventar, Ticket, Schaden oder Fundsache. Suche auf Ihren Bereich beschränkt.",
  label: "Referenz oder Name", placeholder: "BUCH-2026-001, RE-2026-0042, REIN-…",
  rechercher: "Suchen",
  minimum: (n) => `Geben Sie mindestens ${n} Zeichen ein.`,
  resultats: (n, q) => `${n} Ergebnis(se) für „${q}“.`,
  aucun: "Kein Ergebnis. Prüfen Sie die Referenz oder versuchen Sie einen Kundennamen.",
  retour: "← Steuerung", audit: "Audit-Protokoll",
  categories: {
    logement: "Unterkünfte", reservation: "Buchungen", facture: "Rechnungen",
    paiement: "Zahlungen", mission: "Aufträge", menage: "Reinigungen",
    "etat-des-lieux": "Inventarprüfungen", ticket: "Support", sinistre: "Schäden",
    "objet-trouve": "Fundsachen", "commande-extra": "Extras",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsRecherche> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsRecherche(langue: string): TraductionsRecherche {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
