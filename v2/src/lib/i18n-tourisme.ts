import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsTourisme {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  okDesactive: string;
  okEnregistre: string;
  erreurInattendue: string;
  lieux: (n: number) => string;
  aucunLieu: string;
  lieu: string;
  categorie: string;
  commune: string;
  acces: string;
  prix: string;
  extra: string;
  statut: string;
  action: string;
  site: string;
  actif: string;
  inactif: string;
  desactiver: string;
  reactiverHint: string;
  ajouter: string;
  aideAjout: string;
  identifiant: string;
  nom: string;
  prixIndicatif: string;
  lien: string;
  mode: string;
  extraLie: string;
  logement: string;
  tousLogements: string;
  enregistrer: string;
  categories: Record<string, string>;
}

const FR: TraductionsTourisme = {
  titrePage: "Office de tourisme — Espace hôte",
  surtitre: "Espace hôte · Voyageur",
  titre: "Office de tourisme",
  description:
    "Adresses et activités affichées dans l’espace voyageur, filtrables par catégorie. Aucun ajout automatique.",
  okDesactive: "Lieu désactivé.",
  okEnregistre: "Lieu enregistré.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  lieux: (n) => `Lieux (${n})`,
  aucunLieu:
    "Aucun lieu. Ajoutez les bonnes adresses de la commune ci-dessous.",
  lieu: "Lieu",
  categorie: "Catégorie",
  commune: "Commune",
  acces: "Accès",
  prix: "Prix",
  extra: "Extra",
  statut: "Statut",
  action: "Action",
  site: "Site",
  actif: "Actif",
  inactif: "Inactif",
  desactiver: "Désactiver",
  reactiverHint: "Réenregistrer pour activer",
  ajouter: "Ajouter ou mettre à jour un lieu",
  aideAjout: "Un identifiant existant met à jour la fiche et la réactive.",
  identifiant: "Identifiant",
  nom: "Nom",
  prixIndicatif: "Prix indicatif",
  lien: "Lien (https)",
  mode: "Mode",
  extraLie: "Identifiant d’extra lié",
  logement: "Logement (vide = tous)",
  tousLogements: "Tous les logements",
  enregistrer: "Enregistrer le lieu",
  categories: {
    visite: "Visite",
    plage: "Plage",
    pratique: "Pratique",
    activite: "Activité",
    resto: "Restaurant",
    nature: "Nature",
    culture: "Culture",
    autre: "Autre",
  },
};

const EN: TraductionsTourisme = {
  titrePage: "Tourist office — Staff area",
  surtitre: "Staff area · Guest",
  titre: "Tourist office",
  description:
    "Places and activities shown in the guest area, filterable by category. Nothing is added automatically.",
  okDesactive: "Place disabled.",
  okEnregistre: "Place saved.",
  erreurInattendue: "Unexpected error. Try again.",
  lieux: (n) => `Places (${n})`,
  aucunLieu: "No place. Add the local recommendations below.",
  lieu: "Place",
  categorie: "Category",
  commune: "Town",
  acces: "Access",
  prix: "Price",
  extra: "Extra",
  statut: "Status",
  action: "Action",
  site: "Website",
  actif: "Active",
  inactif: "Inactive",
  desactiver: "Disable",
  reactiverHint: "Save again to activate",
  ajouter: "Add or update a place",
  aideAjout: "An existing identifier updates the record and reactivates it.",
  identifiant: "Identifier",
  nom: "Name",
  prixIndicatif: "Indicative price",
  lien: "Link (https)",
  mode: "Mode",
  extraLie: "Linked extra identifier",
  logement: "Property (empty = all)",
  tousLogements: "All properties",
  enregistrer: "Save place",
  categories: {
    visite: "Visit",
    plage: "Beach",
    pratique: "Practical",
    activite: "Activity",
    resto: "Restaurant",
    nature: "Nature",
    culture: "Culture",
    autre: "Other",
  },
};

const ES: TraductionsTourisme = {
  titrePage: "Oficina de turismo — Área profesional",
  surtitre: "Área profesional · Viajero",
  titre: "Oficina de turismo",
  description:
    "Direcciones y actividades mostradas en el área del viajero, filtrables por categoría. Sin añadidos automáticos.",
  okDesactive: "Lugar desactivado.",
  okEnregistre: "Lugar guardado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  lieux: (n) => `Lugares (${n})`,
  aucunLieu:
    "Ningún lugar. Añada las direcciones recomendadas de la localidad abajo.",
  lieu: "Lugar",
  categorie: "Categoría",
  commune: "Municipio",
  acces: "Acceso",
  prix: "Precio",
  extra: "Extra",
  statut: "Estado",
  action: "Acción",
  site: "Sitio",
  actif: "Activo",
  inactif: "Inactivo",
  desactiver: "Desactivar",
  reactiverHint: "Guardar de nuevo para activar",
  ajouter: "Añadir o actualizar un lugar",
  aideAjout: "Un identificador existente actualiza la ficha y la reactiva.",
  identifiant: "Identificador",
  nom: "Nombre",
  prixIndicatif: "Precio indicativo",
  lien: "Enlace (https)",
  mode: "Modo",
  extraLie: "Identificador de extra vinculado",
  logement: "Alojamiento (vacío = todos)",
  tousLogements: "Todos los alojamientos",
  enregistrer: "Guardar lugar",
  categories: {
    visite: "Visita",
    plage: "Playa",
    pratique: "Práctico",
    activite: "Actividad",
    resto: "Restaurante",
    nature: "Naturaleza",
    culture: "Cultura",
    autre: "Otro",
  },
};

const IT: TraductionsTourisme = {
  titrePage: "Ufficio turistico — Area professionale",
  surtitre: "Area professionale · Ospite",
  titre: "Ufficio turistico",
  description:
    "Indirizzi e attività mostrati nell’area ospite, filtrabili per categoria. Nessuna aggiunta automatica.",
  okDesactive: "Luogo disattivato.",
  okEnregistre: "Luogo salvato.",
  erreurInattendue: "Errore imprevisto. Riprovare.",
  lieux: (n) => `Luoghi (${n})`,
  aucunLieu: "Nessun luogo. Aggiungere gli indirizzi consigliati qui sotto.",
  lieu: "Luogo",
  categorie: "Categoria",
  commune: "Comune",
  acces: "Accesso",
  prix: "Prezzo",
  extra: "Extra",
  statut: "Stato",
  action: "Azione",
  site: "Sito",
  actif: "Attivo",
  inactif: "Inattivo",
  desactiver: "Disattivare",
  reactiverHint: "Salvare di nuovo per attivare",
  ajouter: "Aggiungere o aggiornare un luogo",
  aideAjout: "Un identificatore esistente aggiorna la scheda e la riattiva.",
  identifiant: "Identificatore",
  nom: "Nome",
  prixIndicatif: "Prezzo indicativo",
  lien: "Link (https)",
  mode: "Modalità",
  extraLie: "Identificatore extra collegato",
  logement: "Alloggio (vuoto = tutti)",
  tousLogements: "Tutti gli alloggi",
  enregistrer: "Salvare il luogo",
  categories: {
    visite: "Visita",
    plage: "Spiaggia",
    pratique: "Pratico",
    activite: "Attività",
    resto: "Ristorante",
    nature: "Natura",
    culture: "Cultura",
    autre: "Altro",
  },
};

const DE: TraductionsTourisme = {
  titrePage: "Touristeninformation — Mitarbeiterbereich",
  surtitre: "Mitarbeiterbereich · Gast",
  titre: "Touristeninformation",
  description:
    "Orte und Aktivitäten im Gästebereich, nach Kategorie filterbar. Keine automatische Ergänzung.",
  okDesactive: "Ort deaktiviert.",
  okEnregistre: "Ort gespeichert.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  lieux: (n) => `Orte (${n})`,
  aucunLieu:
    "Kein Ort. Fügen Sie unten die empfohlenen Adressen der Gemeinde hinzu.",
  lieu: "Ort",
  categorie: "Kategorie",
  commune: "Gemeinde",
  acces: "Zugang",
  prix: "Preis",
  extra: "Extra",
  statut: "Status",
  action: "Aktion",
  site: "Website",
  actif: "Aktiv",
  inactif: "Inaktiv",
  desactiver: "Deaktivieren",
  reactiverHint: "Zum Aktivieren erneut speichern",
  ajouter: "Ort hinzufügen oder aktualisieren",
  aideAjout:
    "Eine vorhandene Kennung aktualisiert den Eintrag und aktiviert ihn erneut.",
  identifiant: "Kennung",
  nom: "Name",
  prixIndicatif: "Richtpreis",
  lien: "Link (https)",
  mode: "Modus",
  extraLie: "Verknüpfte Extra-Kennung",
  logement: "Unterkunft (leer = alle)",
  tousLogements: "Alle Unterkünfte",
  enregistrer: "Ort speichern",
  categories: {
    visite: "Besichtigung",
    plage: "Strand",
    pratique: "Praktisch",
    activite: "Aktivität",
    resto: "Restaurant",
    nature: "Natur",
    culture: "Kultur",
    autre: "Sonstiges",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsTourisme> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsTourisme(langue: string): TraductionsTourisme {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
