import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsAudit {
  exporter: string;
  retour: string;
  rechercher: string;
  recherchePlaceholder: string;
  periode: string;
  jours: string;
  famille: string;
  toutes: string;
  filtrer: string;
  effacer: string;
  aucuneAction: string;
  details: string;
  precedent: string;
  suivant: string;
  retention: string;
  conservation: string;
  aucuneAncienne: string;
  purger: string;
  tableau: string;
  par: string;
  cible: string;
  reference: string;
  page: string;
  saisir: string;
  aucunePurge: string;
  messagePurge: (nombre: number, jours: number) => string;
  messageAnciennes: (nombre: number) => string;
  familles: Record<string, string>;
}

const FR: TraductionsAudit = {
  exporter: "Exporter le journal CSV", retour: "Retour au tableau de bord",
  rechercher: "Rechercher", recherchePlaceholder: "action, auteur, cible ou référence",
  periode: "Période", jours: "jours", famille: "Famille", toutes: "Toutes",
  filtrer: "Filtrer", effacer: "Effacer les filtres",
  aucuneAction: "Aucune action sur cette période.", details: "Détails",
  precedent: "← Précédent", suivant: "Suivant →", retention: "Rétention",
  conservation: "Conservation", aucuneAncienne: "Aucune entrée au-delà de cette durée.",
  purger: "Purger définitivement", tableau: "Tableau de bord",
  par: "Par", cible: "cible", reference: "réf", page: "Page",
  saisir: "Saisissez",
  aucunePurge: "Aucune entrée à purger.",
  messagePurge: (n, j) => `${n} entrée(s) de plus de ${j} jours supprimée(s).`,
  messageAnciennes: (n) => `${n} entrée(s) dépasse(nt) cette durée.`,
  familles: {
    utilisateur: "Utilisateurs", reservation: "Réservations", paiement: "Paiements",
    facture: "Factures", caution: "Cautions", mission: "Missions", ticket: "Support",
    menage: "Ménage", message: "Messages", dispatch: "Dispatch", assistant: "Assistant",
    stock: "Stock", logement: "Logements", avis: "Avis",
  },
};

const EN: TraductionsAudit = {
  exporter: "Export audit CSV", retour: "Back to dashboard",
  rechercher: "Search", recherchePlaceholder: "action, author, target or reference",
  periode: "Period", jours: "days", famille: "Category", toutes: "All",
  filtrer: "Filter", effacer: "Clear filters",
  aucuneAction: "No action in this period.", details: "Details",
  precedent: "← Previous", suivant: "Next →", retention: "Retention",
  conservation: "Retention", aucuneAncienne: "No entry older than this period.",
  purger: "Delete permanently", tableau: "Dashboard",
  par: "By", cible: "target", reference: "ref", page: "Page",
  saisir: "Type",
  aucunePurge: "No entry to delete.",
  messagePurge: (n, j) => `${n} entr${n === 1 ? "y" : "ies"} older than ${j} days deleted.`,
  messageAnciennes: (n) => `${n} entr${n === 1 ? "y" : "ies"} exceed this retention period.`,
  familles: {
    utilisateur: "Users", reservation: "Bookings", paiement: "Payments",
    facture: "Invoices", caution: "Deposits", mission: "Tasks", ticket: "Support",
    menage: "Cleaning", message: "Messages", dispatch: "Dispatch", assistant: "Assistant",
    stock: "Stock", logement: "Properties", avis: "Reviews",
  },
};

const ES: TraductionsAudit = {
  exporter: "Exportar registro CSV", retour: "Volver al panel",
  rechercher: "Buscar", recherchePlaceholder: "acción, autor, objetivo o referencia",
  periode: "Periodo", jours: "días", famille: "Categoría", toutes: "Todas",
  filtrer: "Filtrar", effacer: "Borrar filtros",
  aucuneAction: "Ninguna acción en este periodo.", details: "Detalles",
  precedent: "← Anterior", suivant: "Siguiente →", retention: "Retención",
  conservation: "Conservación", aucuneAncienne: "Ninguna entrada supera esta duración.",
  purger: "Eliminar definitivamente", tableau: "Panel",
  par: "Por", cible: "objetivo", reference: "ref", page: "Página",
  saisir: "Escriba",
  aucunePurge: "No hay entradas para eliminar.",
  messagePurge: (n, j) => `${n} entrada(s) de más de ${j} días eliminada(s).`,
  messageAnciennes: (n) => `${n} entrada(s) supera(n) esta duración.`,
  familles: {
    utilisateur: "Usuarios", reservation: "Reservas", paiement: "Pagos",
    facture: "Facturas", caution: "Fianzas", mission: "Misiones", ticket: "Soporte",
    menage: "Limpieza", message: "Mensajes", dispatch: "Asignación", assistant: "Asistente",
    stock: "Existencias", logement: "Alojamientos", avis: "Opiniones",
  },
};

const IT: TraductionsAudit = {
  exporter: "Esporta registro CSV", retour: "Torna alla dashboard",
  rechercher: "Cerca", recherchePlaceholder: "azione, autore, destinatario o riferimento",
  periode: "Periodo", jours: "giorni", famille: "Categoria", toutes: "Tutte",
  filtrer: "Filtra", effacer: "Cancella filtri",
  aucuneAction: "Nessuna azione in questo periodo.", details: "Dettagli",
  precedent: "← Precedente", suivant: "Successivo →", retention: "Conservazione",
  conservation: "Conservazione", aucuneAncienne: "Nessuna voce oltre questa durata.",
  purger: "Elimina definitivamente", tableau: "Dashboard",
  par: "Da", cible: "destinatario", reference: "rif", page: "Pagina",
  saisir: "Digitare",
  aucunePurge: "Nessuna voce da eliminare.",
  messagePurge: (n, j) => `${n} voce/i più vecchia/e di ${j} giorni eliminata/e.`,
  messageAnciennes: (n) => `${n} voce/i supera/no questa durata.`,
  familles: {
    utilisateur: "Utenti", reservation: "Prenotazioni", paiement: "Pagamenti",
    facture: "Fatture", caution: "Cauzioni", mission: "Incarichi", ticket: "Supporto",
    menage: "Pulizie", message: "Messaggi", dispatch: "Assegnazione", assistant: "Assistente",
    stock: "Scorte", logement: "Alloggi", avis: "Recensioni",
  },
};

const DE: TraductionsAudit = {
  exporter: "Audit-CSV exportieren", retour: "Zurück zum Dashboard",
  rechercher: "Suchen", recherchePlaceholder: "Aktion, Autor, Ziel oder Referenz",
  periode: "Zeitraum", jours: "Tage", famille: "Kategorie", toutes: "Alle",
  filtrer: "Filtern", effacer: "Filter löschen",
  aucuneAction: "Keine Aktion in diesem Zeitraum.", details: "Details",
  precedent: "← Zurück", suivant: "Weiter →", retention: "Aufbewahrung",
  conservation: "Aufbewahrung", aucuneAncienne: "Kein Eintrag überschreitet diese Dauer.",
  purger: "Endgültig löschen", tableau: "Dashboard",
  par: "Von", cible: "Ziel", reference: "Ref.", page: "Seite",
  saisir: "Geben Sie",
  aucunePurge: "Keine Einträge zu löschen.",
  messagePurge: (n, j) => `${n} Eintrag/Einträge älter als ${j} Tage gelöscht.`,
  messageAnciennes: (n) => `${n} Eintrag/Einträge überschreitet/überschreiten diese Dauer.`,
  familles: {
    utilisateur: "Benutzer", reservation: "Buchungen", paiement: "Zahlungen",
    facture: "Rechnungen", caution: "Kautionen", mission: "Aufträge", ticket: "Support",
    menage: "Reinigung", message: "Nachrichten", dispatch: "Disposition", assistant: "Assistent",
    stock: "Bestand", logement: "Unterkünfte", avis: "Bewertungen",
  },
};

const DICTIONNAIRES: Record<Langue, TraductionsAudit> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsAudit(langue: string): TraductionsAudit {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
