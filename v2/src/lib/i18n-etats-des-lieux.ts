import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsEtatsDesLieux {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  retour: string;
  vide: string;
  gererLogements: string;
  choisirLogement: string;
  erreurInattendue: string;
  nouvelle: (nom: string) => string;
  nouvelleAide: string;
  aucunBien: string;
  aucunBienAide: string;
  type: string;
  date: string;
  sejour: string;
  aucunSejour: string;
  reference: string;
  bien: string;
  etatConstate: string;
  manquant: string;
  commentaire: string;
  optionnel: string;
  notes: string;
  enregistrer: string;
  historique: string;
  entretien: string;
  menage: string;
  aucunEtat: string;
  colDate: string;
  colLogement: string;
  colType: string;
  colSejour: string;
  colManquants: string;
  colDegrades: string;
  colRemplacement: string;
  aCompleter: string;
  voir: string;
}

const FR: TraductionsEtatsDesLieux = {
  titrePage: "États des lieux — LCD Parc", surtitre: "Espace hôte · Exploitation",
  titre: "États des lieux", description: "Constats d’entrée et de sortie, écarts et coût de remplacement.",
  retour: "Retour au tableau de bord",
  vide: "Créez d’abord un logement et son inventaire pour réaliser un état des lieux.",
  gererLogements: "Gérer les logements", choisirLogement: "Choisir un logement",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  nouvelle: (nom) => `Nouvel état des lieux — ${nom}`,
  nouvelleAide: "Chaque ligne part de l’état de référence. Cochez « manquant » ou ajustez l’état constaté.",
  aucunBien: "Aucun bien inventorié pour ce logement : impossible de créer un état des lieux.",
  aucunBienAide: "Ajoutez des biens à l’inventaire du logement avant de réaliser un état des lieux.",
  type: "Type", date: "Date", sejour: "Séjour (facultatif)", aucunSejour: "Aucun séjour lié",
  reference: "Référence", bien: "Bien", etatConstate: "État constaté", manquant: "Manquant",
  commentaire: "Commentaire", optionnel: "Optionnel", notes: "Notes générales",
  enregistrer: "Enregistrer l’état des lieux", historique: "Historique du logement",
  entretien: "Entretien", menage: "Ménage", aucunEtat: "Aucun état des lieux pour ce logement.",
  colDate: "Date", colLogement: "Logement", colType: "Type", colSejour: "Séjour",
  colManquants: "Manquants", colDegrades: "Dégradés", colRemplacement: "Remplacement",
  aCompleter: "À compléter", voir: "Voir",
};

const EN: TraductionsEtatsDesLieux = {
  titrePage: "Inspections — LCD Parc", surtitre: "Staff area · Operations",
  titre: "Inspections", description: "Check-in and check-out reports, discrepancies and replacement cost.",
  retour: "Back to dashboard",
  vide: "Create a property and its inventory first to run an inspection.",
  gererLogements: "Manage properties", choisirLogement: "Choose a property",
  erreurInattendue: "Unexpected error. Try again.",
  nouvelle: (nom) => `New inspection — ${nom}`,
  nouvelleAide: "Each line starts from the reference condition. Tick “missing” or adjust the observed condition.",
  aucunBien: "No item inventoried for this property: an inspection cannot be created.",
  aucunBienAide: "Add items to the property inventory before running an inspection.",
  type: "Type", date: "Date", sejour: "Stay (optional)", aucunSejour: "No linked stay",
  reference: "Reference", bien: "Item", etatConstate: "Observed condition", manquant: "Missing",
  commentaire: "Comment", optionnel: "Optional", notes: "General notes",
  enregistrer: "Save inspection", historique: "Property history",
  entretien: "Maintenance", menage: "Housekeeping", aucunEtat: "No inspection for this property.",
  colDate: "Date", colLogement: "Property", colType: "Type", colSejour: "Stay",
  colManquants: "Missing", colDegrades: "Damaged", colRemplacement: "Replacement",
  aCompleter: "To complete", voir: "View",
};

const ES: TraductionsEtatsDesLieux = {
  titrePage: "Estados de los lugares — LCD Parc", surtitre: "Área profesional · Explotación",
  titre: "Estados de los lugares", description: "Constancias de entrada y salida, diferencias y coste de reposición.",
  retour: "Volver al panel",
  vide: "Cree primero un alojamiento y su inventario para realizar un estado de los lugares.",
  gererLogements: "Gestionar alojamientos", choisirLogement: "Elegir un alojamiento",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  nouvelle: (nom) => `Nuevo estado de los lugares — ${nom}`,
  nouvelleAide: "Cada línea parte del estado de referencia. Marque «falta» o ajuste el estado observado.",
  aucunBien: "Ningún bien inventariado para este alojamiento: no se puede crear un estado de los lugares.",
  aucunBienAide: "Añada bienes al inventario del alojamiento antes de realizar un estado de los lugares.",
  type: "Tipo", date: "Fecha", sejour: "Estancia (opcional)", aucunSejour: "Ninguna estancia vinculada",
  reference: "Referencia", bien: "Bien", etatConstate: "Estado observado", manquant: "Falta",
  commentaire: "Comentario", optionnel: "Opcional", notes: "Notas generales",
  enregistrer: "Guardar el estado de los lugares", historique: "Historial del alojamiento",
  entretien: "Mantenimiento", menage: "Limpieza", aucunEtat: "Ningún estado de los lugares para este alojamiento.",
  colDate: "Fecha", colLogement: "Alojamiento", colType: "Tipo", colSejour: "Estancia",
  colManquants: "Faltantes", colDegrades: "Deteriorados", colRemplacement: "Reposición",
  aCompleter: "Por completar", voir: "Ver",
};

const IT: TraductionsEtatsDesLieux = {
  titrePage: "Stati dei luoghi — LCD Parc", surtitre: "Area professionale · Esercizio",
  titre: "Stati dei luoghi", description: "Constatazioni di ingresso e uscita, differenze e costo di sostituzione.",
  retour: "Torna alla dashboard",
  vide: "Crei prima un alloggio e il suo inventario per realizzare uno stato dei luoghi.",
  gererLogements: "Gestisci gli alloggi", choisirLogement: "Scegli un alloggio",
  erreurInattendue: "Errore imprevisto. Riprovi.",
  nouvelle: (nom) => `Nuovo stato dei luoghi — ${nom}`,
  nouvelleAide: "Ogni riga parte dallo stato di riferimento. Spunti «mancante» o adegui lo stato constatato.",
  aucunBien: "Nessun bene inventariato per questo alloggio: impossibile creare uno stato dei luoghi.",
  aucunBienAide: "Aggiunga beni all’inventario dell’alloggio prima di realizzare uno stato dei luoghi.",
  type: "Tipo", date: "Data", sejour: "Soggiorno (facoltativo)", aucunSejour: "Nessun soggiorno collegato",
  reference: "Riferimento", bien: "Bene", etatConstate: "Stato constatato", manquant: "Mancante",
  commentaire: "Commento", optionnel: "Opzionale", notes: "Note generali",
  enregistrer: "Salva lo stato dei luoghi", historique: "Cronologia dell’alloggio",
  entretien: "Manutenzione", menage: "Pulizie", aucunEtat: "Nessuno stato dei luoghi per questo alloggio.",
  colDate: "Data", colLogement: "Alloggio", colType: "Tipo", colSejour: "Soggiorno",
  colManquants: "Mancanti", colDegrades: "Danneggiati", colRemplacement: "Sostituzione",
  aCompleter: "Da completare", voir: "Vedi",
};

const DE: TraductionsEtatsDesLieux = {
  titrePage: "Zustandsprotokolle — LCD Parc", surtitre: "Profibereich · Betrieb",
  titre: "Zustandsprotokolle", description: "Ein- und Auszugsprotokolle, Abweichungen und Ersatzkosten.",
  retour: "Zurück zum Dashboard",
  vide: "Erstellen Sie zuerst eine Unterkunft und ihr Inventar, um ein Zustandsprotokoll zu erstellen.",
  gererLogements: "Unterkünfte verwalten", choisirLogement: "Unterkunft wählen",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  nouvelle: (nom) => `Neues Zustandsprotokoll — ${nom}`,
  nouvelleAide: "Jede Zeile startet vom Referenzzustand. Aktivieren Sie „fehlt“ oder passen Sie den festgestellten Zustand an.",
  aucunBien: "Kein Gegenstand für diese Unterkunft inventarisiert: kein Zustandsprotokoll möglich.",
  aucunBienAide: "Fügen Sie dem Inventar der Unterkunft Gegenstände hinzu, bevor Sie ein Zustandsprotokoll erstellen.",
  type: "Typ", date: "Datum", sejour: "Aufenthalt (optional)", aucunSejour: "Kein verknüpfter Aufenthalt",
  reference: "Referenz", bien: "Gegenstand", etatConstate: "Festgestellter Zustand", manquant: "Fehlt",
  commentaire: "Kommentar", optionnel: "Optional", notes: "Allgemeine Notizen",
  enregistrer: "Zustandsprotokoll speichern", historique: "Verlauf der Unterkunft",
  entretien: "Wartung", menage: "Reinigung", aucunEtat: "Kein Zustandsprotokoll für diese Unterkunft.",
  colDate: "Datum", colLogement: "Unterkunft", colType: "Typ", colSejour: "Aufenthalt",
  colManquants: "Fehlend", colDegrades: "Beschädigt", colRemplacement: "Ersatz",
  aCompleter: "Zu vervollständigen", voir: "Ansehen",
};

const DICTIONNAIRES: Record<Langue, TraductionsEtatsDesLieux> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsEtatsDesLieux(langue: string): TraductionsEtatsDesLieux {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
