import type { Langue } from "./i18n";
import { masquerFonctions, resoudreLangue } from "./i18n-staff";

export interface TraductionsMenage {
  titrePageListe: string;
  espaceExploitation: string;
  titre: string;
  description: string;
  videLogement: string;
  creerLogement: string;
  choisirLogement: string;
  scoreMoyen: string;
  alerteQualite: string;
  coutMoyen: string;
  dureeMoyenne: string;
  minutes: string;
  planifierMenage: (nom: string) => string;
  date: string;
  sejour: string;
  aucunSejour: string;
  notes: string;
  optionnel: string;
  planifier: string;
  menages: string;
  aucunMenage: string;
  colDate: string;
  colSejour: string;
  colAvancement: string;
  colStatut: string;
  colNotes: string;
  colQualite: string;
  colCout: string;
  colDuree: string;
  ouvrir: string;
  colPieces: string;
  reglerReferentiel: string;
  referentielModele: (pieces: number, taches: number) => string;
  referentielDuLogement: (pieces: number, taches: number) => string;
  pieceGenerale: string;
  piecesResume: (completes: number, total: number) => string;
  pieceAvancement: (faites: number, total: number) => string;
  pieceComplete: string;
  titrePageReferentiel: string;
  espaceReferentiel: string;
  referentielTitre: string;
  referentielDescription: string;
  referentielAide: string;
  referentielEnregistre: string;
  referentielReinitialise: string;
  colPiece: string;
  colTache: string;
  ligneVide: string;
  lignesAide: (libres: number) => string;
  limites: (pieces: number, tachesParPiece: number, piece: number, tache: number) => string;
  enregistrerReferentiel: string;
  reinitialiserReferentiel: string;
  reinitialiserAide: string;
  titrePageDetail: (date: string) => string;
  espaceMenage: (ref: string) => string;
  titreDetail: (nom: string) => string;
  detailResume: (date: string, statut: string, faites: number, total: number, pourcentage: number) => string;
  tousMenages: string;
  enregistre: string;
  evaluationEnregistree: string;
  photoAjoutee: (evincees: number) => string;
  photoSupprimee: string;
  erreurInattendue: string;
  aucuneTache: string;
  checklist: string;
  statut: string;
  notesLabel: string;
  passageFait: string;
  enregistrerMenage: string;
  photosPreuve: string;
  photosAide: (maxMo: number) => string;
  phase: string;
  avant: string;
  apres: string;
  fichier: string;
  ajouterPhoto: string;
  supprimer: string;
  aucunePhoto: string;
  evaluation: string;
  evaluationAide: string;
  score: string;
  nonRenseigne: string;
  cout: string;
  duree: string;
  enregistrerEvaluation: string;
  etatsDesLieux: string;
  entretien: string;
  tableauBord: string;
}

const FR: TraductionsMenage = {
  titrePageListe: "Ménage — LCD Parc", espaceExploitation: "Espace hôte · Exploitation",
  titre: "Ménage", description: "Checklists de remise en état, avancement et réassort au départ.",
  videLogement: "Créez d’abord un logement pour planifier ses ménages.",
  creerLogement: "Créer un logement", choisirLogement: "Choisir un logement",
  scoreMoyen: "Score qualité moyen", alerteQualite: "Alerte : sous 3,5 / 5",
  coutMoyen: "Coût moyen de rotation", dureeMoyenne: "Durée moyenne", minutes: "min",
  planifierMenage: (nom) => `Planifier un ménage — ${nom}`,
  date: "Date", sejour: "Séjour", aucunSejour: "Aucun séjour lié",
  notes: "Notes", optionnel: "Optionnel", planifier: "Planifier le ménage",
  menages: "Ménages", aucunMenage: "Aucun ménage planifié pour ce logement.",
  colDate: "Date", colSejour: "Séjour", colAvancement: "Avancement",
  colStatut: "Statut", colNotes: "Notes", colQualite: "Qualité",
  colCout: "Coût", colDuree: "Durée", ouvrir: "Ouvrir",
  colPieces: "Pièces", reglerReferentiel: "Référentiel du logement",
  referentielModele: (pieces, taches) =>
    `Modèle LCD Parc : ${pieces} pièce${pieces > 1 ? "s" : ""}, ${taches} tâche${taches > 1 ? "s" : ""}.`,
  referentielDuLogement: (pieces, taches) =>
    `Référentiel propre au logement : ${pieces} pièce${pieces > 1 ? "s" : ""}, ${taches} tâche${taches > 1 ? "s" : ""}.`,
  pieceGenerale: "Général (sans pièce)",
  piecesResume: (completes, total) =>
    `${completes} / ${total} pièce${total > 1 ? "s" : ""} complète${completes > 1 ? "s" : ""}`,
  pieceAvancement: (faites, total) => `${faites} / ${total}`,
  pieceComplete: "pièce complète",
  titrePageReferentiel: "Référentiel ménage — LCD Parc",
  espaceReferentiel: "Espace hôte · Exploitation · Référentiel",
  referentielTitre: "Référentiel de checklist",
  referentielDescription:
    "Les pièces du logement et les tâches de chacune : chaque ménage planifié ensuite part de cette liste et se coche pièce par pièce.",
  referentielAide:
    "Enregistrer ici ne touche pas les ménages déjà créés : ils gardent la checklist copiée le jour de leur planification.",
  referentielEnregistre: "Référentiel enregistré : les prochains ménages partent de cette liste.",
  referentielReinitialise: "Référentiel remis au modèle LCD Parc.",
  colPiece: "Pièce", colTache: "Tâche", ligneVide: "Nouvelle pièce",
  lignesAide: (libres) =>
    `Complétez les ${libres} dernières lignes pour ajouter des tâches ; cochez « Supprimer » pour retirer une ligne. Gardez les tâches d’une même pièce ensemble.`,
  limites: (pieces, tachesParPiece, piece, tache) =>
    `Limites : ${pieces} pièces, ${tachesParPiece} tâches par pièce, ${piece} caractères pour une pièce et ${tache} pour une tâche.`,
  enregistrerReferentiel: "Enregistrer le référentiel",
  reinitialiserReferentiel: "Revenir au modèle",
  reinitialiserAide:
    "Le logement repart du modèle LCD Parc ; les ménages déjà créés ne changent pas.",
  titrePageDetail: (date) => `Ménage ${date} — LCD Parc`,
  espaceMenage: (ref) => `Espace hôte · Ménage · ${ref}`,
  titreDetail: (nom) => `Ménage — ${nom}`,
  detailResume: (date, statut, faites, total, pourcentage) =>
    `${date} · ${statut} · ${faites} / ${total} tâches (${pourcentage} %)`,
  tousMenages: "← Tous les ménages", enregistre: "Ménage enregistré.",
  evaluationEnregistree: "Évaluation enregistrée.",
  photoAjoutee: (n) => n > 0 ? `Photo ajoutée · ${n} ancienne(s) photo(s) évincée(s) pour tenir le quota.` : "Photo ajoutée.",
  photoSupprimee: "Photo supprimée.", erreurInattendue: "Erreur inattendue. Réessayez.",
  aucuneTache: "Ce ménage n’a aucune tâche. Recréez-le depuis la liste pour obtenir la checklist par défaut.",
  checklist: "Checklist", statut: "Statut", notesLabel: "Notes",
  passageFait: "Passer le ménage à « Fait » consomme la rotation de consommables du logement, une seule fois par ménage.",
  enregistrerMenage: "Enregistrer le ménage", photosPreuve: "Photos de preuve",
  photosAide: (maxMo) => `Avant / après ménage. JPEG, PNG ou WebP, ${maxMo} Mo maximum par photo. Le quota est de 5 Go par logement : les plus anciennes sont évincées en premier.`,
  phase: "Phase", avant: "Avant ménage", apres: "Après ménage", fichier: "Fichier",
  ajouterPhoto: "Ajouter la photo", supprimer: "Supprimer",
  aucunePhoto: "Aucune photo pour ce ménage.", evaluation: "Évaluation de la rotation",
  evaluationAide: "Score qualité, coût réel et durée — réservés au suivi interne.",
  score: "Score (1-5)", nonRenseigne: "Non renseigné", cout: "Coût (€)",
  duree: "Durée (min)", enregistrerEvaluation: "Enregistrer l’évaluation",
  etatsDesLieux: "États des lieux", entretien: "Entretien", tableauBord: "Tableau de bord",
};

const EN: TraductionsMenage = {
  titrePageListe: "Cleaning — LCD Parc", espaceExploitation: "Staff area · Operations",
  titre: "Cleaning", description: "Turnover checklists, progress and restocking on departure.",
  videLogement: "Create a property first to plan its cleanings.",
  creerLogement: "Create a property", choisirLogement: "Choose a property",
  scoreMoyen: "Average quality score", alerteQualite: "Alert: below 3.5 / 5",
  coutMoyen: "Average turnover cost", dureeMoyenne: "Average duration", minutes: "min",
  planifierMenage: (nom) => `Plan a cleaning — ${nom}`,
  date: "Date", sejour: "Stay", aucunSejour: "No linked stay",
  notes: "Notes", optionnel: "Optional", planifier: "Plan cleaning",
  menages: "Cleanings", aucunMenage: "No cleaning planned for this property.",
  colDate: "Date", colSejour: "Stay", colAvancement: "Progress",
  colStatut: "Status", colNotes: "Notes", colQualite: "Quality",
  colCout: "Cost", colDuree: "Duration", ouvrir: "Open",
  colPieces: "Rooms", reglerReferentiel: "Property checklist",
  referentielModele: (pieces, taches) =>
    `LCD Parc template: ${pieces} room${pieces === 1 ? "" : "s"}, ${taches} task${taches === 1 ? "" : "s"}.`,
  referentielDuLogement: (pieces, taches) =>
    `Property's own checklist: ${pieces} room${pieces === 1 ? "" : "s"}, ${taches} task${taches === 1 ? "" : "s"}.`,
  pieceGenerale: "General (no room)",
  piecesResume: (completes, total) =>
    `${completes} / ${total} room${total === 1 ? "" : "s"} complete`,
  pieceAvancement: (faites, total) => `${faites} / ${total}`,
  pieceComplete: "room complete",
  titrePageReferentiel: "Cleaning checklist — LCD Parc",
  espaceReferentiel: "Staff area · Operations · Checklist",
  referentielTitre: "Checklist template",
  referentielDescription:
    "The property's rooms and the tasks in each: every cleaning planned afterwards starts from this list and is ticked room by room.",
  referentielAide:
    "Saving here does not touch cleanings already created: they keep the checklist copied on the day they were planned.",
  referentielEnregistre: "Checklist saved: the next cleanings start from this list.",
  referentielReinitialise: "Checklist reset to the LCD Parc template.",
  colPiece: "Room", colTache: "Task", ligneVide: "New room",
  lignesAide: (libres) =>
    `Fill in the last ${libres} rows to add tasks; tick “Delete” to remove a row. Keep the tasks of one room together.`,
  limites: (pieces, tachesParPiece, piece, tache) =>
    `Limits: ${pieces} rooms, ${tachesParPiece} tasks per room, ${piece} characters for a room and ${tache} for a task.`,
  enregistrerReferentiel: "Save the checklist",
  reinitialiserReferentiel: "Back to the template",
  reinitialiserAide:
    "The property returns to the LCD Parc template; cleanings already created do not change.",
  titrePageDetail: (date) => `Cleaning ${date} — LCD Parc`,
  espaceMenage: (ref) => `Staff area · Cleaning · ${ref}`,
  titreDetail: (nom) => `Cleaning — ${nom}`,
  detailResume: (date, statut, faites, total, pourcentage) =>
    `${date} · ${statut} · ${faites} / ${total} tasks (${pourcentage}%)`,
  tousMenages: "← All cleanings", enregistre: "Cleaning saved.",
  evaluationEnregistree: "Evaluation saved.",
  photoAjoutee: (n) => n > 0 ? `Photo added · ${n} older photo(s) removed to stay within quota.` : "Photo added.",
  photoSupprimee: "Photo deleted.", erreurInattendue: "Unexpected error. Try again.",
  aucuneTache: "This cleaning has no task. Recreate it from the list to get the default checklist.",
  checklist: "Checklist", statut: "Status", notesLabel: "Notes",
  passageFait: "Setting the cleaning to “Done” consumes the property’s consumable rotation, once per cleaning.",
  enregistrerMenage: "Save cleaning", photosPreuve: "Proof photos",
  photosAide: (maxMo) => `Before / after cleaning. JPEG, PNG or WebP, ${maxMo} MB maximum per photo. Quota is 5 GB per property: oldest photos are removed first.`,
  phase: "Phase", avant: "Before cleaning", apres: "After cleaning", fichier: "File",
  ajouterPhoto: "Add photo", supprimer: "Delete",
  aucunePhoto: "No photo for this cleaning.", evaluation: "Turnover evaluation",
  evaluationAide: "Quality score, actual cost and duration — internal tracking only.",
  score: "Score (1-5)", nonRenseigne: "Not set", cout: "Cost (€)",
  duree: "Duration (min)", enregistrerEvaluation: "Save evaluation",
  etatsDesLieux: "Inventory checks", entretien: "Maintenance", tableauBord: "Dashboard",
};

const ES: TraductionsMenage = {
  titrePageListe: "Limpieza — LCD Parc", espaceExploitation: "Área profesional · Explotación",
  titre: "Limpieza", description: "Listas de reposición, avance y reabastecimiento a la salida.",
  videLogement: "Cree primero un alojamiento para planificar sus limpiezas.",
  creerLogement: "Crear un alojamiento", choisirLogement: "Elegir un alojamiento",
  scoreMoyen: "Puntuación media de calidad", alerteQualite: "Alerta: por debajo de 3,5 / 5",
  coutMoyen: "Coste medio de rotación", dureeMoyenne: "Duración media", minutes: "min",
  planifierMenage: (nom) => `Planificar una limpieza — ${nom}`,
  date: "Fecha", sejour: "Estancia", aucunSejour: "Ninguna estancia vinculada",
  notes: "Notas", optionnel: "Opcional", planifier: "Planificar limpieza",
  menages: "Limpiezas", aucunMenage: "Ninguna limpieza planificada para este alojamiento.",
  colDate: "Fecha", colSejour: "Estancia", colAvancement: "Avance",
  colStatut: "Estado", colNotes: "Notas", colQualite: "Calidad",
  colCout: "Coste", colDuree: "Duración", ouvrir: "Abrir",
  colPieces: "Estancias", reglerReferentiel: "Lista del alojamiento",
  referentielModele: (pieces, taches) =>
    `Modelo LCD Parc: ${pieces} estancia${pieces === 1 ? "" : "s"}, ${taches} tarea${taches === 1 ? "" : "s"}.`,
  referentielDuLogement: (pieces, taches) =>
    `Lista propia del alojamiento: ${pieces} estancia${pieces === 1 ? "" : "s"}, ${taches} tarea${taches === 1 ? "" : "s"}.`,
  pieceGenerale: "General (sin estancia)",
  piecesResume: (completes, total) =>
    `${completes} / ${total} estancia${total === 1 ? "" : "s"} completa${completes === 1 ? "" : "s"}`,
  pieceAvancement: (faites, total) => `${faites} / ${total}`,
  pieceComplete: "estancia completa",
  titrePageReferentiel: "Lista de limpieza — LCD Parc",
  espaceReferentiel: "Área profesional · Explotación · Lista",
  referentielTitre: "Lista de tareas de referencia",
  referentielDescription:
    "Las estancias del alojamiento y las tareas de cada una: cada limpieza planificada después parte de esta lista y se marca estancia por estancia.",
  referentielAide:
    "Guardar aquí no modifica las limpiezas ya creadas: conservan la lista copiada el día en que se planificaron.",
  referentielEnregistre: "Lista guardada: las próximas limpiezas parten de esta lista.",
  referentielReinitialise: "Lista restablecida al modelo LCD Parc.",
  colPiece: "Estancia", colTache: "Tarea", ligneVide: "Nueva estancia",
  lignesAide: (libres) =>
    `Complete las ${libres} últimas filas para añadir tareas; marque «Eliminar» para quitar una fila. Mantenga juntas las tareas de una misma estancia.`,
  limites: (pieces, tachesParPiece, piece, tache) =>
    `Límites: ${pieces} estancias, ${tachesParPiece} tareas por estancia, ${piece} caracteres para una estancia y ${tache} para una tarea.`,
  enregistrerReferentiel: "Guardar la lista",
  reinitialiserReferentiel: "Volver al modelo",
  reinitialiserAide:
    "El alojamiento vuelve al modelo LCD Parc; las limpiezas ya creadas no cambian.",
  titrePageDetail: (date) => `Limpieza ${date} — LCD Parc`,
  espaceMenage: (ref) => `Área profesional · Limpieza · ${ref}`,
  titreDetail: (nom) => `Limpieza — ${nom}`,
  detailResume: (date, statut, faites, total, pourcentage) =>
    `${date} · ${statut} · ${faites} / ${total} tareas (${pourcentage} %)`,
  tousMenages: "← Todas las limpiezas", enregistre: "Limpieza guardada.",
  evaluationEnregistree: "Evaluación guardada.",
  photoAjoutee: (n) => n > 0 ? `Foto añadida · ${n} foto(s) antigua(s) eliminada(s) para respetar la cuota.` : "Foto añadida.",
  photoSupprimee: "Foto eliminada.", erreurInattendue: "Error inesperado. Inténtelo de nuevo.",
  aucuneTache: "Esta limpieza no tiene tareas. Vuelva a crearla desde la lista para obtener la lista por defecto.",
  checklist: "Lista de tareas", statut: "Estado", notesLabel: "Notas",
  passageFait: "Pasar la limpieza a «Hecho» consume la rotación de consumibles del alojamiento, una sola vez por limpieza.",
  enregistrerMenage: "Guardar limpieza", photosPreuve: "Fotos de prueba",
  photosAide: (maxMo) => `Antes / después de la limpieza. JPEG, PNG o WebP, ${maxMo} MB máximo por foto. La cuota es de 5 GB por alojamiento: se eliminan primero las más antiguas.`,
  phase: "Fase", avant: "Antes de la limpieza", apres: "Después de la limpieza", fichier: "Archivo",
  ajouterPhoto: "Añadir foto", supprimer: "Eliminar",
  aucunePhoto: "Ninguna foto para esta limpieza.", evaluation: "Evaluación de la rotación",
  evaluationAide: "Puntuación de calidad, coste real y duración — solo para seguimiento interno.",
  score: "Puntuación (1-5)", nonRenseigne: "Sin indicar", cout: "Coste (€)",
  duree: "Duración (min)", enregistrerEvaluation: "Guardar evaluación",
  etatsDesLieux: "Inventarios", entretien: "Mantenimiento", tableauBord: "Panel",
};

const IT: TraductionsMenage = {
  titrePageListe: "Pulizie — LCD Parc", espaceExploitation: "Area professionale · Operazioni",
  titre: "Pulizie", description: "Checklist di ripristino, avanzamento e rifornimento alla partenza.",
  videLogement: "Crei prima un alloggio per pianificare le sue pulizie.",
  creerLogement: "Crea un alloggio", choisirLogement: "Scegli un alloggio",
  scoreMoyen: "Punteggio qualità medio", alerteQualite: "Allerta: sotto 3,5 / 5",
  coutMoyen: "Costo medio di rotazione", dureeMoyenne: "Durata media", minutes: "min",
  planifierMenage: (nom) => `Pianifica una pulizia — ${nom}`,
  date: "Data", sejour: "Soggiorno", aucunSejour: "Nessun soggiorno collegato",
  notes: "Note", optionnel: "Facoltativo", planifier: "Pianifica pulizia",
  menages: "Pulizie", aucunMenage: "Nessuna pulizia pianificata per questo alloggio.",
  colDate: "Data", colSejour: "Soggiorno", colAvancement: "Avanzamento",
  colStatut: "Stato", colNotes: "Note", colQualite: "Qualità",
  colCout: "Costo", colDuree: "Durata", ouvrir: "Apri",
  colPieces: "Locali", reglerReferentiel: "Checklist dell’alloggio",
  referentielModele: (pieces, taches) =>
    `Modello LCD Parc: ${pieces} local${pieces === 1 ? "e" : "i"}, ${taches} attività.`,
  referentielDuLogement: (pieces, taches) =>
    `Checklist propria dell’alloggio: ${pieces} local${pieces === 1 ? "e" : "i"}, ${taches} attività.`,
  pieceGenerale: "Generale (senza locale)",
  piecesResume: (completes, total) =>
    `${completes} / ${total} loca${total === 1 ? "le" : "li"} complet${completes === 1 ? "o" : "i"}`,
  pieceAvancement: (faites, total) => `${faites} / ${total}`,
  pieceComplete: "locale completo",
  titrePageReferentiel: "Checklist pulizie — LCD Parc",
  espaceReferentiel: "Area professionale · Operazioni · Checklist",
  referentielTitre: "Checklist di riferimento",
  referentielDescription:
    "I locali dell’alloggio e le attività di ciascuno: ogni pulizia pianificata in seguito parte da questo elenco e si spunta locale per locale.",
  referentielAide:
    "Salvare qui non modifica le pulizie già create: conservano la checklist copiata il giorno della pianificazione.",
  referentielEnregistre: "Checklist salvata: le prossime pulizie partono da questo elenco.",
  referentielReinitialise: "Checklist riportata al modello LCD Parc.",
  colPiece: "Locale", colTache: "Attività", ligneVide: "Nuovo locale",
  lignesAide: (libres) =>
    `Compili le ultime ${libres} righe per aggiungere attività; spunti «Elimina» per togliere una riga. Tenga insieme le attività di uno stesso locale.`,
  limites: (pieces, tachesParPiece, piece, tache) =>
    `Limiti: ${pieces} locali, ${tachesParPiece} attività per locale, ${piece} caratteri per un locale e ${tache} per un’attività.`,
  enregistrerReferentiel: "Salva la checklist",
  reinitialiserReferentiel: "Torna al modello",
  reinitialiserAide:
    "L’alloggio riparte dal modello LCD Parc; le pulizie già create non cambiano.",
  titrePageDetail: (date) => `Pulizia ${date} — LCD Parc`,
  espaceMenage: (ref) => `Area professionale · Pulizia · ${ref}`,
  titreDetail: (nom) => `Pulizia — ${nom}`,
  detailResume: (date, statut, faites, total, pourcentage) =>
    `${date} · ${statut} · ${faites} / ${total} attività (${pourcentage} %)`,
  tousMenages: "← Tutte le pulizie", enregistre: "Pulizia salvata.",
  evaluationEnregistree: "Valutazione salvata.",
  photoAjoutee: (n) => n > 0 ? `Foto aggiunta · ${n} foto precedente/i rimossa/e per rispettare la quota.` : "Foto aggiunta.",
  photoSupprimee: "Foto eliminata.", erreurInattendue: "Errore imprevisto. Riprovare.",
  aucuneTache: "Questa pulizia non ha attività. La ricrei dall’elenco per ottenere la checklist predefinita.",
  checklist: "Checklist", statut: "Stato", notesLabel: "Note",
  passageFait: "Portare la pulizia a «Fatto» consuma la rotazione dei consumabili dell’alloggio, una sola volta per pulizia.",
  enregistrerMenage: "Salva pulizia", photosPreuve: "Foto di prova",
  photosAide: (maxMo) => `Prima / dopo la pulizia. JPEG, PNG o WebP, ${maxMo} MB massimi per foto. La quota è di 5 GB per alloggio: le più vecchie vengono rimosse per prime.`,
  phase: "Fase", avant: "Prima della pulizia", apres: "Dopo la pulizia", fichier: "File",
  ajouterPhoto: "Aggiungi foto", supprimer: "Elimina",
  aucunePhoto: "Nessuna foto per questa pulizia.", evaluation: "Valutazione della rotazione",
  evaluationAide: "Punteggio qualità, costo reale e durata — solo per il monitoraggio interno.",
  score: "Punteggio (1-5)", nonRenseigne: "Non indicato", cout: "Costo (€)",
  duree: "Durata (min)", enregistrerEvaluation: "Salva valutazione",
  etatsDesLieux: "Inventari", entretien: "Manutenzione", tableauBord: "Dashboard",
};

const DE: TraductionsMenage = {
  titrePageListe: "Reinigung — LCD Parc", espaceExploitation: "Profibereich · Betrieb",
  titre: "Reinigung", description: "Checklisten zur Wiederherstellung, Fortschritt und Nachschub bei Abreise.",
  videLogement: "Erstellen Sie zuerst eine Unterkunft, um ihre Reinigungen zu planen.",
  creerLogement: "Unterkunft erstellen", choisirLogement: "Unterkunft wählen",
  scoreMoyen: "Durchschnittliche Qualitätsbewertung", alerteQualite: "Warnung: unter 3,5 / 5",
  coutMoyen: "Durchschnittliche Wechselkosten", dureeMoyenne: "Durchschnittliche Dauer", minutes: "Min.",
  planifierMenage: (nom) => `Reinigung planen — ${nom}`,
  date: "Datum", sejour: "Aufenthalt", aucunSejour: "Kein verknüpfter Aufenthalt",
  notes: "Notizen", optionnel: "Optional", planifier: "Reinigung planen",
  menages: "Reinigungen", aucunMenage: "Keine Reinigung für diese Unterkunft geplant.",
  colDate: "Datum", colSejour: "Aufenthalt", colAvancement: "Fortschritt",
  colStatut: "Status", colNotes: "Notizen", colQualite: "Qualität",
  colCout: "Kosten", colDuree: "Dauer", ouvrir: "Öffnen",
  colPieces: "Räume", reglerReferentiel: "Checkliste der Unterkunft",
  referentielModele: (pieces, taches) =>
    `LCD-Parc-Vorlage: ${pieces} Raum/Räume, ${taches} Aufgabe(n).`,
  referentielDuLogement: (pieces, taches) =>
    `Eigene Checkliste der Unterkunft: ${pieces} Raum/Räume, ${taches} Aufgabe(n).`,
  pieceGenerale: "Allgemein (ohne Raum)",
  piecesResume: (completes, total) =>
    `${completes} / ${total} Raum/Räume vollständig`,
  pieceAvancement: (faites, total) => `${faites} / ${total}`,
  pieceComplete: "Raum vollständig",
  titrePageReferentiel: "Reinigungs-Checkliste — LCD Parc",
  espaceReferentiel: "Profibereich · Betrieb · Checkliste",
  referentielTitre: "Checklisten-Vorlage",
  referentielDescription:
    "Die Räume der Unterkunft und die Aufgaben in jedem: jede danach geplante Reinigung startet aus dieser Liste und wird Raum für Raum abgehakt.",
  referentielAide:
    "Das Speichern hier ändert bereits erstellte Reinigungen nicht: sie behalten die am Planungstag kopierte Checkliste.",
  referentielEnregistre: "Checkliste gespeichert: die nächsten Reinigungen starten aus dieser Liste.",
  referentielReinitialise: "Checkliste auf die LCD-Parc-Vorlage zurückgesetzt.",
  colPiece: "Raum", colTache: "Aufgabe", ligneVide: "Neuer Raum",
  lignesAide: (libres) =>
    `Füllen Sie die letzten ${libres} Zeilen aus, um Aufgaben hinzuzufügen; markieren Sie „Löschen“, um eine Zeile zu entfernen. Halten Sie die Aufgaben eines Raums zusammen.`,
  limites: (pieces, tachesParPiece, piece, tache) =>
    `Grenzen: ${pieces} Räume, ${tachesParPiece} Aufgaben pro Raum, ${piece} Zeichen für einen Raum und ${tache} für eine Aufgabe.`,
  enregistrerReferentiel: "Checkliste speichern",
  reinitialiserReferentiel: "Zurück zur Vorlage",
  reinitialiserAide:
    "Die Unterkunft startet wieder aus der LCD-Parc-Vorlage; bereits erstellte Reinigungen ändern sich nicht.",
  titrePageDetail: (date) => `Reinigung ${date} — LCD Parc`,
  espaceMenage: (ref) => `Profibereich · Reinigung · ${ref}`,
  titreDetail: (nom) => `Reinigung — ${nom}`,
  detailResume: (date, statut, faites, total, pourcentage) =>
    `${date} · ${statut} · ${faites} / ${total} Aufgaben (${pourcentage} %)`,
  tousMenages: "← Alle Reinigungen", enregistre: "Reinigung gespeichert.",
  evaluationEnregistree: "Bewertung gespeichert.",
  photoAjoutee: (n) => n > 0 ? `Foto hinzugefügt · ${n} ältere(s) Foto(s) wegen Kontingent entfernt.` : "Foto hinzugefügt.",
  photoSupprimee: "Foto gelöscht.", erreurInattendue: "Unerwarteter Fehler. Versuchen Sie es erneut.",
  aucuneTache: "Diese Reinigung hat keine Aufgabe. Erstellen Sie sie erneut aus der Liste, um die Standard-Checkliste zu erhalten.",
  checklist: "Checkliste", statut: "Status", notesLabel: "Notizen",
  passageFait: "Das Setzen auf „Erledigt“ verbraucht die Verbrauchsrotation der Unterkunft, einmal pro Reinigung.",
  enregistrerMenage: "Reinigung speichern", photosPreuve: "Nachweisfotos",
  photosAide: (maxMo) => `Vor / nach der Reinigung. JPEG, PNG oder WebP, maximal ${maxMo} MB pro Foto. Das Kontingent beträgt 5 GB pro Unterkunft: die ältesten werden zuerst entfernt.`,
  phase: "Phase", avant: "Vor der Reinigung", apres: "Nach der Reinigung", fichier: "Datei",
  ajouterPhoto: "Foto hinzufügen", supprimer: "Löschen",
  aucunePhoto: "Kein Foto für diese Reinigung.", evaluation: "Wechselbewertung",
  evaluationAide: "Qualitätsbewertung, tatsächliche Kosten und Dauer — nur zur internen Nachverfolgung.",
  score: "Bewertung (1-5)", nonRenseigne: "Nicht angegeben", cout: "Kosten (€)",
  duree: "Dauer (Min.)", enregistrerEvaluation: "Bewertung speichern",
  etatsDesLieux: "Inventarprüfungen", entretien: "Wartung", tableauBord: "Dashboard",
};

const DICTIONNAIRES: Record<Langue, TraductionsMenage> = {
  fr: FR, en: EN, es: ES, it: IT, de: DE,
};

export function traductionsMenage(langue: string): TraductionsMenage {
  return masquerFonctions(DICTIONNAIRES[resoudreLangue(langue)]);
}
