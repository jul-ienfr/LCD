import { LANGUES, type Langue } from "@/lib/i18n";

/**
 * Dictionnaire de la page d'aide publique (`/aide`).
 *
 * Contrat (tâche T042 du plan 004) :
 * - les cinq langues de `LANGUES` sont présentes, avec **exactement les mêmes
 *   clés et la même forme** (listes de même longueur) et aucune valeur vide
 *   (`tests/ergonomie/i18n-aide.test.ts`) ;
 * - `traductionsAide()` replie sur le français pour toute langue inconnue ;
 * - aucun JavaScript n'est requis : le serveur rend la langue demandée.
 */

/** Une ligne du tableau des rôles. */
export interface LigneRoleAide {
  role: string;
  acces: string;
}

/** Une ligne du tableau des espaces (`chemin` reste technique, non traduit). */
export interface LigneEspaceAide {
  chemin: string;
  roles: string;
  contenu: string;
}

export interface TraductionsAide {
  /** Code BCP-47 : `Intl`, `og:locale`, `hreflang`. */
  locale: string;
  /** Nom de la langue, pour le sélecteur. */
  langue: string;
  /** Balise `title`, `{nom}` remplacé par l'identité du tenant. */
  metaTitre: string;
  metaDescription: string;
  filAriane: string;
  accueil: string;
  aide: string;
  choisirLangue: string;
  surtitre: string;
  titre: string;
  intro: string;
  rolesTitre: string;
  rolesEntetes: string[];
  roles: LigneRoleAide[];
  rolesNote: string;
  espacesTitre: string;
  espacesEntetes: string[];
  espaces: LigneEspaceAide[];
  horsLigneTitre: string;
  horsLigneTexte1: string;
  horsLigneTexte2: string;
  limitesTitre: string;
  limites: string[];
  piedMentions: string;
  piedReserver: string;
  piedAvis: string;
  retourAccueil: string;
}

const FR: TraductionsAide = {
  locale: "fr-FR",
  langue: "Français",
  metaTitre: "Aide — {nom}",
  metaDescription:
    "Rôles, espaces, fonctionnement hors ligne et limites connues de la plateforme LCD.",
  filAriane: "Fil d’Ariane",
  accueil: "Accueil",
  aide: "Aide",
  choisirLangue: "Choisir la langue",
  surtitre: "Centre d’aide",
  titre: "Comment fonctionne la plateforme",
  intro:
    "Un seul système pour l’hôte, le voyageur, le propriétaire et le prestataire. Les pages publiques et l’espace voyageur restent consultables sans JavaScript ; les formulaires sont de vrais formulaires HTML.",
  rolesTitre: "Les 7 rôles",
  rolesEntetes: ["Rôle", "Accès"],
  roles: [
    {
      role: "Super-administrateur",
      acces:
        "Apparence globale, supervision de la plateforme et journal d’audit, en plus des droits d’administration.",
    },
    {
      role: "Administrateur",
      acces:
        "Paramétrage de l’établissement, utilisateurs, sécurité, intégrations, facturation et pilotage complet.",
    },
    {
      role: "Hôte",
      acces:
        "Logements, planning, prix, ménage, messages, avis, états des lieux et opérations du quotidien.",
    },
    {
      role: "Comptable",
      acces:
        "Factures, paiements, exports comptables et paramètres fiscaux, sans accès aux autres modules.",
    },
    {
      role: "Prestataire",
      acces:
        "Missions assignées, pointage, photos avant/après et clôture des interventions.",
    },
    {
      role: "Propriétaire",
      acces:
        "Relevé de ses logements, charges, commissions et documents, en lecture seule.",
    },
    {
      role: "Commercial",
      acces:
        "Prospects, pipeline, simulateur de rentabilité et offres, sans accès à l’exploitation.",
    },
  ],
  rolesNote:
    "Un utilisateur peut cumuler plusieurs rôles. Les droits sont revérifiés à chaque action côté serveur, pas seulement à l’affichage.",
  espacesTitre: "Les espaces",
  espacesEntetes: ["Adresse", "Rôles", "Contenu"],
  espaces: [
    {
      chemin: "/hote",
      roles: "Administrateur, hôte",
      contenu:
        "Tableau de bord : indicateurs, arrivées et départs, tâches du jour, raccourcis.",
    },
    {
      chemin: "/hote/logements",
      roles: "Administrateur, hôte",
      contenu:
        "Fiches logements, équipements, accès, propriétaires et conformité des annonces.",
    },
    {
      chemin: "/hote/planning",
      roles: "Administrateur, hôte",
      contenu:
        "Calendrier des séjours, blocages, imports ICS et résolution des conflits.",
    },
    {
      chemin: "/hote/menage",
      roles: "Administrateur, hôte, prestataire",
      contenu:
        "Ménages à faire, checklists, preuves photo, temps pointé et clôture.",
    },
    {
      chemin: "/reserver",
      roles: "Public",
      contenu: "Demande de réservation directe, devis et disponibilités.",
    },
    {
      chemin: "/voyageur",
      roles: "Voyageur (lien signé)",
      contenu:
        "Guide du séjour, accès, messages, incidents et questionnaire de départ, sans compte.",
    },
    {
      chemin: "/supervision/apparence",
      roles: "Super-administrateur",
      contenu:
        "Thème global unique, identité, aperçu signé, publication et retour arrière.",
    },
  ],
  horsLigneTitre: "Hors ligne et vieux téléphones",
  horsLigneTexte1:
    "L’espace voyageur et les pages publiques sont rendus côté serveur : ils s’affichent sans JavaScript et sans installation. Une fois la page ouverte, le contenu déjà chargé reste consultable si le réseau tombe ; les écritures rejouables sont mises en file avec une référence stable pour éviter les doublons au retour du réseau.",
  horsLigneTexte2:
    "Les documents sensibles (contrats, factures, liens voyageur) reposent sur des liens signés à durée limitée : ne les transférez pas à des tiers.",
  limitesTitre: "Ce qui est réel — et les limites",
  limites: [
    "Les réservations, contrats, factures, paiements, ménages et incidents sont enregistrés en base et tracés dans le journal d’audit.",
    "Aucune écriture n’est envoyée automatiquement aux plateformes de réservation : les calendriers ICS sont importés en lecture seule et les conflits sont signalés.",
    "Aucun encaissement de carte bancaire n’est réalisé par la plateforme : les cautions et paiements sont suivis, pas débités.",
    "L’envoi d’e-mails dépend de la configuration de l’établissement ; il peut être désactivé.",
    "L’instance est mono-établissement et n’utilise pas encore de canal de synchronisation bidirectionnel avec les OTA.",
  ],
  piedMentions: "Mentions légales & CGV",
  piedReserver: "Réserver un séjour",
  piedAvis: "Donner mon avis sur le site",
  retourAccueil: "Retour à l’accueil",
};

const EN: TraductionsAide = {
  locale: "en-GB",
  langue: "English",
  metaTitre: "Help — {nom}",
  metaDescription:
    "Roles, areas, offline behaviour and known limits of the LCD platform.",
  filAriane: "Breadcrumb",
  accueil: "Home",
  aide: "Help",
  choisirLangue: "Choose language",
  surtitre: "Help centre",
  titre: "How the platform works",
  intro:
    "One system for the host, the guest, the owner and the service provider. Public pages and the guest area stay readable without JavaScript; forms are real HTML forms.",
  rolesTitre: "The 7 roles",
  rolesEntetes: ["Role", "Access"],
  roles: [
    {
      role: "Super administrator",
      acces:
        "Global appearance, platform oversight and audit log, in addition to administrator rights.",
    },
    {
      role: "Administrator",
      acces:
        "Property settings, users, security, integrations, billing and full operational control.",
    },
    {
      role: "Host",
      acces:
        "Listings, calendar, prices, cleaning, messages, reviews, inspections and day-to-day operations.",
    },
    {
      role: "Accountant",
      acces:
        "Invoices, payments, accounting exports and tax settings, with no access to other modules.",
    },
    {
      role: "Service provider",
      acces:
        "Assigned jobs, time tracking, before/after photos and job completion.",
    },
    {
      role: "Owner",
      acces:
        "Statement of their properties, costs, commissions and documents, read-only.",
    },
    {
      role: "Sales",
      acces:
        "Leads, pipeline, profitability simulator and quotes, with no access to operations.",
    },
  ],
  rolesNote:
    "A user may hold several roles. Rights are checked again on every server-side action, not only in the interface.",
  espacesTitre: "The areas",
  espacesEntetes: ["Address", "Roles", "Content"],
  espaces: [
    {
      chemin: "/hote",
      roles: "Administrator, host",
      contenu: "Dashboard: key figures, arrivals and departures, today's tasks, shortcuts.",
    },
    {
      chemin: "/hote/logements",
      roles: "Administrator, host",
      contenu:
        "Property records, equipment, access, owners and listing compliance.",
    },
    {
      chemin: "/hote/planning",
      roles: "Administrator, host",
      contenu: "Stay calendar, blocks, ICS imports and conflict resolution.",
    },
    {
      chemin: "/hote/menage",
      roles: "Administrator, host, service provider",
      contenu:
        "Cleanings to do, checklists, photo evidence, tracked time and sign-off.",
    },
    {
      chemin: "/reserver",
      roles: "Public",
      contenu: "Direct booking request, quotes and availability.",
    },
    {
      chemin: "/voyageur",
      roles: "Guest (signed link)",
      contenu:
        "Stay guide, access, messages, incidents and check-out survey, without an account.",
    },
    {
      chemin: "/supervision/apparence",
      roles: "Super administrator",
      contenu:
        "Single global theme, identity, signed preview, publishing and rollback.",
    },
  ],
  horsLigneTitre: "Offline and old phones",
  horsLigneTexte1:
    "The guest area and the public pages are rendered on the server: they display without JavaScript and without installation. Once the page is open, content already loaded stays readable if the network drops; replayable writes are queued with a stable reference so that nothing is duplicated when the network returns.",
  horsLigneTexte2:
    "Sensitive documents (contracts, invoices, guest links) rely on signed links with a limited lifetime: do not forward them to third parties.",
  limitesTitre: "What is real — and the limits",
  limites: [
    "Bookings, contracts, invoices, payments, cleanings and incidents are stored in the database and traced in the audit log.",
    "Nothing is written automatically to booking platforms: ICS calendars are imported read-only and conflicts are reported.",
    "No card payment is collected by the platform: deposits and payments are tracked, not charged.",
    "Sending e-mails depends on the property configuration; it can be disabled.",
    "The instance is single-property and does not yet use a two-way synchronisation channel with OTAs.",
  ],
  piedMentions: "Legal notice & terms",
  piedReserver: "Book a stay",
  piedAvis: "Give feedback on the site",
  retourAccueil: "Back to home",
};

const ES: TraductionsAide = {
  locale: "es-ES",
  langue: "Español",
  metaTitre: "Ayuda — {nom}",
  metaDescription:
    "Roles, espacios, funcionamiento sin conexión y límites conocidos de la plataforma LCD.",
  filAriane: "Ruta de navegación",
  accueil: "Inicio",
  aide: "Ayuda",
  choisirLangue: "Elegir idioma",
  surtitre: "Centro de ayuda",
  titre: "Cómo funciona la plataforma",
  intro:
    "Un solo sistema para el anfitrión, el viajero, el propietario y el proveedor. Las páginas públicas y el espacio del viajero siguen consultándose sin JavaScript; los formularios son formularios HTML reales.",
  rolesTitre: "Los 7 roles",
  rolesEntetes: ["Rol", "Acceso"],
  roles: [
    {
      role: "Superadministrador",
      acces:
        "Apariencia global, supervisión de la plataforma y registro de auditoría, además de los permisos de administración.",
    },
    {
      role: "Administrador",
      acces:
        "Configuración del establecimiento, usuarios, seguridad, integraciones, facturación y control completo.",
    },
    {
      role: "Anfitrión",
      acces:
        "Alojamientos, calendario, precios, limpieza, mensajes, opiniones, inventarios y operaciones diarias.",
    },
    {
      role: "Contable",
      acces:
        "Facturas, pagos, exportaciones contables y parámetros fiscales, sin acceso a los demás módulos.",
    },
    {
      role: "Proveedor",
      acces:
        "Tareas asignadas, registro horario, fotos antes/después y cierre de las intervenciones.",
    },
    {
      role: "Propietario",
      acces:
        "Extracto de sus alojamientos, gastos, comisiones y documentos, solo lectura.",
    },
    {
      role: "Comercial",
      acces:
        "Prospectos, pipeline, simulador de rentabilidad y ofertas, sin acceso a la operación.",
    },
  ],
  rolesNote:
    "Un usuario puede acumular varios roles. Los permisos se verifican de nuevo en cada acción del servidor, no solo en la interfaz.",
  espacesTitre: "Los espacios",
  espacesEntetes: ["Dirección", "Roles", "Contenido"],
  espaces: [
    {
      chemin: "/hote",
      roles: "Administrador, anfitrión",
      contenu:
        "Panel: indicadores, llegadas y salidas, tareas del día, accesos directos.",
    },
    {
      chemin: "/hote/logements",
      roles: "Administrador, anfitrión",
      contenu:
        "Fichas de alojamiento, equipamiento, accesos, propietarios y cumplimiento de los anuncios.",
    },
    {
      chemin: "/hote/planning",
      roles: "Administrador, anfitrión",
      contenu:
        "Calendario de estancias, bloqueos, importaciones ICS y resolución de conflictos.",
    },
    {
      chemin: "/hote/menage",
      roles: "Administrador, anfitrión, proveedor",
      contenu:
        "Limpiezas pendientes, listas de comprobación, fotos de prueba, tiempo registrado y cierre.",
    },
    {
      chemin: "/reserver",
      roles: "Público",
      contenu: "Solicitud de reserva directa, presupuestos y disponibilidad.",
    },
    {
      chemin: "/voyageur",
      roles: "Viajero (enlace firmado)",
      contenu:
        "Guía de la estancia, accesos, mensajes, incidencias y cuestionario de salida, sin cuenta.",
    },
    {
      chemin: "/supervision/apparence",
      roles: "Superadministrador",
      contenu:
        "Tema global único, identidad, vista previa firmada, publicación y reversión.",
    },
  ],
  horsLigneTitre: "Sin conexión y teléfonos antiguos",
  horsLigneTexte1:
    "El espacio del viajero y las páginas públicas se renderizan en el servidor: se muestran sin JavaScript y sin instalación. Una vez abierta la página, el contenido ya cargado sigue consultándose si cae la red; las escrituras rejugables se ponen en cola con una referencia estable para evitar duplicados al volver la red.",
  horsLigneTexte2:
    "Los documentos sensibles (contratos, facturas, enlaces del viajero) se basan en enlaces firmados con caducidad: no los reenvíe a terceros.",
  limitesTitre: "Lo que es real — y los límites",
  limites: [
    "Las reservas, contratos, facturas, pagos, limpiezas e incidencias se guardan en la base de datos y se registran en el registro de auditoría.",
    "Nada se envía automáticamente a las plataformas de reserva: los calendarios ICS se importan en solo lectura y los conflictos se señalan.",
    "La plataforma no realiza ningún cobro con tarjeta: las fianzas y los pagos se siguen, no se debitan.",
    "El envío de correos depende de la configuración del establecimiento; puede desactivarse.",
    "La instancia es monoestablecimiento y aún no usa un canal de sincronización bidireccional con las OTA.",
  ],
  piedMentions: "Aviso legal y condiciones",
  piedReserver: "Reservar una estancia",
  piedAvis: "Dar mi opinión sobre el sitio",
  retourAccueil: "Volver al inicio",
};

const IT: TraductionsAide = {
  locale: "it-IT",
  langue: "Italiano",
  metaTitre: "Assistenza — {nom}",
  metaDescription:
    "Ruoli, aree, funzionamento offline e limiti noti della piattaforma LCD.",
  filAriane: "Percorso di navigazione",
  accueil: "Home",
  aide: "Assistenza",
  choisirLangue: "Scegli la lingua",
  surtitre: "Centro assistenza",
  titre: "Come funziona la piattaforma",
  intro:
    "Un unico sistema per host, viaggiatore, proprietario e fornitore. Le pagine pubbliche e l’area del viaggiatore restano consultabili senza JavaScript; i moduli sono veri moduli HTML.",
  rolesTitre: "I 7 ruoli",
  rolesEntetes: ["Ruolo", "Accesso"],
  roles: [
    {
      role: "Superamministratore",
      acces:
        "Aspetto globale, supervisione della piattaforma e registro di audit, oltre ai diritti di amministrazione.",
    },
    {
      role: "Amministratore",
      acces:
        "Configurazione della struttura, utenti, sicurezza, integrazioni, fatturazione e controllo completo.",
    },
    {
      role: "Host",
      acces:
        "Alloggi, calendario, prezzi, pulizie, messaggi, recensioni, stati dei luoghi e operazioni quotidiane.",
    },
    {
      role: "Contabile",
      acces:
        "Fatture, pagamenti, esportazioni contabili e parametri fiscali, senza accesso agli altri moduli.",
    },
    {
      role: "Fornitore",
      acces:
        "Incarichi assegnati, timbratura, foto prima/dopo e chiusura degli interventi.",
    },
    {
      role: "Proprietario",
      acces:
        "Estratto dei suoi alloggi, costi, commissioni e documenti, in sola lettura.",
    },
    {
      role: "Commerciale",
      acces:
        "Contatti, pipeline, simulatore di redditività e offerte, senza accesso alla gestione operativa.",
    },
  ],
  rolesNote:
    "Un utente può cumulare più ruoli. I diritti vengono verificati di nuovo a ogni azione lato server, non solo nell’interfaccia.",
  espacesTitre: "Le aree",
  espacesEntetes: ["Indirizzo", "Ruoli", "Contenuto"],
  espaces: [
    {
      chemin: "/hote",
      roles: "Amministratore, host",
      contenu:
        "Dashboard: indicatori, arrivi e partenze, attività del giorno, scorciatoie.",
    },
    {
      chemin: "/hote/logements",
      roles: "Amministratore, host",
      contenu:
        "Schede alloggio, dotazioni, accessi, proprietari e conformità degli annunci.",
    },
    {
      chemin: "/hote/planning",
      roles: "Amministratore, host",
      contenu:
        "Calendario dei soggiorni, blocchi, importazioni ICS e risoluzione dei conflitti.",
    },
    {
      chemin: "/hote/menage",
      roles: "Amministratore, host, fornitore",
      contenu:
        "Pulizie da fare, checklist, prove fotografiche, tempo registrato e chiusura.",
    },
    {
      chemin: "/reserver",
      roles: "Pubblico",
      contenu: "Richiesta di prenotazione diretta, preventivi e disponibilità.",
    },
    {
      chemin: "/voyageur",
      roles: "Viaggiatore (link firmato)",
      contenu:
        "Guida del soggiorno, accessi, messaggi, incidenti e questionario di partenza, senza account.",
    },
    {
      chemin: "/supervision/apparence",
      roles: "Superamministratore",
      contenu:
        "Tema globale unico, identità, anteprima firmata, pubblicazione e ripristino.",
    },
  ],
  horsLigneTitre: "Offline e telefoni vecchi",
  horsLigneTexte1:
    "L’area del viaggiatore e le pagine pubbliche sono renderizzate sul server: si mostrano senza JavaScript e senza installazione. Una volta aperta la pagina, il contenuto già caricato resta consultabile se la rete cade; le scritture riproducibili vengono messe in coda con un riferimento stabile per evitare duplicati al ritorno della rete.",
  horsLigneTexte2:
    "I documenti sensibili (contratti, fatture, link del viaggiatore) si basano su link firmati a durata limitata: non trasmetterli a terzi.",
  limitesTitre: "Ciò che è reale — e i limiti",
  limites: [
    "Prenotazioni, contratti, fatture, pagamenti, pulizie e incidenti sono salvati nel database e tracciati nel registro di audit.",
    "Nessuna scrittura viene inviata automaticamente alle piattaforme di prenotazione: i calendari ICS sono importati in sola lettura e i conflitti vengono segnalati.",
    "La piattaforma non effettua alcun incasso con carta: cauzioni e pagamenti sono monitorati, non addebitati.",
    "L’invio di e-mail dipende dalla configurazione della struttura; può essere disattivato.",
    "L’istanza è mono-struttura e non utilizza ancora un canale di sincronizzazione bidirezionale con le OTA.",
  ],
  piedMentions: "Note legali e condizioni",
  piedReserver: "Prenota un soggiorno",
  piedAvis: "Dai la tua opinione sul sito",
  retourAccueil: "Torna alla home",
};

const DE: TraductionsAide = {
  locale: "de-DE",
  langue: "Deutsch",
  metaTitre: "Hilfe — {nom}",
  metaDescription:
    "Rollen, Bereiche, Offline-Betrieb und bekannte Grenzen der LCD-Plattform.",
  filAriane: "Brotkrümelnavigation",
  accueil: "Startseite",
  aide: "Hilfe",
  choisirLangue: "Sprache wählen",
  surtitre: "Hilfecenter",
  titre: "So funktioniert die Plattform",
  intro:
    "Ein System für Gastgeber, Gast, Eigentümer und Dienstleister. Öffentliche Seiten und der Gästebereich bleiben ohne JavaScript lesbar; Formulare sind echte HTML-Formulare.",
  rolesTitre: "Die 7 Rollen",
  rolesEntetes: ["Rolle", "Zugriff"],
  roles: [
    {
      role: "Superadministrator",
      acces:
        "Globale Erscheinung, Plattformaufsicht und Audit-Log, zusätzlich zu den Administratorrechten.",
    },
    {
      role: "Administrator",
      acces:
        "Einstellungen der Unterkunft, Benutzer, Sicherheit, Integrationen, Abrechnung und vollständige Steuerung.",
    },
    {
      role: "Gastgeber",
      acces:
        "Unterkünfte, Kalender, Preise, Reinigung, Nachrichten, Bewertungen, Zustandsprotokolle und Tagesgeschäft.",
    },
    {
      role: "Buchhalter",
      acces:
        "Rechnungen, Zahlungen, Buchhaltungsexporte und Steuereinstellungen, ohne Zugriff auf andere Module.",
    },
    {
      role: "Dienstleister",
      acces:
        "Zugewiesene Aufträge, Zeiterfassung, Vorher-/Nachher-Fotos und Abschluss der Einsätze.",
    },
    {
      role: "Eigentümer",
      acces:
        "Abrechnung seiner Unterkünfte, Kosten, Provisionen und Dokumente, nur lesend.",
    },
    {
      role: "Vertrieb",
      acces:
        "Interessenten, Pipeline, Rentabilitätssimulator und Angebote, ohne Zugriff auf den Betrieb.",
    },
  ],
  rolesNote:
    "Ein Benutzer kann mehrere Rollen haben. Die Rechte werden bei jeder serverseitigen Aktion erneut geprüft, nicht nur in der Oberfläche.",
  espacesTitre: "Die Bereiche",
  espacesEntetes: ["Adresse", "Rollen", "Inhalt"],
  espaces: [
    {
      chemin: "/hote",
      roles: "Administrator, Gastgeber",
      contenu:
        "Übersicht: Kennzahlen, An- und Abreisen, Tagesaufgaben, Verknüpfungen.",
    },
    {
      chemin: "/hote/logements",
      roles: "Administrator, Gastgeber",
      contenu:
        "Unterkunftsprofile, Ausstattung, Zugänge, Eigentümer und Konformität der Anzeigen.",
    },
    {
      chemin: "/hote/planning",
      roles: "Administrator, Gastgeber",
      contenu:
        "Aufenthaltskalender, Sperrzeiten, ICS-Importe und Konfliktlösung.",
    },
    {
      chemin: "/hote/menage",
      roles: "Administrator, Gastgeber, Dienstleister",
      contenu:
        "Offene Reinigungen, Checklisten, Fotobelege, erfasste Zeit und Abschluss.",
    },
    {
      chemin: "/reserver",
      roles: "Öffentlich",
      contenu: "Direkte Buchungsanfrage, Angebote und Verfügbarkeiten.",
    },
    {
      chemin: "/voyageur",
      roles: "Gast (signierter Link)",
      contenu:
        "Aufenthaltsguide, Zugänge, Nachrichten, Vorfälle und Abreisefragebogen, ohne Konto.",
    },
    {
      chemin: "/supervision/apparence",
      roles: "Superadministrator",
      contenu:
        "Einziges globales Thema, Identität, signierte Vorschau, Veröffentlichung und Rücknahme.",
    },
  ],
  horsLigneTitre: "Offline und alte Telefone",
  horsLigneTexte1:
    "Der Gästebereich und die öffentlichen Seiten werden auf dem Server gerendert: Sie erscheinen ohne JavaScript und ohne Installation. Ist die Seite einmal geöffnet, bleibt der geladene Inhalt bei Netzausfall lesbar; wiederholbare Schreibvorgänge werden mit einer stabilen Referenz in die Warteschlange gestellt, damit bei Rückkehr des Netzes nichts doppelt entsteht.",
  horsLigneTexte2:
    "Sensible Dokumente (Verträge, Rechnungen, Gästelinks) beruhen auf signierten Links mit begrenzter Laufzeit: Geben Sie sie nicht an Dritte weiter.",
  limitesTitre: "Was real ist — und die Grenzen",
  limites: [
    "Buchungen, Verträge, Rechnungen, Zahlungen, Reinigungen und Vorfälle werden in der Datenbank gespeichert und im Audit-Log nachvollzogen.",
    "Es wird nichts automatisch an Buchungsplattformen geschrieben: ICS-Kalender werden nur lesend importiert und Konflikte werden gemeldet.",
    "Die Plattform zieht keine Kartenzahlungen ein: Kautionen und Zahlungen werden verfolgt, nicht abgebucht.",
    "Der E-Mail-Versand hängt von der Konfiguration der Unterkunft ab; er kann deaktiviert sein.",
    "Die Instanz ist einzelbetrieblich und nutzt noch keinen bidirektionalen Synchronisationskanal zu den OTAs.",
  ],
  piedMentions: "Impressum & AGB",
  piedReserver: "Aufenthalt buchen",
  piedAvis: "Rückmeldung zur Website geben",
  retourAccueil: "Zurück zur Startseite",
};

/** Les cinq langues publiées, dans l'ordre de `LANGUES`. */
export const AIDE: Record<Langue, TraductionsAide> = {
  fr: FR,
  en: EN,
  it: IT,
  es: ES,
  de: DE,
};

const CONNUES = new Set<string>(LANGUES);

/**
 * Traductions de l'aide pour une langue quelconque.
 * Toute valeur absente ou inconnue replie sur le français.
 */
export function traductionsAide(langue: unknown): TraductionsAide {
  return typeof langue === "string" && CONNUES.has(langue)
    ? AIDE[langue as Langue]
    : AIDE.fr;
}
