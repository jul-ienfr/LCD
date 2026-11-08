import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsProprietaires {
  titrePage: string;
  espace: string;
  titre: string;
  description: string;
  entiteLien: string;
  okRetire: string;
  okRattache: (proprietaire: string, logement: string) => string;
  okEnregistre: string;
  msgCommission: string;
  msgCharges: string;
  msgMode: string;
  msgStatut: string;
  msgDates: string;
  msgNotes: string;
  msgLogement: string;
  msgProprietaire: string;
  msgInattendu: string;
  aucunProprietaire: string;
  enregistrerMandat: string;
  aideMandat: string;
  proprietaire: string;
  logement: string;
  commission: string;
  chargesMensuelles: string;
  chargesCourt: string;
  mode: string;
  statut: string;
  debutFacultatif: string;
  finFacultatif: string;
  notesFacultatif: string;
  enregistrer: string;
  mandats: (n: number) => string;
  aucunMandat: string;
  chargesMois: string;
  retirer: string;
  espaceProprio: string;
  modes: Record<string, string>;
  statuts: Record<string, string>;
  dates: (debut: string | null, fin: string | null) => string;
}

const FR: TraductionsProprietaires = {
  titrePage: "Propriétaires et mandats — Espace hôte",
  espace: "Espace hôte",
  titre: "Propriétaires et mandats",
  description:
    "Mandat par logement : mode, commission, dates et statut. Lecture seule côté propriétaire.",
  entiteLien: "Entité juridique",
  okRetire: "Mandat retiré.",
  okRattache: (proprietaire, logement) =>
    `${proprietaire} est rattaché à ${logement}.`,
  okEnregistre: "Mandat enregistré.",
  msgCommission: "Commission invalide (0 à 50 %).",
  msgCharges: "Charges mensuelles invalides (0 à 10 000 €).",
  msgMode: "Mode de mandat invalide.",
  msgStatut: "Statut de mandat invalide.",
  msgDates: "Dates de mandat invalides.",
  msgNotes: "Notes limitées à 1 000 caractères.",
  msgLogement: "Logement introuvable.",
  msgProprietaire: "Propriétaire introuvable ou inactif.",
  msgInattendu: "Erreur inattendue. Réessayez.",
  aucunProprietaire:
    "Aucun propriétaire actif. Créez un utilisateur de rôle proprietaire.",
  enregistrerMandat: "Enregistrer un mandat",
  aideMandat:
    "Le propriétaire verra uniquement les logements rattachés. Le mode « bien propre » force une commission à 0.",
  proprietaire: "Propriétaire",
  logement: "Logement",
  commission: "Commission (%)",
  chargesMensuelles: "Charges mensuelles (€)",
  chargesCourt: "Charges",
  mode: "Mode",
  statut: "Statut",
  debutFacultatif: "Début (facultatif)",
  finFacultatif: "Fin (facultatif)",
  notesFacultatif: "Notes (facultatif)",
  enregistrer: "Enregistrer le mandat",
  mandats: (n) => `${n} mandat${n > 1 ? "s" : ""}`,
  aucunMandat: "Aucun mandat propriétaire.",
  chargesMois: "mois",
  retirer: "Retirer",
  espaceProprio: "Espace propriétaire",
  modes: {
    propre: "Bien propre (0 commission)",
    mandat_tiers: "Mandat tiers",
  },
  statuts: { actif: "Actif", suspendu: "Suspendu" },
  dates: (debut, fin) => {
    if (debut && fin) return `Du ${debut} au ${fin}`;
    if (debut) return `Depuis le ${debut}`;
    if (fin) return `Jusqu’au ${fin}`;
    return "";
  },
};

const EN: TraductionsProprietaires = {
  titrePage: "Owners and mandates — Staff area",
  espace: "Staff area",
  titre: "Owners and mandates",
  description:
    "Mandate per property: type, commission, dates and status. Read-only for the owner.",
  entiteLien: "Legal entity",
  okRetire: "Mandate removed.",
  okRattache: (proprietaire, logement) =>
    `${proprietaire} is linked to ${logement}.`,
  okEnregistre: "Mandate saved.",
  msgCommission: "Invalid commission (0 to 50%).",
  msgCharges: "Invalid monthly charges (0 to €10,000).",
  msgMode: "Invalid mandate type.",
  msgStatut: "Invalid mandate status.",
  msgDates: "Invalid mandate dates.",
  msgNotes: "Notes are limited to 1,000 characters.",
  msgLogement: "Property not found.",
  msgProprietaire: "Owner not found or inactive.",
  msgInattendu: "Unexpected error. Try again.",
  aucunProprietaire:
    "No active owner. Create a user with the proprietaire role.",
  enregistrerMandat: "Save a mandate",
  aideMandat:
    "The owner only sees linked properties. The “own property” type forces a 0 commission.",
  proprietaire: "Owner",
  logement: "Property",
  commission: "Commission (%)",
  chargesMensuelles: "Monthly charges (€)",
  chargesCourt: "Charges",
  mode: "Type",
  statut: "Status",
  debutFacultatif: "Start (optional)",
  finFacultatif: "End (optional)",
  notesFacultatif: "Notes (optional)",
  enregistrer: "Save mandate",
  mandats: (n) => `${n} mandate${n > 1 ? "s" : ""}`,
  aucunMandat: "No owner mandate.",
  chargesMois: "month",
  retirer: "Remove",
  espaceProprio: "Owner area",
  modes: { propre: "Own property (0 commission)", mandat_tiers: "Third-party mandate" },
  statuts: { actif: "Active", suspendu: "Suspended" },
  dates: (debut, fin) => {
    if (debut && fin) return `From ${debut} to ${fin}`;
    if (debut) return `Since ${debut}`;
    if (fin) return `Until ${fin}`;
    return "";
  },
};

const ES: TraductionsProprietaires = {
  titrePage: "Propietarios y mandatos — Área profesional",
  espace: "Área profesional",
  titre: "Propietarios y mandatos",
  description:
    "Mandato por alojamiento: tipo, comisión, fechas y estado. Solo lectura para el propietario.",
  entiteLien: "Entidad jurídica",
  okRetire: "Mandato retirado.",
  okRattache: (proprietaire, logement) =>
    `${proprietaire} está vinculado a ${logement}.`,
  okEnregistre: "Mandato guardado.",
  msgCommission: "Comisión no válida (0 a 50 %).",
  msgCharges: "Gastos mensuales no válidos (0 a 10.000 €).",
  msgMode: "Tipo de mandato no válido.",
  msgStatut: "Estado del mandato no válido.",
  msgDates: "Fechas del mandato no válidas.",
  msgNotes: "Notas limitadas a 1.000 caracteres.",
  msgLogement: "Alojamiento no encontrado.",
  msgProprietaire: "Propietario no encontrado o inactivo.",
  msgInattendu: "Error inesperado. Inténtelo de nuevo.",
  aucunProprietaire:
    "Ningún propietario activo. Cree un usuario con el rol proprietaire.",
  enregistrerMandat: "Registrar un mandato",
  aideMandat:
    "El propietario solo verá los alojamientos vinculados. El tipo «bien propio» fuerza una comisión del 0 %.",
  proprietaire: "Propietario",
  logement: "Alojamiento",
  commission: "Comisión (%)",
  chargesMensuelles: "Gastos mensuales (€)",
  chargesCourt: "Gastos",
  mode: "Tipo",
  statut: "Estado",
  debutFacultatif: "Inicio (opcional)",
  finFacultatif: "Fin (opcional)",
  notesFacultatif: "Notas (opcional)",
  enregistrer: "Guardar mandato",
  mandats: (n) => `${n} mandato${n > 1 ? "s" : ""}`,
  aucunMandat: "Ningún mandato de propietario.",
  chargesMois: "mes",
  retirer: "Retirar",
  espaceProprio: "Área del propietario",
  modes: { propre: "Bien propio (0 comisión)", mandat_tiers: "Mandato de terceros" },
  statuts: { actif: "Activo", suspendu: "Suspendido" },
  dates: (debut, fin) => {
    if (debut && fin) return `Del ${debut} al ${fin}`;
    if (debut) return `Desde el ${debut}`;
    if (fin) return `Hasta el ${fin}`;
    return "";
  },
};

const IT: TraductionsProprietaires = {
  titrePage: "Proprietari e mandati — Area professionale",
  espace: "Area professionale",
  titre: "Proprietari e mandati",
  description:
    "Mandato per alloggio: tipo, commissione, date e stato. Sola lettura per il proprietario.",
  entiteLien: "Entità giuridica",
  okRetire: "Mandato rimosso.",
  okRattache: (proprietaire, logement) =>
    `${proprietaire} è collegato a ${logement}.`,
  okEnregistre: "Mandato salvato.",
  msgCommission: "Commissione non valida (0–50%).",
  msgCharges: "Spese mensili non valide (0–10.000 €).",
  msgMode: "Tipo di mandato non valido.",
  msgStatut: "Stato del mandato non valido.",
  msgDates: "Date del mandato non valide.",
  msgNotes: "Note limitate a 1.000 caratteri.",
  msgLogement: "Alloggio non trovato.",
  msgProprietaire: "Proprietario non trovato o inattivo.",
  msgInattendu: "Errore imprevisto. Riprovare.",
  aucunProprietaire:
    "Nessun proprietario attivo. Creare un utente con ruolo proprietaire.",
  enregistrerMandat: "Registrare un mandato",
  aideMandat:
    "Il proprietario vede solo gli alloggi collegati. Il tipo «immobile proprio» impone una commissione dello 0%.",
  proprietaire: "Proprietario",
  logement: "Alloggio",
  commission: "Commissione (%)",
  chargesMensuelles: "Spese mensili (€)",
  chargesCourt: "Spese",
  mode: "Tipo",
  statut: "Stato",
  debutFacultatif: "Inizio (facoltativo)",
  finFacultatif: "Fine (facoltativo)",
  notesFacultatif: "Note (facoltativo)",
  enregistrer: "Salvare il mandato",
  mandats: (n) => `${n} mandat${n > 1 ? "i" : "o"}`,
  aucunMandat: "Nessun mandato proprietario.",
  chargesMois: "mese",
  retirer: "Rimuovere",
  espaceProprio: "Area proprietario",
  modes: { propre: "Immobile proprio (0 commissione)", mandat_tiers: "Mandato di terzi" },
  statuts: { actif: "Attivo", suspendu: "Sospeso" },
  dates: (debut, fin) => {
    if (debut && fin) return `Dal ${debut} al ${fin}`;
    if (debut) return `Dal ${debut}`;
    if (fin) return `Fino al ${fin}`;
    return "";
  },
};

const DE: TraductionsProprietaires = {
  titrePage: "Eigentümer und Mandate — Mitarbeiterbereich",
  espace: "Mitarbeiterbereich",
  titre: "Eigentümer und Mandate",
  description:
    "Mandat pro Unterkunft: Art, Provision, Daten und Status. Für Eigentümer schreibgeschützt.",
  entiteLien: "Rechtsträger",
  okRetire: "Mandat entfernt.",
  okRattache: (proprietaire, logement) =>
    `${proprietaire} ist mit ${logement} verknüpft.`,
  okEnregistre: "Mandat gespeichert.",
  msgCommission: "Ungültige Provision (0 bis 50 %).",
  msgCharges: "Ungültige monatliche Kosten (0 bis 10.000 €).",
  msgMode: "Ungültige Mandatsart.",
  msgStatut: "Ungültiger Mandatsstatus.",
  msgDates: "Ungültige Mandatsdaten.",
  msgNotes: "Notizen sind auf 1.000 Zeichen begrenzt.",
  msgLogement: "Unterkunft nicht gefunden.",
  msgProprietaire: "Eigentümer nicht gefunden oder inaktiv.",
  msgInattendu: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  aucunProprietaire:
    "Kein aktiver Eigentümer. Legen Sie einen Benutzer mit der Rolle proprietaire an.",
  enregistrerMandat: "Mandat anlegen",
  aideMandat:
    "Der Eigentümer sieht nur verknüpfte Unterkünfte. Die Art „eigene Immobilie“ erzwingt 0 % Provision.",
  proprietaire: "Eigentümer",
  logement: "Unterkunft",
  commission: "Provision (%)",
  chargesMensuelles: "Monatliche Kosten (€)",
  chargesCourt: "Kosten",
  mode: "Art",
  statut: "Status",
  debutFacultatif: "Beginn (optional)",
  finFacultatif: "Ende (optional)",
  notesFacultatif: "Notizen (optional)",
  enregistrer: "Mandat speichern",
  mandats: (n) => `${n} Mandat${n > 1 ? "e" : ""}`,
  aucunMandat: "Kein Eigentümermandat.",
  chargesMois: "Monat",
  retirer: "Entfernen",
  espaceProprio: "Eigentümerbereich",
  modes: { propre: "Eigene Immobilie (0 Provision)", mandat_tiers: "Drittmandat" },
  statuts: { actif: "Aktiv", suspendu: "Ausgesetzt" },
  dates: (debut, fin) => {
    if (debut && fin) return `Vom ${debut} bis ${fin}`;
    if (debut) return `Seit ${debut}`;
    if (fin) return `Bis ${fin}`;
    return "";
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsProprietaires> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsProprietaires(langue: string): TraductionsProprietaires {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
