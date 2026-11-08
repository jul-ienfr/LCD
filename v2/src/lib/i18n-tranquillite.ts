import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsTranquillite {
  titrePage: string;
  surtitre: string;
  titre: string;
  description: string;
  retour: string;
  videTexte: string;
  creerLogement: string;
  choisirLogement: string;
  okSupprime: string;
  okEnregistre: string;
  erreurInattendue: string;
  evenements: string;
  mesures: string;
  depassements: string;
  maxReleve: string;
  ajouter: string;
  type: string;
  date: string;
  moment: string;
  jour: string;
  nuit: string;
  mesure: string;
  note: string;
  notePlaceholder: string;
  seuils: (jour: number, nuit: number) => string;
  enregistrer: string;
  carnetDe: (logement: string, n: number) => string;
  aucunePreuve: string;
  mesureCol: string;
  seuil: string;
  depassement: string;
  supprimer: string;
  lettreTitre: string;
  lettreAide: string;
  brouillon: string;
  journal: string;
  tableau: string;
  types: Record<string, string>;
  moments: Record<string, string>;
}

const FR: TraductionsTranquillite = {
  titrePage: "Carnet de tranquillité — Espace hôte",
  surtitre: "Espace hôte · Preuves",
  titre: "Carnet de tranquillité",
  description:
    "Mesures de bruit, attestations et interventions consignées pour répondre aux nuisances.",
  retour: "Retour au tableau de bord",
  videTexte:
    "Créez d’abord un logement pour tenir son carnet de tranquillité.",
  creerLogement: "Créer un logement",
  choisirLogement: "Choisir un logement",
  okSupprime: "Preuve supprimée.",
  okEnregistre: "Preuve enregistrée. Elle figure désormais dans le carnet.",
  erreurInattendue: "Erreur inattendue. Réessayez.",
  evenements: "Événements (12 mois)",
  mesures: "Mesures de bruit",
  depassements: "Dépassements",
  maxReleve: "Maximum relevé",
  ajouter: "Ajouter une preuve",
  type: "Type",
  date: "Date",
  moment: "Moment (bruit)",
  jour: "Jour",
  nuit: "Nuit",
  mesure: "Mesure (dB, bruit)",
  note: "Note / contexte",
  notePlaceholder: "Fête voisine jusqu’à 2 h, constat à 1 h 15.",
  seuils: (jour, nuit) =>
    `Seuils de référence : ${jour} dB le jour, ${nuit} dB la nuit. Les attestations et interventions exigent une note.`,
  enregistrer: "Enregistrer la preuve",
  carnetDe: (logement, n) => `Carnet de ${logement} (${n} sur 12 mois)`,
  aucunePreuve:
    "Aucune preuve enregistrée. Les événements apparaîtront ici et alimenteront la lettre au syndic.",
  mesureCol: "Mesure",
  seuil: "seuil",
  depassement: "dépassement",
  supprimer: "Supprimer",
  lettreTitre: "Lettre au syndic (brouillon)",
  lettreAide:
    "Texte généré à partir du carnet. Copiez-le dans votre messagerie tracée, puis signez.",
  brouillon: "Brouillon",
  journal: "Journal d’audit",
  tableau: "Tableau de bord",
  types: {
    db: "Mesure de bruit",
    attestation: "Attestation",
    intervention: "Intervention",
  },
  moments: { jour: "jour", nuit: "nuit" },
};

const EN: TraductionsTranquillite = {
  titrePage: "Quietness log — Staff area",
  surtitre: "Staff area · Evidence",
  titre: "Quietness log",
  description:
    "Noise readings, certificates and interventions recorded to answer nuisance complaints.",
  retour: "Back to dashboard",
  videTexte: "Create a property first to keep its quietness log.",
  creerLogement: "Create a property",
  choisirLogement: "Choose a property",
  okSupprime: "Evidence deleted.",
  okEnregistre: "Evidence saved. It now appears in the log.",
  erreurInattendue: "Unexpected error. Try again.",
  evenements: "Events (12 months)",
  mesures: "Noise readings",
  depassements: "Exceedances",
  maxReleve: "Highest reading",
  ajouter: "Add evidence",
  type: "Type",
  date: "Date",
  moment: "Time of day (noise)",
  jour: "Day",
  nuit: "Night",
  mesure: "Reading (dB, noise)",
  note: "Note / context",
  notePlaceholder: "Neighbour party until 2 am, report at 1:15 am.",
  seuils: (jour, nuit) =>
    `Reference thresholds: ${jour} dB by day, ${nuit} dB at night. Certificates and interventions require a note.`,
  enregistrer: "Save evidence",
  carnetDe: (logement, n) => `Log for ${logement} (${n} in 12 months)`,
  aucunePreuve:
    "No evidence recorded. Events will appear here and feed the letter to the building manager.",
  mesureCol: "Reading",
  seuil: "threshold",
  depassement: "exceeded",
  supprimer: "Delete",
  lettreTitre: "Letter to the building manager (draft)",
  lettreAide:
    "Text generated from the log. Copy it into your tracked messaging, then sign it.",
  brouillon: "Draft",
  journal: "Audit log",
  tableau: "Dashboard",
  types: {
    db: "Noise reading",
    attestation: "Certificate",
    intervention: "Intervention",
  },
  moments: { jour: "day", nuit: "night" },
};

const ES: TraductionsTranquillite = {
  titrePage: "Registro de tranquilidad — Área profesional",
  surtitre: "Área profesional · Pruebas",
  titre: "Registro de tranquilidad",
  description:
    "Mediciones de ruido, certificados e intervenciones registradas para responder a las molestias.",
  retour: "Volver al panel",
  videTexte:
    "Cree primero un alojamiento para llevar su registro de tranquilidad.",
  creerLogement: "Crear un alojamiento",
  choisirLogement: "Elegir un alojamiento",
  okSupprime: "Prueba eliminada.",
  okEnregistre: "Prueba guardada. Ya aparece en el registro.",
  erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  evenements: "Eventos (12 meses)",
  mesures: "Mediciones de ruido",
  depassements: "Excesos",
  maxReleve: "Máximo registrado",
  ajouter: "Añadir una prueba",
  type: "Tipo",
  date: "Fecha",
  moment: "Momento (ruido)",
  jour: "Día",
  nuit: "Noche",
  mesure: "Medición (dB, ruido)",
  note: "Nota / contexto",
  notePlaceholder: "Fiesta vecina hasta las 2 h, acta a la 1:15.",
  seuils: (jour, nuit) =>
    `Umbrales de referencia: ${jour} dB de día, ${nuit} dB de noche. Los certificados y las intervenciones exigen una nota.`,
  enregistrer: "Guardar prueba",
  carnetDe: (logement, n) => `Registro de ${logement} (${n} en 12 meses)`,
  aucunePreuve:
    "Ninguna prueba registrada. Los eventos aparecerán aquí y alimentarán la carta al administrador.",
  mesureCol: "Medición",
  seuil: "umbral",
  depassement: "exceso",
  supprimer: "Eliminar",
  lettreTitre: "Carta al administrador (borrador)",
  lettreAide:
    "Texto generado a partir del registro. Cópielo en su mensajería trazada y fírmelo.",
  brouillon: "Borrador",
  journal: "Registro de auditoría",
  tableau: "Panel",
  types: {
    db: "Medición de ruido",
    attestation: "Certificado",
    intervention: "Intervención",
  },
  moments: { jour: "día", nuit: "noche" },
};

const IT: TraductionsTranquillite = {
  titrePage: "Registro di tranquillità — Area professionale",
  surtitre: "Area professionale · Prove",
  titre: "Registro di tranquillità",
  description:
    "Misurazioni del rumore, attestati e interventi registrati per rispondere ai disturbi.",
  retour: "Torna alla dashboard",
  videTexte:
    "Creare prima un alloggio per tenere il suo registro di tranquillità.",
  creerLogement: "Creare un alloggio",
  choisirLogement: "Scegliere un alloggio",
  okSupprime: "Prova eliminata.",
  okEnregistre: "Prova salvata. Ora compare nel registro.",
  erreurInattendue: "Errore imprevisto. Riprovare.",
  evenements: "Eventi (12 mesi)",
  mesures: "Misurazioni del rumore",
  depassements: "Superamenti",
  maxReleve: "Massimo rilevato",
  ajouter: "Aggiungere una prova",
  type: "Tipo",
  date: "Data",
  moment: "Momento (rumore)",
  jour: "Giorno",
  nuit: "Notte",
  mesure: "Misurazione (dB, rumore)",
  note: "Nota / contesto",
  notePlaceholder: "Festa vicina fino alle 2, verbale all’1:15.",
  seuils: (jour, nuit) =>
    `Soglie di riferimento: ${jour} dB di giorno, ${nuit} dB di notte. Gli attestati e gli interventi richiedono una nota.`,
  enregistrer: "Salvare la prova",
  carnetDe: (logement, n) => `Registro di ${logement} (${n} in 12 mesi)`,
  aucunePreuve:
    "Nessuna prova registrata. Gli eventi appariranno qui e alimenteranno la lettera all’amministratore.",
  mesureCol: "Misurazione",
  seuil: "soglia",
  depassement: "superamento",
  supprimer: "Eliminare",
  lettreTitre: "Lettera all’amministratore (bozza)",
  lettreAide:
    "Testo generato dal registro. Copiarlo nella messaggistica tracciata e firmarlo.",
  brouillon: "Bozza",
  journal: "Registro di audit",
  tableau: "Dashboard",
  types: {
    db: "Misurazione del rumore",
    attestation: "Attestato",
    intervention: "Intervento",
  },
  moments: { jour: "giorno", nuit: "notte" },
};

const DE: TraductionsTranquillite = {
  titrePage: "Ruheprotokoll — Mitarbeiterbereich",
  surtitre: "Mitarbeiterbereich · Nachweise",
  titre: "Ruheprotokoll",
  description:
    "Lärmmessungen, Bescheinigungen und Einsätze zur Beantwortung von Beschwerden.",
  retour: "Zurück zum Dashboard",
  videTexte:
    "Legen Sie zuerst eine Unterkunft an, um ihr Ruheprotokoll zu führen.",
  creerLogement: "Unterkunft anlegen",
  choisirLogement: "Unterkunft auswählen",
  okSupprime: "Nachweis gelöscht.",
  okEnregistre: "Nachweis gespeichert. Er erscheint jetzt im Protokoll.",
  erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  evenements: "Ereignisse (12 Monate)",
  mesures: "Lärmmessungen",
  depassements: "Überschreitungen",
  maxReleve: "Höchster Wert",
  ajouter: "Nachweis hinzufügen",
  type: "Art",
  date: "Datum",
  moment: "Tageszeit (Lärm)",
  jour: "Tag",
  nuit: "Nacht",
  mesure: "Messung (dB, Lärm)",
  note: "Notiz / Kontext",
  notePlaceholder: "Nachbarfeier bis 2 Uhr, Protokoll um 1:15 Uhr.",
  seuils: (jour, nuit) =>
    `Referenzschwellen: ${jour} dB tagsüber, ${nuit} dB nachts. Bescheinigungen und Einsätze erfordern eine Notiz.`,
  enregistrer: "Nachweis speichern",
  carnetDe: (logement, n) => `Protokoll für ${logement} (${n} in 12 Monaten)`,
  aucunePreuve:
    "Kein Nachweis gespeichert. Ereignisse erscheinen hier und fließen in den Brief an die Hausverwaltung ein.",
  mesureCol: "Messung",
  seuil: "Schwelle",
  depassement: "Überschreitung",
  supprimer: "Löschen",
  lettreTitre: "Brief an die Hausverwaltung (Entwurf)",
  lettreAide:
    "Aus dem Protokoll erzeugter Text. In die nachverfolgbare Nachricht kopieren und unterschreiben.",
  brouillon: "Entwurf",
  journal: "Audit-Protokoll",
  tableau: "Dashboard",
  types: {
    db: "Lärmmessung",
    attestation: "Bescheinigung",
    intervention: "Einsatz",
  },
  moments: { jour: "Tag", nuit: "Nacht" },
};

const DICTIONNAIRES: Record<Langue, TraductionsTranquillite> = {
  fr: FR,
  en: EN,
  es: ES,
  it: IT,
  de: DE,
};

export function traductionsTranquillite(
  langue: string,
): TraductionsTranquillite {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
