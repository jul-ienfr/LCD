import type { LanguePublique } from "@/domain/page-publique";

export interface TraductionsFils {
  titrePage: string;
  titre: string;
  description: string;
  filtreTous: string;
  statuts: Record<"ouvert" | "en_attente" | "clos", string>;
  recherche: string;
  recherchePlaceholder: string;
  filtrer: string;
  nonLus: string;
  nonAssigne: string;
  assigneA: string;
  assigner: string;
  colonneVoyageur: string;
  colonneDernier: string;
  colonneMessages: string;
  colonneStatut: string;
  vueFil: string;
  aucunMessage: string;
  repondre: string;
  canal: string;
  sujet: string;
  message: string;
  envoyer: string;
  brouillon: string;
  brouillonAssistant: string;
  assistant: string;
  assistantAide: string;
  intention: string;
  ton: string;
  redigerAssistant: string;
  traduire: string;
  traduction: string;
  traduireReponse: string;
  traductionReponse: string;
  traductionAide: string;
  envoyerBrouillon: string;
  pieceJointe: string;
  ajouterPieceJointe: string;
  consignes: string;
  optout: string;
  optoutFait: string;
  statutMisAJour: string;
  messageEnvoye: string;
  pieceJointeAjoutee: string;
  erreur: string;
  vide: string;
  automatisations: string;
  titreAutomatisations: string;
  descriptionAutomatisations: string;
  declencheur: string;
  modele: string;
  actif: string;
  activer: string;
  desactiver: string;
  supprimer: string;
  creerDepuisDefaut: string;
  creer: string;
  okCree: string;
  okModifie: string;
  okSupprime: string;
  variables: string;
}

const TRADUCTIONS: Record<LanguePublique, TraductionsFils> = {
  fr: {
    titrePage: "Fils voyageurs — LCD",
    titre: "Fils voyageurs",
    description:
      "Tous les échanges avec un voyageur, quel que soit le canal, dans un seul fil. Les messages automatiques arrivent en brouillon : rien ne part sans validation.",
    filtreTous: "Tous",
    statuts: {
      ouvert: "Ouvert",
      en_attente: "En attente du voyageur",
      clos: "Clos",
    },
    recherche: "Recherche",
    recherchePlaceholder: "Nom, email ou téléphone",
    filtrer: "Filtrer",
    nonLus: "non lus",
    nonAssigne: "Non assigné",
    assigneA: "Assigné à",
    assigner: "Assigner",
    colonneVoyageur: "Voyageur",
    colonneDernier: "Dernier message",
    colonneMessages: "Messages",
    colonneStatut: "Statut",
    vueFil: "Ouvrir le fil",
    aucunMessage: "Aucun message",
    repondre: "Répondre",
    canal: "Canal",
    sujet: "Sujet",
    message: "Message",
    envoyer: "Envoyer",
    brouillon: "Brouillon",
    brouillonAssistant: "Brouillon rédigé et ajouté au fil.",
    assistant: "Assistant de rédaction",
    assistantAide:
      "Rédige un brouillon contextualisé par les derniers messages du fil. Rien n’est envoyé sans validation.",
    intention: "Intention",
    ton: "Ton",
    redigerAssistant: "Rédiger un brouillon",
    traduire: "Traduire",
    traduction: "Traduction",
    traduireReponse: "Traduire la réponse",
    traductionReponse: "Réponse traduite pour le voyageur",
    traductionAide: "Traduction automatique — à relire avant envoi.",
    envoyerBrouillon: "Envoyer ce brouillon",
    pieceJointe: "Pièce jointe",
    ajouterPieceJointe: "Ajouter la pièce jointe",
    consignes: "Consignes",
    optout: "Retirer le consentement SMS/WhatsApp",
    optoutFait: "Consentement retiré pour ce canal.",
    statutMisAJour: "Statut du fil mis à jour.",
    messageEnvoye: "Message envoyé.",
    pieceJointeAjoutee: "Pièce jointe ajoutée.",
    erreur: "Action impossible.",
    vide: "Aucun fil pour le moment.",
    automatisations: "Automatisations",
    titreAutomatisations: "Automatisations de messages",
    descriptionAutomatisations:
      "Modèles de messages de séjour (J-7, J-1, arrivée, départ, J+1). Chaque exécution crée un brouillon à valider.",
    declencheur: "Déclencheur",
    modele: "Modèle",
    actif: "Actif",
    activer: "Activer",
    desactiver: "Désactiver",
    supprimer: "Supprimer",
    creerDepuisDefaut: "Créer depuis un modèle",
    creer: "Créer",
    okCree: "Automatisation créée.",
    okModifie: "Automatisation mise à jour.",
    okSupprime: "Automatisation supprimée.",
    variables:
      "Variables : {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
  en: {
    titrePage: "Guest threads — LCD",
    titre: "Guest threads",
    description:
      "Every exchange with a guest, whatever the channel, in a single thread. Automatic messages arrive as drafts: nothing is sent without approval.",
    filtreTous: "All",
    statuts: { ouvert: "Open", en_attente: "Waiting for guest", clos: "Closed" },
    recherche: "Search",
    recherchePlaceholder: "Name, email or phone",
    filtrer: "Filter",
    nonLus: "unread",
    nonAssigne: "Unassigned",
    assigneA: "Assigned to",
    assigner: "Assign",
    colonneVoyageur: "Guest",
    colonneDernier: "Last message",
    colonneMessages: "Messages",
    colonneStatut: "Status",
    vueFil: "Open thread",
    aucunMessage: "No message",
    repondre: "Reply",
    canal: "Channel",
    sujet: "Subject",
    message: "Message",
    envoyer: "Send",
    brouillon: "Draft",
    brouillonAssistant: "Draft written and added to the thread.",
    assistant: "Writing assistant",
    assistantAide:
      "Drafts a reply grounded in the latest messages of the thread. Nothing is sent without approval.",
    intention: "Intent",
    ton: "Tone",
    redigerAssistant: "Draft a reply",
    traduire: "Translate",
    traduction: "Translation",
    traduireReponse: "Translate the reply",
    traductionReponse: "Reply translated for the traveller",
    traductionAide: "Machine translation — review before sending.",
    envoyerBrouillon: "Send this draft",
    pieceJointe: "Attachment",
    ajouterPieceJointe: "Add attachment",
    consignes: "Settings",
    optout: "Withdraw SMS/WhatsApp consent",
    optoutFait: "Consent withdrawn for this channel.",
    statutMisAJour: "Thread status updated.",
    messageEnvoye: "Message sent.",
    pieceJointeAjoutee: "Attachment added.",
    erreur: "Action not possible.",
    vide: "No thread yet.",
    automatisations: "Automations",
    titreAutomatisations: "Message automations",
    descriptionAutomatisations:
      "Stay message templates (J-7, J-1, arrival, departure, J+1). Each run creates a draft to approve.",
    declencheur: "Trigger",
    modele: "Template",
    actif: "Active",
    activer: "Activate",
    desactiver: "Deactivate",
    supprimer: "Delete",
    creerDepuisDefaut: "Create from a template",
    creer: "Create",
    okCree: "Automation created.",
    okModifie: "Automation updated.",
    okSupprime: "Automation deleted.",
    variables:
      "Variables: {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
  es: {
    titrePage: "Hilos de huéspedes — LCD",
    titre: "Hilos de huéspedes",
    description:
      "Todas las conversaciones con un huésped, sea cual sea el canal, en un solo hilo. Los mensajes automáticos llegan como borrador.",
    filtreTous: "Todos",
    statuts: { ouvert: "Abierto", en_attente: "Esperando huésped", clos: "Cerrado" },
    recherche: "Búsqueda",
    recherchePlaceholder: "Nombre, correo o teléfono",
    filtrer: "Filtrar",
    nonLus: "sin leer",
    nonAssigne: "Sin asignar",
    assigneA: "Asignado a",
    assigner: "Asignar",
    colonneVoyageur: "Huésped",
    colonneDernier: "Último mensaje",
    colonneMessages: "Mensajes",
    colonneStatut: "Estado",
    vueFil: "Abrir hilo",
    aucunMessage: "Sin mensaje",
    repondre: "Responder",
    canal: "Canal",
    sujet: "Asunto",
    message: "Mensaje",
    envoyer: "Enviar",
    brouillon: "Borrador",
    brouillonAssistant: "Borrador redactado y añadido al hilo.",
    assistant: "Asistente de redacción",
    assistantAide:
      "Redacta un borrador contextualizado con los últimos mensajes del hilo. Nada se envía sin validación.",
    intention: "Intención",
    ton: "Tono",
    redigerAssistant: "Redactar un borrador",
    traduire: "Traducir",
    traduction: "Traducción",
    traduireReponse: "Traducir la respuesta",
    traductionReponse: "Respuesta traducida para el viajero",
    traductionAide: "Traducción automática — revisar antes de enviar.",
    envoyerBrouillon: "Enviar este borrador",
    pieceJointe: "Adjunto",
    ajouterPieceJointe: "Añadir adjunto",
    consignes: "Ajustes",
    optout: "Retirar el consentimiento SMS/WhatsApp",
    optoutFait: "Consentimiento retirado para este canal.",
    statutMisAJour: "Estado del hilo actualizado.",
    messageEnvoye: "Mensaje enviado.",
    pieceJointeAjoutee: "Adjunto añadido.",
    erreur: "Acción imposible.",
    vide: "Todavía no hay hilos.",
    automatisations: "Automatizaciones",
    titreAutomatisations: "Automatizaciones de mensajes",
    descriptionAutomatisations:
      "Plantillas de mensajes de estancia (J-7, J-1, llegada, salida, J+1). Cada ejecución crea un borrador.",
    declencheur: "Disparador",
    modele: "Plantilla",
    actif: "Activa",
    activer: "Activar",
    desactiver: "Desactivar",
    supprimer: "Eliminar",
    creerDepuisDefaut: "Crear desde plantilla",
    creer: "Crear",
    okCree: "Automatización creada.",
    okModifie: "Automatización actualizada.",
    okSupprime: "Automatización eliminada.",
    variables:
      "Variables: {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
  it: {
    titrePage: "Conversazioni ospiti — LCD",
    titre: "Conversazioni ospiti",
    description:
      "Tutti gli scambi con un ospite, su qualsiasi canale, in un'unica conversazione. I messaggi automatici arrivano come bozza.",
    filtreTous: "Tutti",
    statuts: { ouvert: "Aperta", en_attente: "In attesa dell'ospite", clos: "Chiusa" },
    recherche: "Ricerca",
    recherchePlaceholder: "Nome, email o telefono",
    filtrer: "Filtra",
    nonLus: "non letti",
    nonAssigne: "Non assegnata",
    assigneA: "Assegnata a",
    assigner: "Assegna",
    colonneVoyageur: "Ospite",
    colonneDernier: "Ultimo messaggio",
    colonneMessages: "Messaggi",
    colonneStatut: "Stato",
    vueFil: "Apri conversazione",
    aucunMessage: "Nessun messaggio",
    repondre: "Rispondi",
    canal: "Canale",
    sujet: "Oggetto",
    message: "Messaggio",
    envoyer: "Invia",
    brouillon: "Bozza",
    brouillonAssistant: "Bozza redatta e aggiunta al filo.",
    assistant: "Assistente di scrittura",
    assistantAide:
      "Redige una bozza contestualizzata con gli ultimi messaggi del filo. Nulla viene inviato senza validazione.",
    intention: "Intenzione",
    ton: "Tono",
    redigerAssistant: "Redigere una bozza",
    traduire: "Tradurre",
    traduction: "Traduzione",
    traduireReponse: "Tradurre la risposta",
    traductionReponse: "Risposta tradotta per il viaggiatore",
    traductionAide: "Traduzione automatica — rileggere prima dell’invio.",
    envoyerBrouillon: "Invia questa bozza",
    pieceJointe: "Allegato",
    ajouterPieceJointe: "Aggiungi allegato",
    consignes: "Impostazioni",
    optout: "Revoca consenso SMS/WhatsApp",
    optoutFait: "Consenso revocato per questo canale.",
    statutMisAJour: "Stato aggiornato.",
    messageEnvoye: "Messaggio inviato.",
    pieceJointeAjoutee: "Allegato aggiunto.",
    erreur: "Azione impossibile.",
    vide: "Nessuna conversazione.",
    automatisations: "Automazioni",
    titreAutomatisations: "Automazioni dei messaggi",
    descriptionAutomatisations:
      "Modelli di messaggi di soggiorno (J-7, J-1, arrivo, partenza, J+1). Ogni esecuzione crea una bozza.",
    declencheur: "Attivatore",
    modele: "Modello",
    actif: "Attiva",
    activer: "Attiva",
    desactiver: "Disattiva",
    supprimer: "Elimina",
    creerDepuisDefaut: "Crea da modello",
    creer: "Crea",
    okCree: "Automazione creata.",
    okModifie: "Automazione aggiornata.",
    okSupprime: "Automazione eliminata.",
    variables:
      "Variabili: {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
  de: {
    titrePage: "Gästeverläufe — LCD",
    titre: "Gästeverläufe",
    description:
      "Alle Nachrichten mit einem Gast, unabhängig vom Kanal, in einem Verlauf. Automatische Nachrichten kommen als Entwurf.",
    filtreTous: "Alle",
    statuts: { ouvert: "Offen", en_attente: "Wartet auf Gast", clos: "Geschlossen" },
    recherche: "Suche",
    recherchePlaceholder: "Name, E-Mail oder Telefon",
    filtrer: "Filtern",
    nonLus: "ungelesen",
    nonAssigne: "Nicht zugewiesen",
    assigneA: "Zugewiesen an",
    assigner: "Zuweisen",
    colonneVoyageur: "Gast",
    colonneDernier: "Letzte Nachricht",
    colonneMessages: "Nachrichten",
    colonneStatut: "Status",
    vueFil: "Verlauf öffnen",
    aucunMessage: "Keine Nachricht",
    repondre: "Antworten",
    canal: "Kanal",
    sujet: "Betreff",
    message: "Nachricht",
    envoyer: "Senden",
    brouillon: "Entwurf",
    brouillonAssistant: "Entwurf erstellt und dem Verlauf hinzugefügt.",
    assistant: "Schreibassistent",
    assistantAide:
      "Erstellt einen Entwurf auf Basis der letzten Nachrichten des Verlaufs. Nichts wird ohne Freigabe gesendet.",
    intention: "Absicht",
    ton: "Ton",
    redigerAssistant: "Entwurf erstellen",
    traduire: "Übersetzen",
    traduction: "Übersetzung",
    traduireReponse: "Antwort übersetzen",
    traductionReponse: "Antwort für den Gast übersetzt",
    traductionAide: "Automatische Übersetzung — vor dem Senden prüfen.",
    envoyerBrouillon: "Diesen Entwurf senden",
    pieceJointe: "Anhang",
    ajouterPieceJointe: "Anhang hinzufügen",
    consignes: "Einstellungen",
    optout: "SMS/WhatsApp-Einwilligung widerrufen",
    optoutFait: "Einwilligung für diesen Kanal widerrufen.",
    statutMisAJour: "Status aktualisiert.",
    messageEnvoye: "Nachricht gesendet.",
    pieceJointeAjoutee: "Anhang hinzugefügt.",
    erreur: "Aktion nicht möglich.",
    vide: "Noch kein Verlauf.",
    automatisations: "Automatisierungen",
    titreAutomatisations: "Nachrichten-Automatisierungen",
    descriptionAutomatisations:
      "Vorlagen für Aufenthaltsnachrichten (J-7, J-1, Anreise, Abreise, J+1). Jeder Lauf erzeugt einen Entwurf.",
    declencheur: "Auslöser",
    modele: "Vorlage",
    actif: "Aktiv",
    activer: "Aktivieren",
    desactiver: "Deaktivieren",
    supprimer: "Löschen",
    creerDepuisDefaut: "Aus Vorlage erstellen",
    creer: "Erstellen",
    okCree: "Automatisierung erstellt.",
    okModifie: "Automatisierung aktualisiert.",
    okSupprime: "Automatisierung gelöscht.",
    variables:
      "Variablen: {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
  nl: {
    titrePage: "Gastenberichten — LCD",
    titre: "Gastenberichten",
    description:
      "Alle berichten met een gast, op elk kanaal, in één gesprek. Automatische berichten komen binnen als concept.",
    filtreTous: "Alle",
    statuts: { ouvert: "Open", en_attente: "Wacht op gast", clos: "Gesloten" },
    recherche: "Zoeken",
    recherchePlaceholder: "Naam, e-mail of telefoon",
    filtrer: "Filteren",
    nonLus: "ongelezen",
    nonAssigne: "Niet toegewezen",
    assigneA: "Toegewezen aan",
    assigner: "Toewijzen",
    colonneVoyageur: "Gast",
    colonneDernier: "Laatste bericht",
    colonneMessages: "Berichten",
    colonneStatut: "Status",
    vueFil: "Gesprek openen",
    aucunMessage: "Geen bericht",
    repondre: "Antwoorden",
    canal: "Kanaal",
    sujet: "Onderwerp",
    message: "Bericht",
    envoyer: "Verzenden",
    brouillon: "Concept",
    brouillonAssistant: "Concept opgesteld en aan het gesprek toegevoegd.",
    assistant: "Schrijfassistent",
    assistantAide:
      "Maakt een concept op basis van de laatste berichten in het gesprek. Niets wordt zonder goedkeuring verzonden.",
    intention: "Intentie",
    ton: "Toon",
    redigerAssistant: "Concept opstellen",
    traduire: "Vertalen",
    traduction: "Vertaling",
    traduireReponse: "Antwoord vertalen",
    traductionReponse: "Antwoord voor de gast vertaald",
    traductionAide: "Automatische vertaling — controleren vóór verzenden.",
    envoyerBrouillon: "Dit concept verzenden",
    pieceJointe: "Bijlage",
    ajouterPieceJointe: "Bijlage toevoegen",
    consignes: "Instellingen",
    optout: "SMS/WhatsApp-toestemming intrekken",
    optoutFait: "Toestemming voor dit kanaal ingetrokken.",
    statutMisAJour: "Status bijgewerkt.",
    messageEnvoye: "Bericht verzonden.",
    pieceJointeAjoutee: "Bijlage toegevoegd.",
    erreur: "Actie niet mogelijk.",
    vide: "Nog geen gesprek.",
    automatisations: "Automatiseringen",
    titreAutomatisations: "Bericht-automatiseringen",
    descriptionAutomatisations:
      "Sjablonen voor verblijfsberichten (J-7, J-1, aankomst, vertrek, J+1). Elke run maakt een concept.",
    declencheur: "Trigger",
    modele: "Sjabloon",
    actif: "Actief",
    activer: "Activeren",
    desactiver: "Deactiveren",
    supprimer: "Verwijderen",
    creerDepuisDefaut: "Aanmaken vanuit sjabloon",
    creer: "Aanmaken",
    okCree: "Automatisering aangemaakt.",
    okModifie: "Automatisering bijgewerkt.",
    okSupprime: "Automatisering verwijderd.",
    variables:
      "Variabelen: {{voyageur}}, {{logement}}, {{arrivee}}, {{depart}}, {{nuits}}, {{reference}}",
  },
};

export function traductionsFils(langue: string): TraductionsFils {
  return TRADUCTIONS[langue as LanguePublique] ?? TRADUCTIONS.fr;
}

/** Messages de confirmation indexés par le paramètre `?ok=` de l'URL. */
export function messageFils(t: TraductionsFils, cle: string): string {
  const table = t as unknown as Record<string, string>;
  return table[cle] ?? t.erreur;
}
