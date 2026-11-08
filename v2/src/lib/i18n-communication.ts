import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsCommunication {
  aTitrePage: string;
  aSurtitre: string;
  aTitre: string;
  aDescription: string;
  aBrouillonsMois: string;
  aCoutMois: string;
  aQuotaAtteint: string;
  aDesactive: string;
  aCreerAide: string;
  aChoisirLogement: string;
  aIntention: string;
  aTon: string;
  aVoyageur: string;
  aVoyageurPlaceholder: string;
  aDetails: string;
  aDetailsPlaceholder: string;
  aRediger: string;
  aComparer: string;
  aVariante: (ton: string) => string;
  aBrouillon: string;
  aPrompt: string;
  aMots: (mots: number, max: number) => string;
  aCanal: string;
  aEmailVoyageur: string;
  aTelephone: string;
  aEnregistrerMessages: string;
  aMessagesVoyageurs: string;
  aPhrasesTypes: string;
  fTitrePage: string;
  fSurtitre: string;
  fTitre: string;
  fDescription: string;
  fCree: string;
  fNouveau: string;
  fCanal: string;
  fSujet: string;
  fSujetPlaceholder: string;
  fLogementOptionnel: string;
  fAucun: string;
  fCreer: string;
  fConversations: string;
  fFiltrer: string;
  fTous: string;
  fVide: string;
  fColSujet: string;
  fColCanal: string;
  fColLogement: string;
  fColStatut: string;
  fColActivite: string;
  fOuvert: string;
  fFerme: string;
  fTableau: string;
  fMessagesVoyageur: string;
}

const FR: TraductionsCommunication = {
  aTitrePage: "Assistant de messages — Espace hôte",
  aSurtitre: "Espace hôte · Assistant",
  aTitre: "Brouillons de messages",
  aDescription: "Routage local ou standard selon l’intention, aperçu du prompt et brouillon sans donnée sensible.",
  aBrouillonsMois: "Brouillons enregistrés ce mois",
  aCoutMois: "Coût estimé ce mois",
  aQuotaAtteint: "Quota mensuel atteint : l’enregistrement de nouveaux brouillons est bloqué jusqu’au mois prochain.",
  aDesactive: "Assistant désactivé par le super-administrateur : la génération est suspendue, les messages déjà enregistrés restent accessibles.",
  aCreerAide: "Créez d’abord un logement pour rédiger un brouillon.",
  aChoisirLogement: "Choisir un logement",
  aIntention: "Intention",
  aTon: "Ton",
  aVoyageur: "Voyageur (optionnel)",
  aVoyageurPlaceholder: "Camille",
  aDetails: "Détails (optionnel)",
  aDetailsPlaceholder: "Arrivée possible dès 14 h, lit bébé installé.",
  aRediger: "Rédiger le brouillon",
  aComparer: "Comparer les 3 tons",
  aVariante: (ton) => `Variante — ${ton}`,
  aBrouillon: "Brouillon",
  aPrompt: "Prompt envoyé au modèle",
  aMots: (mots, max) => `${mots} / ${max} mots`,
  aCanal: "Canal",
  aEmailVoyageur: "E-mail du voyageur",
  aTelephone: "Téléphone (SMS)",
  aEnregistrerMessages: "Enregistrer dans les messages",
  aMessagesVoyageurs: "Messages voyageurs",
  aPhrasesTypes: "Phrases types",
  fTitrePage: "Fils internes — LCD Parc",
  fSurtitre: "Espace hôte · Communication",
  fTitre: "Fils internes",
  fDescription: "Trois canaux de travail — propriétaire, prestataire, voyageur — pour garder les échanges et les décisions au même endroit. Un fil fermé reste consultable mais n’accepte plus de réponse.",
  fCree: "Fil créé.",
  fNouveau: "Nouveau fil",
  fCanal: "Canal",
  fSujet: "Sujet",
  fSujetPlaceholder: "Ex. Clé du portail à remplacer",
  fLogementOptionnel: "Logement (optionnel)",
  fAucun: "Aucun",
  fCreer: "Créer le fil",
  fConversations: "Conversations",
  fFiltrer: "Filtrer par canal",
  fTous: "Tous",
  fVide: "Aucun fil pour ce filtre. Créez le premier ci-dessus.",
  fColSujet: "Sujet",
  fColCanal: "Canal",
  fColLogement: "Logement",
  fColStatut: "Statut",
  fColActivite: "Dernière activité",
  fOuvert: "Ouvert",
  fFerme: "Fermé",
  fTableau: "Tableau de bord",
  fMessagesVoyageur: "Messages voyageur",
};

const EN: TraductionsCommunication = {
  aTitrePage: "Message assistant — Staff area",
  aSurtitre: "Staff area · Assistant",
  aTitre: "Message drafts",
  aDescription: "Local or standard routing by intent, prompt preview and draft without sensitive data.",
  aBrouillonsMois: "Drafts saved this month",
  aCoutMois: "Estimated cost this month",
  aQuotaAtteint: "Monthly quota reached: saving new drafts is blocked until next month.",
  aDesactive: "Assistant disabled by the super administrator: generation is suspended, already saved messages remain accessible.",
  aCreerAide: "Create a property first to write a draft.",
  aChoisirLogement: "Choose a property",
  aIntention: "Intent",
  aTon: "Tone",
  aVoyageur: "Guest (optional)",
  aVoyageurPlaceholder: "Camille",
  aDetails: "Details (optional)",
  aDetailsPlaceholder: "Arrival possible from 2 pm, cot installed.",
  aRediger: "Write draft",
  aComparer: "Compare the 3 tones",
  aVariante: (ton) => `Variant — ${ton}`,
  aBrouillon: "Draft",
  aPrompt: "Prompt sent to the model",
  aMots: (mots, max) => `${mots} / ${max} words`,
  aCanal: "Channel",
  aEmailVoyageur: "Guest email",
  aTelephone: "Phone (SMS)",
  aEnregistrerMessages: "Save to messages",
  aMessagesVoyageurs: "Guest messages",
  aPhrasesTypes: "Canned replies",
  fTitrePage: "Internal threads — LCD Parc",
  fSurtitre: "Staff area · Communication",
  fTitre: "Internal threads",
  fDescription: "Three work channels — owner, provider, guest — to keep exchanges and decisions in one place. A closed thread remains readable but no longer accepts replies.",
  fCree: "Thread created.",
  fNouveau: "New thread",
  fCanal: "Channel",
  fSujet: "Subject",
  fSujetPlaceholder: "E.g. Gate key to replace",
  fLogementOptionnel: "Property (optional)",
  fAucun: "None",
  fCreer: "Create thread",
  fConversations: "Conversations",
  fFiltrer: "Filter by channel",
  fTous: "All",
  fVide: "No thread for this filter. Create the first one above.",
  fColSujet: "Subject",
  fColCanal: "Channel",
  fColLogement: "Property",
  fColStatut: "Status",
  fColActivite: "Last activity",
  fOuvert: "Open",
  fFerme: "Closed",
  fTableau: "Dashboard",
  fMessagesVoyageur: "Guest messages",
};

const ES: TraductionsCommunication = {
  aTitrePage: "Asistente de mensajes — Área profesional",
  aSurtitre: "Área profesional · Asistente",
  aTitre: "Borradores de mensajes",
  aDescription: "Enrutamiento local o estándar según la intención, vista previa del prompt y borrador sin datos sensibles.",
  aBrouillonsMois: "Borradores guardados este mes",
  aCoutMois: "Coste estimado este mes",
  aQuotaAtteint: "Cuota mensual alcanzada: el guardado de nuevos borradores está bloqueado hasta el próximo mes.",
  aDesactive: "Asistente desactivado por el superadministrador: la generación está suspendida, los mensajes ya guardados siguen accesibles.",
  aCreerAide: "Cree primero un alojamiento para redactar un borrador.",
  aChoisirLogement: "Elegir un alojamiento",
  aIntention: "Intención",
  aTon: "Tono",
  aVoyageur: "Viajero (opcional)",
  aVoyageurPlaceholder: "Camille",
  aDetails: "Detalles (opcional)",
  aDetailsPlaceholder: "Llegada posible desde las 14 h, cuna instalada.",
  aRediger: "Redactar el borrador",
  aComparer: "Comparar los 3 tonos",
  aVariante: (ton) => `Variante — ${ton}`,
  aBrouillon: "Borrador",
  aPrompt: "Prompt enviado al modelo",
  aMots: (mots, max) => `${mots} / ${max} palabras`,
  aCanal: "Canal",
  aEmailVoyageur: "Correo del viajero",
  aTelephone: "Teléfono (SMS)",
  aEnregistrerMessages: "Guardar en los mensajes",
  aMessagesVoyageurs: "Mensajes de viajeros",
  aPhrasesTypes: "Respuestas tipo",
  fTitrePage: "Hilos internos — LCD Parc",
  fSurtitre: "Área profesional · Comunicación",
  fTitre: "Hilos internos",
  fDescription: "Tres canales de trabajo — propietario, proveedor, viajero — para mantener los intercambios y las decisiones en un mismo lugar. Un hilo cerrado sigue consultable pero ya no acepta respuestas.",
  fCree: "Hilo creado.",
  fNouveau: "Nuevo hilo",
  fCanal: "Canal",
  fSujet: "Asunto",
  fSujetPlaceholder: "Ej. Llave del portal a sustituir",
  fLogementOptionnel: "Alojamiento (opcional)",
  fAucun: "Ninguno",
  fCreer: "Crear el hilo",
  fConversations: "Conversaciones",
  fFiltrer: "Filtrar por canal",
  fTous: "Todos",
  fVide: "Ningún hilo para este filtro. Cree el primero arriba.",
  fColSujet: "Asunto",
  fColCanal: "Canal",
  fColLogement: "Alojamiento",
  fColStatut: "Estado",
  fColActivite: "Última actividad",
  fOuvert: "Abierto",
  fFerme: "Cerrado",
  fTableau: "Panel",
  fMessagesVoyageur: "Mensajes de viajeros",
};

const IT: TraductionsCommunication = {
  aTitrePage: "Assistente messaggi — Area professionale",
  aSurtitre: "Area professionale · Assistente",
  aTitre: "Bozze di messaggi",
  aDescription: "Instradamento locale o standard secondo l’intenzione, anteprima del prompt e bozza senza dati sensibili.",
  aBrouillonsMois: "Bozze salvate questo mese",
  aCoutMois: "Costo stimato questo mese",
  aQuotaAtteint: "Quota mensile raggiunta: il salvataggio di nuove bozze è bloccato fino al mese prossimo.",
  aDesactive: "Assistente disattivato dal super amministratore: la generazione è sospesa, i messaggi già salvati restano accessibili.",
  aCreerAide: "Crei prima un alloggio per scrivere una bozza.",
  aChoisirLogement: "Scegli un alloggio",
  aIntention: "Intenzione",
  aTon: "Tono",
  aVoyageur: "Ospite (opzionale)",
  aVoyageurPlaceholder: "Camille",
  aDetails: "Dettagli (opzionale)",
  aDetailsPlaceholder: "Arrivo possibile dalle 14, culla installata.",
  aRediger: "Scrivi la bozza",
  aComparer: "Confronta i 3 toni",
  aVariante: (ton) => `Variante — ${ton}`,
  aBrouillon: "Bozza",
  aPrompt: "Prompt inviato al modello",
  aMots: (mots, max) => `${mots} / ${max} parole`,
  aCanal: "Canale",
  aEmailVoyageur: "E-mail dell’ospite",
  aTelephone: "Telefono (SMS)",
  aEnregistrerMessages: "Salva nei messaggi",
  aMessagesVoyageurs: "Messaggi ospiti",
  aPhrasesTypes: "Risposte predefinite",
  fTitrePage: "Fili interni — LCD Parc",
  fSurtitre: "Area professionale · Comunicazione",
  fTitre: "Fili interni",
  fDescription: "Tre canali di lavoro — proprietario, fornitore, ospite — per tenere scambi e decisioni nello stesso posto. Un filo chiuso resta consultabile ma non accetta più risposte.",
  fCree: "Filo creato.",
  fNouveau: "Nuovo filo",
  fCanal: "Canale",
  fSujet: "Oggetto",
  fSujetPlaceholder: "Es. Chiave del cancello da sostituire",
  fLogementOptionnel: "Alloggio (opzionale)",
  fAucun: "Nessuno",
  fCreer: "Crea il filo",
  fConversations: "Conversazioni",
  fFiltrer: "Filtra per canale",
  fTous: "Tutti",
  fVide: "Nessun filo per questo filtro. Crei il primo qui sopra.",
  fColSujet: "Oggetto",
  fColCanal: "Canale",
  fColLogement: "Alloggio",
  fColStatut: "Stato",
  fColActivite: "Ultima attività",
  fOuvert: "Aperto",
  fFerme: "Chiuso",
  fTableau: "Dashboard",
  fMessagesVoyageur: "Messaggi ospiti",
};

const DE: TraductionsCommunication = {
  aTitrePage: "Nachrichten-Assistent — Profibereich",
  aSurtitre: "Profibereich · Assistent",
  aTitre: "Nachrichtenentwürfe",
  aDescription: "Lokales oder Standard-Routing je nach Absicht, Prompt-Vorschau und Entwurf ohne sensible Daten.",
  aBrouillonsMois: "Diesen Monat gespeicherte Entwürfe",
  aCoutMois: "Geschätzte Kosten diesen Monat",
  aQuotaAtteint: "Monatskontingent erreicht: Das Speichern neuer Entwürfe ist bis zum nächsten Monat blockiert.",
  aDesactive: "Assistent vom Superadministrator deaktiviert: Die Generierung ist ausgesetzt, bereits gespeicherte Nachrichten bleiben zugänglich.",
  aCreerAide: "Erstellen Sie zuerst eine Unterkunft, um einen Entwurf zu schreiben.",
  aChoisirLogement: "Unterkunft wählen",
  aIntention: "Absicht",
  aTon: "Ton",
  aVoyageur: "Gast (optional)",
  aVoyageurPlaceholder: "Camille",
  aDetails: "Details (optional)",
  aDetailsPlaceholder: "Anreise ab 14 Uhr möglich, Babybett aufgestellt.",
  aRediger: "Entwurf schreiben",
  aComparer: "Die 3 Töne vergleichen",
  aVariante: (ton) => `Variante — ${ton}`,
  aBrouillon: "Entwurf",
  aPrompt: "An das Modell gesendeter Prompt",
  aMots: (mots, max) => `${mots} / ${max} Wörter`,
  aCanal: "Kanal",
  aEmailVoyageur: "E-Mail des Gastes",
  aTelephone: "Telefon (SMS)",
  aEnregistrerMessages: "In Nachrichten speichern",
  aMessagesVoyageurs: "Gastnachrichten",
  aPhrasesTypes: "Textbausteine",
  fTitrePage: "Interne Threads — LCD Parc",
  fSurtitre: "Profibereich · Kommunikation",
  fTitre: "Interne Threads",
  fDescription: "Drei Arbeitskanäle — Eigentümer, Dienstleister, Gast — damit Austausch und Entscheidungen an einem Ort bleiben. Ein geschlossener Thread bleibt lesbar, nimmt aber keine Antworten mehr an.",
  fCree: "Thread erstellt.",
  fNouveau: "Neuer Thread",
  fCanal: "Kanal",
  fSujet: "Betreff",
  fSujetPlaceholder: "Z. B. Tor Schlüssel ersetzen",
  fLogementOptionnel: "Unterkunft (optional)",
  fAucun: "Keine",
  fCreer: "Thread erstellen",
  fConversations: "Unterhaltungen",
  fFiltrer: "Nach Kanal filtern",
  fTous: "Alle",
  fVide: "Kein Thread für diesen Filter. Erstellen Sie den ersten oben.",
  fColSujet: "Betreff",
  fColCanal: "Kanal",
  fColLogement: "Unterkunft",
  fColStatut: "Status",
  fColActivite: "Letzte Aktivität",
  fOuvert: "Offen",
  fFerme: "Geschlossen",
  fTableau: "Dashboard",
  fMessagesVoyageur: "Gastnachrichten",
};

const DICTIONNAIRES: Record<Langue, TraductionsCommunication> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsCommunication(langue: string): TraductionsCommunication {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
