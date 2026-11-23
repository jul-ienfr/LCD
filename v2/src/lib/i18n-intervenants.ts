import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsIntervenants {
  titrePage: string;
  espace: string;
  titre: string;
  description: string;
  resume: (intervenants: number) => string;
  du: string;
  au: string;
  filtrer: string;
  moisCourant: string;
  moisPrecedent: string;
  douzeMois: string;
  periodeAffichee: (du: string, au: string) => string;
  periodeInvalide: string;
  aucune: string;
  colIntervenant: string;
  colInterventions: string;
  colScore: string;
  colQualite: string;
  colPonctualite: string;
  colRegularite: string;
  colPreuves: string;
  nonMesurable: string;
  scoreSur: (score: number) => string;
  detailInterventions: (total: number, annulees: number) => string;
  detailQualite: (sansRefus: number, refusees: number) => string;
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) => string;
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) => string;
  detailPreuves: (validees: number, refusees: number, enAttente: number) => string;
  kpiIntervenants: string;
  kpiScoreMoyen: string;
  kpiNote: string;
  aideTitre: string;
  aide: string;
  tolerances: (ponctualite: number, ecart: number) => string;
  espaceMissions: string;
}

const COMMUNS_FR = {
  du: "Du", au: "Au", filtrer: "Afficher",
  moisCourant: "Mois courant", moisPrecedent: "Mois précédent", douzeMois: "12 derniers mois",
  periodeAffichee: (du: string, au: string) => `Période analysée : ${du} → ${au}`,
  periodeInvalide:
    "Période invalide (dates au format AAAA-MM-JJ, ordre croissant, un an au maximum) : la période par défaut est affichée.",
  aucune: "Aucune intervention sur cette période.",
  colIntervenant: "Intervenant", colInterventions: "Interventions", colScore: "Score",
  colQualite: "Qualité des preuves", colPonctualite: "Ponctualité",
  colRegularite: "Régularité des durées", colPreuves: "Preuves",
  nonMesurable: "Non mesurable",
  scoreSur: (score: number) => `${score}/100`,
  detailInterventions: (total: number, annulees: number) =>
    `${total} sur la période${annulees > 0 ? ` · ${annulees} annulée${annulees > 1 ? "s" : ""}` : ""}`,
  detailQualite: (sansRefus: number, refusees: number) =>
    `${sansRefus} validée${sansRefus > 1 ? "s" : ""} du premier coup · ${refusees} refusée${refusees > 1 ? "s" : ""}`,
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) =>
    `${aLHeure}/${mesurables} à l’heure · retard moyen ${retardMoyen}`,
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) =>
    `${conformes}/${mesurables} conformes · écart moyen ${ecartMoyen}`,
  detailPreuves: (validees: number, refusees: number, enAttente: number) =>
    `${validees} validée${validees > 1 ? "s" : ""} du premier coup · ${refusees} refusée${refusees > 1 ? "s" : ""} · ${enAttente} en attente`,
  kpiIntervenants: "Intervenants suivis", kpiScoreMoyen: "Score moyen", kpiNote: "sur les composantes mesurables",
  aideTitre: "Comment lire ce score",
  aide:
    "Chaque composante est calculée sur les interventions de la période : la qualité regarde les preuves acceptées du premier coup (un refus reste dans l’historique), la ponctualité compare le pointage début à l’heure prévue, la régularité compare la durée réelle à la durée prévue. Une composante sans donnée n’est pas comptée : un intervenant sans intervention mesurable n’affiche pas de score plutôt qu’un zéro trompeur.",
  tolerances: (ponctualite: number, ecart: number) =>
    `Tolérances : début jusqu’à ${ponctualite} min après l’heure prévue, durée réelle à ±${ecart} min de la durée prévue.`,
  espaceMissions: "Missions",
};

const COMMUNS_EN = {
  du: "From", au: "To", filtrer: "Show",
  moisCourant: "Current month", moisPrecedent: "Previous month", douzeMois: "Last 12 months",
  periodeAffichee: (du: string, au: string) => `Period analysed: ${du} → ${au}`,
  periodeInvalide:
    "Invalid period (dates as YYYY-MM-DD, ascending order, one year maximum): the default period is shown.",
  aucune: "No intervention in this period.",
  colIntervenant: "Provider", colInterventions: "Interventions", colScore: "Score",
  colQualite: "Proof quality", colPonctualite: "Punctuality",
  colRegularite: "Duration consistency", colPreuves: "Proofs",
  nonMesurable: "Not measurable",
  scoreSur: (score: number) => `${score}/100`,
  detailInterventions: (total: number, annulees: number) =>
    `${total} in the period${annulees > 0 ? ` · ${annulees} cancelled` : ""}`,
  detailQualite: (sansRefus: number, refusees: number) =>
    `${sansRefus} accepted first time · ${refusees} rejected`,
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) =>
    `${aLHeure}/${mesurables} on time · average delay ${retardMoyen}`,
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) =>
    `${conformes}/${mesurables} within tolerance · average deviation ${ecartMoyen}`,
  detailPreuves: (validees: number, refusees: number, enAttente: number) =>
    `${validees} validated · ${refusees} rejected · ${enAttente} pending`,
  kpiIntervenants: "Providers tracked", kpiScoreMoyen: "Average score", kpiNote: "across measurable components",
  aideTitre: "How to read this score",
  aide:
    "Each component is computed over the period’s interventions: quality looks at proofs accepted first time (a rejection stays in the history), punctuality compares the start check-in with the planned time, consistency compares the actual duration with the planned one. A component without data is not counted: a provider with nothing measurable shows no score rather than a misleading zero.",
  tolerances: (ponctualite: number, ecart: number) =>
    `Tolerances: start up to ${ponctualite} min after the planned time, actual duration within ±${ecart} min of the planned one.`,
  espaceMissions: "Tasks",
};

const COMMUNS_ES = {
  du: "Desde", au: "Hasta", filtrer: "Mostrar",
  moisCourant: "Mes actual", moisPrecedent: "Mes anterior", douzeMois: "Últimos 12 meses",
  periodeAffichee: (du: string, au: string) => `Periodo analizado: ${du} → ${au}`,
  periodeInvalide:
    "Periodo no válido (fechas AAAA-MM-DD, orden ascendente, un año como máximo): se muestra el periodo por defecto.",
  aucune: "Ninguna intervención en este periodo.",
  colIntervenant: "Prestador", colInterventions: "Intervenciones", colScore: "Puntuación",
  colQualite: "Calidad de las pruebas", colPonctualite: "Puntualidad",
  colRegularite: "Regularidad de las duraciones", colPreuves: "Pruebas",
  nonMesurable: "No medible",
  scoreSur: (score: number) => `${score}/100`,
  detailInterventions: (total: number, annulees: number) =>
    `${total} en el periodo${annulees > 0 ? ` · ${annulees} anulada(s)` : ""}`,
  detailQualite: (sansRefus: number, refusees: number) =>
    `${sansRefus} aceptada(s) a la primera · ${refusees} rechazada(s)`,
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) =>
    `${aLHeure}/${mesurables} puntuales · retraso medio ${retardMoyen}`,
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) =>
    `${conformes}/${mesurables} conformes · desviación media ${ecartMoyen}`,
  detailPreuves: (validees: number, refusees: number, enAttente: number) =>
    `${validees} validada(s) · ${refusees} rechazada(s) · ${enAttente} pendiente(s)`,
  kpiIntervenants: "Prestadores seguidos", kpiScoreMoyen: "Puntuación media", kpiNote: "en los componentes medibles",
  aideTitre: "Cómo leer esta puntuación",
  aide:
    "Cada componente se calcula sobre las intervenciones del periodo: la calidad mira las pruebas aceptadas a la primera (un rechazo permanece en el historial), la puntualidad compara el registro de inicio con la hora prevista, la regularidad compara la duración real con la prevista. Un componente sin datos no se cuenta: un prestador sin intervención medible no muestra puntuación en lugar de un cero engañoso.",
  tolerances: (ponctualite: number, ecart: number) =>
    `Tolerancias: inicio hasta ${ponctualite} min después de la hora prevista, duración real a ±${ecart} min de la prevista.`,
  espaceMissions: "Misiones",
};

const COMMUNS_IT = {
  du: "Dal", au: "Al", filtrer: "Mostra",
  moisCourant: "Mese corrente", moisPrecedent: "Mese precedente", douzeMois: "Ultimi 12 mesi",
  periodeAffichee: (du: string, au: string) => `Periodo analizzato: ${du} → ${au}`,
  periodeInvalide:
    "Periodo non valido (date AAAA-MM-GG, ordine crescente, un anno al massimo): viene mostrato il periodo predefinito.",
  aucune: "Nessun intervento in questo periodo.",
  colIntervenant: "Fornitore", colInterventions: "Interventi", colScore: "Punteggio",
  colQualite: "Qualità delle prove", colPonctualite: "Puntualità",
  colRegularite: "Regolarità delle durate", colPreuves: "Prove",
  nonMesurable: "Non misurabile",
  scoreSur: (score: number) => `${score}/100`,
  detailInterventions: (total: number, annulees: number) =>
    `${total} nel periodo${annulees > 0 ? ` · ${annulees} annullato/i` : ""}`,
  detailQualite: (sansRefus: number, refusees: number) =>
    `${sansRefus} accettata/e al primo colpo · ${refusees} rifiutata/e`,
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) =>
    `${aLHeure}/${mesurables} puntuali · ritardo medio ${retardMoyen}`,
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) =>
    `${conformes}/${mesurables} conformi · scostamento medio ${ecartMoyen}`,
  detailPreuves: (validees: number, refusees: number, enAttente: number) =>
    `${validees} validata/e · ${refusees} rifiutata/e · ${enAttente} in attesa`,
  kpiIntervenants: "Fornitori seguiti", kpiScoreMoyen: "Punteggio medio", kpiNote: "sui componenti misurabili",
  aideTitre: "Come leggere questo punteggio",
  aide:
    "Ogni componente è calcolata sugli interventi del periodo: la qualità guarda le prove accettate al primo colpo (un rifiuto resta nella cronologia), la puntualità confronta la registrazione di inizio con l’ora prevista, la regolarità confronta la durata reale con quella prevista. Un componente senza dati non viene contato: un fornitore senza intervento misurabile non mostra punteggio invece di uno zero ingannevole.",
  tolerances: (ponctualite: number, ecart: number) =>
    `Tolleranze: inizio fino a ${ponctualite} min dopo l’ora prevista, durata reale a ±${ecart} min da quella prevista.`,
  espaceMissions: "Incarichi",
};

const COMMUNS_DE = {
  du: "Von", au: "Bis", filtrer: "Anzeigen",
  moisCourant: "Aktueller Monat", moisPrecedent: "Vorheriger Monat", douzeMois: "Letzte 12 Monate",
  periodeAffichee: (du: string, au: string) => `Analysierter Zeitraum: ${du} → ${au}`,
  periodeInvalide:
    "Ungültiger Zeitraum (Datum als JJJJ-MM-TT, aufsteigend, höchstens ein Jahr): der Standardzeitraum wird angezeigt.",
  aucune: "Keine Einsätze in diesem Zeitraum.",
  colIntervenant: "Dienstleister", colInterventions: "Einsätze", colScore: "Bewertung",
  colQualite: "Nachweisqualität", colPonctualite: "Pünktlichkeit",
  colRegularite: "Dauerregelmäßigkeit", colPreuves: "Nachweise",
  nonMesurable: "Nicht messbar",
  scoreSur: (score: number) => `${score}/100`,
  detailInterventions: (total: number, annulees: number) =>
    `${total} im Zeitraum${annulees > 0 ? ` · ${annulees} storniert` : ""}`,
  detailQualite: (sansRefus: number, refusees: number) =>
    `${sansRefus} auf Anhieb akzeptiert · ${refusees} abgelehnt`,
  detailPonctualite: (aLHeure: number, mesurables: number, retardMoyen: string) =>
    `${aLHeure}/${mesurables} pünktlich · mittlere Verspätung ${retardMoyen}`,
  detailRegularite: (conformes: number, mesurables: number, ecartMoyen: string) =>
    `${conformes}/${mesurables} im Rahmen · mittlere Abweichung ${ecartMoyen}`,
  detailPreuves: (validees: number, refusees: number, enAttente: number) =>
    `${validees} bestätigt · ${refusees} abgelehnt · ${enAttente} offen`,
  kpiIntervenants: "Betreute Dienstleister", kpiScoreMoyen: "Durchschnittsbewertung", kpiNote: "über messbare Komponenten",
  aideTitre: "So wird die Bewertung gelesen",
  aide:
    "Jede Komponente wird über die Einsätze des Zeitraums berechnet: die Qualität betrachtet auf Anhieb akzeptierte Nachweise (eine Ablehnung bleibt im Verlauf), die Pünktlichkeit vergleicht die Startstempelung mit der geplanten Uhrzeit, die Regelmäßigkeit die Ist-Dauer mit der geplanten. Eine Komponente ohne Daten zählt nicht: ein Dienstleister ohne messbaren Einsatz zeigt keine Bewertung statt einer irreführenden Null.",
  tolerances: (ponctualite: number, ecart: number) =>
    `Toleranzen: Beginn bis ${ponctualite} min nach der geplanten Zeit, Ist-Dauer ±${ecart} min um die geplante.`,
  espaceMissions: "Aufträge",
};

const FR: TraductionsIntervenants = {
  ...COMMUNS_FR,
  titrePage: "Intervenants — Score",
  espace: "Espace hôte",
  titre: "Score des intervenants",
  description:
    "Qualité des preuves, ponctualité du pointage et régularité des durées, agrégées par intervenant sur la période choisie.",
  resume: (intervenants) =>
    `${intervenants} intervenant${intervenants > 1 ? "s" : ""} sur la période`,
};

const EN: TraductionsIntervenants = {
  ...COMMUNS_EN,
  titrePage: "Providers — Score",
  espace: "Staff area",
  titre: "Provider score",
  description:
    "Proof quality, check-in punctuality and duration consistency, aggregated per provider over the selected period.",
  resume: (intervenants) => `${intervenants} provider${intervenants === 1 ? "" : "s"} in the period`,
};

const ES: TraductionsIntervenants = {
  ...COMMUNS_ES,
  titrePage: "Prestadores — Puntuación",
  espace: "Área profesional",
  titre: "Puntuación de los prestadores",
  description:
    "Calidad de las pruebas, puntualidad del registro y regularidad de las duraciones, agregadas por prestador en el periodo elegido.",
  resume: (intervenants) => `${intervenants} prestador${intervenants === 1 ? "" : "es"} en el periodo`,
};

const IT: TraductionsIntervenants = {
  ...COMMUNS_IT,
  titrePage: "Fornitori — Punteggio",
  espace: "Area professionale",
  titre: "Punteggio dei fornitori",
  description:
    "Qualità delle prove, puntualità della registrazione e regolarità delle durate, aggregate per fornitore nel periodo scelto.",
  resume: (intervenants) => `${intervenants} fornitore${intervenants === 1 ? "" : "i"} nel periodo`,
};

const DE: TraductionsIntervenants = {
  ...COMMUNS_DE,
  titrePage: "Dienstleister — Bewertung",
  espace: "Profibereich",
  titre: "Bewertung der Dienstleister",
  description:
    "Nachweisqualität, Pünktlichkeit der Stempelung und Dauerregelmäßigkeit, je Dienstleister über den gewählten Zeitraum aggregiert.",
  resume: (intervenants) => `${intervenants} Dienstleister im Zeitraum`,
};

const DICTIONNAIRES: Record<Langue, TraductionsIntervenants> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsIntervenants(langue: string): TraductionsIntervenants {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
