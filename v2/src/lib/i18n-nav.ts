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
  langue: string;
  navigationPrincipale: string;
  apercuLectureSeule: (role: string) => string;
  tableau: string;
  logements: string;
  planning: string;
  canaux: string;
  menage: string;
  factures: string;
  compta: string;
  messages: string;
  prix: string;
  promotions: string;
  demandes: string;
  etatsDesLieux: string;
  entretien: string;
  missions: string;
  dispatch: string;
  cautions: string;
  extras: string;
  stocks: string;
  inventaire: string;
  guides: string;
  assistant: string;
  avis: string;
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
  langue: "Langue",
  navigationPrincipale: "Navigation principale",
  apercuLectureSeule: (role) => `Aperçu lecture seule — rôle « ${role} ». Toute écriture est bloquée.`,
  tableau: "Tableau de bord",
  logements: "Logements",
  planning: "Planning",
  canaux: "Canaux",
  menage: "Ménage",
  factures: "Factures",
  compta: "Compta",
  messages: "Messages",
  prix: "Prix",
  promotions: "Promotions",
  demandes: "Demandes",
  etatsDesLieux: "États des lieux",
  entretien: "Entretien",
  missions: "Missions",
  dispatch: "Dispatch",
  cautions: "Cautions",
  extras: "Extras",
  stocks: "Stocks",
  inventaire: "Inventaire",
  guides: "Guides logement",
  assistant: "Assistant",
  avis: "Avis",
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
  langue: "Language",
  navigationPrincipale: "Main navigation",
  apercuLectureSeule: (role) => `Read-only preview — “${role}” role. All writes are blocked.`,
  tableau: "Dashboard",
  logements: "Properties",
  planning: "Calendar",
  canaux: "Channels",
  menage: "Cleaning",
  factures: "Invoices",
  compta: "Accounting",
  messages: "Messages",
  prix: "Pricing",
  promotions: "Promotions",
  demandes: "Requests",
  etatsDesLieux: "Inventory checks",
  entretien: "Maintenance",
  missions: "Tasks",
  dispatch: "Dispatch",
  cautions: "Deposits",
  extras: "Extras",
  stocks: "Stock",
  inventaire: "Inventory",
  guides: "Property guides",
  assistant: "Assistant",
  avis: "Reviews",
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
  langue: "Idioma",
  navigationPrincipale: "Navegación principal",
  apercuLectureSeule: (role) => `Vista previa de solo lectura — rol «${role}». Toda escritura está bloqueada.`,
  tableau: "Panel",
  logements: "Alojamientos",
  planning: "Calendario",
  canaux: "Canales",
  menage: "Limpieza",
  factures: "Facturas",
  compta: "Contabilidad",
  messages: "Mensajes",
  prix: "Precios",
  promotions: "Promociones",
  demandes: "Solicitudes",
  etatsDesLieux: "Inventarios",
  entretien: "Mantenimiento",
  missions: "Misiones",
  dispatch: "Asignación",
  cautions: "Fianzas",
  extras: "Extras",
  stocks: "Existencias",
  inventaire: "Inventario",
  guides: "Guías del alojamiento",
  assistant: "Asistente",
  avis: "Opiniones",
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
  langue: "Lingua",
  navigationPrincipale: "Navigazione principale",
  apercuLectureSeule: (role) => `Anteprima sola lettura — ruolo «${role}». Ogni scrittura è bloccata.`,
  tableau: "Dashboard",
  logements: "Alloggi",
  planning: "Calendario",
  canaux: "Canali",
  menage: "Pulizie",
  factures: "Fatture",
  compta: "Contabilità",
  messages: "Messaggi",
  prix: "Prezzi",
  promotions: "Promozioni",
  demandes: "Richieste",
  etatsDesLieux: "Stati dei luoghi",
  entretien: "Manutenzione",
  missions: "Incarichi",
  dispatch: "Assegnazione",
  cautions: "Cauzioni",
  extras: "Extra",
  stocks: "Scorte",
  inventaire: "Inventario",
  guides: "Guide alloggio",
  assistant: "Assistente",
  avis: "Recensioni",
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
  langue: "Sprache",
  navigationPrincipale: "Hauptnavigation",
  apercuLectureSeule: (role) => `Schreibgeschützte Vorschau — Rolle „${role}“. Alle Schreibvorgänge sind gesperrt.`,
  tableau: "Dashboard",
  logements: "Unterkünfte",
  planning: "Kalender",
  canaux: "Kanäle",
  menage: "Reinigung",
  factures: "Rechnungen",
  compta: "Buchhaltung",
  messages: "Nachrichten",
  prix: "Preise",
  promotions: "Aktionen",
  demandes: "Anfragen",
  etatsDesLieux: "Zustandsberichte",
  entretien: "Wartung",
  missions: "Aufträge",
  dispatch: "Disposition",
  cautions: "Kautionen",
  extras: "Extras",
  stocks: "Bestand",
  inventaire: "Inventar",
  guides: "Unterkunftsguides",
  assistant: "Assistent",
  avis: "Bewertungen",
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

