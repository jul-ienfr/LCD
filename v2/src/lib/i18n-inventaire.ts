import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsInventaire {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  videTexte: string;
  creerLogement: string;
  choisirLogement: string;
  okUtiliser: string;
  okEtat: string;
  okEnregistre: string;
  erreurInattendue: string;
  kpiBiens: string;
  kpiRotations: string;
  kpiAge: string;
  kpiBudget: string;
  alerteDormants: string;
  alerteRemplacements: string;
  alerteGaranties: string;
  aucunMasc: string;
  aucunFem: string;
  biensDe: (nom: string) => string;
  aucunBien: string;
  colBien: string;
  colEtat: string;
  colUsages: string;
  colLavages: string;
  colDernierUsage: string;
  colActions: string;
  utilise: string;
  utiliseLave: string;
  etatBtn: string;
  notePlaceholder: string;
  nouvelEtatDe: (label: string) => string;
  noteEtatDe: (label: string) => string;
  ajouterTitre: string;
  ajouterAide: string;
  qrLabel: string;
  categorie: string;
  libelle: string;
  dateAchat: string;
  prixAchat: string;
  fournisseur: string;
  garantieFin: string;
  etatInitial: string;
  photo: string;
  notes: string;
  enregistrerBien: string;
  etats: Record<string, string>;
  surCinq: string;
  joursSuffixe: string;
  etatPrefixe: string;
}

const FR: TraductionsInventaire = {
  titrePage: "Inventaire durable — Espace hôte",
  surtitre: "Espace hôte · Exploitation",
  titre: "Inventaire durable",
  description:
    "QR par bien, compteurs d'usage et de lavage, alertes d'usure, garantie et coût par séjour.",
  videTexte: "Créez d'abord un logement pour suivre son inventaire durable.",
  creerLogement: "Créer un logement",
  choisirLogement: "Choisir un logement",
  okUtiliser: "Utilisation enregistrée.",
  okEtat: "État du bien mis à jour.",
  okEnregistre: "Bien enregistré.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  kpiBiens: "Biens suivis",
  kpiRotations: "Rotations cumulées",
  kpiAge: "Âge moyen",
  kpiBudget: "Budget remplacement",
  alerteDormants: "Dormants > 90 jours",
  alerteRemplacements: "À remplacer",
  alerteGaranties: "Garanties < 30 jours",
  aucunMasc: "Aucun.",
  aucunFem: "Aucune.",
  biensDe: (nom) => `Biens de ${nom}`,
  aucunBien:
    "Aucun bien inventorié. Ajoutez le linge et l'équipement durable ci-dessous.",
  colBien: "Bien",
  colEtat: "État",
  colUsages: "Usages",
  colLavages: "Lavages",
  colDernierUsage: "Dernier usage",
  colActions: "Actions",
  utilise: "Utilisé",
  utiliseLave: "Utilisé + lavé",
  etatBtn: "État",
  notePlaceholder: "Note (optionnel)",
  nouvelEtatDe: (label) => `Nouvel état de ${label}`,
  noteEtatDe: (label) => `Note d'état de ${label}`,
  ajouterTitre: "Ajouter ou mettre à jour un bien",
  ajouterAide:
    "Un QR existant met à jour la fiche sans toucher aux compteurs d'usage et de lavage.",
  qrLabel: "QR / identifiant",
  categorie: "Catégorie",
  libelle: "Libellé",
  dateAchat: "Date d'achat",
  prixAchat: "Prix d'achat (€)",
  fournisseur: "Fournisseur",
  garantieFin: "Fin de garantie",
  etatInitial: "État initial",
  photo: "Photo (URL)",
  notes: "Notes",
  enregistrerBien: "Enregistrer le bien",
  etats: {
    "1": "À remplacer",
    "2": "Usé",
    "3": "Correct",
    "4": "Bon",
    "5": "Neuf",
  },
  surCinq: "/5",
  joursSuffixe: "j",
  etatPrefixe: "état",
};

const EN: TraductionsInventaire = {
  titrePage: "Sustainable inventory — Host space",
  surtitre: "Host space · Operations",
  titre: "Sustainable inventory",
  description:
    "QR per item, usage and wash counters, wear alerts, warranty and cost per stay.",
  videTexte: "Create a property first to track its sustainable inventory.",
  creerLogement: "Create a property",
  choisirLogement: "Choose a property",
  okUtiliser: "Usage recorded.",
  okEtat: "Item condition updated.",
  okEnregistre: "Item saved.",
  erreurInattendue: "Unexpected error. Please retry.",
  kpiBiens: "Tracked items",
  kpiRotations: "Cumulative rotations",
  kpiAge: "Average age",
  kpiBudget: "Replacement budget",
  alerteDormants: "Dormant > 90 days",
  alerteRemplacements: "To replace",
  alerteGaranties: "Warranties < 30 days",
  aucunMasc: "None.",
  aucunFem: "None.",
  biensDe: (nom) => `Items for ${nom}`,
  aucunBien:
    "No inventoried items. Add linens and durable equipment below.",
  colBien: "Item",
  colEtat: "Condition",
  colUsages: "Uses",
  colLavages: "Washes",
  colDernierUsage: "Last used",
  colActions: "Actions",
  utilise: "Used",
  utiliseLave: "Used + washed",
  etatBtn: "Condition",
  notePlaceholder: "Note (optional)",
  nouvelEtatDe: (label) => `New condition for ${label}`,
  noteEtatDe: (label) => `Condition note for ${label}`,
  ajouterTitre: "Add or update an item",
  ajouterAide:
    "An existing QR updates the record without touching usage and wash counters.",
  qrLabel: "QR / identifier",
  categorie: "Category",
  libelle: "Label",
  dateAchat: "Purchase date",
  prixAchat: "Purchase price (€)",
  fournisseur: "Supplier",
  garantieFin: "Warranty end",
  etatInitial: "Initial condition",
  photo: "Photo (URL)",
  notes: "Notes",
  enregistrerBien: "Save item",
  etats: {
    "1": "Replace",
    "2": "Worn",
    "3": "Fair",
    "4": "Good",
    "5": "New",
  },
  surCinq: "/5",
  joursSuffixe: "d",
  etatPrefixe: "condition",
};

const ES: TraductionsInventaire = {
  titrePage: "Inventario duradero — Espacio anfitrión",
  surtitre: "Espacio anfitrión · Explotación",
  titre: "Inventario duradero",
  description:
    "QR por artículo, contadores de uso y lavado, alertas de desgaste, garantía y coste por estancia.",
  videTexte:
    "Cree primero un alojamiento para seguir su inventario duradero.",
  creerLogement: "Crear un alojamiento",
  choisirLogement: "Elegir un alojamiento",
  okUtiliser: "Uso registrado.",
  okEtat: "Estado del artículo actualizado.",
  okEnregistre: "Artículo guardado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  kpiBiens: "Artículos seguidos",
  kpiRotations: "Rotaciones acumuladas",
  kpiAge: "Edad media",
  kpiBudget: "Presupuesto de reposición",
  alerteDormants: "Dormidos > 90 días",
  alerteRemplacements: "A reponer",
  alerteGaranties: "Garantías < 30 días",
  aucunMasc: "Ninguno.",
  aucunFem: "Ninguna.",
  biensDe: (nom) => `Artículos de ${nom}`,
  aucunBien:
    "Ningún artículo inventariado. Añada la ropa y el equipamiento duradero abajo.",
  colBien: "Artículo",
  colEtat: "Estado",
  colUsages: "Usos",
  colLavages: "Lavados",
  colDernierUsage: "Último uso",
  colActions: "Acciones",
  utilise: "Usado",
  utiliseLave: "Usado + lavado",
  etatBtn: "Estado",
  notePlaceholder: "Nota (opcional)",
  nouvelEtatDe: (label) => `Nuevo estado de ${label}`,
  noteEtatDe: (label) => `Nota de estado de ${label}`,
  ajouterTitre: "Añadir o actualizar un artículo",
  ajouterAide:
    "Un QR existente actualiza la ficha sin tocar los contadores de uso y lavado.",
  qrLabel: "QR / identificador",
  categorie: "Categoría",
  libelle: "Etiqueta",
  dateAchat: "Fecha de compra",
  prixAchat: "Precio de compra (€)",
  fournisseur: "Proveedor",
  garantieFin: "Fin de garantía",
  etatInitial: "Estado inicial",
  photo: "Foto (URL)",
  notes: "Notas",
  enregistrerBien: "Guardar artículo",
  etats: {
    "1": "A reponer",
    "2": "Desgastado",
    "3": "Aceptable",
    "4": "Bueno",
    "5": "Nuevo",
  },
  surCinq: "/5",
  joursSuffixe: "d",
  etatPrefixe: "estado",
};

const IT: TraductionsInventaire = {
  titrePage: "Inventario durevole — Spazio host",
  surtitre: "Spazio host · Gestione",
  titre: "Inventario durevole",
  description:
    "QR per articolo, contatori di uso e lavaggio, avvisi di usura, garanzia e costo per soggiorno.",
  videTexte:
    "Creare prima un alloggio per tracciare il suo inventario durevole.",
  creerLogement: "Creare un alloggio",
  choisirLogement: "Scegliere un alloggio",
  okUtiliser: "Uso registrato.",
  okEtat: "Stato dell'articolo aggiornato.",
  okEnregistre: "Articolo salvato.",
  erreurInattendue: "Errore imprevisto. Riprova.",
  kpiBiens: "Articoli tracciati",
  kpiRotations: "Rotazioni cumulative",
  kpiAge: "Età media",
  kpiBudget: "Budget di sostituzione",
  alerteDormants: "Dormienti > 90 giorni",
  alerteRemplacements: "Da sostituire",
  alerteGaranties: "Garanzie < 30 giorni",
  aucunMasc: "Nessuno.",
  aucunFem: "Nessuna.",
  biensDe: (nom) => `Articoli di ${nom}`,
  aucunBien:
    "Nessun articolo inventariato. Aggiungere biancheria e attrezzatura durevole qui sotto.",
  colBien: "Articolo",
  colEtat: "Stato",
  colUsages: "Usi",
  colLavages: "Lavaggi",
  colDernierUsage: "Ultimo uso",
  colActions: "Azioni",
  utilise: "Usato",
  utiliseLave: "Usato + lavato",
  etatBtn: "Stato",
  notePlaceholder: "Nota (facoltativo)",
  nouvelEtatDe: (label) => `Nuovo stato di ${label}`,
  noteEtatDe: (label) => `Nota di stato di ${label}`,
  ajouterTitre: "Aggiungere o aggiornare un articolo",
  ajouterAide:
    "Un QR esistente aggiorna la scheda senza toccare i contatori di uso e lavaggio.",
  qrLabel: "QR / identificativo",
  categorie: "Categoria",
  libelle: "Etichetta",
  dateAchat: "Data di acquisto",
  prixAchat: "Prezzo di acquisto (€)",
  fournisseur: "Fornitore",
  garantieFin: "Fine garanzia",
  etatInitial: "Stato iniziale",
  photo: "Foto (URL)",
  notes: "Note",
  enregistrerBien: "Salva articolo",
  etats: {
    "1": "Da sostituire",
    "2": "Usurato",
    "3": "Discreto",
    "4": "Buono",
    "5": "Nuovo",
  },
  surCinq: "/5",
  joursSuffixe: "g",
  etatPrefixe: "stato",
};

const DE: TraductionsInventaire = {
  titrePage: "Nachhaltiges Inventar — Gastgeberbereich",
  surtitre: "Gastgeberbereich · Betrieb",
  titre: "Nachhaltiges Inventar",
  description:
    "QR pro Artikel, Nutzungs- und Waschzähler, Verschleißwarnungen, Garantie und Kosten pro Aufenthalt.",
  videTexte:
    "Legen Sie zuerst eine Unterkunft an, um ihr nachhaltiges Inventar zu verfolgen.",
  creerLogement: "Unterkunft anlegen",
  choisirLogement: "Unterkunft auswählen",
  okUtiliser: "Nutzung erfasst.",
  okEtat: "Zustand des Artikels aktualisiert.",
  okEnregistre: "Artikel gespeichert.",
  erreurInattendue: "Unerwarteter Fehler. Bitte erneut versuchen.",
  kpiBiens: "Erfasste Artikel",
  kpiRotations: "Kumulierte Wechsel",
  kpiAge: "Durchschnittsalter",
  kpiBudget: "Ersatzbudget",
  alerteDormants: "Schläfer > 90 Tage",
  alerteRemplacements: "Zu ersetzen",
  alerteGaranties: "Garantien < 30 Tage",
  aucunMasc: "Keiner.",
  aucunFem: "Keine.",
  biensDe: (nom) => `Artikel von ${nom}`,
  aucunBien:
    "Kein inventarisiertes Material. Fügen Sie Wäsche und langlebige Ausstattung unten hinzu.",
  colBien: "Artikel",
  colEtat: "Zustand",
  colUsages: "Nutzungen",
  colLavages: "Wäschen",
  colDernierUsage: "Letzte Nutzung",
  colActions: "Aktionen",
  utilise: "Genutzt",
  utiliseLave: "Genutzt + gewaschen",
  etatBtn: "Zustand",
  notePlaceholder: "Notiz (optional)",
  nouvelEtatDe: (label) => `Neuer Zustand von ${label}`,
  noteEtatDe: (label) => `Zustandsnotiz für ${label}`,
  ajouterTitre: "Artikel hinzufügen oder aktualisieren",
  ajouterAide:
    "Ein bestehender QR aktualisiert den Eintrag ohne Nutzungs- und Waschzähler zu ändern.",
  qrLabel: "QR / Kennung",
  categorie: "Kategorie",
  libelle: "Bezeichnung",
  dateAchat: "Kaufdatum",
  prixAchat: "Kaufpreis (€)",
  fournisseur: "Lieferant",
  garantieFin: "Garantieende",
  etatInitial: "Anfangszustand",
  photo: "Foto (URL)",
  notes: "Notizen",
  enregistrerBien: "Artikel speichern",
  etats: {
    "1": "Zu ersetzen",
    "2": "Abgenutzt",
    "3": "Akzeptabel",
    "4": "Gut",
    "5": "Neu",
  },
  surCinq: "/5",
  joursSuffixe: "T",
  etatPrefixe: "Zustand",
};

const DICTIONNAIRES: Record<Langue, TraductionsInventaire> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsInventaire(
  langue: string,
): TraductionsInventaire {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
