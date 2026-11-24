import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsNavigation {
  exploitation: string;
  relation: string;
  conformite: string;
  administration: string;
  voirSite: string;
  quitter: string;
  quitterApercu: string;
  plus: string;
  supervision: string;
  apparence: string;
  espaces: string;
  maintenance: string;
  journaux: string;
  langue: string;
  preferences: string;
  navigationPrincipale: string;
  apercuLectureSeule: (role: string) => string;
  tableau: string;
  logements: string;
  planning: string;
  canaux: string;
  menage: string;
  factures: string;
  compta: string;
  rapports: string;
  messages: string;
  filsVoyageurs: string;
  automatisations: string;
  notifications: string;
  installation: string;
  prix: string;
  promotions: string;
  demandes: string;
  demandesExtra: string;
  etatsDesLieux: string;
  entretien: string;
  missions: string;
  intervenants: string;
  dispatch: string;
  cautions: string;
  extras: string;
  stocks: string;
  inventaire: string;
  guides: string;
  assistant: string;
  avis: string;
  avisVoyageur: string;
  questionnaires: string;
  objetsTrouves: string;
  sinistres: string;
  tranquillite: string;
  tourisme: string;
  phrases: string;
  annonce: string;
  onboarding: string;
  formation: string;
  police: string;
  rgpd: string;
  recherche: string;
  acces: string;
  proprietaires: string;
  entite: string;
  integrations: string;
  audit: string;
  utilisateurs: string;
  securite: string;
  roles: Record<string, string>;
  espaceHote: string;
}

const FR: TraductionsNavigation = {
  exploitation: "Exploitation",
  relation: "Relation voyageur",
  conformite: "Conformité",
  administration: "Administration",
  voirSite: "Voir le site",
  quitter: "Quitter",
  quitterApercu: "Quitter l’aperçu",
  plus: "Plus",
  supervision: "Supervision plateforme",
  apparence: "Apparence",
  espaces: "Espaces",
  maintenance: "Maintenance",
  journaux: "Journaux applicatifs",
  langue: "Langue",
  preferences: "Préférences",
  navigationPrincipale: "Navigation principale",
  apercuLectureSeule: (role) => `Aperçu lecture seule — rôle « ${role} ». Toute écriture est bloquée.`,
  tableau: "Tableau de bord",
  logements: "Logements",
  planning: "Planning",
  canaux: "Canaux",
  menage: "Ménage",
  factures: "Factures",
  compta: "Compta",
  rapports: "Rapports",
  messages: "Messages",
  filsVoyageurs: "Fils voyageurs",
  automatisations: "Automatisations",
  notifications: "Notifications",
  installation: "Installation (PWA)",
  prix: "Prix",
  promotions: "Promotions",
  demandes: "Demandes",
  demandesExtra: "Demandes d'extras",
  etatsDesLieux: "États des lieux",
  entretien: "Entretien",
  missions: "Missions",
  intervenants: "Intervenants",
  dispatch: "Dispatch",
  cautions: "Cautions",
  extras: "Extras",
  stocks: "Stocks",
  inventaire: "Inventaire",
  guides: "Guides logement",
  assistant: "Assistant",
  avis: "Avis",
  avisVoyageur: "Avis voyageurs",
  questionnaires: "Questionnaires",
  objetsTrouves: "Objets trouvés",
  sinistres: "Sinistres",
  tranquillite: "Tranquillité",
  tourisme: "Tourisme",
  phrases: "Phrases types",
  annonce: "Annonce",
  onboarding: "Onboarding",
  formation: "Formation",
  police: "Police",
  rgpd: "RGPD",
  recherche: "Recherche",
  acces: "Accès",
  proprietaires: "Propriétaires",
  entite: "Entité",
  integrations: "Intégrations",
  audit: "Audit",
  utilisateurs: "Utilisateurs",
  securite: "Sécurité",
  roles: {
    admin: "Administrateur", hote: "Hôte", operateur: "Opérateur",
    comptable: "Comptable", presta: "Prestataire", proprietaire: "Propriétaire",
    commercial: "Commercial", super_admin: "Super-admin",
  },
  espaceHote: "Espace hôte",
};

const EN: TraductionsNavigation = {
  exploitation: "Operations",
  relation: "Guest relations",
  conformite: "Compliance",
  administration: "Administration",
  voirSite: "View site",
  quitter: "Sign out",
  quitterApercu: "Exit preview",
  plus: "More",
  supervision: "Platform supervision",
  apparence: "Appearance",
  espaces: "Spaces",
  maintenance: "Maintenance",
  journaux: "Application logs",
  langue: "Language",
  preferences: "Preferences",
  navigationPrincipale: "Main navigation",
  apercuLectureSeule: (role) => `Read-only preview — “${role}” role. All writes are blocked.`,
  tableau: "Dashboard",
  logements: "Properties",
  planning: "Calendar",
  canaux: "Channels",
  menage: "Cleaning",
  factures: "Invoices",
  compta: "Accounting",
  rapports: "Reports",
  messages: "Messages",
  filsVoyageurs: "Guest threads",
  automatisations: "Automations",
  notifications: "Notifications",
  installation: "Installation (PWA)",
  prix: "Pricing",
  promotions: "Promotions",
  demandes: "Requests",
  demandesExtra: "Extra requests",
  etatsDesLieux: "Inventory checks",
  entretien: "Maintenance",
  missions: "Tasks",
  intervenants: "Providers",
  dispatch: "Dispatch",
  cautions: "Deposits",
  extras: "Extras",
  stocks: "Stock",
  inventaire: "Inventory",
  guides: "Property guides",
  assistant: "Assistant",
  avis: "Reviews",
  avisVoyageur: "Guest reviews",
  questionnaires: "Questionnaires",
  objetsTrouves: "Lost property",
  sinistres: "Claims",
  tranquillite: "Neighbourhood",
  tourisme: "Tourism",
  phrases: "Message templates",
  annonce: "Listing",
  onboarding: "Onboarding",
  formation: "Training",
  police: "Police",
  rgpd: "GDPR",
  recherche: "Search",
  acces: "Access",
  proprietaires: "Owners",
  entite: "Entity",
  integrations: "Integrations",
  audit: "Audit",
  utilisateurs: "Users",
  securite: "Security",
  roles: {
    admin: "Administrator", hote: "Host", operateur: "Operator",
    comptable: "Accountant", presta: "Provider", proprietaire: "Owner",
    commercial: "Sales", super_admin: "Super-admin",
  },
  espaceHote: "Staff area",
};

const ES: TraductionsNavigation = {
  exploitation: "Operaciones",
  relation: "Relación con el viajero",
  conformite: "Cumplimiento",
  administration: "Administración",
  voirSite: "Ver el sitio",
  quitter: "Salir",
  quitterApercu: "Salir de la vista previa",
  plus: "Más",
  supervision: "Supervisión de la plataforma",
  apparence: "Apariencia",
  espaces: "Espacios",
  maintenance: "Mantenimiento",
  journaux: "Registros de la aplicación",
  langue: "Idioma",
  preferences: "Preferencias",
  navigationPrincipale: "Navegación principal",
  apercuLectureSeule: (role) => `Vista previa de solo lectura — rol «${role}». Toda escritura está bloqueada.`,
  tableau: "Panel",
  logements: "Alojamientos",
  planning: "Calendario",
  canaux: "Canales",
  menage: "Limpieza",
  factures: "Facturas",
  compta: "Contabilidad",
  rapports: "Informes",
  messages: "Mensajes",
  filsVoyageurs: "Hilos de huéspedes",
  automatisations: "Automatizaciones",
  notifications: "Notificaciones",
  installation: "Instalación (PWA)",
  prix: "Precios",
  promotions: "Promociones",
  demandes: "Solicitudes",
  demandesExtra: "Solicitudes de extras",
  etatsDesLieux: "Inventarios",
  entretien: "Mantenimiento",
  missions: "Misiones",
  intervenants: "Prestadores",
  dispatch: "Asignación",
  cautions: "Fianzas",
  extras: "Extras",
  stocks: "Existencias",
  inventaire: "Inventario",
  guides: "Guías del alojamiento",
  assistant: "Asistente",
  avis: "Opiniones",
  avisVoyageur: "Opiniones de huéspedes",
  questionnaires: "Cuestionarios",
  objetsTrouves: "Objetos perdidos",
  sinistres: "Siniestros",
  tranquillite: "Tranquilidad",
  tourisme: "Turismo",
  phrases: "Frases tipo",
  annonce: "Anuncio",
  onboarding: "Incorporación",
  formation: "Formación",
  police: "Policía",
  rgpd: "RGPD",
  recherche: "Búsqueda",
  acces: "Accesos",
  proprietaires: "Propietarios",
  entite: "Entidad",
  integrations: "Integraciones",
  audit: "Auditoría",
  utilisateurs: "Usuarios",
  securite: "Seguridad",
  roles: {
    admin: "Administrador", hote: "Anfitrión", operateur: "Operador",
    comptable: "Contable", presta: "Proveedor", proprietaire: "Propietario",
    commercial: "Comercial", super_admin: "Super-admin",
  },
  espaceHote: "Área profesional",
};

const IT: TraductionsNavigation = {
  exploitation: "Operatività",
  relation: "Relazione con il viaggiatore",
  conformite: "Conformità",
  administration: "Amministrazione",
  voirSite: "Vedi il sito",
  quitter: "Esci",
  quitterApercu: "Esci dall’anteprima",
  plus: "Altro",
  supervision: "Supervisione della piattaforma",
  apparence: "Aspetto",
  espaces: "Spazi",
  maintenance: "Manutenzione",
  journaux: "Registri dell’applicazione",
  langue: "Lingua",
  preferences: "Preferenze",
  navigationPrincipale: "Navigazione principale",
  apercuLectureSeule: (role) => `Anteprima sola lettura — ruolo «${role}». Ogni scrittura è bloccata.`,
  tableau: "Dashboard",
  logements: "Alloggi",
  planning: "Calendario",
  canaux: "Canali",
  menage: "Pulizie",
  factures: "Fatture",
  compta: "Contabilità",
  rapports: "Report",
  messages: "Messaggi",
  filsVoyageurs: "Conversazioni ospiti",
  automatisations: "Automazioni",
  notifications: "Notifiche",
  installation: "Installazione (PWA)",
  prix: "Prezzi",
  promotions: "Promozioni",
  demandes: "Richieste",
  demandesExtra: "Richieste extra",
  etatsDesLieux: "Stati dei luoghi",
  entretien: "Manutenzione",
  missions: "Incarichi",
  intervenants: "Fornitori",
  dispatch: "Assegnazione",
  cautions: "Cauzioni",
  extras: "Extra",
  stocks: "Scorte",
  inventaire: "Inventario",
  guides: "Guide alloggio",
  assistant: "Assistente",
  avis: "Recensioni",
  avisVoyageur: "Recensioni ospiti",
  questionnaires: "Questionari",
  objetsTrouves: "Oggetti smarriti",
  sinistres: "Sinistri",
  tranquillite: "Tranquillità",
  tourisme: "Turismo",
  phrases: "Frasi predefinite",
  annonce: "Annuncio",
  onboarding: "Onboarding",
  formation: "Formazione",
  police: "Polizia",
  rgpd: "GDPR",
  recherche: "Ricerca",
  acces: "Accessi",
  proprietaires: "Proprietari",
  entite: "Entità",
  integrations: "Integrazioni",
  audit: "Audit",
  utilisateurs: "Utenti",
  securite: "Sicurezza",
  roles: {
    admin: "Amministratore", hote: "Host", operateur: "Operatore",
    comptable: "Contabile", presta: "Fornitore", proprietaire: "Proprietario",
    commercial: "Commerciale", super_admin: "Super-admin",
  },
  espaceHote: "Area professionale",
};

const DE: TraductionsNavigation = {
  exploitation: "Betrieb",
  relation: "Gästebeziehung",
  conformite: "Compliance",
  administration: "Verwaltung",
  voirSite: "Website ansehen",
  quitter: "Abmelden",
  quitterApercu: "Vorschau beenden",
  plus: "Mehr",
  supervision: "Plattformaufsicht",
  apparence: "Darstellung",
  espaces: "Bereiche",
  maintenance: "Wartung",
  journaux: "Anwendungsprotokolle",
  langue: "Sprache",
  preferences: "Einstellungen",
  navigationPrincipale: "Hauptnavigation",
  apercuLectureSeule: (role) => `Schreibgeschützte Vorschau — Rolle „${role}“. Alle Schreibvorgänge sind gesperrt.`,
  tableau: "Dashboard",
  logements: "Unterkünfte",
  planning: "Kalender",
  canaux: "Kanäle",
  menage: "Reinigung",
  factures: "Rechnungen",
  compta: "Buchhaltung",
  rapports: "Berichte",
  messages: "Nachrichten",
  filsVoyageurs: "Gästeverläufe",
  automatisations: "Automatisierungen",
  notifications: "Benachrichtigungen",
  installation: "Installation (PWA)",
  prix: "Preise",
  promotions: "Aktionen",
  demandes: "Anfragen",
  demandesExtra: "Extra-Anfragen",
  etatsDesLieux: "Zustandsberichte",
  entretien: "Wartung",
  missions: "Aufträge",
  intervenants: "Dienstleister",
  dispatch: "Disposition",
  cautions: "Kautionen",
  extras: "Extras",
  stocks: "Bestand",
  inventaire: "Inventar",
  guides: "Unterkunftsguides",
  assistant: "Assistent",
  avis: "Bewertungen",
  avisVoyageur: "Gästebewertungen",
  questionnaires: "Fragebögen",
  objetsTrouves: "Fundsachen",
  sinistres: "Schadensfälle",
  tranquillite: "Nachbarschaft",
  tourisme: "Tourismus",
  phrases: "Textvorlagen",
  annonce: "Inserat",
  onboarding: "Onboarding",
  formation: "Schulung",
  police: "Polizei",
  rgpd: "DSGVO",
  recherche: "Suche",
  acces: "Zugriff",
  proprietaires: "Eigentümer",
  entite: "Einheit",
  integrations: "Integrationen",
  audit: "Audit",
  utilisateurs: "Benutzer",
  securite: "Sicherheit",
  roles: {
    admin: "Administrator", hote: "Gastgeber", operateur: "Operator",
    comptable: "Buchhalter", presta: "Dienstleister", proprietaire: "Eigentümer",
    commercial: "Vertrieb", super_admin: "Super-Admin",
  },
  espaceHote: "Profibereich",
};

const DICTIONNAIRES: Record<Langue, TraductionsNavigation> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsNavigation(langue: string): TraductionsNavigation {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}

