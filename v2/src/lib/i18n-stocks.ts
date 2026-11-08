import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsStocks {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  videTexte: string;
  creerLogement: string;
  choisirLogement: string;
  okConsommer: string;
  okReassort: string;
  okEnregistre: string;
  erreurInattendue: string;
  kpiReferences: string;
  kpiRuptures: string;
  kpiArticles: string;
  rotationTitre: string;
  rotationAide: string;
  consommerRotation: string;
  consommablesDe: (nom: string) => string;
  aucunConsommable: string;
  colConsommable: string;
  colStock: string;
  colSeuil: string;
  colCible: string;
  colConso: string;
  colStatut: string;
  colActions: string;
  consommer: string;
  reassort: string;
  coursesTitre: string;
  aucunAchat: string;
  ruptures: string;
  stocksBas: string;
  ajouterTitre: string;
  ajouterAide: string;
  code: string;
  libelle: string;
  stockActuel: string;
  unite: string;
  seuilAlerte: string;
  cibleReassort: string;
  consoRotation: string;
  enregistrer: string;
  statuts: Record<string, string>;
}

const FR: TraductionsStocks = {
  titrePage: "Consommables et courses — Espace hôte",
  surtitre: "Espace hôte · Exploitation",
  titre: "Consommables & courses",
  description:
    "Seuils par logement, décrément à chaque rotation, liste de courses automatique.",
  videTexte: "Créez d'abord un logement pour suivre ses consommables.",
  creerLogement: "Créer un logement",
  choisirLogement: "Choisir un logement",
  okConsommer: "Rotation consommée : stocks décrémentés.",
  okReassort: "Réassort enregistré : stocks remis à la cible.",
  okEnregistre: "Consommable enregistré.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  kpiReferences: "Références",
  kpiRuptures: "Ruptures",
  kpiArticles: "Articles à acheter",
  rotationTitre: "Rotation de ménage",
  rotationAide:
    "Décrémente chaque consommable de sa consommation par rotation (bornée à zéro).",
  consommerRotation: "Consommer la rotation",
  consommablesDe: (nom) => `Consommables de ${nom}`,
  aucunConsommable:
    "Aucun consommable suivi. Ajoutez le socle de rotation ci-dessous.",
  colConsommable: "Consommable",
  colStock: "Stock",
  colSeuil: "Seuil",
  colCible: "Cible",
  colConso: "Conso/rotation",
  colStatut: "Statut",
  colActions: "Actions",
  consommer: "Consommer",
  reassort: "Réassort",
  coursesTitre: "Liste de courses",
  aucunAchat:
    "Aucun achat nécessaire : tous les stocks sont au-dessus du seuil.",
  ruptures: "Ruptures",
  stocksBas: "Stocks bas",
  ajouterTitre: "Ajouter ou mettre à jour un consommable",
  ajouterAide:
    "Un code existant met à jour la fiche (le stock saisi remplace le stock actuel).",
  code: "Code",
  libelle: "Libellé",
  stockActuel: "Stock actuel",
  unite: "Unité",
  seuilAlerte: "Seuil d'alerte",
  cibleReassort: "Cible de réassort",
  consoRotation: "Consommation par rotation",
  enregistrer: "Enregistrer",
  statuts: {
    rupture: "Rupture",
    bas: "Stock bas",
    ok: "OK",
  },
};

const EN: TraductionsStocks = {
  titrePage: "Consumables & shopping — Host space",
  surtitre: "Host space · Operations",
  titre: "Consumables & shopping",
  description:
    "Thresholds per property, decremented each turnover, automatic shopping list.",
  videTexte: "Create a property first to track its consumables.",
  creerLogement: "Create a property",
  choisirLogement: "Choose a property",
  okConsommer: "Turnover consumed: stocks decremented.",
  okReassort: "Restock recorded: stocks reset to target.",
  okEnregistre: "Consumable saved.",
  erreurInattendue: "Unexpected error. Please retry.",
  kpiReferences: "References",
  kpiRuptures: "Out of stock",
  kpiArticles: "Items to buy",
  rotationTitre: "Housekeeping turnover",
  rotationAide:
    "Decrements each consumable by its per-turnover usage (floored at zero).",
  consommerRotation: "Consume turnover",
  consommablesDe: (nom) => `Consumables for ${nom}`,
  aucunConsommable:
    "No tracked consumables. Add the turnover basics below.",
  colConsommable: "Consumable",
  colStock: "Stock",
  colSeuil: "Threshold",
  colCible: "Target",
  colConso: "Use/turnover",
  colStatut: "Status",
  colActions: "Actions",
  consommer: "Consume",
  reassort: "Restock",
  coursesTitre: "Shopping list",
  aucunAchat: "No purchases needed: all stocks are above threshold.",
  ruptures: "Out of stock",
  stocksBas: "Low stock",
  ajouterTitre: "Add or update a consumable",
  ajouterAide:
    "An existing code updates the record (entered stock replaces current stock).",
  code: "Code",
  libelle: "Label",
  stockActuel: "Current stock",
  unite: "Unit",
  seuilAlerte: "Alert threshold",
  cibleReassort: "Restock target",
  consoRotation: "Consumption per turnover",
  enregistrer: "Save",
  statuts: {
    rupture: "Out of stock",
    bas: "Low stock",
    ok: "OK",
  },
};

const ES: TraductionsStocks = {
  titrePage: "Consumibles y compras — Espacio anfitrión",
  surtitre: "Espacio anfitrión · Explotación",
  titre: "Consumibles y compras",
  description:
    "Umbrales por alojamiento, decremento en cada rotación, lista de compras automática.",
  videTexte: "Cree primero un alojamiento para seguir sus consumibles.",
  creerLogement: "Crear un alojamiento",
  choisirLogement: "Elegir un alojamiento",
  okConsommer: "Rotación consumida: existencias decrementadas.",
  okReassort: "Reposición registrada: existencias restablecidas al objetivo.",
  okEnregistre: "Consumible guardado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  kpiReferences: "Referencias",
  kpiRuptures: "Agotados",
  kpiArticles: "Artículos a comprar",
  rotationTitre: "Rotación de limpieza",
  rotationAide:
    "Decrementa cada consumible según su consumo por rotación (mínimo cero).",
  consommerRotation: "Consumir la rotación",
  consommablesDe: (nom) => `Consumibles de ${nom}`,
  aucunConsommable:
    "Ningún consumible seguido. Añada la base de rotación abajo.",
  colConsommable: "Consumible",
  colStock: "Existencias",
  colSeuil: "Umbral",
  colCible: "Objetivo",
  colConso: "Consumo/rotación",
  colStatut: "Estado",
  colActions: "Acciones",
  consommer: "Consumir",
  reassort: "Reponer",
  coursesTitre: "Lista de compras",
  aucunAchat:
    "Ninguna compra necesaria: todas las existencias están por encima del umbral.",
  ruptures: "Agotados",
  stocksBas: "Existencias bajas",
  ajouterTitre: "Añadir o actualizar un consumible",
  ajouterAide:
    "Un código existente actualiza la ficha (las existencias introducidas sustituyen las actuales).",
  code: "Código",
  libelle: "Etiqueta",
  stockActuel: "Existencias actuales",
  unite: "Unidad",
  seuilAlerte: "Umbral de alerta",
  cibleReassort: "Objetivo de reposición",
  consoRotation: "Consumo por rotación",
  enregistrer: "Guardar",
  statuts: {
    rupture: "Agotado",
    bas: "Existencias bajas",
    ok: "OK",
  },
};

const IT: TraductionsStocks = {
  titrePage: "Consumabili e spesa — Spazio host",
  surtitre: "Spazio host · Gestione",
  titre: "Consumabili e spesa",
  description:
    "Soglie per alloggio, decremento a ogni rotazione, lista della spesa automatica.",
  videTexte: "Creare prima un alloggio per tracciare i suoi consumabili.",
  creerLogement: "Creare un alloggio",
  choisirLogement: "Scegliere un alloggio",
  okConsommer: "Rotazione consumata: scorte decrementate.",
  okReassort: "Riassortimento registrato: scorte riportate all'obiettivo.",
  okEnregistre: "Consumabile salvato.",
  erreurInattendue: "Errore imprevisto. Riprova.",
  kpiReferences: "Referimenti",
  kpiRuptures: "Esauriti",
  kpiArticles: "Articoli da acquistare",
  rotationTitre: "Rotazione di pulizia",
  rotationAide:
    "Decrementa ogni consumabile del suo consumo per rotazione (minimo zero).",
  consommerRotation: "Consumare la rotazione",
  consommablesDe: (nom) => `Consumabili di ${nom}`,
  aucunConsommable:
    "Nessun consumabile tracciato. Aggiungere la base di rotazione qui sotto.",
  colConsommable: "Consumabile",
  colStock: "Scorta",
  colSeuil: "Soglia",
  colCible: "Obiettivo",
  colConso: "Consumo/rotazione",
  colStatut: "Stato",
  colActions: "Azioni",
  consommer: "Consuma",
  reassort: "Riassortisci",
  coursesTitre: "Lista della spesa",
  aucunAchat:
    "Nessun acquisto necessario: tutte le scorte sono sopra la soglia.",
  ruptures: "Esauriti",
  stocksBas: "Scorte basse",
  ajouterTitre: "Aggiungere o aggiornare un consumabile",
  ajouterAide:
    "Un codice esistente aggiorna la scheda (la scorta inserita sostituisce quella attuale).",
  code: "Codice",
  libelle: "Etichetta",
  stockActuel: "Scorta attuale",
  unite: "Unità",
  seuilAlerte: "Soglia di allerta",
  cibleReassort: "Obiettivo di riassortimento",
  consoRotation: "Consumo per rotazione",
  enregistrer: "Salva",
  statuts: {
    rupture: "Esaurito",
    bas: "Scorte basse",
    ok: "OK",
  },
};

const DE: TraductionsStocks = {
  titrePage: "Verbrauchsmaterial & Einkauf — Gastgeberbereich",
  surtitre: "Gastgeberbereich · Betrieb",
  titre: "Verbrauchsmaterial & Einkauf",
  description:
    "Schwellen pro Unterkunft, Dekrement bei jedem Wechsel, automatische Einkaufsliste.",
  videTexte:
    "Legen Sie zuerst eine Unterkunft an, um ihre Verbrauchsmaterialien zu verfolgen.",
  creerLogement: "Unterkunft anlegen",
  choisirLogement: "Unterkunft auswählen",
  okConsommer: "Wechsel verbraucht: Bestände dekrementiert.",
  okReassort: "Auffüllung erfasst: Bestände auf Zielwert zurückgesetzt.",
  okEnregistre: "Verbrauchsmaterial gespeichert.",
  erreurInattendue: "Unerwarteter Fehler. Bitte erneut versuchen.",
  kpiReferences: "Referenzen",
  kpiRuptures: "Vergriffen",
  kpiArticles: "Zu kaufende Artikel",
  rotationTitre: "Reinigungswechsel",
  rotationAide:
    "Dekrementiert jedes Verbrauchsmaterial um seinen Verbrauch pro Wechsel (mindestens null).",
  consommerRotation: "Wechsel verbrauchen",
  consommablesDe: (nom) => `Verbrauchsmaterial für ${nom}`,
  aucunConsommable:
    "Kein Verbrauchsmaterial erfasst. Fügen Sie die Wechselbasis unten hinzu.",
  colConsommable: "Verbrauchsmaterial",
  colStock: "Bestand",
  colSeuil: "Schwelle",
  colCible: "Ziel",
  colConso: "Verbrauch/Wechsel",
  colStatut: "Status",
  colActions: "Aktionen",
  consommer: "Verbrauchen",
  reassort: "Auffüllen",
  coursesTitre: "Einkaufsliste",
  aucunAchat:
    "Kein Einkauf nötig: Alle Bestände liegen über der Schwelle.",
  ruptures: "Vergriffen",
  stocksBas: "Niedriger Bestand",
  ajouterTitre: "Verbrauchsmaterial hinzufügen oder aktualisieren",
  ajouterAide:
    "Ein bestehender Code aktualisiert den Eintrag (eingegebener Bestand ersetzt den aktuellen).",
  code: "Code",
  libelle: "Bezeichnung",
  stockActuel: "Aktueller Bestand",
  unite: "Einheit",
  seuilAlerte: "Warnschwelle",
  cibleReassort: "Auffüllziel",
  consoRotation: "Verbrauch pro Wechsel",
  enregistrer: "Speichern",
  statuts: {
    rupture: "Vergriffen",
    bas: "Niedriger Bestand",
    ok: "OK",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsStocks> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsStocks(langue: string): TraductionsStocks {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
