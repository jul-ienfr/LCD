import { LANGUES, type Langue } from "@/lib/i18n";

/**
 * Dictionnaire de la vitrine publique (`/`).
 *
 * Contrat (tâche T015/T035 du plan 004) :
 * - les cinq langues de `LANGUES` sont présentes, avec **exactement les mêmes
 *   clés** et aucune valeur vide (`tests/ergonomie/i18n-vitrine.test.ts`) ;
 * - `traductionsVitrine()` replie sur le français pour toute langue inconnue ;
 * - aucun JavaScript n'est requis : le serveur rend la bonne langue via `?lang=`.
 */

/** Une preuve chiffrée affichée en paire valeur / libellé. */
export interface PreuveVitrine {
  valeur: string;
  libelle: string;
}

/** Une étape du récit d'arrivée. */
export interface EngagementVitrine {
  numero: string;
  titre: string;
  texte: string;
}

/** Une photo de la galerie, avec son texte alternatif traduit. */
export interface PhotoVitrine {
  alt: string;
  surtitre?: string;
  titre?: string;
}

/** Une formule destinée aux propriétaires. */
export interface FormuleVitrine {
  nom: string;
  prix: string;
  base: string;
  cible: string;
  points: string[];
  enAvant?: boolean;
}

export interface TraductionsVitrine {
  /** Code BCP-47 : `Intl`, `og:locale`, `hreflang`. */
  locale: string;
  /** Nom de la langue, pour le sélecteur. */
  langue: string;
  /** Balise `title`, `{nom}` remplacé par l'identité du tenant. */
  metaTitre: string;
  metaDescription: string;
  lienEvitement: string;
  navPrincipale: string;
  navAccueil: string;
  navSejours: string;
  navAide: string;
  navProprietaires: string;
  navSeConnecter: string;
  ctaReserver: string;
  ouvrirMenu: string;
  choisirLangue: string;
  heroSurtitre: string;
  heroTitre: string;
  heroTexte: string;
  /** Texte alternatif de la photo d'ouverture. */
  heroImageAlt: string;
  /** « Séjours à partir de » — suivi du prix d'appel réel. */
  heroPrixPrefix: string;
  etiquettes: string[];
  /** Nom accessible de la région défilante qui liste `etiquettes`. */
  etiquettesTitre: string;
  rechercheTitre: string;
  rechercheDestination: string;
  rechercheDestinationValeur: string;
  rechercheArrivee: string;
  rechercheDepart: string;
  rechercheRechercher: string;
  preuveTitre: string;
  preuveTexte: string;
  preuves: PreuveVitrine[];
  maisonsSurtitre: string;
  maisonsTitre: string;
  maisonsTexte: string;
  /** Les quatre photos de la galerie, dans l'ordre du gabarit (`tsconfig` :
   * `noUncheckedIndexedAccess`, d'où le tuple plutôt qu'un tableau). */
  maisonsPhotos: [PhotoVitrine, PhotoVitrine, PhotoVitrine, PhotoVitrine];
  sejourSurtitre: string;
  sejourTitre: string;
  sejourTexte: string;
  engagements: EngagementVitrine[];
  proprietairesSurtitre: string;
  proprietairesTitre: string;
  proprietairesTexte: string;
  proprietairesCta: string;
  proprietairesCtaSecondaire: string;
  proprietairesImageAlt: string;
  formulesSurtitre: string;
  formulesTitre: string;
  formulesNote: string;
  formules: FormuleVitrine[];
  formulePopulaire: string;
  formuleCta: string;
  adressesSurtitre: string;
  adressesTitre: string;
  adressesTout: string;
  adressesVide: string;
  adressesVideCta: string;
  adressesVideSuite: string;
  adressesNuit: string;
  adressesVoir: string;
  /** Connecteur du texte alternatif : « {nom} à {adresse} ». */
  adressesLieu: string;
  finalSurtitre: string;
  finalTitre: string;
  finalCta: string;
  finalCtaSecondaire: string;
  piedSlogan: string;
  piedSejours: string;
  piedReserver: string;
  piedAide: string;
  piedDesign: string;
  piedProprietaires: string;
  piedEspaceHote: string;
  piedConfier: string;
  piedTableauBord: string;
  piedInformations: string;
  piedMentions: string;
  piedAvis: string;
  piedVersionLegere: string;
  piedDroits: string;
  piedSansJs: string;
}

const FR: TraductionsVitrine = {
  locale: "fr-FR",
  langue: "Français",
  metaTitre: "{nom} — séjours sur la Côte d’Azur",
  metaDescription:
    "Maisons choisies, arrivée autonome, ménage hôtelier et assistance 24/7. Réservez en direct, sans commission.",
  lienEvitement: "Aller au contenu",
  navPrincipale: "Navigation principale",
  navAccueil: "Accueil",
  navSejours: "Séjours",
  navAide: "Aide",
  navProprietaires: "Propriétaires",
  navSeConnecter: "Se connecter",
  ctaReserver: "Réserver",
  ouvrirMenu: "Ouvrir le menu",
  choisirLangue: "Choisir la langue",
  heroSurtitre: "Côte d’Azur · conciergerie indépendante",
  heroTitre: "Des maisons qui donnent envie de rester.",
  heroTexte:
    "Des adresses choisies, préparées et suivies par une équipe locale. Réservez en direct, sans commission de plateforme.",
  heroImageAlt: "Maison de vacances avec piscine et terrasse",
  heroPrixPrefix: "Séjours à partir de",
  etiquettes: [
    "Réservation directe",
    "Arrivée autonome",
    "Ménage hôtelier",
    "Linge inclus",
    "Assistance 7 j/7",
    "Sans commission",
  ],
  etiquettesTitre: "Caractéristiques",
  rechercheTitre: "Trouver un séjour",
  rechercheDestination: "Destination",
  rechercheDestinationValeur: "Côte d’Azur",
  rechercheArrivee: "Arrivée",
  rechercheDepart: "Départ",
  rechercheRechercher: "Rechercher",
  preuveTitre: "L’hospitalité d’une maison privée, la précision d’un hôtel.",
  preuveTexte:
    "Nous ne listons pas des annonces. Nous préparons des maisons, formons les équipes qui y interviennent et restons joignables pendant tout votre séjour.",
  preuves: [
    { valeur: "0 %", libelle: "commission" },
    { valeur: "5", libelle: "langues" },
    { valeur: "24/7", libelle: "assistance" },
  ],
  maisonsSurtitre: "Les maisons",
  maisonsTitre: "Des lieux qui ont une âme.",
  maisonsTexte:
    "Lumière du matin, vue dégagée, vraie cuisine : nous choisissons les maisons comme si nous devions y dormir.",
  maisonsPhotos: [
    {
      alt: "Salon lumineux ouvert sur une terrasse",
      surtitre: "Le salon",
      titre: "Ouvert sur la terrasse",
    },
    {
      alt: "Piscine privée entourée de végétation",
      surtitre: "Le matin",
      titre: "Le premier plongeon",
    },
    { alt: "Chambre préparée avec linge hôtelier" },
    { alt: "Terrasse ombragée pour les repas" },
  ],
  sejourSurtitre: "Le séjour",
  sejourTitre: "Vous arrivez. Tout est déjà là.",
  sejourTexte:
    "Pas de boîte à clés introuvable, pas de ménage à refaire, pas de numéro qui sonne dans le vide.",
  engagements: [
    {
      numero: "01",
      titre: "Une maison préparée",
      texte:
        "Lits faits, linge hôtelier, produits d’accueil et climatisation vérifiée avant chaque arrivée.",
    },
    {
      numero: "02",
      titre: "Une arrivée sans friction",
      texte:
        "Instructions claires, boîte à clés sécurisée et assistance joignable jusqu’à minuit.",
    },
    {
      numero: "03",
      titre: "Un séjour suivi",
      texte:
        "Un seul numéro pour la moindre question, du premier petit-déjeuner au départ.",
    },
  ],
  proprietairesSurtitre: "Propriétaires",
  proprietairesTitre: "Votre maison mérite une équipe, pas un logiciel de plus.",
  proprietairesTexte:
    "Nous prenons en charge les séjours, la relation voyageur et la maintenance pendant que vous gardez la main sur les prix et le calendrier. Un seul interlocuteur, un relevé clair chaque mois.",
  proprietairesCta: "Confier mon logement",
  proprietairesCtaSecondaire: "Comment ça marche",
  proprietairesImageAlt: "Maison contemporaine avec jardin",
  formulesSurtitre: "Propriétaires",
  formulesTitre: "Un prix par logement, pas une commission.",
  formulesNote:
    "Indicatif — le devis dépend du nombre de logements et du niveau de service.",
  formules: [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / logement / mois",
      cible: "La boîte à outils pour propriétaire autonome.",
      points: ["Moteurs installés", "Vente directe", "Support communautaire"],
    },
    {
      nom: "Pilotage",
      prix: "190",
      base: "€ / logement / mois",
      cible: "L’exploitation déléguée, sans perdre la main.",
      points: [
        "Tout le Kit",
        "Ménage et dispatch pilotés",
        "Relevé mensuel propriétaire",
      ],
      enAvant: true,
    },
    {
      nom: "Full service",
      prix: "290",
      base: "€ / logement / mois",
      cible: "La gestion complète, clé en main.",
      points: [
        "Tout le Pilotage",
        "Conciergerie et urgences",
        "Compta et reversement J+5",
      ],
    },
  ],
  formulePopulaire: "Le plus choisi",
  formuleCta: "Demander une offre",
  adressesSurtitre: "Disponibles maintenant",
  adressesTitre: "Nos adresses.",
  adressesTout: "Voir toutes les disponibilités",
  adressesVide: "Les prochaines disponibilités sont en préparation.",
  adressesVideCta: "Contactez-nous",
  adressesVideSuite: "pour être prévenu.",
  adressesNuit: "la nuit",
  adressesVoir: "Voir les disponibilités →",
  adressesLieu: "à",
  finalSurtitre: "Prêt à partir",
  finalTitre: "Votre prochain séjour commence ici.",
  finalCta: "Voir les disponibilités",
  finalCtaSecondaire: "Poser une question",
  piedSlogan:
    "Conciergerie indépendante sur la Côte d’Azur. Des maisons préparées, des séjours suivis.",
  piedSejours: "Séjours",
  piedReserver: "Réserver",
  piedAide: "Aide",
  piedDesign: "Design system",
  piedProprietaires: "Propriétaires",
  piedEspaceHote: "Espace hôte",
  piedConfier: "Confier un logement",
  piedTableauBord: "Tableau de bord",
  piedInformations: "Informations",
  piedMentions: "Mentions légales",
  piedAvis: "Donner mon avis sur le site",
  piedVersionLegere: "Version légère",
  piedDroits: "Tous droits réservés.",
  piedSansJs: "Site accessible sans JavaScript · Hébergé en Europe",
};

const EN: TraductionsVitrine = {
  locale: "en-GB",
  langue: "English",
  metaTitre: "{nom} — stays on the French Riviera",
  metaDescription:
    "Handpicked homes, self check-in, hotel-grade cleaning and 24/7 support. Book direct, with no commission.",
  lienEvitement: "Skip to content",
  navPrincipale: "Main navigation",
  navAccueil: "Home",
  navSejours: "Stays",
  navAide: "Help",
  navProprietaires: "Owners",
  navSeConnecter: "Sign in",
  ctaReserver: "Book",
  ouvrirMenu: "Open menu",
  choisirLangue: "Choose language",
  heroSurtitre: "French Riviera · independent concierge",
  heroTitre: "Homes that make you want to stay.",
  heroTexte:
    "Addresses chosen, prepared and looked after by a local team. Book direct, with no platform commission.",
  heroImageAlt: "Holiday home with a pool and a terrace",
  heroPrixPrefix: "Stays from",
  etiquettes: [
    "Direct booking",
    "Self check-in",
    "Hotel-grade cleaning",
    "Linen included",
    "Support 7 days a week",
    "No commission",
  ],
  etiquettesTitre: "Features",
  rechercheTitre: "Find a stay",
  rechercheDestination: "Destination",
  rechercheDestinationValeur: "French Riviera",
  rechercheArrivee: "Check-in",
  rechercheDepart: "Check-out",
  rechercheRechercher: "Search",
  preuveTitre: "The hospitality of a private home, the precision of a hotel.",
  preuveTexte:
    "We do not list adverts. We prepare homes, train the teams who work in them and stay reachable throughout your stay.",
  preuves: [
    { valeur: "0 %", libelle: "commission" },
    { valeur: "5", libelle: "languages" },
    { valeur: "24/7", libelle: "support" },
  ],
  maisonsSurtitre: "The homes",
  maisonsTitre: "Places with a soul.",
  maisonsTexte:
    "Morning light, open views, a real kitchen: we choose homes as if we were going to sleep in them.",
  maisonsPhotos: [
    {
      alt: "Bright living room opening onto a terrace",
      surtitre: "The living room",
      titre: "Open to the terrace",
    },
    {
      alt: "Private pool surrounded by greenery",
      surtitre: "The morning",
      titre: "The first dip",
    },
    { alt: "Bedroom prepared with hotel linen" },
    { alt: "Shaded terrace for meals" },
  ],
  sejourSurtitre: "The stay",
  sejourTitre: "You arrive. Everything is already there.",
  sejourTexte:
    "No missing key box, no cleaning to redo, no number ringing into the void.",
  engagements: [
    {
      numero: "01",
      titre: "A home made ready",
      texte:
        "Beds made, hotel linen, welcome products and air conditioning checked before every arrival.",
    },
    {
      numero: "02",
      titre: "A frictionless arrival",
      texte:
        "Clear instructions, a secure key box and help available until midnight.",
    },
    {
      numero: "03",
      titre: "A stay that is looked after",
      texte:
        "One number for the smallest question, from the first breakfast to check-out.",
    },
  ],
  proprietairesSurtitre: "Owners",
  proprietairesTitre: "Your home deserves a team, not one more piece of software.",
  proprietairesTexte:
    "We take care of the stays, the guest relationship and maintenance while you keep control of prices and the calendar. One contact, a clear statement every month.",
  proprietairesCta: "Entrust my property",
  proprietairesCtaSecondaire: "How it works",
  proprietairesImageAlt: "Contemporary house with a garden",
  formulesSurtitre: "Owners",
  formulesTitre: "A price per property, not a commission.",
  formulesNote:
    "Indicative — the quote depends on the number of properties and the level of service.",
  formules: [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / property / month",
      cible: "The toolbox for independent owners.",
      points: ["Channels installed", "Direct sales", "Community support"],
    },
    {
      nom: "Managed",
      prix: "190",
      base: "€ / property / month",
      cible: "Delegated operations without losing control.",
      points: [
        "Everything in Kit",
        "Cleaning and dispatch managed",
        "Monthly owner statement",
      ],
      enAvant: true,
    },
    {
      nom: "Full service",
      prix: "290",
      base: "€ / property / month",
      cible: "Complete, turnkey management.",
      points: [
        "Everything in Managed",
        "Concierge and emergencies",
        "Accounting and payout in 5 days",
      ],
    },
  ],
  formulePopulaire: "Most chosen",
  formuleCta: "Request a quote",
  adressesSurtitre: "Available now",
  adressesTitre: "Our addresses.",
  adressesTout: "See all availability",
  adressesVide: "The next available dates are being prepared.",
  adressesVideCta: "Contact us",
  adressesVideSuite: "to be notified.",
  adressesNuit: "per night",
  adressesVoir: "See availability →",
  adressesLieu: "in",
  finalSurtitre: "Ready to go",
  finalTitre: "Your next stay starts here.",
  finalCta: "See availability",
  finalCtaSecondaire: "Ask a question",
  piedSlogan:
    "Independent concierge on the French Riviera. Homes prepared, stays looked after.",
  piedSejours: "Stays",
  piedReserver: "Book",
  piedAide: "Help",
  piedDesign: "Design system",
  piedProprietaires: "Owners",
  piedEspaceHote: "Host area",
  piedConfier: "Entrust a property",
  piedTableauBord: "Dashboard",
  piedInformations: "Information",
  piedMentions: "Legal notice",
  piedAvis: "Give feedback on the site",
  piedVersionLegere: "Light version",
  piedDroits: "All rights reserved.",
  piedSansJs: "Site usable without JavaScript · Hosted in Europe",
};

const ES: TraductionsVitrine = {
  locale: "es-ES",
  langue: "Español",
  metaTitre: "{nom} — estancias en la Costa Azul",
  metaDescription:
    "Casas seleccionadas, llegada autónoma, limpieza de hotel y asistencia 24/7. Reserva en directo, sin comisión.",
  lienEvitement: "Ir al contenido",
  navPrincipale: "Navegación principal",
  navAccueil: "Inicio",
  navSejours: "Estancias",
  navAide: "Ayuda",
  navProprietaires: "Propietarios",
  navSeConnecter: "Iniciar sesión",
  ctaReserver: "Reservar",
  ouvrirMenu: "Abrir el menú",
  choisirLangue: "Elegir idioma",
  heroSurtitre: "Costa Azul · conserjería independiente",
  heroTitre: "Casas que invitan a quedarse.",
  heroTexte:
    "Direcciones elegidas, preparadas y atendidas por un equipo local. Reserva en directo, sin comisión de plataforma.",
  heroImageAlt: "Casa de vacaciones con piscina y terraza",
  heroPrixPrefix: "Estancias desde",
  etiquettes: [
    "Reserva directa",
    "Llegada autónoma",
    "Limpieza de hotel",
    "Ropa de cama incluida",
    "Asistencia 7 días",
    "Sin comisión",
  ],
  etiquettesTitre: "Características",
  rechercheTitre: "Buscar una estancia",
  rechercheDestination: "Destino",
  rechercheDestinationValeur: "Costa Azul",
  rechercheArrivee: "Llegada",
  rechercheDepart: "Salida",
  rechercheRechercher: "Buscar",
  preuveTitre: "La hospitalidad de una casa privada, la precisión de un hotel.",
  preuveTexte:
    "No publicamos anuncios. Preparamos casas, formamos a los equipos que intervienen en ellas y seguimos disponibles durante toda la estancia.",
  preuves: [
    { valeur: "0 %", libelle: "comisión" },
    { valeur: "5", libelle: "idiomas" },
    { valeur: "24/7", libelle: "asistencia" },
  ],
  maisonsSurtitre: "Las casas",
  maisonsTitre: "Lugares con alma.",
  maisonsTexte:
    "Luz de la mañana, vistas despejadas, cocina de verdad: elegimos las casas como si fuéramos a dormir en ellas.",
  maisonsPhotos: [
    {
      alt: "Salón luminoso abierto a una terraza",
      surtitre: "El salón",
      titre: "Abierto a la terraza",
    },
    {
      alt: "Piscina privada rodeada de vegetación",
      surtitre: "La mañana",
      titre: "El primer baño",
    },
    { alt: "Dormitorio preparado con ropa de hotel" },
    { alt: "Terraza a la sombra para las comidas" },
  ],
  sejourSurtitre: "La estancia",
  sejourTitre: "Usted llega. Todo ya está listo.",
  sejourTexte:
    "Sin caja de llaves perdida, sin limpieza que repetir, sin un número que suena en el vacío.",
  engagements: [
    {
      numero: "01",
      titre: "Una casa preparada",
      texte:
        "Camas hechas, ropa de hotel, productos de bienvenida y aire acondicionado revisado antes de cada llegada.",
    },
    {
      numero: "02",
      titre: "Una llegada sin fricción",
      texte:
        "Instrucciones claras, caja de llaves segura y asistencia disponible hasta medianoche.",
    },
    {
      numero: "03",
      titre: "Una estancia acompañada",
      texte:
        "Un único número para cualquier duda, del primer desayuno a la salida.",
    },
  ],
  proprietairesSurtitre: "Propietarios",
  proprietairesTitre: "Su casa merece un equipo, no un programa más.",
  proprietairesTexte:
    "Nos ocupamos de las estancias, de la relación con el viajero y del mantenimiento mientras usted mantiene el control de los precios y del calendario. Un solo interlocutor y un extracto claro cada mes.",
  proprietairesCta: "Confiar mi alojamiento",
  proprietairesCtaSecondaire: "Cómo funciona",
  proprietairesImageAlt: "Casa contemporánea con jardín",
  formulesSurtitre: "Propietarios",
  formulesTitre: "Un precio por alojamiento, no una comisión.",
  formulesNote:
    "Orientativo — el presupuesto depende del número de alojamientos y del nivel de servicio.",
  formules: [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / alojamiento / mes",
      cible: "La caja de herramientas para el propietario autónomo.",
      points: ["Canales instalados", "Venta directa", "Soporte comunitario"],
    },
    {
      nom: "Gestión",
      prix: "190",
      base: "€ / alojamiento / mes",
      cible: "La explotación delegada, sin perder el control.",
      points: [
        "Todo el Kit",
        "Limpieza y reparto gestionados",
        "Extracto mensual para el propietario",
      ],
      enAvant: true,
    },
    {
      nom: "Todo incluido",
      prix: "290",
      base: "€ / alojamiento / mes",
      cible: "La gestión completa, llave en mano.",
      points: [
        "Toda la Gestión",
        "Conserjería y urgencias",
        "Contabilidad y liquidación en 5 días",
      ],
    },
  ],
  formulePopulaire: "La más elegida",
  formuleCta: "Pedir presupuesto",
  adressesSurtitre: "Disponibles ahora",
  adressesTitre: "Nuestras direcciones.",
  adressesTout: "Ver toda la disponibilidad",
  adressesVide: "Las próximas disponibilidades están en preparación.",
  adressesVideCta: "Escríbanos",
  adressesVideSuite: "para avisarle.",
  adressesNuit: "por noche",
  adressesVoir: "Ver disponibilidad →",
  adressesLieu: "en",
  finalSurtitre: "Listo para salir",
  finalTitre: "Su próxima estancia empieza aquí.",
  finalCta: "Ver disponibilidad",
  finalCtaSecondaire: "Hacer una pregunta",
  piedSlogan:
    "Conserjería independiente en la Costa Azul. Casas preparadas, estancias acompañadas.",
  piedSejours: "Estancias",
  piedReserver: "Reservar",
  piedAide: "Ayuda",
  piedDesign: "Design system",
  piedProprietaires: "Propietarios",
  piedEspaceHote: "Espacio anfitrión",
  piedConfier: "Confiar un alojamiento",
  piedTableauBord: "Panel",
  piedInformations: "Información",
  piedMentions: "Aviso legal",
  piedAvis: "Dar mi opinión sobre el sitio",
  piedVersionLegere: "Versión ligera",
  piedDroits: "Todos los derechos reservados.",
  piedSansJs: "Sitio accesible sin JavaScript · Alojado en Europa",
};

const IT: TraductionsVitrine = {
  locale: "it-IT",
  langue: "Italiano",
  metaTitre: "{nom} — soggiorni in Costa Azzurra",
  metaDescription:
    "Case selezionate, arrivo autonomo, pulizia da hotel e assistenza 24/7. Prenota diretto, senza commissioni.",
  lienEvitement: "Vai al contenuto",
  navPrincipale: "Navigazione principale",
  navAccueil: "Home",
  navSejours: "Soggiorni",
  navAide: "Assistenza",
  navProprietaires: "Proprietari",
  navSeConnecter: "Accedi",
  ctaReserver: "Prenota",
  ouvrirMenu: "Apri il menu",
  choisirLangue: "Scegli la lingua",
  heroSurtitre: "Costa Azzurra · concierge indipendente",
  heroTitre: "Case che fanno venire voglia di restare.",
  heroTexte:
    "Indirizzi scelti, preparati e seguiti da un team locale. Prenota diretto, senza commissioni di piattaforma.",
  heroImageAlt: "Casa vacanze con piscina e terrazza",
  heroPrixPrefix: "Soggiorni da",
  etiquettes: [
    "Prenotazione diretta",
    "Arrivo autonomo",
    "Pulizia da hotel",
    "Biancheria inclusa",
    "Assistenza 7 giorni su 7",
    "Senza commissioni",
  ],
  etiquettesTitre: "Caratteristiche",
  rechercheTitre: "Trova un soggiorno",
  rechercheDestination: "Destinazione",
  rechercheDestinationValeur: "Costa Azzurra",
  rechercheArrivee: "Arrivo",
  rechercheDepart: "Partenza",
  rechercheRechercher: "Cerca",
  preuveTitre: "L’ospitalità di una casa privata, la precisione di un hotel.",
  preuveTexte:
    "Non pubblichiamo annunci. Prepariamo le case, formiamo i team che vi lavorano e restiamo raggiungibili per tutto il soggiorno.",
  preuves: [
    { valeur: "0 %", libelle: "commissioni" },
    { valeur: "5", libelle: "lingue" },
    { valeur: "24/7", libelle: "assistenza" },
  ],
  maisonsSurtitre: "Le case",
  maisonsTitre: "Luoghi che hanno un’anima.",
  maisonsTexte:
    "Luce del mattino, vista aperta, cucina vera: scegliamo le case come se dovessimo dormirci.",
  maisonsPhotos: [
    {
      alt: "Soggiorno luminoso aperto su una terrazza",
      surtitre: "Il soggiorno",
      titre: "Aperto sulla terrazza",
    },
    {
      alt: "Piscina privata circondata dal verde",
      surtitre: "La mattina",
      titre: "Il primo tuffo",
    },
    { alt: "Camera preparata con biancheria da hotel" },
    { alt: "Terrazza ombreggiata per i pasti" },
  ],
  sejourSurtitre: "Il soggiorno",
  sejourTitre: "Arrivi. È già tutto pronto.",
  sejourTexte:
    "Nessuna cassetta delle chiavi introvabile, nessuna pulizia da rifare, nessun numero che squilla a vuoto.",
  engagements: [
    {
      numero: "01",
      titre: "Una casa preparata",
      texte:
        "Letti rifatti, biancheria da hotel, prodotti di benvenuto e aria condizionata verificata prima di ogni arrivo.",
    },
    {
      numero: "02",
      titre: "Un arrivo senza attriti",
      texte:
        "Istruzioni chiare, cassetta delle chiavi sicura e assistenza raggiungibile fino a mezzanotte.",
    },
    {
      numero: "03",
      titre: "Un soggiorno seguito",
      texte:
        "Un solo numero per ogni domanda, dalla prima colazione alla partenza.",
    },
  ],
  proprietairesSurtitre: "Proprietari",
  proprietairesTitre: "La tua casa merita un team, non l’ennesimo software.",
  proprietairesTexte:
    "Ci occupiamo dei soggiorni, della relazione con il viaggiatore e della manutenzione mentre tu mantieni il controllo su prezzi e calendario. Un solo referente e un estratto chiaro ogni mese.",
  proprietairesCta: "Affidami la casa",
  proprietairesCtaSecondaire: "Come funziona",
  proprietairesImageAlt: "Casa contemporanea con giardino",
  formulesSurtitre: "Proprietari",
  formulesTitre: "Un prezzo per alloggio, non una commissione.",
  formulesNote:
    "Indicativo — il preventivo dipende dal numero di alloggi e dal livello di servizio.",
  formules: [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / alloggio / mese",
      cible: "La cassetta degli attrezzi per il proprietario autonomo.",
      points: ["Canali installati", "Vendita diretta", "Supporto della community"],
    },
    {
      nom: "Gestione",
      prix: "190",
      base: "€ / alloggio / mese",
      cible: "La gestione delegata, senza perdere il controllo.",
      points: [
        "Tutto il Kit",
        "Pulizie e dispatch gestiti",
        "Estratto mensile per il proprietario",
      ],
      enAvant: true,
    },
    {
      nom: "Tutto incluso",
      prix: "290",
      base: "€ / alloggio / mese",
      cible: "La gestione completa, chiavi in mano.",
      points: [
        "Tutta la Gestione",
        "Concierge e urgenze",
        "Contabilità e bonifico in 5 giorni",
      ],
    },
  ],
  formulePopulaire: "La più scelta",
  formuleCta: "Chiedi un preventivo",
  adressesSurtitre: "Disponibili ora",
  adressesTitre: "I nostri indirizzi.",
  adressesTout: "Vedi tutte le disponibilità",
  adressesVide: "Le prossime disponibilità sono in preparazione.",
  adressesVideCta: "Scrivici",
  adressesVideSuite: "per essere avvisato.",
  adressesNuit: "a notte",
  adressesVoir: "Vedi disponibilità →",
  adressesLieu: "a",
  finalSurtitre: "Pronti a partire",
  finalTitre: "Il prossimo soggiorno inizia qui.",
  finalCta: "Vedi disponibilità",
  finalCtaSecondaire: "Fai una domanda",
  piedSlogan:
    "Concierge indipendente in Costa Azzurra. Case preparate, soggiorni seguiti.",
  piedSejours: "Soggiorni",
  piedReserver: "Prenota",
  piedAide: "Assistenza",
  piedDesign: "Design system",
  piedProprietaires: "Proprietari",
  piedEspaceHote: "Area host",
  piedConfier: "Affida un alloggio",
  piedTableauBord: "Dashboard",
  piedInformations: "Informazioni",
  piedMentions: "Note legali",
  piedAvis: "Dai la tua opinione sul sito",
  piedVersionLegere: "Versione leggera",
  piedDroits: "Tutti i diritti riservati.",
  piedSansJs: "Sito accessibile senza JavaScript · Ospitato in Europa",
};

const DE: TraductionsVitrine = {
  locale: "de-DE",
  langue: "Deutsch",
  metaTitre: "{nom} — Aufenthalte an der Côte d’Azur",
  metaDescription:
    "Ausgewählte Häuser, autonome Anreise, Hotelreinigung und Support rund um die Uhr. Direkt buchen, ohne Provision.",
  lienEvitement: "Zum Inhalt springen",
  navPrincipale: "Hauptnavigation",
  navAccueil: "Startseite",
  navSejours: "Aufenthalte",
  navAide: "Hilfe",
  navProprietaires: "Eigentümer",
  navSeConnecter: "Anmelden",
  ctaReserver: "Buchen",
  ouvrirMenu: "Menü öffnen",
  choisirLangue: "Sprache wählen",
  heroSurtitre: "Côte d’Azur · unabhängiger Concierge",
  heroTitre: "Häuser, in denen man bleiben möchte.",
  heroTexte:
    "Adressen, die ein lokales Team auswählt, vorbereitet und betreut. Direkt buchen, ohne Plattformprovision.",
  heroImageAlt: "Ferienhaus mit Pool und Terrasse",
  heroPrixPrefix: "Aufenthalte ab",
  etiquettes: [
    "Direktbuchung",
    "Autonome Anreise",
    "Hotelreinigung",
    "Wäsche inklusive",
    "Support an 7 Tagen",
    "Ohne Provision",
  ],
  etiquettesTitre: "Merkmale",
  rechercheTitre: "Aufenthalt finden",
  rechercheDestination: "Reiseziel",
  rechercheDestinationValeur: "Côte d’Azur",
  rechercheArrivee: "Anreise",
  rechercheDepart: "Abreise",
  rechercheRechercher: "Suchen",
  preuveTitre: "Die Gastfreundschaft eines Privathauses, die Präzision eines Hotels.",
  preuveTexte:
    "Wir listen keine Anzeigen. Wir bereiten Häuser vor, schulen die Teams vor Ort und bleiben während des gesamten Aufenthalts erreichbar.",
  preuves: [
    { valeur: "0 %", libelle: "Provision" },
    { valeur: "5", libelle: "Sprachen" },
    { valeur: "24/7", libelle: "Support" },
  ],
  maisonsSurtitre: "Die Häuser",
  maisonsTitre: "Orte mit Seele.",
  maisonsTexte:
    "Morgenlicht, freier Blick, eine echte Küche: Wir wählen Häuser aus, als würden wir selbst darin schlafen.",
  maisonsPhotos: [
    {
      alt: "Helles Wohnzimmer mit Blick auf die Terrasse",
      surtitre: "Das Wohnzimmer",
      titre: "Offen zur Terrasse",
    },
    {
      alt: "Privater Pool inmitten von Grün",
      surtitre: "Der Morgen",
      titre: "Der erste Sprung ins Wasser",
    },
    { alt: "Schlafzimmer mit Hotelwäsche vorbereitet" },
    { alt: "Schattige Terrasse für die Mahlzeiten" },
  ],
  sejourSurtitre: "Der Aufenthalt",
  sejourTitre: "Sie kommen an. Alles ist schon da.",
  sejourTexte:
    "Keine Schlüsselbox, die nicht zu finden ist, keine Reinigung, die wiederholt werden muss, keine Nummer, die ins Leere klingelt.",
  engagements: [
    {
      numero: "01",
      titre: "Ein vorbereitetes Haus",
      texte:
        "Gemachte Betten, Hotelwäsche, Willkommensprodukte und geprüfte Klimaanlage vor jeder Anreise.",
    },
    {
      numero: "02",
      titre: "Eine reibungslose Anreise",
      texte:
        "Klare Anweisungen, sichere Schlüsselbox und erreichbare Hilfe bis Mitternacht.",
    },
    {
      numero: "03",
      titre: "Ein betreuter Aufenthalt",
      texte:
        "Eine einzige Nummer für jede Frage, vom ersten Frühstück bis zur Abreise.",
    },
  ],
  proprietairesSurtitre: "Eigentümer",
  proprietairesTitre: "Ihr Haus verdient ein Team, keine weitere Software.",
  proprietairesTexte:
    "Wir übernehmen Aufenthalte, Gästebetreuung und Instandhaltung, während Sie Preise und Kalender in der Hand behalten. Ein Ansprechpartner, eine klare Abrechnung pro Monat.",
  proprietairesCta: "Haus anvertrauen",
  proprietairesCtaSecondaire: "So funktioniert es",
  proprietairesImageAlt: "Modernes Haus mit Garten",
  formulesSurtitre: "Eigentümer",
  formulesTitre: "Ein Preis pro Unterkunft, keine Provision.",
  formulesNote:
    "Richtwert — das Angebot hängt von der Anzahl der Unterkünfte und dem Servicelevel ab.",
  formules: [
    {
      nom: "Kit",
      prix: "149",
      base: "€ / Unterkunft / Monat",
      cible: "Der Werkzeugkasten für selbstständige Eigentümer.",
      points: ["Portale eingerichtet", "Direktverkauf", "Community-Support"],
    },
    {
      nom: "Betreuung",
      prix: "190",
      base: "€ / Unterkunft / Monat",
      cible: "Delegierter Betrieb, ohne die Kontrolle zu verlieren.",
      points: [
        "Alles aus Kit",
        "Reinigung und Disposition gesteuert",
        "Monatliche Eigentümerabrechnung",
      ],
      enAvant: true,
    },
    {
      nom: "Rundum-Service",
      prix: "290",
      base: "€ / Unterkunft / Monat",
      cible: "Die komplette Verwaltung, schlüsselfertig.",
      points: [
        "Alles aus Betreuung",
        "Concierge und Notfälle",
        "Buchhaltung und Auszahlung in 5 Tagen",
      ],
    },
  ],
  formulePopulaire: "Am häufigsten gewählt",
  formuleCta: "Angebot anfordern",
  adressesSurtitre: "Jetzt verfügbar",
  adressesTitre: "Unsere Adressen.",
  adressesTout: "Alle Verfügbarkeiten ansehen",
  adressesVide: "Die nächsten Verfügbarkeiten werden vorbereitet.",
  adressesVideCta: "Schreiben Sie uns",
  adressesVideSuite: "um benachrichtigt zu werden.",
  adressesNuit: "pro Nacht",
  adressesVoir: "Verfügbarkeit ansehen →",
  adressesLieu: "in",
  finalSurtitre: "Bereit zur Abreise",
  finalTitre: "Ihr nächster Aufenthalt beginnt hier.",
  finalCta: "Verfügbarkeit ansehen",
  finalCtaSecondaire: "Frage stellen",
  piedSlogan:
    "Unabhängiger Concierge an der Côte d’Azur. Vorbereitete Häuser, betreute Aufenthalte.",
  piedSejours: "Aufenthalte",
  piedReserver: "Buchen",
  piedAide: "Hilfe",
  piedDesign: "Design system",
  piedProprietaires: "Eigentümer",
  piedEspaceHote: "Gastgeberbereich",
  piedConfier: "Unterkunft anvertrauen",
  piedTableauBord: "Übersicht",
  piedInformations: "Informationen",
  piedMentions: "Impressum",
  piedAvis: "Rückmeldung zur Website geben",
  piedVersionLegere: "Leichte Version",
  piedDroits: "Alle Rechte vorbehalten.",
  piedSansJs: "Website ohne JavaScript nutzbar · In Europa gehostet",
};

/** Les cinq langues publiées, dans l'ordre de `LANGUES`. */
export const VITRINE: Record<Langue, TraductionsVitrine> = {
  fr: FR,
  en: EN,
  it: IT,
  es: ES,
  de: DE,
};

const CONNUES = new Set<string>(LANGUES);

/**
 * Traductions de la vitrine pour une langue quelconque.
 * Toute valeur absente ou inconnue replie sur le français.
 */
export function traductionsVitrine(langue: unknown): TraductionsVitrine {
  return typeof langue === "string" && CONNUES.has(langue)
    ? VITRINE[langue as Langue]
    : VITRINE.fr;
}
