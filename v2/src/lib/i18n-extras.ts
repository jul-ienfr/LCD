import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsExtras {
  titrePage: string;
  surtitre: string;
  titre: string;
  resume: (extras: number, commandes: number) => string;
  okCree: (nom: string) => string;
  okEnregistre: string;
  erreurCodeExistant: string;
  erreurPrix: string;
  erreurInattendue: string;
  creerTitre: string;
  creerAide: string;
  code: string;
  nom: string;
  prix: string;
  logementFacultatif: string;
  tousLesLogements: string;
  descriptionFacultatif: string;
  creer: string;
  catalogue: string;
  aucunExtra: string;
  actif: string;
  inactif: string;
  commandes: string;
  aucuneCommande: string;
  statuts: Record<string, string>;
}

const FR: TraductionsExtras = {
  titrePage: "Extras voyageur — Espace hôte",
  surtitre: "Espace hôte",
  titre: "Extras voyageur",
  resume: (extras, commandes) =>
    `${extras} extra${extras > 1 ? "s" : ""} · ${commandes} commande${commandes > 1 ? "s" : ""}`,
  okCree: (nom) => `Extra « ${nom} » créé.`,
  okEnregistre: "Enregistré.",
  erreurCodeExistant: "Ce code extra existe déjà.",
  erreurPrix: "Prix invalide (ex. 12 ou 12,50).",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  creerTitre: "Créer un extra",
  creerAide:
    "Un extra global est proposé à tous les logements ; un extra lié à un logement n’apparaît que pour ce logement.",
  code: "Code",
  nom: "Nom",
  prix: "Prix (€)",
  logementFacultatif: "Logement (facultatif)",
  tousLesLogements: "Tous les logements",
  descriptionFacultatif: "Description (facultatif)",
  creer: "Créer l’extra",
  catalogue: "Catalogue",
  aucunExtra: "Aucun extra au catalogue.",
  actif: "actif",
  inactif: "inactif",
  commandes: "Commandes",
  aucuneCommande: "Aucune commande pour le moment.",
  statuts: {
    demandee: "Demandée",
    confirmee: "Confirmer",
    refusee: "Refuser",
    livree: "Livrée",
  },
};

const EN: TraductionsExtras = {
  titrePage: "Guest extras — Host space",
  surtitre: "Host space",
  titre: "Guest extras",
  resume: (extras, commandes) =>
    `${extras} extra${extras > 1 ? "s" : ""} · ${commandes} order${commandes > 1 ? "s" : ""}`,
  okCree: (nom) => `Extra “${nom}” created.`,
  okEnregistre: "Saved.",
  erreurCodeExistant: "This extra code already exists.",
  erreurPrix: "Invalid price (e.g. 12 or 12.50).",
  erreurInattendue: "Unexpected error. Please retry.",
  creerTitre: "Create an extra",
  creerAide:
    "A global extra is offered to all properties; an extra linked to a property only appears for that property.",
  code: "Code",
  nom: "Name",
  prix: "Price (€)",
  logementFacultatif: "Property (optional)",
  tousLesLogements: "All properties",
  descriptionFacultatif: "Description (optional)",
  creer: "Create extra",
  catalogue: "Catalog",
  aucunExtra: "No extras in the catalog.",
  actif: "active",
  inactif: "inactive",
  commandes: "Orders",
  aucuneCommande: "No orders yet.",
  statuts: {
    demandee: "Requested",
    confirmee: "Confirm",
    refusee: "Refuse",
    livree: "Delivered",
  },
};

const ES: TraductionsExtras = {
  titrePage: "Extras viajero — Espacio anfitrión",
  surtitre: "Espacio anfitrión",
  titre: "Extras viajero",
  resume: (extras, commandes) =>
    `${extras} extra${extras > 1 ? "s" : ""} · ${commandes} pedido${commandes > 1 ? "s" : ""}`,
  okCree: (nom) => `Extra «${nom}» creado.`,
  okEnregistre: "Guardado.",
  erreurCodeExistant: "Este código de extra ya existe.",
  erreurPrix: "Precio no válido (ej. 12 o 12,50).",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  creerTitre: "Crear un extra",
  creerAide:
    "Un extra global se ofrece a todos los alojamientos; un extra vinculado a un alojamiento solo aparece para ese alojamiento.",
  code: "Código",
  nom: "Nombre",
  prix: "Precio (€)",
  logementFacultatif: "Alojamiento (opcional)",
  tousLesLogements: "Todos los alojamientos",
  descriptionFacultatif: "Descripción (opcional)",
  creer: "Crear el extra",
  catalogue: "Catálogo",
  aucunExtra: "No hay extras en el catálogo.",
  actif: "activo",
  inactif: "inactivo",
  commandes: "Pedidos",
  aucuneCommande: "Aún no hay pedidos.",
  statuts: {
    demandee: "Solicitado",
    confirmee: "Confirmar",
    refusee: "Rechazar",
    livree: "Entregado",
  },
};

const IT: TraductionsExtras = {
  titrePage: "Extra ospite — Spazio host",
  surtitre: "Spazio host",
  titre: "Extra ospite",
  resume: (extras, commandes) =>
    `${extras} extra · ${commandes} ordin${commandes > 1 ? "i" : "e"}`,
  okCree: (nom) => `Extra «${nom}» creato.`,
  okEnregistre: "Salvato.",
  erreurCodeExistant: "Questo codice extra esiste già.",
  erreurPrix: "Prezzo non valido (es. 12 o 12,50).",
  erreurInattendue: "Errore imprevisto. Riprova.",
  creerTitre: "Crea un extra",
  creerAide:
    "Un extra globale è proposto per tutti gli alloggi; un extra legato a un alloggio appare solo per quell’alloggio.",
  code: "Codice",
  nom: "Nome",
  prix: "Prezzo (€)",
  logementFacultatif: "Alloggio (facoltativo)",
  tousLesLogements: "Tutti gli alloggi",
  descriptionFacultatif: "Descrizione (facoltativo)",
  creer: "Crea l’extra",
  catalogue: "Catalogo",
  aucunExtra: "Nessun extra nel catalogo.",
  actif: "attivo",
  inactif: "inattivo",
  commandes: "Ordini",
  aucuneCommande: "Nessun ordine per il momento.",
  statuts: {
    demandee: "Richiesto",
    confirmee: "Conferma",
    refusee: "Rifiuta",
    livree: "Consegnato",
  },
};

const DE: TraductionsExtras = {
  titrePage: "Gast-Extras — Gastgeberbereich",
  surtitre: "Gastgeberbereich",
  titre: "Gast-Extras",
  resume: (extras, commandes) =>
    `${extras} Extra${extras > 1 ? "s" : ""} · ${commandes} Bestellung${commandes > 1 ? "en" : ""}`,
  okCree: (nom) => `Extra „${nom}“ erstellt.`,
  okEnregistre: "Gespeichert.",
  erreurCodeExistant: "Dieser Extra-Code existiert bereits.",
  erreurPrix: "Ungültiger Preis (z. B. 12 oder 12,50).",
  erreurInattendue: "Unerwarteter Fehler. Bitte erneut versuchen.",
  creerTitre: "Extra anlegen",
  creerAide:
    "Ein globales Extra wird allen Unterkünften angeboten; ein Extra mit Unterkunft erscheint nur dort.",
  code: "Code",
  nom: "Name",
  prix: "Preis (€)",
  logementFacultatif: "Unterkunft (optional)",
  tousLesLogements: "Alle Unterkünfte",
  descriptionFacultatif: "Beschreibung (optional)",
  creer: "Extra anlegen",
  catalogue: "Katalog",
  aucunExtra: "Keine Extras im Katalog.",
  actif: "aktiv",
  inactif: "inaktiv",
  commandes: "Bestellungen",
  aucuneCommande: "Noch keine Bestellungen.",
  statuts: {
    demandee: "Angefragt",
    confirmee: "Bestätigen",
    refusee: "Ablehnen",
    livree: "Geliefert",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsExtras> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsExtras(langue: string): TraductionsExtras {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
