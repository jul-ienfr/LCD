import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsConformite {
  pTitrePage: string;
  pSurtitre: string;
  pTitre: string;
  pDescription: string;
  pConservees: (n: number) => string;
  pAucune: string;
  colSejour: string;
  colLogement: string;
  colPersonne: string;
  colNaissance: string;
  colContact: string;
  colRecue: string;
  colPurge: string;
  pNote: string;
  fTitrePage: string;
  fSurtitre: string;
  fTitre: string;
  fDescription: string;
  fProgression: string;
  fResume: (faites: number, total: number, pourcentage: number) => string;
  fComplet: string;
  fAide: string;
  fOk: (module: string | null, pourcentage: string | number | null) => string;
  erreurInattendue: string;
  termine: string;
  pourcentageModule: (n: number) => string;
  enregistrerProgression: string;
  rTitrePage: string;
  rSurtitre: string;
  rTitre: string;
  rDescription: string;
  rOk: string;
  rAvancement: string;
  rResume: (documentes: number, actifs: number, pourcentage: number) => string;
  rComplet: string;
  rACompleter: string;
  rManquants: (liste: string) => string;
  rDpoAide: string;
  dpoNom: string;
  dpoContact: string;
  hebergement: string;
  colTraitement: string;
  colBaseLegale: string;
  colDonnees: string;
  colDestinataires: string;
  colActif: string;
  colConservation: string;
  notesPlaceholder: string;
  actifSr: (finalite: string) => string;
  rDurees: (max: number) => string;
  enregistrerRegistre: string;
}

const FR: TraductionsConformite = {
  pTitrePage: "Fiches de police — Espace hôte", pSurtitre: "Conformité",
  pTitre: "Fiches de police",
  pDescription: "Une fiche par personne hébergée, déposée par le voyageur via son lien de séjour. Conservation 6 mois puis purge automatique. Aucune pièce d’identité n’est demandée ni stockée.",
  pConservees: (n) => `${n} fiche(s) conservée(s)`,
  pAucune: "Aucune fiche reçue. Les voyageurs la remplissent depuis leur espace de séjour, avant l’arrivée.",
  colSejour: "Séjour", colLogement: "Logement", colPersonne: "Personne",
  colNaissance: "Naissance", colContact: "Contact", colRecue: "Reçue", colPurge: "Purge",
  pNote: "Données personnelles : accès limité aux rôles admin et hôte. Export interdit hors réquisition légale ; la purge est assurée par le cron /api/cron/purge-police.",
  fTitrePage: "Formation de l’équipe — Espace hôte", fSurtitre: "Espace hôte · Équipe",
  fTitre: "Formation de l’équipe",
  fDescription: "Parcours guidés pour accueillir, entretenir et facturer sans erreur.",
  fProgression: "Ma progression",
  fResume: (faites, total, pourcentage) => `${faites} / ${total} étapes · ${pourcentage} %`,
  fComplet: "Parcours complet. Bravo !",
  fAide: "Cochez les étapes réalisées, module par module. Votre progression est enregistrée à chaque envoi.",
  fOk: (module, pourcentage) =>
    `Progression enregistrée${module ? ` (${module})` : ""}${pourcentage ? ` · ${pourcentage} %` : ""}.`,
  erreurInattendue: "Erreur inattendue. Réessayez.", termine: "Terminé",
  pourcentageModule: (n) => `${n} % du module`,
  enregistrerProgression: "Enregistrer ma progression",
  rTitrePage: "Registre RGPD — Espace hôte", rSurtitre: "Espace hôte · Conformité",
  rTitre: "Registre RGPD",
  rDescription: "Sept traitements, leurs finalités, bases légales et durées de conservation.",
  rOk: "Registre enregistré.", rAvancement: "Avancement",
  rResume: (documentes, actifs, pourcentage) => `${documentes} / ${actifs} traitements actifs documentés · ${pourcentage} %`,
  rComplet: "Registre complet", rACompleter: "À compléter",
  rManquants: (liste) => `Durée de conservation manquante : ${liste}.`,
  rDpoAide: "Renseignez le contact du DPO (ou du référent) pour compléter le registre.",
  dpoNom: "DPO / référent", dpoContact: "Contact DPO", hebergement: "Hébergement des données",
  colTraitement: "Traitement", colBaseLegale: "Base légale", colDonnees: "Données",
  colDestinataires: "Destinataires", colActif: "Actif", colConservation: "Conservation (mois)",
  notesPlaceholder: "Mesures, sous-traitants, remarques",
  actifSr: (finalite) => `${finalite} actif`,
  rDurees: (max) => `Les durées peuvent être ajustées entre 1 et ${max} mois. L’export JSON reprend l’ensemble des données du tenant pour répondre à une demande d’accès.`,
  enregistrerRegistre: "Enregistrer le registre",
};

const EN: TraductionsConformite = {
  pTitrePage: "Police forms — Staff area", pSurtitre: "Compliance",
  pTitre: "Police forms",
  pDescription: "One form per hosted person, filed by the guest through their stay link. Kept 6 months then purged automatically. No identity document is requested or stored.",
  pConservees: (n) => `${n} form(s) kept`,
  pAucune: "No form received. Guests fill it in from their stay area before arrival.",
  colSejour: "Stay", colLogement: "Property", colPersonne: "Person",
  colNaissance: "Birth", colContact: "Contact", colRecue: "Received", colPurge: "Purge",
  pNote: "Personal data: access limited to admin and host roles. Export prohibited outside legal requisition; purging is handled by the /api/cron/purge-police cron.",
  fTitrePage: "Team training — Staff area", fSurtitre: "Staff area · Team",
  fTitre: "Team training",
  fDescription: "Guided paths to welcome, maintain and invoice without mistakes.",
  fProgression: "My progress",
  fResume: (faites, total, pourcentage) => `${faites} / ${total} steps · ${pourcentage}%`,
  fComplet: "Path complete. Well done!",
  fAide: "Tick completed steps, module by module. Your progress is saved on each submission.",
  fOk: (module, pourcentage) =>
    `Progress saved${module ? ` (${module})` : ""}${pourcentage ? ` · ${pourcentage}%` : ""}.`,
  erreurInattendue: "Unexpected error. Try again.", termine: "Completed",
  pourcentageModule: (n) => `${n}% of module`,
  enregistrerProgression: "Save my progress",
  rTitrePage: "GDPR register — Staff area", rSurtitre: "Staff area · Compliance",
  rTitre: "GDPR register",
  rDescription: "Seven processing activities, their purposes, legal bases and retention periods.",
  rOk: "Register saved.", rAvancement: "Progress",
  rResume: (documentes, actifs, pourcentage) => `${documentes} / ${actifs} active processing activities documented · ${pourcentage}%`,
  rComplet: "Register complete", rACompleter: "To complete",
  rManquants: (liste) => `Missing retention period: ${liste}.`,
  rDpoAide: "Enter the DPO (or referent) contact to complete the register.",
  dpoNom: "DPO / referent", dpoContact: "DPO contact", hebergement: "Data hosting",
  colTraitement: "Processing", colBaseLegale: "Legal basis", colDonnees: "Data",
  colDestinataires: "Recipients", colActif: "Active", colConservation: "Retention (months)",
  notesPlaceholder: "Measures, processors, remarks",
  actifSr: (finalite) => `${finalite} active`,
  rDurees: (max) => `Retention can be adjusted between 1 and ${max} months. The JSON export includes all tenant data to answer an access request.`,
  enregistrerRegistre: "Save register",
};

const ES: TraductionsConformite = {
  pTitrePage: "Fichas de policía — Área profesional", pSurtitre: "Conformidad",
  pTitre: "Fichas de policía",
  pDescription: "Una ficha por persona alojada, presentada por el viajero mediante su enlace de estancia. Conservación 6 meses y purga automática. No se solicita ni almacena ningún documento de identidad.",
  pConservees: (n) => `${n} ficha(s) conservada(s)`,
  pAucune: "Ninguna ficha recibida. Los viajeros la rellenan desde su espacio de estancia, antes de la llegada.",
  colSejour: "Estancia", colLogement: "Alojamiento", colPersonne: "Persona",
  colNaissance: "Nacimiento", colContact: "Contacto", colRecue: "Recibida", colPurge: "Purga",
  pNote: "Datos personales: acceso limitado a los roles admin y anfitrión. Exportación prohibida fuera de requisa legal; la purga la realiza el cron /api/cron/purge-police.",
  fTitrePage: "Formación del equipo — Área profesional", fSurtitre: "Área profesional · Equipo",
  fTitre: "Formación del equipo",
  fDescription: "Itinerarios guiados para acoger, mantener y facturar sin errores.",
  fProgression: "Mi progreso",
  fResume: (faites, total, pourcentage) => `${faites} / ${total} etapas · ${pourcentage} %`,
  fComplet: "Itinerario completo. ¡Enhorabuena!",
  fAide: "Marque las etapas realizadas, módulo a módulo. Su progreso se guarda en cada envío.",
  fOk: (module, pourcentage) =>
    `Progreso guardado${module ? ` (${module})` : ""}${pourcentage ? ` · ${pourcentage} %` : ""}.`,
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.", termine: "Terminado",
  pourcentageModule: (n) => `${n} % del módulo`,
  enregistrerProgression: "Guardar mi progreso",
  rTitrePage: "Registro RGPD — Área profesional", rSurtitre: "Área profesional · Conformidad",
  rTitre: "Registro RGPD",
  rDescription: "Siete tratamientos, sus finalidades, bases legales y plazos de conservación.",
  rOk: "Registro guardado.", rAvancement: "Avance",
  rResume: (documentes, actifs, pourcentage) => `${documentes} / ${actifs} tratamientos activos documentados · ${pourcentage} %`,
  rComplet: "Registro completo", rACompleter: "Por completar",
  rManquants: (liste) => `Plazo de conservación pendiente: ${liste}.`,
  rDpoAide: "Indique el contacto del DPO (o referente) para completar el registro.",
  dpoNom: "DPO / referente", dpoContact: "Contacto DPO", hebergement: "Alojamiento de datos",
  colTraitement: "Tratamiento", colBaseLegale: "Base legal", colDonnees: "Datos",
  colDestinataires: "Destinatarios", colActif: "Activo", colConservation: "Conservación (meses)",
  notesPlaceholder: "Medidas, encargados, observaciones",
  actifSr: (finalite) => `${finalite} activo`,
  rDurees: (max) => `Los plazos pueden ajustarse entre 1 y ${max} meses. La exportación JSON incluye todos los datos del tenant para responder a una solicitud de acceso.`,
  enregistrerRegistre: "Guardar el registro",
};

const IT: TraductionsConformite = {
  pTitrePage: "Schede di polizia — Area professionale", pSurtitre: "Conformità",
  pTitre: "Schede di polizia",
  pDescription: "Una scheda per persona ospitata, depositata dall’ospite tramite il suo link di soggiorno. Conservazione 6 mesi poi cancellazione automatica. Nessun documento d’identità viene richiesto o conservato.",
  pConservees: (n) => `${n} scheda/e conservata/e`,
  pAucune: "Nessuna scheda ricevuta. Gli ospiti la compilano dal loro spazio soggiorno, prima dell’arrivo.",
  colSejour: "Soggiorno", colLogement: "Alloggio", colPersonne: "Persona",
  colNaissance: "Nascita", colContact: "Contatto", colRecue: "Ricevuta", colPurge: "Cancellazione",
  pNote: "Dati personali: accesso limitato ai ruoli admin e host. Esportazione vietata fuori da richiesta legale; la cancellazione è gestita dal cron /api/cron/purge-police.",
  fTitrePage: "Formazione del team — Area professionale", fSurtitre: "Area professionale · Team",
  fTitre: "Formazione del team",
  fDescription: "Percorsi guidati per accogliere, mantenere e fatturare senza errori.",
  fProgression: "I miei progressi",
  fResume: (faites, total, pourcentage) => `${faites} / ${total} tappe · ${pourcentage} %`,
  fComplet: "Percorso completato. Complimenti!",
  fAide: "Spunti le tappe svolte, modulo per modulo. I progressi vengono salvati a ogni invio.",
  fOk: (module, pourcentage) =>
    `Progressi salvati${module ? ` (${module})` : ""}${pourcentage ? ` · ${pourcentage} %` : ""}.`,
  erreurInattendue: "Errore imprevisto. Riprovi.", termine: "Completato",
  pourcentageModule: (n) => `${n} % del modulo`,
  enregistrerProgression: "Salva i miei progressi",
  rTitrePage: "Registro GDPR — Area professionale", rSurtitre: "Area professionale · Conformità",
  rTitre: "Registro GDPR",
  rDescription: "Sette trattamenti, le loro finalità, basi giuridiche e periodi di conservazione.",
  rOk: "Registro salvato.", rAvancement: "Avanzamento",
  rResume: (documentes, actifs, pourcentage) => `${documentes} / ${actifs} trattamenti attivi documentati · ${pourcentage} %`,
  rComplet: "Registro completo", rACompleter: "Da completare",
  rManquants: (liste) => `Periodo di conservazione mancante: ${liste}.`,
  rDpoAide: "Inserisca il contatto del DPO (o referente) per completare il registro.",
  dpoNom: "DPO / referente", dpoContact: "Contatto DPO", hebergement: "Hosting dei dati",
  colTraitement: "Trattamento", colBaseLegale: "Base giuridica", colDonnees: "Dati",
  colDestinataires: "Destinatari", colActif: "Attivo", colConservation: "Conservazione (mesi)",
  notesPlaceholder: "Misure, responsabili, note",
  actifSr: (finalite) => `${finalite} attivo`,
  rDurees: (max) => `I periodi possono essere regolati tra 1 e ${max} mesi. L’esportazione JSON include tutti i dati del tenant per rispondere a una richiesta di accesso.`,
  enregistrerRegistre: "Salva il registro",
};

const DE: TraductionsConformite = {
  pTitrePage: "Meldescheine — Profibereich", pSurtitre: "Compliance",
  pTitre: "Meldescheine",
  pDescription: "Ein Schein pro beherbergter Person, vom Gast über seinen Aufenthaltslink eingereicht. Aufbewahrung 6 Monate, dann automatische Löschung. Es werden keine Ausweisdokumente verlangt oder gespeichert.",
  pConservees: (n) => `${n} Schein(e) aufbewahrt`,
  pAucune: "Kein Schein erhalten. Gäste füllen ihn vor der Anreise in ihrem Aufenthaltsbereich aus.",
  colSejour: "Aufenthalt", colLogement: "Unterkunft", colPersonne: "Person",
  colNaissance: "Geburt", colContact: "Kontakt", colRecue: "Erhalten", colPurge: "Löschung",
  pNote: "Personendaten: Zugriff auf Admin- und Gastgeberrollen beschränkt. Export außerhalb gesetzlicher Anforderung verboten; die Löschung erfolgt durch den Cron /api/cron/purge-police.",
  fTitrePage: "Team-Schulung — Profibereich", fSurtitre: "Profibereich · Team",
  fTitre: "Team-Schulung",
  fDescription: "Geführte Pfade für Empfang, Pflege und fehlerfreie Abrechnung.",
  fProgression: "Mein Fortschritt",
  fResume: (faites, total, pourcentage) => `${faites} / ${total} Schritte · ${pourcentage} %`,
  fComplet: "Pfad abgeschlossen. Bravo!",
  fAide: "Haken Sie erledigte Schritte Modul für Modul ab. Ihr Fortschritt wird bei jedem Senden gespeichert.",
  fOk: (module, pourcentage) =>
    `Fortschritt gespeichert${module ? ` (${module})` : ""}${pourcentage ? ` · ${pourcentage} %` : ""}.`,
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.", termine: "Abgeschlossen",
  pourcentageModule: (n) => `${n} % des Moduls`,
  enregistrerProgression: "Fortschritt speichern",
  rTitrePage: "DSGVO-Register — Profibereich", rSurtitre: "Profibereich · Compliance",
  rTitre: "DSGVO-Register",
  rDescription: "Sieben Verarbeitungen, ihre Zwecke, Rechtsgrundlagen und Aufbewahrungsfristen.",
  rOk: "Register gespeichert.", rAvancement: "Fortschritt",
  rResume: (documentes, actifs, pourcentage) => `${documentes} / ${actifs} aktive Verarbeitungen dokumentiert · ${pourcentage} %`,
  rComplet: "Register vollständig", rACompleter: "Zu vervollständigen",
  rManquants: (liste) => `Fehlende Aufbewahrungsfrist: ${liste}.`,
  rDpoAide: "Geben Sie den Kontakt des DPO (oder Referenten) ein, um das Register zu vervollständigen.",
  dpoNom: "DPO / Referent", dpoContact: "DPO-Kontakt", hebergement: "Datenhosting",
  colTraitement: "Verarbeitung", colBaseLegale: "Rechtsgrundlage", colDonnees: "Daten",
  colDestinataires: "Empfänger", colActif: "Aktiv", colConservation: "Aufbewahrung (Monate)",
  notesPlaceholder: "Maßnahmen, Auftragsverarbeiter, Hinweise",
  actifSr: (finalite) => `${finalite} aktiv`,
  rDurees: (max) => `Die Fristen können zwischen 1 und ${max} Monaten angepasst werden. Der JSON-Export enthält alle Mandantendaten zur Beantwortung einer Auskunftsanfrage.`,
  enregistrerRegistre: "Register speichern",
};

const DICTIONNAIRES: Record<Langue, TraductionsConformite> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsConformite(langue: string): TraductionsConformite {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
