import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsIntegrations {
  titrePage: string;
  espace: string;
  titre: string;
  description: string;
  okSupprime: string;
  okEnregistre: (libelle: string | null) => string;
  erreurInattendue: string;
  ajouter: string;
  aideAjout: string;
  libelle: string;
  urlHttps: string;
  secret: string;
  secretAide: string;
  evenements: string;
  enregistrer: string;
  webhooks: (n: number) => string;
  aucunWebhook: string;
  secretLabel: string;
  supprimer: string;
  livraisons: string;
  aucuneLivraison: string;
  date: string;
  evenement: string;
  statut: string;
  essais: string;
  detail: string;
  statuts: Record<string, string>;
  evenementsLabels: Record<string, string>;
}

const FR: TraductionsIntegrations = {
  titrePage: "Intégrations — Espace hôte",
  espace: "Espace hôte",
  titre: "Intégrations",
  description:
    "Webhooks signés vers Home Assistant, Moli ou un autre outil.",
  okSupprime: "Webhook supprimé.",
  okEnregistre: (libelle) =>
    libelle ? `Webhook « ${libelle} » enregistré.` : "Webhook enregistré.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  ajouter: "Ajouter un webhook",
  aideAjout:
    "Les livraisons sont tentées immédiatement par le cron horaire, avec jusqu’à 5 essais.",
  libelle: "Libellé",
  urlHttps: "URL HTTPS",
  secret: "Secret de signature",
  secretAide:
    "À recopier dans Home Assistant / Moli. Signature HMAC-SHA256 dans l’en-tête X-LCD-Signature.",
  evenements: "Événements",
  enregistrer: "Enregistrer le webhook",
  webhooks: (n) => `${n} webhook${n > 1 ? "s" : ""}`,
  aucunWebhook: "Aucun webhook configuré.",
  secretLabel: "secret",
  supprimer: "Supprimer",
  livraisons: "Dernières livraisons",
  aucuneLivraison: "Aucune livraison pour le moment.",
  date: "Date",
  evenement: "Événement",
  statut: "Statut",
  essais: "Essais",
  detail: "Détail",
  statuts: { pending: "en attente", success: "livré", failed: "échec" },
  evenementsLabels: {
    "reservation.created": "Réservation créée",
    "paiement.created": "Paiement reçu",
    "mission.status": "Mission changée",
    "ticket.created": "Ticket créé",
  },
};

const EN: TraductionsIntegrations = {
  titrePage: "Integrations — Staff area",
  espace: "Staff area",
  titre: "Integrations",
  description: "Signed webhooks to Home Assistant, Moli or another tool.",
  okSupprime: "Webhook deleted.",
  okEnregistre: (libelle) =>
    libelle ? `Webhook “${libelle}” saved.` : "Webhook saved.",
  erreurInattendue: "Unexpected error. Try again.",
  ajouter: "Add a webhook",
  aideAjout:
    "Deliveries are attempted immediately by the hourly cron, with up to 5 retries.",
  libelle: "Label",
  urlHttps: "HTTPS URL",
  secret: "Signing secret",
  secretAide:
    "Copy into Home Assistant / Moli. HMAC-SHA256 signature in the X-LCD-Signature header.",
  evenements: "Events",
  enregistrer: "Save webhook",
  webhooks: (n) => `${n} webhook${n > 1 ? "s" : ""}`,
  aucunWebhook: "No webhook configured.",
  secretLabel: "secret",
  supprimer: "Delete",
  livraisons: "Latest deliveries",
  aucuneLivraison: "No delivery yet.",
  date: "Date",
  evenement: "Event",
  statut: "Status",
  essais: "Attempts",
  detail: "Detail",
  statuts: { pending: "pending", success: "delivered", failed: "failed" },
  evenementsLabels: {
    "reservation.created": "Booking created",
    "paiement.created": "Payment received",
    "mission.status": "Mission changed",
    "ticket.created": "Ticket created",
  },
};

const ES: TraductionsIntegrations = {
  titrePage: "Integraciones — Área profesional",
  espace: "Área profesional",
  titre: "Integraciones",
  description: "Webhooks firmados hacia Home Assistant, Moli u otra herramienta.",
  okSupprime: "Webhook eliminado.",
  okEnregistre: (libelle) =>
    libelle ? `Webhook «${libelle}» guardado.` : "Webhook guardado.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  ajouter: "Añadir un webhook",
  aideAjout:
    "El cron horario intenta las entregas de inmediato, con hasta 5 reintentos.",
  libelle: "Etiqueta",
  urlHttps: "URL HTTPS",
  secret: "Secreto de firma",
  secretAide:
    "Copiar en Home Assistant / Moli. Firma HMAC-SHA256 en la cabecera X-LCD-Signature.",
  evenements: "Eventos",
  enregistrer: "Guardar webhook",
  webhooks: (n) => `${n} webhook${n > 1 ? "s" : ""}`,
  aucunWebhook: "Ningún webhook configurado.",
  secretLabel: "secreto",
  supprimer: "Eliminar",
  livraisons: "Últimas entregas",
  aucuneLivraison: "Ninguna entrega por el momento.",
  date: "Fecha",
  evenement: "Evento",
  statut: "Estado",
  essais: "Intentos",
  detail: "Detalle",
  statuts: { pending: "pendiente", success: "entregado", failed: "fallido" },
  evenementsLabels: {
    "reservation.created": "Reserva creada",
    "paiement.created": "Pago recibido",
    "mission.status": "Misión modificada",
    "ticket.created": "Ticket creado",
  },
};

const IT: TraductionsIntegrations = {
  titrePage: "Integrazioni — Area professionale",
  espace: "Area professionale",
  titre: "Integrazioni",
  description: "Webhook firmati verso Home Assistant, Moli o un altro strumento.",
  okSupprime: "Webhook eliminato.",
  okEnregistre: (libelle) =>
    libelle ? `Webhook «${libelle}» salvato.` : "Webhook salvato.",
  erreurInattendue: "Errore imprevisto. Riprovare.",
  ajouter: "Aggiungere un webhook",
  aideAjout:
    "Il cron orario tenta subito le consegne, con un massimo di 5 tentativi.",
  libelle: "Etichetta",
  urlHttps: "URL HTTPS",
  secret: "Segreto di firma",
  secretAide:
    "Copiare in Home Assistant / Moli. Firma HMAC-SHA256 nell’intestazione X-LCD-Signature.",
  evenements: "Eventi",
  enregistrer: "Salvare il webhook",
  webhooks: (n) => `${n} webhook`,
  aucunWebhook: "Nessun webhook configurato.",
  secretLabel: "segreto",
  supprimer: "Eliminare",
  livraisons: "Ultime consegne",
  aucuneLivraison: "Nessuna consegna per il momento.",
  date: "Data",
  evenement: "Evento",
  statut: "Stato",
  essais: "Tentativi",
  detail: "Dettaglio",
  statuts: { pending: "in attesa", success: "consegnato", failed: "fallito" },
  evenementsLabels: {
    "reservation.created": "Prenotazione creata",
    "paiement.created": "Pagamento ricevuto",
    "mission.status": "Missione modificata",
    "ticket.created": "Ticket creato",
  },
};

const DE: TraductionsIntegrations = {
  titrePage: "Integrationen — Mitarbeiterbereich",
  espace: "Mitarbeiterbereich",
  titre: "Integrationen",
  description: "Signierte Webhooks an Home Assistant, Moli oder ein anderes Tool.",
  okSupprime: "Webhook gelöscht.",
  okEnregistre: (libelle) =>
    libelle ? `Webhook „${libelle}“ gespeichert.` : "Webhook gespeichert.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  ajouter: "Webhook hinzufügen",
  aideAjout:
    "Zustellungen werden sofort vom stündlichen Cron versucht, mit bis zu 5 Wiederholungen.",
  libelle: "Bezeichnung",
  urlHttps: "HTTPS-URL",
  secret: "Signatur-Geheimnis",
  secretAide:
    "In Home Assistant / Moli kopieren. HMAC-SHA256-Signatur im Header X-LCD-Signature.",
  evenements: "Ereignisse",
  enregistrer: "Webhook speichern",
  webhooks: (n) => `${n} Webhook${n > 1 ? "s" : ""}`,
  aucunWebhook: "Kein Webhook konfiguriert.",
  secretLabel: "Geheimnis",
  supprimer: "Löschen",
  livraisons: "Letzte Zustellungen",
  aucuneLivraison: "Noch keine Zustellung.",
  date: "Datum",
  evenement: "Ereignis",
  statut: "Status",
  essais: "Versuche",
  detail: "Detail",
  statuts: { pending: "ausstehend", success: "zugestellt", failed: "fehlgeschlagen" },
  evenementsLabels: {
    "reservation.created": "Buchung erstellt",
    "paiement.created": "Zahlung erhalten",
    "mission.status": "Mission geändert",
    "ticket.created": "Ticket erstellt",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsIntegrations> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsIntegrations(langue: string): TraductionsIntegrations {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
